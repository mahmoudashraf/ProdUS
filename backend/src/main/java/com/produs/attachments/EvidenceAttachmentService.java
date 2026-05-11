package com.produs.attachments;

import com.produs.commerce.DisputeCase;
import com.produs.commerce.DisputeCaseRepository;
import com.produs.entity.User;
import com.produs.service.S3Service;
import com.produs.teams.Team;
import com.produs.teams.TeamMemberRepository;
import com.produs.workspace.Deliverable;
import com.produs.workspace.DeliverableRepository;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import com.produs.workspace.WorkspaceParticipant;
import com.produs.workspace.WorkspaceParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EvidenceAttachmentService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/json",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/x-zip-compressed",
            "application/zip",
            "image/jpeg",
            "image/png",
            "image/webp",
            "text/csv",
            "text/markdown",
            "text/plain"
    );

    private final EvidenceAttachmentRepository attachmentRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final DeliverableRepository deliverableRepository;
    private final DisputeCaseRepository disputeRepository;
    private final WorkspaceParticipantRepository participantRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final S3Service s3Service;

    @Value("${app.attachments.max-file-size-bytes:10485760}")
    private long maxFileSizeBytes;

    @Transactional(readOnly = true)
    public List<EvidenceAttachment> listWorkspaceAttachments(User user, UUID workspaceId) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        return attachmentRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
    }

    @Transactional(readOnly = true)
    public List<EvidenceAttachment> listScopeAttachments(
            User user,
            EvidenceAttachment.AttachmentScope scopeType,
            UUID scopeId
    ) {
        ResolvedScope scope = resolveScope(scopeType, scopeId);
        requireScopeViewer(user, scope);
        return attachmentRepository.findByScopeTypeAndScopeIdOrderByCreatedAtDesc(scopeType, scopeId);
    }

    @Transactional
    public EvidenceAttachment upload(
            User user,
            EvidenceAttachment.AttachmentScope scopeType,
            UUID scopeId,
            String label,
            MultipartFile file
    ) {
        validateFile(file);
        ResolvedScope scope = resolveScope(scopeType, scopeId);
        requireScopeContributor(user, scope);

        String fileName = sanitizeFileName(file.getOriginalFilename());
        String contentType = normalizeContentType(file.getContentType());
        String key = s3Service.generateFileKey(storagePrefix(scope), fileName);
        String fileUrl;
        try {
            fileUrl = s3Service.uploadFile(key, file.getBytes(), contentType);
        } catch (IOException e) {
            throw new IllegalArgumentException("File could not be read for upload");
        }

        EvidenceAttachment attachment = new EvidenceAttachment();
        attachment.setWorkspace(scope.workspace());
        attachment.setDeliverable(scope.deliverable());
        attachment.setDispute(scope.dispute());
        attachment.setUploadedBy(user);
        attachment.setScopeType(scopeType);
        attachment.setScopeId(scopeId);
        attachment.setFileName(fileName);
        attachment.setStorageKey(key);
        attachment.setFileUrl(fileUrl);
        attachment.setContentType(contentType);
        attachment.setSizeBytes(file.getSize());
        attachment.setLabel(normalizeLabel(label));
        return attachmentRepository.save(attachment);
    }

    @Transactional
    public void delete(User user, UUID attachmentId) {
        EvidenceAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
        requireAttachmentDeletePermission(user, attachment);
        s3Service.deleteFile(attachment.getStorageKey());
        attachmentRepository.delete(attachment);
    }

    @Transactional(readOnly = true)
    public String createDownloadUrl(User user, UUID attachmentId) {
        EvidenceAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
        requireScopeViewer(user, new ResolvedScope(
                attachment.getScopeType(),
                attachment.getWorkspace(),
                attachment.getDeliverable(),
                attachment.getDispute()
        ));
        return s3Service.generatePresignedDownloadUrl(attachment.getStorageKey());
    }

    private ResolvedScope resolveScope(EvidenceAttachment.AttachmentScope scopeType, UUID scopeId) {
        if (scopeType == null || scopeId == null) {
            throw new IllegalArgumentException("Attachment scope is required");
        }
        return switch (scopeType) {
            case WORKSPACE -> {
                ProjectWorkspace workspace = workspaceRepository.findById(scopeId)
                        .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
                yield new ResolvedScope(scopeType, workspace, null, null);
            }
            case DELIVERABLE -> {
                Deliverable deliverable = deliverableRepository.findById(scopeId)
                        .orElseThrow(() -> new IllegalArgumentException("Deliverable not found"));
                yield new ResolvedScope(scopeType, deliverable.getMilestone().getWorkspace(), deliverable, null);
            }
            case DISPUTE -> {
                DisputeCase dispute = disputeRepository.findById(scopeId)
                        .orElseThrow(() -> new IllegalArgumentException("Dispute not found"));
                yield new ResolvedScope(scopeType, dispute.getWorkspace(), null, dispute);
            }
        };
    }

    private void requireScopeViewer(User user, ResolvedScope scope) {
        if (scope.scopeType() == EvidenceAttachment.AttachmentScope.DISPUTE) {
            requireDisputeViewer(user, scope.dispute());
            return;
        }
        requireWorkspaceViewer(user, scope.workspace());
    }

    private void requireScopeContributor(User user, ResolvedScope scope) {
        if (scope.scopeType() == EvidenceAttachment.AttachmentScope.DISPUTE) {
            requireDisputeContributor(user, scope.dispute());
            return;
        }
        requireWorkspaceContributor(user, scope.workspace());
    }

    private void requireAttachmentDeletePermission(User user, EvidenceAttachment attachment) {
        if (isAdmin(user)
                || attachment.getUploadedBy().getId().equals(user.getId())
                || attachment.getWorkspace().getOwner().getId().equals(user.getId())) {
            return;
        }
        if (attachment.getDispute() != null && isAssignedTeamManager(user, attachment.getDispute())) {
            return;
        }
        throw new AccessDeniedException("Attachment cannot be deleted by this user");
    }

    private void requireWorkspaceViewer(User user, ProjectWorkspace workspace) {
        if (isAdmin(user) || workspace.getOwner().getId().equals(user.getId())) {
            return;
        }
        if (participantRepository.existsByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), user.getId())) {
            return;
        }
        throw new AccessDeniedException("Workspace attachments are not available to this user");
    }

    private void requireWorkspaceContributor(User user, ProjectWorkspace workspace) {
        if (isAdmin(user) || workspace.getOwner().getId().equals(user.getId())) {
            return;
        }
        WorkspaceParticipant participant = participantRepository.findByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), user.getId())
                .orElseThrow(() -> new AccessDeniedException("Workspace attachments cannot be changed by this user"));
        if (participant.getRole() == WorkspaceParticipant.ParticipantRole.OWNER
                || participant.getRole() == WorkspaceParticipant.ParticipantRole.COORDINATOR
                || participant.getRole() == WorkspaceParticipant.ParticipantRole.TEAM_LEAD
                || participant.getRole() == WorkspaceParticipant.ParticipantRole.SPECIALIST) {
            return;
        }
        throw new AccessDeniedException("Workspace attachments cannot be changed by this user");
    }

    private void requireDisputeViewer(User user, DisputeCase dispute) {
        if (isAdmin(user)
                || dispute.getWorkspace().getOwner().getId().equals(user.getId())
                || dispute.getOpenedBy().getId().equals(user.getId())
                || isAssignedTeamManager(user, dispute)
                || isAssignedTeamMember(user, dispute)) {
            return;
        }
        throw new AccessDeniedException("Dispute attachments are not available to this user");
    }

    private void requireDisputeContributor(User user, DisputeCase dispute) {
        requireDisputeViewer(user, dispute);
    }

    private boolean isAdmin(User user) {
        return user.getRole() == User.UserRole.ADMIN;
    }

    private boolean isAssignedTeamManager(User user, DisputeCase dispute) {
        Team team = dispute.getTeam();
        return team != null && team.getManager().getId().equals(user.getId());
    }

    private boolean isAssignedTeamMember(User user, DisputeCase dispute) {
        Team team = dispute.getTeam();
        return team != null && teamMemberRepository.existsByTeamIdAndUserIdAndActiveTrue(team.getId(), user.getId());
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Attachment file is required");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new IllegalArgumentException("Attachment exceeds the maximum allowed size");
        }
        String contentType = normalizeContentType(file.getContentType());
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Attachment file type is not allowed");
        }
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "application/octet-stream";
        }
        return contentType.toLowerCase(Locale.ROOT).trim();
    }

    private String sanitizeFileName(String originalFileName) {
        String fileName = originalFileName == null || originalFileName.isBlank() ? "attachment" : originalFileName;
        fileName = fileName.replace('\\', '/');
        int lastSlash = fileName.lastIndexOf('/');
        if (lastSlash >= 0) {
            fileName = fileName.substring(lastSlash + 1);
        }
        fileName = fileName.replaceAll("[\\p{Cntrl}]", "").trim();
        if (fileName.isBlank()) {
            return "attachment";
        }
        return fileName.length() > 180 ? fileName.substring(fileName.length() - 180) : fileName;
    }

    private String normalizeLabel(String label) {
        if (label == null || label.isBlank()) {
            return null;
        }
        String normalized = label.replaceAll("[\\p{Cntrl}]", "").trim();
        return normalized.length() > 180 ? normalized.substring(0, 180) : normalized;
    }

    private String storagePrefix(ResolvedScope scope) {
        return "evidence/%s/%s".formatted(
                scope.scopeType().name().toLowerCase(Locale.ROOT),
                switch (scope.scopeType()) {
                    case WORKSPACE -> scope.workspace().getId();
                    case DELIVERABLE -> scope.deliverable().getId();
                    case DISPUTE -> scope.dispute().getId();
                }
        );
    }

    private record ResolvedScope(
            EvidenceAttachment.AttachmentScope scopeType,
            ProjectWorkspace workspace,
            Deliverable deliverable,
            DisputeCase dispute
    ) {}
}
