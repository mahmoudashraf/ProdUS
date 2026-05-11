package com.produs.controller;

import com.produs.dto.PlatformDtos.ErrorMessageResponse;
import com.produs.dto.PlatformDtos.FileDeleteResponse;
import com.produs.dto.PlatformDtos.FileExistsResponse;
import com.produs.dto.PlatformDtos.FileMetadataResponse;
import com.produs.dto.PlatformDtos.UploadUrlResponse;
import com.produs.service.S3Service;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File Upload", description = "File upload and management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class FileUploadController {

    private final S3Service s3Service;

    @PostMapping("/upload-url")
    @Operation(summary = "Generate presigned upload URL", description = "Generate a presigned URL for uploading files to S3")
    @ApiResponse(responseCode = "200", description = "Presigned URL generated successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> generateUploadUrl(
            @RequestParam String fileName,
            @RequestParam String contentType,
            @RequestParam(defaultValue = "uploads") String prefix
    ) {
        log.info("Generating presigned upload URL for file: {} with content type: {}", fileName, contentType);
        
        try {
            String key = s3Service.generateFileKey(prefix, fileName);
            String presignedUrl = s3Service.generatePresignedUploadUrl(key, contentType);
            String fileUrl = s3Service.getFileUrl(key);
            
            return ResponseEntity.ok(new UploadUrlResponse(presignedUrl, key, fileUrl, 900));
        } catch (Exception e) {
            log.error("Failed to generate presigned upload URL", e);
            return ResponseEntity.internalServerError()
                    .body(new ErrorMessageResponse("Failed to generate upload URL: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{key}")
    @Operation(summary = "Delete file", description = "Delete a file from S3 storage")
    @ApiResponse(responseCode = "200", description = "File deleted successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "404", description = "File not found")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteFile(@PathVariable String key) {
        log.info("Deleting file with key: {}", key);
        
        try {
            if (!s3Service.fileExists(key)) {
                return ResponseEntity.notFound().build();
            }
            
            s3Service.deleteFile(key);
            return ResponseEntity.ok(new FileDeleteResponse("File deleted successfully", key));
        } catch (Exception e) {
            log.error("Failed to delete file with key: {}", key, e);
            return ResponseEntity.internalServerError()
                    .body(new ErrorMessageResponse("Failed to delete file: " + e.getMessage()));
        }
    }

    @GetMapping("/{key}/exists")
    @Operation(summary = "Check file existence", description = "Check if a file exists in S3 storage")
    @ApiResponse(responseCode = "200", description = "File existence checked")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> checkFileExists(@PathVariable String key) {
        try {
            boolean exists = s3Service.fileExists(key);
            return ResponseEntity.ok(new FileExistsResponse(exists, key));
        } catch (Exception e) {
            log.error("Failed to check file existence for key: {}", key, e);
            return ResponseEntity.internalServerError()
                    .body(new ErrorMessageResponse("Failed to check file existence: " + e.getMessage()));
        }
    }

    @GetMapping("/{key}/metadata")
    @Operation(summary = "Get file metadata", description = "Get metadata for a file in S3 storage")
    @ApiResponse(responseCode = "200", description = "File metadata retrieved")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "404", description = "File not found")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getFileMetadata(@PathVariable String key) {
        try {
            if (!s3Service.fileExists(key)) {
                return ResponseEntity.notFound().build();
            }
            
            var metadata = s3Service.getFileMetadata(key);
            return ResponseEntity.ok(new FileMetadataResponse(
                    key,
                    metadata.contentType() != null ? metadata.contentType() : "unknown",
                    metadata.contentLength(),
                    metadata.lastModified() != null ? metadata.lastModified().toString() : null,
                    metadata.eTag()
            ));
        } catch (Exception e) {
            log.error("Failed to get file metadata for key: {}", key, e);
            return ResponseEntity.internalServerError()
                    .body(new ErrorMessageResponse("Failed to get file metadata: " + e.getMessage()));
        }
    }
}
