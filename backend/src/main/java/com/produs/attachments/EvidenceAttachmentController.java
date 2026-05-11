package com.produs.attachments;

import com.produs.dto.PlatformDtos.AttachmentDownloadUrlResponse;
import com.produs.dto.PlatformDtos.EvidenceAttachmentResponse;
import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toEvidenceAttachmentResponse;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class EvidenceAttachmentController {

    private final EvidenceAttachmentService attachmentService;

    @Value("${aws.s3.presigned-url-duration:900}")
    private int downloadUrlExpiresInSeconds;

    @GetMapping
    public List<EvidenceAttachmentResponse> list(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID workspaceId,
            @RequestParam(required = false) EvidenceAttachment.AttachmentScope scopeType,
            @RequestParam(required = false) UUID scopeId
    ) {
        if (workspaceId != null) {
            return attachmentService.listWorkspaceAttachments(user, workspaceId).stream()
                    .map(attachment -> toEvidenceAttachmentResponse(attachment))
                    .toList();
        }
        if (scopeType == null || scopeId == null) {
            throw new IllegalArgumentException("workspaceId or scopeType and scopeId are required");
        }
        return attachmentService.listScopeAttachments(user, scopeType, scopeId).stream()
                .map(attachment -> toEvidenceAttachmentResponse(attachment))
                .toList();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EvidenceAttachmentResponse upload(
            @AuthenticationPrincipal User user,
            @RequestParam EvidenceAttachment.AttachmentScope scopeType,
            @RequestParam UUID scopeId,
            @RequestParam(required = false) String label,
            @RequestParam MultipartFile file
    ) {
        return toEvidenceAttachmentResponse(attachmentService.upload(user, scopeType, scopeId, label, file));
    }

    @DeleteMapping("/{attachmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal User user, @PathVariable UUID attachmentId) {
        attachmentService.delete(user, attachmentId);
    }

    @GetMapping("/{attachmentId}/download-url")
    public AttachmentDownloadUrlResponse downloadUrl(@AuthenticationPrincipal User user, @PathVariable UUID attachmentId) {
        return new AttachmentDownloadUrlResponse(
                attachmentService.createDownloadUrl(user, attachmentId),
                downloadUrlExpiresInSeconds
        );
    }
}
