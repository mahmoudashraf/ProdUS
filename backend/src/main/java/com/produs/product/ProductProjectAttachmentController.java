package com.produs.product;

import com.produs.product.AiAssistedProductCreationService.ProductProjectAttachmentResponse;
import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/product-attachments")
@RequiredArgsConstructor
public class ProductProjectAttachmentController {

    private final ProductProfileRepository productRepository;
    private final ProductProjectAttachmentService attachmentService;

    @GetMapping
    public List<ProductProjectAttachmentResponse> list(
            @AuthenticationPrincipal User user,
            @RequestParam UUID productId
    ) {
        ProductProfile product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product profile not found"));
        return attachmentService.listForProduct(user, product).stream()
                .map(ProductProjectAttachmentResponse::from)
                .toList();
    }

    @GetMapping("/{attachmentId}/download-url")
    public Map<String, String> downloadUrl(
            @AuthenticationPrincipal User user,
            @PathVariable UUID attachmentId
    ) {
        return Map.of("url", attachmentService.createOwnerDownloadUrl(user, attachmentId));
    }

    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable UUID attachmentId
    ) {
        attachmentService.delete(user, attachmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ai-access/{token}")
    public ResponseEntity<Void> temporaryAiAccess(@PathVariable String token) {
        String signedUrl = attachmentService.createAiAccessDownloadUrl(token);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .location(URI.create(signedUrl))
                .build();
    }
}
