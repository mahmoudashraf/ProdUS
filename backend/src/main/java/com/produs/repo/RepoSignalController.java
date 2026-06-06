package com.produs.repo;

import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class RepoSignalController {

    private final RepoSignalService repoSignalService;

    @GetMapping("/api/products/{productId}/repo-signals")
    public RepoSignalService.RepoSignalSummaryResponse getProductSignals(
            @AuthenticationPrincipal User actor,
            @PathVariable UUID productId
    ) {
        return repoSignalService.getProductSignals(actor, productId);
    }

    @PostMapping("/api/products/{productId}/repo-signals/refresh")
    public RepoSignalService.RepoSignalSummaryResponse refreshProductSignals(
            @AuthenticationPrincipal User actor,
            @PathVariable UUID productId
    ) {
        return repoSignalService.refreshProductSignals(actor, productId);
    }

    @GetMapping("/api/workspaces/{workspaceId}/repo-signals")
    public RepoSignalService.RepoSignalSummaryResponse getWorkspaceSignals(
            @AuthenticationPrincipal User actor,
            @PathVariable UUID workspaceId
    ) {
        return repoSignalService.getWorkspaceSignals(actor, workspaceId);
    }

    @PostMapping("/api/workspaces/{workspaceId}/repo-signals/refresh")
    public RepoSignalService.RepoSignalSummaryResponse refreshWorkspaceSignals(
            @AuthenticationPrincipal User actor,
            @PathVariable UUID workspaceId
    ) {
        return repoSignalService.refreshWorkspaceSignals(actor, workspaceId);
    }
}
