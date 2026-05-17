package com.produs.engine;

import com.produs.entity.User;
import com.produs.engine.ProductizationEngineService.AutomatedCheckRequest;
import com.produs.engine.ProductizationEngineService.AutomatedCheckResponse;
import com.produs.engine.ProductizationEngineService.CriterionResponse;
import com.produs.engine.ProductizationEngineService.DiagnosisRequest;
import com.produs.engine.ProductizationEngineService.DiagnosisResponse;
import com.produs.engine.ProductizationEngineService.EvidenceRequirementRequest;
import com.produs.engine.ProductizationEngineService.EvidenceRequirementResponse;
import com.produs.engine.ProductizationEngineService.HandoffRequest;
import com.produs.engine.ProductizationEngineService.HandoffResponse;
import com.produs.engine.ProductizationEngineService.HealthReviewRequest;
import com.produs.engine.ProductizationEngineService.HealthReviewResponse;
import com.produs.engine.ProductizationEngineService.IntegrationConnectionRequest;
import com.produs.engine.ProductizationEngineService.IntegrationConnectionResponse;
import com.produs.engine.ProductizationEngineService.IntegrationSignalRequest;
import com.produs.engine.ProductizationEngineService.IntegrationSignalResponse;
import com.produs.engine.ProductizationEngineService.ReviewDecisionRequest;
import com.produs.engine.ProductizationEngineService.ReviewDecisionResponse;
import com.produs.engine.ProductizationEngineService.WorkspaceGovernanceResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/productization-engine")
@RequiredArgsConstructor
public class ProductizationEngineController {

    private final ProductizationEngineService engineService;

    @GetMapping("/products/{productId}/diagnoses")
    public List<DiagnosisResponse> diagnoses(@AuthenticationPrincipal User user, @PathVariable UUID productId) {
        return engineService.diagnoses(user, productId);
    }

    @PostMapping("/products/{productId}/diagnoses")
    public DiagnosisResponse createDiagnosis(
            @AuthenticationPrincipal User user,
            @PathVariable UUID productId,
            @Valid @RequestBody DiagnosisRequest request
    ) {
        return engineService.createDiagnosis(user, productId, request);
    }

    @GetMapping("/milestones/{milestoneId}/criteria")
    public List<CriterionResponse> criteria(@AuthenticationPrincipal User user, @PathVariable UUID milestoneId) {
        return engineService.criteria(user, milestoneId);
    }

    @PostMapping("/milestones/{milestoneId}/criteria/generate")
    public List<CriterionResponse> generateCriteria(@AuthenticationPrincipal User user, @PathVariable UUID milestoneId) {
        return engineService.generateCriteria(user, milestoneId);
    }

    @PutMapping("/evidence-requirements/{requirementId}")
    public EvidenceRequirementResponse updateEvidenceRequirement(
            @AuthenticationPrincipal User user,
            @PathVariable UUID requirementId,
            @Valid @RequestBody EvidenceRequirementRequest request
    ) {
        return engineService.updateEvidenceRequirement(user, requirementId, request);
    }

    @PostMapping("/criteria/{criterionId}/checks")
    public AutomatedCheckResponse createCheck(
            @AuthenticationPrincipal User user,
            @PathVariable UUID criterionId,
            @Valid @RequestBody AutomatedCheckRequest request
    ) {
        return engineService.createCheck(user, criterionId, request);
    }

    @PostMapping("/criteria/{criterionId}/reviews")
    public ReviewDecisionResponse reviewCriterion(
            @AuthenticationPrincipal User user,
            @PathVariable UUID criterionId,
            @Valid @RequestBody ReviewDecisionRequest request
    ) {
        return engineService.reviewCriterion(user, criterionId, request);
    }

    @GetMapping("/workspaces/{workspaceId}/governance")
    public WorkspaceGovernanceResponse workspaceGovernance(@AuthenticationPrincipal User user, @PathVariable UUID workspaceId) {
        return engineService.workspaceGovernance(user, workspaceId);
    }

    @PostMapping("/workspaces/{workspaceId}/handoff")
    public HandoffResponse upsertHandoff(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody HandoffRequest request
    ) {
        return engineService.upsertHandoff(user, workspaceId, request);
    }

    @PostMapping("/workspaces/{workspaceId}/health-reviews")
    public HealthReviewResponse createHealthReview(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody HealthReviewRequest request
    ) {
        return engineService.createHealthReview(user, workspaceId, request);
    }

    @PostMapping("/workspaces/{workspaceId}/integrations")
    public IntegrationConnectionResponse createIntegration(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody IntegrationConnectionRequest request
    ) {
        return engineService.createIntegration(user, workspaceId, request);
    }

    @PostMapping("/integrations/{connectionId}/signals")
    public IntegrationSignalResponse createIntegrationSignal(
            @AuthenticationPrincipal User user,
            @PathVariable UUID connectionId,
            @Valid @RequestBody IntegrationSignalRequest request
    ) {
        return engineService.createIntegrationSignal(user, connectionId, request);
    }
}
