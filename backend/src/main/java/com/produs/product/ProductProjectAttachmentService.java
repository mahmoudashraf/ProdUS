package com.produs.product;

import com.produs.entity.User;
import com.produs.service.S3Service;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import com.produs.workspace.WorkspaceParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductProjectAttachmentService {

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

    private final ProductProjectAttachmentRepository attachmentRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final WorkspaceParticipantRepository participantRepository;
    private final S3Service s3Service;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.attachments.max-file-size-bytes:10485760}")
    private long maxFileSizeBytes;

    @Value("${app.product-creation.ai-document-access-ttl-minutes:10}")
    private long aiDocumentAccessTtlMinutes;

    @Transactional(readOnly = true)
    public List<ProductProjectAttachment> listForProduct(User user, ProductProfile product) {
        requireProductAttachmentRead(user, product);
        return attachmentRepository.findByProductProfileIdOrderByCreatedAtDesc(product.getId());
    }

    @Transactional
    public List<ProductProjectAttachment> uploadForProductCreation(
            User user,
            ProductProfile product,
            List<MultipartFile> files,
            Set<Integer> aiSharedFileIndexes
    ) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }
        Set<Integer> selectedIndexes = aiSharedFileIndexes == null ? Set.of() : aiSharedFileIndexes;
        java.util.ArrayList<ProductProjectAttachment> uploaded = new java.util.ArrayList<>();
        for (int index = 0; index < files.size(); index++) {
            MultipartFile file = files.get(index);
            if (file != null && !file.isEmpty()) {
                uploaded.add(uploadOne(user, product, file, selectedIndexes, index));
            }
        }
        return uploaded;
    }

    @Transactional
    public TemporaryAiDocumentAccess grantTemporaryAiAccess(ProductProjectAttachment attachment, String apiBaseUrl) {
        String token = createToken();
        attachment.setAiShareRequested(true);
        attachment.setAiAccessTokenHash(sha256Hex(token));
        attachment.setAiAccessExpiresAt(LocalDateTime.now().plusMinutes(Math.max(1, aiDocumentAccessTtlMinutes)));
        attachment.setAiAccessRevokedAt(null);
        ProductProjectAttachment saved = attachmentRepository.save(attachment);
        return new TemporaryAiDocumentAccess(
                saved.getId(),
                saved.getFileName(),
                saved.getContentType(),
                saved.getSizeBytes(),
                accessUrl(apiBaseUrl, token),
                saved.getAiAccessExpiresAt()
        );
    }

    @Transactional(readOnly = true)
    public String createOwnerDownloadUrl(User user, UUID attachmentId) {
        ProductProjectAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Project attachment not found"));
        requireProductAttachmentRead(user, attachment.getProductProfile());
        return s3Service.generatePresignedDownloadUrl(attachment.getStorageKey());
    }

    @Transactional
    public String createAiAccessDownloadUrl(String token) {
        if (token == null || token.isBlank()) {
            throw new AccessDeniedException("Temporary document token is required");
        }
        ProductProjectAttachment attachment = attachmentRepository.findByAiAccessTokenHash(sha256Hex(token))
                .orElseThrow(() -> new AccessDeniedException("Temporary document token is invalid"));
        if (!attachment.isAiShareRequested()
                || attachment.getAiAccessExpiresAt() == null
                || attachment.getAiAccessExpiresAt().isBefore(LocalDateTime.now())
                || attachment.getAiAccessRevokedAt() != null) {
            throw new AccessDeniedException("Temporary document access has expired");
        }
        attachment.setAiAccessLastUsedAt(LocalDateTime.now());
        attachmentRepository.save(attachment);
        return s3Service.generatePresignedDownloadUrl(attachment.getStorageKey());
    }

    @Transactional
    public void delete(User user, UUID attachmentId) {
        ProductProjectAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Project attachment not found"));
        if (user.getRole() != User.UserRole.ADMIN && !attachment.getProductProfile().getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the product owner can delete project attachments");
        }
        s3Service.deleteFile(attachment.getStorageKey());
        attachmentRepository.delete(attachment);
    }

    private ProductProjectAttachment uploadOne(
            User user,
            ProductProfile product,
            MultipartFile file,
            Set<Integer> aiSharedFileIndexes,
            int index
    ) {
        validateFile(file);
        String fileName = sanitizeFileName(file.getOriginalFilename());
        String contentType = normalizeContentType(file.getContentType());
        String key = s3Service.generateFileKey("project-attachments/products/" + product.getId(), fileName);
        String fileUrl;
        try {
            fileUrl = s3Service.uploadFile(key, file.getBytes(), contentType);
        } catch (IOException e) {
            throw new IllegalArgumentException("File could not be read for upload");
        }

        ProductProjectAttachment attachment = new ProductProjectAttachment();
        attachment.setProductProfile(product);
        attachment.setUploadedBy(user);
        attachment.setFileName(fileName);
        attachment.setStorageKey(key);
        attachment.setFileUrl(fileUrl);
        attachment.setContentType(contentType);
        attachment.setSizeBytes(file.getSize());
        attachment.setLabel(fileName);
        attachment.setAiShareRequested(aiSharedFileIndexes.contains(index));
        return attachmentRepository.save(attachment);
    }

    private void requireProductAttachmentRead(User user, ProductProfile product) {
        if (user.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(user.getId())) {
            return;
        }
        List<ProjectWorkspace> workspaces = workspaceRepository.findByPackageInstanceProductProfileId(product.getId());
        boolean participant = workspaces.stream()
                .anyMatch(workspace -> participantRepository.existsByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), user.getId()));
        if (participant) {
            return;
        }
        throw new AccessDeniedException("Project attachments are restricted to the product owner and approved workspace participants");
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
        String fileName = originalFileName == null || originalFileName.isBlank() ? "project-document" : originalFileName;
        fileName = fileName.replace('\\', '/');
        int lastSlash = fileName.lastIndexOf('/');
        if (lastSlash >= 0) {
            fileName = fileName.substring(lastSlash + 1);
        }
        fileName = fileName.replaceAll("[\\p{Cntrl}]", "").trim();
        if (fileName.isBlank()) {
            return "project-document";
        }
        return fileName.length() > 180 ? fileName.substring(fileName.length() - 180) : fileName;
    }

    private String createToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return "pdoc_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256Hex(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private String accessUrl(String apiBaseUrl, String token) {
        String base = apiBaseUrl == null || apiBaseUrl.isBlank() ? "" : apiBaseUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + "/api/product-attachments/ai-access/" + token;
    }

    public record TemporaryAiDocumentAccess(
            UUID attachmentId,
            String fileName,
            String contentType,
            long sizeBytes,
            String temporaryAccessUrl,
            LocalDateTime expiresAt
    ) {}
}
