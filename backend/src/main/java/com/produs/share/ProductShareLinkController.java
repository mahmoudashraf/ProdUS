package com.produs.share;

import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

import com.produs.share.ProductShareDtos.ProductShareLinkRequest;
import com.produs.share.ProductShareDtos.ProductShareLinkResponse;
import com.produs.share.ProductShareDtos.PublicProductShareResponse;

@RestController
@RequiredArgsConstructor
public class ProductShareLinkController {

    private final ProductShareLinkService productShareLinkService;

    @GetMapping("/api/products/{productId}/share-links")
    public List<ProductShareLinkResponse> list(
            @AuthenticationPrincipal User owner,
            @PathVariable UUID productId
    ) {
        return productShareLinkService.list(owner, productId);
    }

    @PostMapping("/api/products/{productId}/share-links")
    public ProductShareLinkResponse create(
            @AuthenticationPrincipal User owner,
            @PathVariable UUID productId,
            @RequestBody(required = false) ProductShareLinkRequest request
    ) {
        return productShareLinkService.create(owner, productId, request);
    }

    @DeleteMapping("/api/products/{productId}/share-links/{linkId}")
    public ProductShareLinkResponse revoke(
            @AuthenticationPrincipal User owner,
            @PathVariable UUID productId,
            @PathVariable UUID linkId
    ) {
        return productShareLinkService.revoke(owner, productId, linkId);
    }

    @GetMapping("/api/public/product-shares/{token}")
    public PublicProductShareResponse publicView(@PathVariable String token) {
        return productShareLinkService.publicView(token);
    }
}
