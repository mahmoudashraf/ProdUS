package com.produs.scanner;

import com.produs.entity.User;
import com.produs.scanner.ScannerService.CiEvidenceUploadRequest;
import com.produs.scanner.ScannerService.CiTemplateResponse;
import com.produs.scanner.ScannerService.CiTemplateType;
import com.produs.scanner.ScannerService.ConnectorPermissionResponse;
import com.produs.scanner.ScannerService.CreateScannerScheduleRequest;
import com.produs.scanner.ScannerService.CreateScanSourceRequest;
import com.produs.scanner.ScannerService.DisconnectScanSourceRequest;
import com.produs.scanner.ScannerService.ExternalImportRequest;
import com.produs.scanner.ScannerService.FindingStatusRequest;
import com.produs.scanner.ScannerService.NormalizedFindingResponse;
import com.produs.scanner.ScannerService.ProductScannerSummaryResponse;
import com.produs.scanner.ScannerService.RescanRequest;
import com.produs.scanner.ScannerService.ScanCancelRequest;
import com.produs.scanner.ScannerService.ScanRunResponse;
import com.produs.scanner.ScannerService.ScanSourceResponse;
import com.produs.scanner.ScannerService.ScannerScheduleResponse;
import com.produs.scanner.ScannerService.ScannerAdminHealthResponse;
import com.produs.scanner.ScannerService.ScannerEvidenceItemResponse;
import com.produs.scanner.ScannerService.ScannerImportRunResponse;
import com.produs.scanner.ScannerService.StartHostedScanRequest;
import com.produs.scanner.ScannerService.ToolRunResponse;
import com.produs.scanner.ScannerService.UpdateScannerScheduleRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/scanner")
@RequiredArgsConstructor
public class ScannerController {

    private final ScannerService scannerService;

    @GetMapping("/connector-permissions")
    public List<ConnectorPermissionResponse> listConnectorPermissions() {
        return scannerService.listConnectorPermissions();
    }

    @PostMapping("/sources")
    public ScanSourceResponse createSource(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateScanSourceRequest request
    ) {
        return scannerService.createSource(user, request);
    }

    @GetMapping("/sources")
    public List<ScanSourceResponse> listSources(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID workspaceId
    ) {
        return scannerService.listSources(user, productId, workspaceId);
    }

    @PostMapping("/sources/{sourceId}/disconnect")
    public ScanSourceResponse disconnectSource(
            @AuthenticationPrincipal User user,
            @PathVariable UUID sourceId,
            @RequestBody(required = false) DisconnectScanSourceRequest request
    ) {
        return scannerService.disconnectSource(user, sourceId, request);
    }

    @PostMapping("/runs/ci-upload")
    public ScanRunResponse uploadCiEvidence(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CiEvidenceUploadRequest request
    ) {
        return scannerService.uploadCiEvidence(user, request);
    }

    @PostMapping("/imports/external")
    public ScannerImportRunResponse importExternalEvidence(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ExternalImportRequest request
    ) {
        return scannerService.importExternalEvidence(user, request);
    }

    @GetMapping("/imports")
    public List<ScannerImportRunResponse> listImportRuns(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID workspaceId,
            @RequestParam(required = false) UUID sourceId
    ) {
        return scannerService.listImportRuns(user, productId, workspaceId, sourceId);
    }

    @GetMapping("/ci-templates/{type}")
    public CiTemplateResponse getCiTemplate(
            @AuthenticationPrincipal User user,
            @PathVariable CiTemplateType type,
            @RequestParam UUID productId,
            @RequestParam(required = false) UUID workspaceId,
            @RequestParam(required = false) UUID sourceId
    ) {
        return scannerService.getCiTemplate(user, type, productId, workspaceId, sourceId);
    }

    @PostMapping("/schedules")
    public ScannerScheduleResponse createSchedule(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateScannerScheduleRequest request
    ) {
        return scannerService.createSchedule(user, request);
    }

    @GetMapping("/schedules")
    public List<ScannerScheduleResponse> listSchedules(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID workspaceId
    ) {
        return scannerService.listSchedules(user, productId, workspaceId);
    }

    @PatchMapping("/schedules/{scheduleId}")
    public ScannerScheduleResponse updateSchedule(
            @AuthenticationPrincipal User user,
            @PathVariable UUID scheduleId,
            @Valid @RequestBody UpdateScannerScheduleRequest request
    ) {
        return scannerService.updateSchedule(user, scheduleId, request);
    }

    @PostMapping("/runs/hosted")
    public ScanRunResponse startHostedScan(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody StartHostedScanRequest request
    ) {
        return scannerService.startHostedScan(user, request);
    }

    @PostMapping("/runs/{runId}/cancel")
    public ScanRunResponse cancelScanRun(
            @AuthenticationPrincipal User user,
            @PathVariable UUID runId,
            @RequestBody(required = false) ScanCancelRequest request
    ) {
        return scannerService.cancelScanRun(user, runId, request);
    }

    @PostMapping("/runs/{runId}/rescan")
    public ScanRunResponse rescan(
            @AuthenticationPrincipal User user,
            @PathVariable UUID runId,
            @RequestBody(required = false) RescanRequest request
    ) {
        return scannerService.rescan(user, runId, request);
    }

    @GetMapping("/runs/{runId}")
    public ScanRunResponse getRun(@AuthenticationPrincipal User user, @PathVariable UUID runId) {
        return scannerService.getRun(user, runId);
    }

    @GetMapping("/runs/{runId}/tools")
    public List<ToolRunResponse> listToolRuns(@AuthenticationPrincipal User user, @PathVariable UUID runId) {
        return scannerService.listToolRuns(user, runId);
    }

    @GetMapping("/runs/{runId}/findings")
    public List<NormalizedFindingResponse> listRunFindings(@AuthenticationPrincipal User user, @PathVariable UUID runId) {
        return scannerService.listRunFindings(user, runId);
    }

    @GetMapping("/findings/{findingId}")
    public NormalizedFindingResponse getFinding(@AuthenticationPrincipal User user, @PathVariable UUID findingId) {
        return scannerService.getFinding(user, findingId);
    }

    @PatchMapping("/findings/{findingId}/status")
    public NormalizedFindingResponse updateFindingStatus(
            @AuthenticationPrincipal User user,
            @PathVariable UUID findingId,
            @Valid @RequestBody FindingStatusRequest request
    ) {
        return scannerService.updateFindingStatus(user, findingId, request);
    }

    @GetMapping("/evidence")
    public List<ScannerEvidenceItemResponse> listEvidence(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID workspaceId,
            @RequestParam(required = false) UUID milestoneId,
            @RequestParam(required = false) UUID findingId
    ) {
        return scannerService.listEvidence(user, productId, workspaceId, milestoneId, findingId);
    }

    @GetMapping("/products/{productId}/summary")
    public ProductScannerSummaryResponse getProductSummary(
            @AuthenticationPrincipal User user,
            @PathVariable UUID productId
    ) {
        return scannerService.getProductSummary(user, productId);
    }

    @GetMapping("/admin/health")
    public ScannerAdminHealthResponse adminHealth(@AuthenticationPrincipal User user) {
        return scannerService.adminHealth(user);
    }
}
