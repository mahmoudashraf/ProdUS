package com.produs.network;

import com.produs.dto.PlatformDtos.CurrentUserSummary;
import com.produs.dto.PlatformDtos.ExpertProfileResponse;
import com.produs.dto.PlatformDtos.TeamJoinRequestResponse;
import com.produs.dto.PlatformDtos.TeamResponse;
import com.produs.entity.User;
import com.produs.experts.ExpertProfile;
import com.produs.experts.ExpertProfileRepository;
import com.produs.teams.Team;
import com.produs.teams.TeamJoinRequestRepository;
import com.produs.teams.TeamMember;
import com.produs.teams.TeamMemberRepository;
import com.produs.teams.TeamRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toCurrentUserSummary;
import static com.produs.dto.PlatformDtos.toExpertProfileResponse;
import static com.produs.dto.PlatformDtos.toTeamJoinRequestResponse;
import static com.produs.dto.PlatformDtos.toTeamResponse;

@RestController
@RequestMapping("/api/expert-network")
@RequiredArgsConstructor
public class ExpertNetworkController {

    private final ExpertProfileRepository expertProfileRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamJoinRequestRepository teamJoinRequestRepository;
    private final FormationPostRepository formationPostRepository;
    private final CommunityChannelRepository channelRepository;
    private final CommunityPostRepository postRepository;
    private final CommunityCommentRepository commentRepository;
    private final CommunityHelpfulMarkRepository helpfulMarkRepository;
    private final ConversationThreadRepository threadRepository;
    private final ConversationParticipantRepository participantRepository;
    private final ConversationMessageRepository messageRepository;
    private final TrialCollaborationRepository trialRepository;

    @GetMapping("/home")
    public NetworkHomeResponse home(@AuthenticationPrincipal User user) {
        ExpertProfile profile = expertProfileRepository.findByUserId(user.getId()).orElse(null);
        List<Team> myTeams = mine(user);
        List<TeamJoinRequestResponse> joinRequests = teamJoinRequestRepository.findByRequesterIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(request -> toTeamJoinRequestResponse(request))
                .toList();
        List<ConversationThreadResponse> threads = threadRepository.findVisibleThreads(user.getId()).stream()
                .limit(5)
                .map(thread -> toThreadResponse(thread, false))
                .toList();

        return new NetworkHomeResponse(
                profile == null ? null : toExpertProfileResponse(profile),
                myTeams.stream().map(team -> toTeamResponse(team)).toList(),
                joinRequests,
                formationPostRepository.findByStatusOrderByCreatedAtDesc(FormationPost.PostStatus.ACTIVE).stream()
                        .limit(5)
                        .map(this::toFormationPostResponse)
                        .toList(),
                channelRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                        .limit(6)
                        .map(this::toChannelResponse)
                        .toList(),
                threads,
                trialRepository.findAllByOrderByCreatedAtDesc().stream()
                        .limit(5)
                        .map(this::toTrialResponse)
                        .toList()
        );
    }

    @GetMapping("/formation-posts")
    public List<FormationPostResponse> formationPosts() {
        return formationPostRepository.findByStatusOrderByCreatedAtDesc(FormationPost.PostStatus.ACTIVE).stream()
                .map(this::toFormationPostResponse)
                .toList();
    }

    @PostMapping("/formation-posts")
    public FormationPostResponse createFormationPost(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody FormationPostRequest request
    ) {
        FormationPost post = new FormationPost();
        post.setAuthor(user);
        if (request.teamId() != null) {
            Team team = teamRepository.findByIdAndActiveTrue(request.teamId())
                    .orElseThrow(() -> new IllegalArgumentException("Team not found"));
            requireManagerOrAdmin(user, team);
            post.setTeam(team);
        }
        post.setPostType(request.postType());
        apply(post, request);
        return toFormationPostResponse(formationPostRepository.save(post));
    }

