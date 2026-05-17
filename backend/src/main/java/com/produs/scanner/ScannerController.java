package com.produs.scanner;

import com.produs.entity.User;
import com.produs.scanner.ScannerService.CiEvidenceUploadRequest;
import com.produs.scanner.ScannerService.CreateScanSourceRequest;
import com.produs.scanner.ScannerService.FindingStatusRequest;
import com.produs.scanner.ScannerService.NormalizedFindingResponse;
import com.produs.scanner.ScannerService.ProductScannerSummaryResponse;
import com.produs.scanner.ScannerService.ScanRunResponse;
import com.produs.scanner.ScannerService.ScanSourceResponse;
import com.produs.scanner.ScannerService.ScannerEvidenceItemResponse;
import com.produs.scanner.ScannerService.ToolRunResponse;
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

    @PostMapping("/runs/ci-upload")
    public ScanRunResponse uploadCiEvidence(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CiEvidenceUploadRequest request
    ) {
        return scannerService.uploadCiEvidence(user, request);
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
}
