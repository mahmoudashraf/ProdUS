package com.produs.scanner;

import com.produs.product.ProductProfile;
import com.produs.workspace.ProjectWorkspace;
import com.produs.catalog.ServiceModule;
import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScannerRiskLifecycleService {

    private final ScannerRiskThreadRepository riskThreadRepository;
    private final NormalizedFindingRepository findingRepository;
    private final ScanRunRepository scanRunRepository;
    private final ToolRunRepository toolRunRepository;

    @Transactional
    public void syncCompletedRun(ScanRun run) {
        if (run.getStatus() != ScanRun.RunStatus.COMPLETED) {
            return;
        }
        List<NormalizedFinding> currentFindings = findingRepository.findByScanRunIdOrderBySeverityDescCreatedAtDesc(run.getId());
        Set<String> currentFingerprints = currentFindings.stream()
                .map(NormalizedFinding::getFingerprint)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        for (NormalizedFinding finding : currentFindings) {
            upsertSeenFinding(run, finding);
        }
        if (run.getComparisonBaseRunId() != null && comparableCoverageComplete(run)) {
            findingRepository.findByScanRunIdOrderBySeverityDescCreatedAtDesc(run.getComparisonBaseRunId()).stream()
                    .filter(finding -> !currentFingerprints.contains(finding.getFingerprint()))
                    .forEach(finding -> markFixedIfStillCurrent(run, finding));
        }
    }

    @Transactional
    public void markRiskReadyToCheck(ScannerRiskThread thread) {
        if (thread.getCurrentState() == ScannerRiskThread.RiskState.ACCEPTED_RISK
                || thread.getCurrentState() == ScannerRiskThread.RiskState.FALSE_POSITIVE
                || thread.getCurrentState() == ScannerRiskThread.RiskState.FIXED_BY_LATEST_SCAN) {
            return;
        }
        thread.setCurrentState(ScannerRiskThread.RiskState.READY_TO_CHECK);
        riskThreadRepository.save(thread);
    }

    @Transactional
    public ScannerRiskThread assignWorkspace(ScannerRiskThread thread, ProjectWorkspace workspace) {
        thread.setWorkspace(workspace);
        return riskThreadRepository.save(thread);
    }

    @Transactional
    public ScannerRiskThread unassignWorkspace(ScannerRiskThread thread) {
        thread.setWorkspace(null);
        return riskThreadRepository.save(thread);
    }

    @Transactional
    public ScannerRiskThread updateServiceMapping(
            ScannerRiskThread thread,
            ServiceModule selectedModule,
            User actor,
            String note
    ) {
        if (thread.getScannerSuggestedModule() == null) {
            thread.setScannerSuggestedModule(thread.getRecommendedModule());
        }
        thread.setRecommendedModule(selectedModule);
        thread.setServiceMappingChangedBy(actor);
        thread.setServiceMappingChangedAt(LocalDateTime.now());
        thread.setServiceMappingNote(note);
        return riskThreadRepository.save(thread);
    }

    @Transactional
    public List<ScannerRiskThread> currentProductRisks(UUID productId) {
        List<ScannerRiskThread> risks = riskThreadRepository.findByProductProfileIdOrderBySeverityDescUpdatedAtDesc(productId);
        if (risks.isEmpty()) {
            backfillProduct(productId);
            risks = riskThreadRepository.findByProductProfileIdOrderBySeverityDescUpdatedAtDesc(productId);
        }
        return risks;
    }

    @Transactional
    public List<ScannerRiskThread> currentWorkspaceRisks(UUID workspaceId) {
        List<ScannerRiskThread> risks = riskThreadRepository.findByWorkspaceIdOrderBySeverityDescUpdatedAtDesc(workspaceId);
        if (risks.isEmpty()) {
            UUID productId = workspaceProductId(workspaceId);
            if (productId != null) {
                findingRepository.findByProductProfileIdAndWorkspaceIdOrderBySeverityDescCreatedAtDesc(productId, workspaceId)
                        .forEach(finding -> upsertSeenFinding(finding.getScanRun(), finding));
            }
            risks = riskThreadRepository.findByWorkspaceIdOrderBySeverityDescUpdatedAtDesc(workspaceId);
        }
        return risks;
    }

    @Transactional(readOnly = true)
    public ScanComparison compareRun(ScanRun run) {
        List<NormalizedFinding> currentFindings = findingRepository.findByScanRunIdOrderBySeverityDescCreatedAtDesc(run.getId());
        Optional<ScanRun> baseline = baselineFor(run);
        if (baseline.isEmpty()) {
            return new ScanComparison(run, null, true, null, currentFindings, List.of(), List.of(), currentFindings, List.of(), List.of());
        }
        List<NormalizedFinding> baselineFindings = findingRepository.findByScanRunIdOrderBySeverityDescCreatedAtDesc(baseline.get().getId());
        Map<String, NormalizedFinding> currentByFingerprint = latestByFingerprint(currentFindings);
        Map<String, NormalizedFinding> baselineByFingerprint = latestByFingerprint(baselineFindings);
        List<NormalizedFinding> fixed = new ArrayList<>();
        List<NormalizedFinding> stillOpen = new ArrayList<>();
        List<NormalizedFinding> newlySeen = new ArrayList<>();
        List<NormalizedFinding> returned = new ArrayList<>();

        for (Map.Entry<String, NormalizedFinding> entry : currentByFingerprint.entrySet()) {
            NormalizedFinding current = entry.getValue();
            NormalizedFinding previous = baselineByFingerprint.get(entry.getKey());
            if (previous == null) {
                newlySeen.add(current);
            } else if (previous.getStatus() == NormalizedFinding.FindingStatus.RESOLVED) {
                returned.add(current);
            } else {
                stillOpen.add(current);
            }
        }
        for (Map.Entry<String, NormalizedFinding> entry : baselineByFingerprint.entrySet()) {
            if (!currentByFingerprint.containsKey(entry.getKey())) {
                fixed.add(entry.getValue());
            }
        }
        boolean complete = run.getStatus() == ScanRun.RunStatus.COMPLETED && comparableCoverageComplete(run);
        String incompleteReason = complete ? null : incompleteReason(run);
        return new ScanComparison(run, baseline.get(), complete, incompleteReason, currentFindings, baselineFindings, fixed, newlySeen, stillOpen, returned);
    }

    private void upsertSeenFinding(ScanRun run, NormalizedFinding finding) {
        ScannerRiskThread thread = riskThreadRepository.findByProductProfileIdAndFingerprint(run.getProductProfile().getId(), finding.getFingerprint())
                .orElseGet(() -> newThread(run.getProductProfile(), finding));
        ScannerRiskThread.RiskState previous = thread.getCurrentState();
        copyFinding(thread, run, finding);
        if (thread.getFirstSeenScanRun() == null) {
            thread.setFirstSeenScanRun(run);
        }
        thread.setLastSeenScanRun(run);
        thread.setCurrentFinding(finding);
        thread.setScannerSuggestedModule(finding.getRecommendedModule());
        if (thread.getServiceMappingChangedAt() == null) {
            thread.setRecommendedModule(finding.getRecommendedModule());
        }
        thread.setCurrentState(nextSeenState(previous, finding));
        riskThreadRepository.save(thread);
    }

    private void backfillProduct(UUID productId) {
        Map<String, NormalizedFinding> latest = latestByFingerprint(findingRepository.findByProductProfileIdOrderBySeverityDescCreatedAtDesc(productId));
        latest.values().forEach(finding -> upsertSeenFinding(finding.getScanRun(), finding));
    }

    private UUID workspaceProductId(UUID workspaceId) {
        return scanRunRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .findFirst()
                .map(run -> run.getProductProfile().getId())
                .orElse(null);
    }

    private ScannerRiskThread newThread(ProductProfile product, NormalizedFinding finding) {
        ScannerRiskThread thread = new ScannerRiskThread();
        thread.setProductProfile(product);
        thread.setFingerprint(finding.getFingerprint());
        thread.setCurrentState(ScannerRiskThread.RiskState.NEW);
        thread.setFirstSeenScanRun(finding.getScanRun());
        return thread;
    }

    private ScannerRiskThread.RiskState nextSeenState(ScannerRiskThread.RiskState previous, NormalizedFinding finding) {
        if (previous == ScannerRiskThread.RiskState.ACCEPTED_RISK || previous == ScannerRiskThread.RiskState.FALSE_POSITIVE) {
            return previous;
        }
        if (previous == ScannerRiskThread.RiskState.FIXED_BY_LATEST_SCAN
                || previous == ScannerRiskThread.RiskState.RETURNED
                || finding.getStatus() == NormalizedFinding.FindingStatus.REGRESSED) {
            return ScannerRiskThread.RiskState.RETURNED;
        }
        if (previous == null || previous == ScannerRiskThread.RiskState.NEW || finding.getStatus() == NormalizedFinding.FindingStatus.NEW) {
            return ScannerRiskThread.RiskState.NEW;
        }
        if (finding.getStatus() == NormalizedFinding.FindingStatus.INSUFFICIENT_EVIDENCE) {
            return ScannerRiskThread.RiskState.NEEDS_PROOF;
        }
        return ScannerRiskThread.RiskState.STILL_OPEN;
    }

    private void markFixedIfStillCurrent(ScanRun run, NormalizedFinding baselineFinding) {
        riskThreadRepository.findByProductProfileIdAndFingerprint(run.getProductProfile().getId(), baselineFinding.getFingerprint())
                .ifPresent(thread -> {
                    if (thread.getCurrentState() == ScannerRiskThread.RiskState.ACCEPTED_RISK
                            || thread.getCurrentState() == ScannerRiskThread.RiskState.FALSE_POSITIVE) {
                        return;
                    }
                    thread.setCurrentState(ScannerRiskThread.RiskState.FIXED_BY_LATEST_SCAN);
                    thread.setLastFixedScanRun(run);
                    riskThreadRepository.save(thread);
                });
    }

    private void copyFinding(ScannerRiskThread thread, ScanRun run, NormalizedFinding finding) {
        thread.setWorkspace(finding.getWorkspace() == null ? thread.getWorkspace() : finding.getWorkspace());
        thread.setTitle(finding.getTitle());
        thread.setDescription(finding.getDescription());
        thread.setSeverity(finding.getSeverity());
        thread.setSourceTool(finding.getSourceTool());
        thread.setSourceRuleId(finding.getSourceRuleId());
        thread.setAffectedComponent(finding.getAffectedComponent());
        thread.setReadinessArea(finding.getReadinessArea());
        thread.setBusinessRisk(finding.getBusinessRisk());
        thread.setEvidenceRequired(finding.getEvidenceRequired());
        if (thread.getLastSeenScanRun() == null || isAfter(run.getCreatedAt(), thread.getLastSeenScanRun().getCreatedAt())) {
            thread.setLastSeenScanRun(run);
        }
    }

    private Optional<ScanRun> baselineFor(ScanRun run) {
        if (run.getComparisonBaseRunId() != null) {
            return scanRunRepository.findById(run.getComparisonBaseRunId());
        }
        return scanRunRepository.findByProductProfileIdOrderByCreatedAtDesc(run.getProductProfile().getId()).stream()
                .filter(candidate -> !candidate.getId().equals(run.getId()))
                .filter(candidate -> candidate.getStatus() == ScanRun.RunStatus.COMPLETED)
                .filter(candidate -> candidate.getDepth() == run.getDepth())
                .filter(candidate -> sameTarget(candidate, run))
                .findFirst();
    }

    private boolean comparableCoverageComplete(ScanRun run) {
        List<ToolRun> tools = toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(run.getId());
        return !tools.isEmpty() && tools.stream().allMatch(tool -> tool.getStatus() == ToolRun.ToolStatus.COMPLETED);
    }

    private String incompleteReason(ScanRun run) {
        if (run.getStatus() != ScanRun.RunStatus.COMPLETED) {
            return "Scan did not complete.";
        }
        List<ToolRun> incomplete = toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(run.getId()).stream()
                .filter(tool -> tool.getStatus() != ToolRun.ToolStatus.COMPLETED)
                .toList();
        if (!incomplete.isEmpty()) {
            return "Some scanner tools did not complete: " + incomplete.stream()
                    .map(tool -> tool.getToolName() + " " + tool.getStatus())
                    .collect(Collectors.joining(", "));
        }
        return null;
    }

    private Map<String, NormalizedFinding> latestByFingerprint(List<NormalizedFinding> findings) {
        return findings.stream()
                .sorted(Comparator.comparing(NormalizedFinding::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .collect(Collectors.toMap(
                        NormalizedFinding::getFingerprint,
                        Function.identity(),
                        (left, ignored) -> left,
                        LinkedHashMap::new
                ));
    }

    private boolean sameTarget(ScanRun left, ScanRun right) {
        return same(left.getScanSource().getId(), right.getScanSource().getId())
                && same(left.getBranchRef(), right.getBranchRef())
                && same(left.getRuntimeTargetUrl(), right.getRuntimeTargetUrl())
                && same(left.getContainerImageRef(), right.getContainerImageRef());
    }

    private boolean same(Object left, Object right) {
        if (left == null) {
            return right == null;
        }
        return left.equals(right);
    }

    private boolean isAfter(LocalDateTime left, LocalDateTime right) {
        if (left == null) return false;
        if (right == null) return true;
        return left.isAfter(right);
    }

    public record ScanComparison(
            ScanRun run,
            ScanRun baselineRun,
            boolean complete,
            String incompleteReason,
            List<NormalizedFinding> currentFindings,
            List<NormalizedFinding> baselineFindings,
            List<NormalizedFinding> fixed,
            List<NormalizedFinding> newlySeen,
            List<NormalizedFinding> stillOpen,
            List<NormalizedFinding> returned
    ) {}
}