    @PutMapping("/formation-posts/{id}")
    public FormationPostResponse updateFormationPost(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody FormationPostRequest request
    ) {
        FormationPost post = formationPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Formation post not found"));
        requireAuthorOrAdmin(user, post.getAuthor());
        post.setPostType(request.postType());
        apply(post, request);
        return toFormationPostResponse(formationPostRepository.save(post));
    }

    @PostMapping("/formation-posts/{id}/close")
    public FormationPostResponse closeFormationPost(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        FormationPost post = formationPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Formation post not found"));
        requireAuthorOrAdmin(user, post.getAuthor());
        post.setStatus(FormationPost.PostStatus.CLOSED);
        return toFormationPostResponse(formationPostRepository.save(post));
    }

    @GetMapping("/channels")
    public List<ChannelResponse> channels() {
        return channelRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(this::toChannelResponse)
                .toList();
    }

    @GetMapping("/channels/{slug}/posts")
    public List<CommunityPostResponse> channelPosts(@PathVariable String slug) {
        channelRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found"));
        return postRepository.findByChannelSlugAndStatusOrderByCreatedAtDesc(slug, CommunityPost.PostStatus.ACTIVE).stream()
                .map(post -> toPostResponse(post, false))
                .toList();
    }

    @PostMapping("/channels/{slug}/posts")
    public CommunityPostResponse createPost(
            @AuthenticationPrincipal User user,
            @PathVariable String slug,
            @Valid @RequestBody CommunityPostRequest request
    ) {
        CommunityChannel channel = channelRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found"));
        CommunityPost post = new CommunityPost();
        post.setChannel(channel);
        post.setAuthor(user);
        post.setTitle(request.title());
        post.setBody(request.body());
        post.setServiceTags(request.serviceTags());
        post.setStatus(CommunityPost.PostStatus.ACTIVE);
        return toPostResponse(postRepository.save(post), false);
    }

    @GetMapping("/posts/{id}")
    public CommunityPostResponse getPost(@PathVariable UUID id) {
        CommunityPost post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        return toPostResponse(post, true);
    }

    @PostMapping("/posts/{id}/comments")
    public CommunityPostResponse addComment(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody CommentRequest request
    ) {
        CommunityPost post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (post.getStatus() == CommunityPost.PostStatus.LOCKED) {
            throw new IllegalArgumentException("Post is locked");
        }
        CommunityComment comment = new CommunityComment();
        comment.setPost(post);
        comment.setAuthor(user);
        comment.setBody(request.body());
        commentRepository.save(comment);
        post.setReplyCount((int) commentRepository.countByPostIdAndStatus(id, CommunityComment.CommentStatus.ACTIVE));
        post.setLastReplyAt(LocalDateTime.now());
        return toPostResponse(postRepository.save(post), true);
    }

    @PostMapping("/posts/{id}/helpful")
    public CommunityPostResponse markHelpful(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        CommunityPost post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (!helpfulMarkRepository.existsByPostIdAndUserId(id, user.getId())) {
            CommunityHelpfulMark mark = new CommunityHelpfulMark();
            mark.setPost(post);
            mark.setUser(user);
            helpfulMarkRepository.save(mark);
            post.setHelpfulCount(post.getHelpfulCount() + 1);
            post = postRepository.save(post);
        }
        return toPostResponse(post, false);
    }

    @GetMapping("/conversations")
    public List<ConversationThreadResponse> conversations(@AuthenticationPrincipal User user) {
        return threadRepository.findVisibleThreads(user.getId()).stream()
                .map(thread -> toThreadResponse(thread, false))
                .toList();
    }

    @GetMapping("/conversations/{id}")
    public ConversationThreadResponse conversation(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        ConversationThread thread = threadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        requireParticipant(user, thread);
        return toThreadResponse(thread, true);
    }

