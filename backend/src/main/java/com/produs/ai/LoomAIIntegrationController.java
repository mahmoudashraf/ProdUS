package com.produs.ai;

import com.produs.ai.LoomAIIntegrationService.AssistantQueryRequest;
import com.produs.ai.LoomAIIntegrationService.AssistantQueryResponse;
import com.produs.ai.LoomAIIntegrationService.AssistantSessionRequest;
import com.produs.ai.LoomAIIntegrationService.AssistantSessionResponse;
import com.produs.ai.LoomAIIntegrationService.AssistantSuggestionsRequest;
import com.produs.ai.LoomAIIntegrationService.AssistantSuggestionsResponse;
import com.produs.ai.LoomAIIntegrationService.KnowledgeSyncResponse;
import com.produs.ai.LoomAIIntegrationService.KnowledgeExportResponse;
import com.produs.ai.LoomAIIntegrationService.LoomAIAuthContextResponse;
import com.produs.ai.LoomAIIntegrationService.LoomAIStatusResponse;
import com.produs.ai.LoomAIIntegrationService.SafeKnowledgeRecord;
import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class LoomAIIntegrationController {

    private final LoomAIIntegrationService integrationService;

    @GetMapping("/loomai/status")
    public LoomAIStatusResponse status(@AuthenticationPrincipal User user) {
        return integrationService.status(user);
    }

    @GetMapping("/loomai/knowledge-preview")
    public List<SafeKnowledgeRecord> previewKnowledge(@AuthenticationPrincipal User user) {
        return integrationService.previewSafeKnowledge(user);
    }

    @GetMapping("/loomai/knowledge-export")
    public KnowledgeExportResponse exportKnowledge(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit
    ) {
        return integrationService.exportSafeKnowledge(authorization, cursor, limit);
    }

    @GetMapping("/loomai/auth-context")
    public LoomAIAuthContextResponse authContext(@AuthenticationPrincipal User user) {
        return integrationService.authContext(user);
    }

    @PostMapping("/loomai/knowledge-sync")
    public KnowledgeSyncResponse syncKnowledge(@AuthenticationPrincipal User user) {
        return integrationService.syncSafeKnowledge(user);
    }

    @PostMapping("/assistant/session")
    public AssistantSessionResponse createSession(
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) AssistantSessionRequest request
    ) {
        return integrationService.createSession(user, request);
    }

    @PostMapping("/assistant/query")
    public AssistantQueryResponse query(
            @AuthenticationPrincipal User user,
            @RequestBody AssistantQueryRequest request
    ) {
        return integrationService.query(user, request);
    }

    @PostMapping("/assistant/query-once")
    public AssistantQueryResponse queryOnce(
            @AuthenticationPrincipal User user,
            @RequestBody AssistantQueryRequest request
    ) {
        return integrationService.queryOnce(user, request);
    }

    @PostMapping("/assistant/suggestions")
    public AssistantSuggestionsResponse suggestions(
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) AssistantSuggestionsRequest request
    ) {
        return integrationService.suggestions(user, request);
    }
}
