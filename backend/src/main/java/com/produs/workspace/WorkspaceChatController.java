package com.produs.workspace;

import com.produs.dto.PlatformDtos.CurrentUserSummary;
import com.produs.entity.User;
import com.produs.network.ConversationMessage;
import com.produs.network.ConversationMessageRepository;
import com.produs.network.ConversationParticipant;
import com.produs.network.ConversationParticipantRepository;
import com.produs.network.ConversationThread;
import com.produs.network.ConversationThreadRepository;
import com.produs.scanner.NormalizedFinding;
import com.produs.scanner.ScannerRiskLifecycleService;
import com.produs.scanner.ScannerRiskThread;
import com.produs.scanner.ScannerRiskThreadRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.produs.dto.PlatformDtos.toCurrentUserSummary;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceChatController {

    private final ProjectWorkspaceRepository workspaceRepository;
    private final WorkspaceParticipantRepository workspaceParticipantRepository;
    private final ConversationThreadRepository threadRepository;
    private final ConversationParticipantRepository conversationParticipantRepository;
    private final ConversationMessageRepository messageRepository;
    private final ScannerRiskThreadRepository riskThreadRepository;
    private final ScannerRiskLifecycleService riskLifecycleService;
    private final WorkspaceChatMessageRiskMentionRepository mentionRepository;

    @GetMapping("/{workspaceId}/chat")
    @Transactional
    public WorkspaceChatResponse chat(@AuthenticationPrincipal User user, @PathVariable UUID workspaceId) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        ConversationThread thread = workspaceThread(workspace, user);
        syncConversationParticipants(thread, workspace, user);
        return toChatResponse(workspace, thread);
    }

    @PostMapping("/{workspaceId}/chat/messages")
    @Transactional
    public WorkspaceChatResponse sendMessage(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody WorkspaceChatMessageRequest request
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        ConversationThread thread = workspaceThread(workspace, user);
        syncConversationParticipants(thread, workspace, user);

        ConversationMessage message = new ConversationMessage();
        message.setThread(thread);
        message.setSender(user);
        message.setMessageType(ConversationMessage.MessageType.TEXT);
        message.setBody(request.body().trim());
        ConversationMessage savedMessage = messageRepository.save(message);

        List<ScannerRiskThread> mentionedRisks = resolveMentionedRisks(workspace, request.mentionedRiskIds());
        for (ScannerRiskThread risk : mentionedRisks) {
            WorkspaceChatMessageRiskMention mention = new WorkspaceChatMessageRiskMention();
            mention.setMessage(savedMessage);
            mention.setRiskThread(risk);
            mentionRepository.save(mention);
        }

        thread.setLastMessageAt(LocalDateTime.now());
        threadRepository.save(thread);
        return toChatResponse(workspace, thread);
    }

    private ConversationThread workspaceThread(ProjectWorkspace workspace, User creator) {
        return threadRepository.findFirstByScopeTypeAndScopeIdOrderByCreatedAtAsc(
                        ConversationThread.ScopeType.WORKSPACE,
                        workspace.getId()
                )
                .orElseGet(() -> {
                    ConversationThread thread = new ConversationThread();
                    thread.setScopeType(ConversationThread.ScopeType.WORKSPACE);
                    thread.setScopeId(workspace.getId());
                    thread.setTitle(workspace.getName() + " workspace chat");
                    thread.setCreatedBy(creator);
                    thread.setLastMessageAt(LocalDateTime.now());
                    return threadRepository.save(thread);
                });
    }

    private void syncConversationParticipants(ConversationThread thread, ProjectWorkspace workspace, User currentUser) {
        ensureConversationParticipant(thread, workspace.getOwner(), "owner");
        workspaceParticipantRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspace.getId()).stream()
                .filter(WorkspaceParticipant::isActive)
                .forEach(participant -> ensureConversationParticipant(
                        thread,
                        participant.getUser(),
                        participant.getRole().name().toLowerCase()
                ));
        if (currentUser.getRole() == User.UserRole.ADMIN) {
            ensureConversationParticipant(thread, currentUser, "admin");
        }
    }

    private void ensureConversationParticipant(ConversationThread thread, User user, String role) {
        ConversationParticipant participant = conversationParticipantRepository
                .findByThreadIdAndUserId(thread.getId(), user.getId())
                .orElseGet(ConversationParticipant::new);
        participant.setThread(thread);
        participant.setUser(user);
        participant.setParticipantRole(role == null || role.isBlank() ? "participant" : role);
        conversationParticipantRepository.save(participant);
    }

    private List<ScannerRiskThread> resolveMentionedRisks(ProjectWorkspace workspace, Collection<UUID> requestedRiskIds) {
        if (requestedRiskIds == null || requestedRiskIds.isEmpty()) {
            return List.of();
        }
        LinkedHashSet<UUID> requested = requestedRiskIds.stream()
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (requested.isEmpty()) {
            return List.of();
        }
        Map<UUID, ScannerRiskThread> byId = riskThreadRepository.findByIdIn(requested).stream()
                .collect(Collectors.toMap(ScannerRiskThread::getId, risk -> risk));
        if (!byId.keySet().containsAll(requested)) {
            throw new IllegalArgumentException("One or more mentioned findings were not found");
        }
        List<ScannerRiskThread> risks = new ArrayList<>();
        for (UUID id : requested) {
            ScannerRiskThread risk = byId.get(id);
            if (risk.getWorkspace() == null || !risk.getWorkspace().getId().equals(workspace.getId())) {
                throw new AccessDeniedException("Mentioned finding is not assigned to this workspace");
            }
            risks.add(risk);
        }
        return risks;
    }

    private WorkspaceChatResponse toChatResponse(ProjectWorkspace workspace, ConversationThread thread) {
        List<ConversationMessage> messages = messageRepository.findByThreadIdAndDeletedAtIsNullOrderByCreatedAtAsc(thread.getId());
        Map<UUID, List<WorkspaceChatMentionResponse>> mentionsByMessage = mentionsByMessage(messages);
        List<WorkspaceChatMessageResponse> messageResponses = messages.stream()
                .map(message -> new WorkspaceChatMessageResponse(
                        message.getId(),
                        message.getCreatedAt(),
                        message.getSender() == null ? null : toCurrentUserSummary(message.getSender()),
                        message.getBody(),
                        mentionsByMessage.getOrDefault(message.getId(), List.of())
                ))
                .toList();
        List<WorkspaceChatParticipantResponse> participantResponses =
                conversationParticipantRepository.findByThreadIdOrderByCreatedAtAsc(thread.getId()).stream()
                        .map(participant -> new WorkspaceChatParticipantResponse(
                                toCurrentUserSummary(participant.getUser()),
                                participant.getParticipantRole()
                        ))
                        .toList();
        List<WorkspaceChatMentionResponse> mentionableFindings = mentionableFindings(workspace).stream()
                .map(this::toMentionResponse)
                .toList();
        return new WorkspaceChatResponse(
                workspace.getId(),
                thread.getId(),
                thread.getTitle(),
                participantResponses,
                messageResponses,
                mentionableFindings
        );
    }

    private Map<UUID, List<WorkspaceChatMentionResponse>> mentionsByMessage(List<ConversationMessage> messages) {
        if (messages.isEmpty()) {
            return Map.of();
        }
        List<UUID> messageIds = messages.stream().map(ConversationMessage::getId).toList();
        return mentionRepository.findByMessageIds(messageIds).stream()
                .collect(Collectors.groupingBy(
                        mention -> mention.getMessage().getId(),
                        LinkedHashMap::new,
                        Collectors.mapping(mention -> toMentionResponse(mention.getRiskThread()), Collectors.toList())
                ));
    }

    private List<ScannerRiskThread> mentionableFindings(ProjectWorkspace workspace) {
        return riskLifecycleService.currentWorkspaceRisks(workspace.getId()).stream()
                .filter(this::isMentionable)
                .sorted(Comparator.comparing(ScannerRiskThread::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private boolean isMentionable(ScannerRiskThread risk) {
        return risk.getCurrentState() != ScannerRiskThread.RiskState.ACCEPTED_RISK
                && risk.getCurrentState() != ScannerRiskThread.RiskState.FALSE_POSITIVE;
    }

    private WorkspaceChatMentionResponse toMentionResponse(ScannerRiskThread risk) {
        return new WorkspaceChatMentionResponse(
                risk.getId(),
                risk.getTitle(),
                risk.getSeverity(),
                risk.getCurrentState(),
                risk.getRecommendedModule() == null ? null : risk.getRecommendedModule().getName(),
                risk.getSourceTool(),
                risk.getAffectedComponent()
        );
    }

    private void requireWorkspaceViewer(User user, ProjectWorkspace workspace) {
        if (user.getRole() == User.UserRole.ADMIN || workspace.getOwner().getId().equals(user.getId())) {
            return;
        }
        if (workspaceParticipantRepository.existsByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), user.getId())) {
            return;
        }
        throw new AccessDeniedException("Workspace is not available to this user");
    }

    public record WorkspaceChatMessageRequest(
            @NotBlank(message = "Message is required")
            String body,
            List<UUID> mentionedRiskIds
    ) {}
    public record WorkspaceChatResponse(
            UUID workspaceId,
            UUID threadId,
            String title,
            List<WorkspaceChatParticipantResponse> participants,
            List<WorkspaceChatMessageResponse> messages,
            List<WorkspaceChatMentionResponse> mentionableFindings
    ) {}
    public record WorkspaceChatParticipantResponse(CurrentUserSummary user, String role) {}
    public record WorkspaceChatMessageResponse(
            UUID id,
            LocalDateTime createdAt,
            CurrentUserSummary sender,
            String body,
            List<WorkspaceChatMentionResponse> mentions
    ) {}
    public record WorkspaceChatMentionResponse(
            UUID id,
            String title,
            NormalizedFinding.FindingSeverity severity,
            ScannerRiskThread.RiskState currentState,
            String serviceName,
            String sourceTool,
            String affectedComponent
    ) {}
}
