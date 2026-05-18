package com.produs.scanner;

import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
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
public class ScannerStorageController {

    private final ScannerStorageGovernanceService storageGovernanceService;

    @GetMapping("/evidence/{evidenceId}/artifact-url")
    public ScannerStorageGovernanceService.SignedArtifactResponse signedEvidenceArtifact(
            @AuthenticationPrincipal User user,
            @PathVariable UUID evidenceId
    ) {
        return storageGovernanceService.signedEvidenceArtifact(user, evidenceId);
    }

    @PostMapping("/evidence-exports")
    public ScannerStorageGovernanceService.EvidenceExportBundleResponse createEvidenceExport(
            @AuthenticationPrincipal User user,
            @RequestBody ScannerStorageGovernanceService.CreateEvidenceExportRequest request
    ) {
        return storageGovernanceService.createEvidenceExport(user, request);
    }

    @GetMapping("/evidence-exports")
    public List<ScannerStorageGovernanceService.EvidenceExportBundleResponse> listEvidenceExports(
            @AuthenticationPrincipal User user,
            @RequestParam UUID productId
    ) {
        return storageGovernanceService.listEvidenceExports(user, productId);
    }

    @PostMapping("/admin/storage/retention")
    public ScannerStorageGovernanceService.RetentionRunResponse runRetention(
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) ScannerStorageGovernanceService.RetentionRunRequest request
    ) {
        return storageGovernanceService.runRetention(user, request);
    }
}