    @PostMapping("/conversations")
    public ConversationThreadResponse createConversation(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ConversationCreateRequest request
    ) {
        ConversationThread thread = threadRepository
                .findByScopeTypeAndScopeIdAndCreatedById(request.scopeType(), request.scopeId(), user.getId())
                .orElseGet(ConversationThread::new);
        if (thread.getId() == null) {
            thread.setCreatedBy(user);
            thread.setScopeType(request.scopeType());
            thread.setScopeId(request.scopeId());
            thread.setTitle(request.title() == null || request.title().isBlank() ? defaultThreadTitle(request) : request.title());
            thread.setStatus(ConversationThread.ThreadStatus.OPEN);
            thread.setLastMessageAt(LocalDateTime.now());
            thread = threadRepository.save(thread);
            ensureParticipant(thread, user, "initiator");
            for (User participant : resolveParticipants(user, request)) {
                ensureParticipant(thread, participant, "participant");
            }
        }
        if (request.initialMessage() != null && !request.initialMessage().isBlank()) {
            addMessageInternal(thread, user, request.initialMessage(), ConversationMessage.MessageType.TEXT);
        }
        return toThreadResponse(thread, true);
    }

    @PostMapping("/conversations/{id}/messages")
    public ConversationThreadResponse addMessage(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody MessageRequest request
    ) {
        ConversationThread thread = threadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        requireParticipant(user, thread);
        addMessageInternal(thread, user, request.body(), ConversationMessage.MessageType.TEXT);
        return toThreadResponse(thread, true);
    }

