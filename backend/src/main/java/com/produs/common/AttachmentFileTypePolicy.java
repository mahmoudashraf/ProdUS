package com.produs.common;

import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public final class AttachmentFileTypePolicy {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/json",
            "application/markdown",
            "application/msword",
            "application/pdf",
            "application/vnd.ms-excel",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/x-markdown",
            "application/x-zip",
            "application/x-zip-compressed",
            "application/zip",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "text/csv",
            "text/json",
            "text/markdown",
            "text/plain",
            "text/x-markdown",
            "text/x-web-markdown"
    );

    private static final Map<String, String> CONTENT_TYPE_ALIASES = Map.ofEntries(
            Map.entry("application/markdown", "text/markdown"),
            Map.entry("application/x-markdown", "text/markdown"),
            Map.entry("application/x-zip", "application/zip"),
            Map.entry("application/x-zip-compressed", "application/zip"),
            Map.entry("image/jpg", "image/jpeg"),
            Map.entry("text/json", "application/json"),
            Map.entry("text/x-markdown", "text/markdown"),
            Map.entry("text/x-web-markdown", "text/markdown")
    );

    private static final Map<String, String> EXTENSION_CONTENT_TYPES = Map.ofEntries(
            Map.entry("csv", "text/csv"),
            Map.entry("doc", "application/msword"),
            Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("jpg", "image/jpeg"),
            Map.entry("json", "application/json"),
            Map.entry("markdown", "text/markdown"),
            Map.entry("md", "text/markdown"),
            Map.entry("pdf", "application/pdf"),
            Map.entry("png", "image/png"),
            Map.entry("ppt", "application/vnd.ms-powerpoint"),
            Map.entry("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
            Map.entry("txt", "text/plain"),
            Map.entry("webp", "image/webp"),
            Map.entry("xls", "application/vnd.ms-excel"),
            Map.entry("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            Map.entry("zip", "application/zip")
    );

    private AttachmentFileTypePolicy() {
    }

    public static String resolveAllowedContentType(MultipartFile file) {
        String normalized = normalizeContentType(file == null ? null : file.getContentType());
        if (ALLOWED_CONTENT_TYPES.contains(normalized)) {
            return canonicalContentType(normalized);
        }
        if (isGenericBinary(normalized)) {
            Optional<String> inferred = inferFromFileName(file == null ? null : file.getOriginalFilename());
            if (inferred.isPresent()) {
                return inferred.get();
            }
        }
        return normalized;
    }

    public static boolean isAllowed(MultipartFile file) {
        return ALLOWED_CONTENT_TYPES.contains(resolveAllowedContentType(file));
    }

    private static String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "application/octet-stream";
        }
        String normalized = contentType.toLowerCase(Locale.ROOT).trim();
        int parameterIndex = normalized.indexOf(';');
        if (parameterIndex >= 0) {
            normalized = normalized.substring(0, parameterIndex).trim();
        }
        return normalized;
    }

    private static String canonicalContentType(String contentType) {
        return CONTENT_TYPE_ALIASES.getOrDefault(contentType, contentType);
    }

    private static boolean isGenericBinary(String contentType) {
        return contentType.equals("application/octet-stream")
                || contentType.equals("application/binary")
                || contentType.equals("binary/octet-stream");
    }

    private static Optional<String> inferFromFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return Optional.empty();
        }
        String fileName = originalFileName.replace('\\', '/');
        int lastSlash = fileName.lastIndexOf('/');
        if (lastSlash >= 0) {
            fileName = fileName.substring(lastSlash + 1);
        }
        int extensionIndex = fileName.lastIndexOf('.');
        if (extensionIndex < 0 || extensionIndex == fileName.length() - 1) {
            return Optional.empty();
        }
        String extension = fileName.substring(extensionIndex + 1).toLowerCase(Locale.ROOT).trim();
        return Optional.ofNullable(EXTENSION_CONTENT_TYPES.get(extension));
    }
}