    @PostMapping("/conversations/{id}/read")
    public ConversationThreadResponse markRead(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        ConversationThread thread = threadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        ConversationParticipant participant = participantRepository.findByThreadIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AccessDeniedException("Conversation is private"));
        participant.setLastReadAt(LocalDateTime.now());
        participantRepository.save(participant);
        return toThreadResponse(thread, true);
    }

    @PostMapping("/conversations/{id}/mute")
    public ConversationThreadResponse mute(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        ConversationThread thread = threadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        ConversationParticipant participant = participantRepository.findByThreadIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AccessDeniedException("Conversation is private"));
        participant.setMuted(!participant.isMuted());
        participantRepository.save(participant);
        return toThreadResponse(thread, true);
    }

    @GetMapping("/trials")
    public List<TrialCollaborationResponse> trials() {
        return trialRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toTrialResponse)
                .toList();
    }

    @PostMapping("/trials")
    public TrialCollaborationResponse createTrial(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody TrialRequest request
    ) {
        TrialCollaboration trial = new TrialCollaboration();
        trial.setInitiatedBy(user);
        if (request.teamId() != null) {
            trial.setTeam(teamRepository.findByIdAndActiveTrue(request.teamId())
                    .orElseThrow(() -> new IllegalArgumentException("Team not found")));
        }
        trial.setTitle(request.title());
        trial.setScope(request.scope());
        trial.setProposedStartDate(request.proposedStartDate());
        trial.setProposedEndDate(request.proposedEndDate());
        trial.setStatus(TrialCollaboration.TrialStatus.PROPOSED);
        return toTrialResponse(trialRepository.save(trial));
    }

    @PostMapping("/trials/{id}/{action}")
    public TrialCollaborationResponse updateTrialStatus(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @PathVariable String action
    ) {
        TrialCollaboration trial = trialRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trial not found"));
        if (!trial.getInitiatedBy().getId().equals(user.getId())
                && user.getRole() != User.UserRole.ADMIN
                && (trial.getTeam() == null || !trial.getTeam().getManager().getId().equals(user.getId()))) {
            throw new AccessDeniedException("Trial belongs to another user or team");
        }
        trial.setStatus(switch (action) {
            case "accept" -> TrialCollaboration.TrialStatus.ACCEPTED;
            case "activate" -> TrialCollaboration.TrialStatus.ACTIVE;
            case "complete" -> TrialCollaboration.TrialStatus.COMPLETED;
            case "cancel" -> TrialCollaboration.TrialStatus.CANCELLED;
            default -> throw new IllegalArgumentException("Unsupported trial action");
        });
        return toTrialResponse(trialRepository.save(trial));
    }

    private void apply(FormationPost post, FormationPostRequest request) {
        post.setTitle(request.title());
        post.setBody(request.body());
        post.setOfferedServices(request.offeredServices());
        post.setNeededServices(request.neededServices());
        post.setWorkingStyle(request.workingStyle());
        post.setTimezone(request.timezone());
        post.setPackageSize(request.packageSize());
        post.setExpiresOn(request.expiresOn() == null ? LocalDate.now().plusDays(30) : request.expiresOn());
        post.setStatus(request.status() == null ? FormationPost.PostStatus.ACTIVE : request.status());
    }

    private List<Team> mine(User user) {
        LinkedHashMap<UUID, Team> teams = new LinkedHashMap<>();
        teamRepository.findByManagerIdOrderByCreatedAtDesc(user.getId()).forEach(team -> teams.put(team.getId(), team));
        teamMemberRepository.findByUserIdAndActiveTrueOrderByCreatedAtDesc(user.getId()).stream()
                .map(TeamMember::getTeam)
                .filter(Team::isActive)
                .forEach(team -> teams.putIfAbsent(team.getId(), team));
        return new ArrayList<>(teams.values());
    }

    private void addMessageInternal(
            ConversationThread thread,
            User sender,
            String body,
            ConversationMessage.MessageType type
    ) {
        ConversationMessage message = new ConversationMessage();
        message.setThread(thread);
        message.setSender(sender);
        message.setMessageType(type);
        message.setBody(body);
        messageRepository.save(message);
        thread.setLastMessageAt(LocalDateTime.now());
        threadRepository.save(thread);
    }

    private List<User> resolveParticipants(User currentUser, ConversationCreateRequest request) {
        List<User> participants = new ArrayList<>();
        if (request.targetUserId() != null && !request.targetUserId().equals(currentUser.getId())) {
            participants.add(resolveUserById(request.targetUserId()));
            return participants;
        }
        if (request.scopeId() == null) {
            return participants;
        }
        switch (request.scopeType()) {
            case EXPERT_PROFILE -> expertProfileRepository.findByIdAndActiveTrue(request.scopeId())
                    .map(ExpertProfile::getUser)
                    .filter(user -> !user.getId().equals(currentUser.getId()))
                    .ifPresent(participants::add);
            case TEAM_PROFILE, TEAM_OPENING -> teamRepository.findByIdAndActiveTrue(request.scopeId())
                    .map(Team::getManager)
                    .filter(user -> !user.getId().equals(currentUser.getId()))
                    .ifPresent(participants::add);
            case FORMATION_POST -> formationPostRepository.findById(request.scopeId())
                    .map(FormationPost::getAuthor)
                    .filter(user -> !user.getId().equals(currentUser.getId()))
                    .ifPresent(participants::add);
            case TEAM_JOIN_REQUEST -> teamJoinRequestRepository.findById(request.scopeId()).ifPresent(joinRequest -> {
                if (!joinRequest.getRequester().getId().equals(currentUser.getId())) {
                    participants.add(joinRequest.getRequester());
                }
                if (!joinRequest.getTeam().getManager().getId().equals(currentUser.getId())) {
                    participants.add(joinRequest.getTeam().getManager());
                }
            });
            case TRIAL_COLLABORATION -> trialRepository.findById(request.scopeId())
                    .map(TrialCollaboration::getTeam)
                    .map(Team::getManager)
                    .filter(user -> !user.getId().equals(currentUser.getId()))
                    .ifPresent(participants::add);
            case DIRECT -> {
            }
        }
        return participants;
    }

    private User resolveUserById(UUID userId) {
        return expertProfileRepository.findByUserId(userId)
                .map(ExpertProfile::getUser)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));
    }

    private void ensureParticipant(ConversationThread thread, User user, String role) {
        ConversationParticipant participant = participantRepository.findByThreadIdAndUserId(thread.getId(), user.getId())
                .orElseGet(ConversationParticipant::new);
        participant.setThread(thread);
        participant.setUser(user);
        participant.setParticipantRole(role);
        participantRepository.save(participant);
    }

    private void requireParticipant(User user, ConversationThread thread) {
        if (user.getRole() == User.UserRole.ADMIN || participantRepository.existsByThreadIdAndUserId(thread.getId(), user.getId())) {
            return;
        }
        throw new AccessDeniedException("Conversation is private");
    }

    private void requireAuthorOrAdmin(User user, User author) {
        if (user.getRole() == User.UserRole.ADMIN || author.getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Only the author can change this record");
    }

    private void requireManagerOrAdmin(User user, Team team) {
        if (user.getRole() == User.UserRole.ADMIN || team.getManager().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Team belongs to another manager");
    }

    private String defaultThreadTitle(ConversationCreateRequest request) {
        return switch (request.scopeType()) {
            case EXPERT_PROFILE -> "Expert profile conversation";
            case TEAM_PROFILE -> "Team profile conversation";
            case TEAM_OPENING -> "Team opening conversation";
            case FORMATION_POST -> "Formation post conversation";
            case TEAM_JOIN_REQUEST -> "Join request conversation";
            case TRIAL_COLLABORATION -> "Trial collaboration conversation";
            case DIRECT -> "Direct conversation";
        };
    }

    private FormationPostResponse toFormationPostResponse(FormationPost post) {
        return new FormationPostResponse(
                post.getId(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                toCurrentUserSummary(post.getAuthor()),
                toTeamResponse(post.getTeam()),
                post.getPostType(),
                post.getTitle(),
                post.getBody(),
                post.getOfferedServices(),
                post.getNeededServices(),
                post.getWorkingStyle(),
                post.getTimezone(),
                post.getPackageSize(),
                post.getStatus(),
                post.getExpiresOn()
        );
    }

    private ChannelResponse toChannelResponse(CommunityChannel channel) {
        return new ChannelResponse(
                channel.getId(),
                channel.getCreatedAt(),
                channel.getUpdatedAt(),
                channel.getSlug(),
                channel.getName(),
                channel.getDescription(),
                channel.getChannelType(),
                channel.getColor(),
                channel.getSortOrder(),
                channel.isActive()
        );
    }

    private CommunityPostResponse toPostResponse(CommunityPost post, boolean includeComments) {
        List<CommentResponse> comments = includeComments
                ? commentRepository.findByPostIdAndStatusOrderByCreatedAtAsc(post.getId(), CommunityComment.CommentStatus.ACTIVE).stream()
                        .map(comment -> new CommentResponse(
                                comment.getId(),
                                comment.getCreatedAt(),
                                comment.getUpdatedAt(),
                                toCurrentUserSummary(comment.getAuthor()),
                                comment.getBody(),
                                comment.getStatus()
                        ))
                        .toList()
                : List.of();
        return new CommunityPostResponse(
                post.getId(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                toChannelResponse(post.getChannel()),
                toCurrentUserSummary(post.getAuthor()),
                post.getTitle(),
                post.getBody(),
                post.getServiceTags(),
                post.getStatus(),
                post.getHelpfulCount(),
                post.getReplyCount(),
                post.getLastReplyAt(),
                comments
        );
    }

    private ConversationThreadResponse toThreadResponse(ConversationThread thread, boolean includeMessages) {
        List<ConversationParticipantResponse> participants = participantRepository.findByThreadIdOrderByCreatedAtAsc(thread.getId()).stream()
                .map(participant -> new ConversationParticipantResponse(
                        participant.getId(),
                        toCurrentUserSummary(participant.getUser()),
                        participant.getParticipantRole(),
                        participant.isMuted(),
                        participant.isArchived(),
                        participant.getLastReadAt()
                ))
                .toList();
        List<ConversationMessageResponse> messages = includeMessages
                ? messageRepository.findByThreadIdAndDeletedAtIsNullOrderByCreatedAtAsc(thread.getId()).stream()
                        .map(message -> new ConversationMessageResponse(
                                message.getId(),
                                message.getCreatedAt(),
                                message.getUpdatedAt(),
                                toCurrentUserSummary(message.getSender()),
                                message.getMessageType(),
                                message.getBody()
                        ))
                        .toList()
                : List.of();
        return new ConversationThreadResponse(
                thread.getId(),
                thread.getCreatedAt(),
                thread.getUpdatedAt(),
                thread.getScopeType(),
                thread.getScopeId(),
                thread.getTitle(),
                thread.getStatus(),
                toCurrentUserSummary(thread.getCreatedBy()),
                thread.getLastMessageAt(),
                participants,
                messages
        );
    }

    private TrialCollaborationResponse toTrialResponse(TrialCollaboration trial) {
        return new TrialCollaborationResponse(
                trial.getId(),
                trial.getCreatedAt(),
                trial.getUpdatedAt(),
                toCurrentUserSummary(trial.getInitiatedBy()),
                toTeamResponse(trial.getTeam()),
                trial.getTitle(),
                trial.getScope(),
                trial.getStatus(),
                trial.getProposedStartDate(),
                trial.getProposedEndDate()
        );
    }

    public record NetworkHomeResponse(
            ExpertProfileResponse expertProfile,
            List<TeamResponse> myTeams,
            List<TeamJoinRequestResponse> myJoinRequests,
            List<FormationPostResponse> formationPosts,
            List<ChannelResponse> channels,
            List<ConversationThreadResponse> conversations,
            List<TrialCollaborationResponse> trials
    ) {}

    public record FormationPostRequest(
            @NotNull FormationPost.PostType postType,
            UUID teamId,
            @NotBlank String title,
            String body,
            String offeredServices,
            String neededServices,
            String workingStyle,
            String timezone,
            String packageSize,
            FormationPost.PostStatus status,
            LocalDate expiresOn
    ) {}

    public record FormationPostResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            CurrentUserSummary author,
            TeamResponse team,
            FormationPost.PostType postType,
            String title,
            String body,
            String offeredServices,
            String neededServices,
            String workingStyle,
            String timezone,
            String packageSize,
            FormationPost.PostStatus status,
            LocalDate expiresOn
    ) {}

    public record ChannelResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String slug,
            String name,
            String description,
            CommunityChannel.ChannelType channelType,
            String color,
            int sortOrder,
            boolean active
    ) {}

    public record CommunityPostRequest(@NotBlank String title, @NotBlank String body, String serviceTags) {}
    public record CommentRequest(@NotBlank String body) {}

    public record CommunityPostResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ChannelResponse channel,
            CurrentUserSummary author,
            String title,
            String body,
            String serviceTags,
            CommunityPost.PostStatus status,
            int helpfulCount,
            int replyCount,
            LocalDateTime lastReplyAt,
            List<CommentResponse> comments
    ) {}

    public record CommentResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            CurrentUserSummary author,
            String body,
            CommunityComment.CommentStatus status
    ) {}

    public record ConversationCreateRequest(
            @NotNull ConversationThread.ScopeType scopeType,
            UUID scopeId,
            UUID targetUserId,
            String title,
            String initialMessage
    ) {}

    public record MessageRequest(@NotBlank String body) {}

    public record ConversationThreadResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ConversationThread.ScopeType scopeType,
            UUID scopeId,
            String title,
            ConversationThread.ThreadStatus status,
            CurrentUserSummary createdBy,
            LocalDateTime lastMessageAt,
            List<ConversationParticipantResponse> participants,
            List<ConversationMessageResponse> messages
    ) {}

    public record ConversationParticipantResponse(
            UUID id,
            CurrentUserSummary user,
            String participantRole,
            boolean muted,
            boolean archived,
            LocalDateTime lastReadAt
    ) {}

    public record ConversationMessageResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            CurrentUserSummary sender,
            ConversationMessage.MessageType messageType,
            String body
    ) {}

    public record TrialRequest(
            UUID teamId,
            @NotBlank String title,
            String scope,
            LocalDate proposedStartDate,
            LocalDate proposedEndDate
    ) {}

    public record TrialCollaborationResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            CurrentUserSummary initiatedBy,
            TeamResponse team,
            String title,
            String scope,
            TrialCollaboration.TrialStatus status,
            LocalDate proposedStartDate,
            LocalDate proposedEndDate
    ) {}
}
