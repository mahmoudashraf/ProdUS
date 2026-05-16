package com.produs.cart;

import com.produs.dto.PlatformDtos.ProductizationCartConvertResponse;
import com.produs.dto.PlatformDtos.ProductizationCartResponse;
import com.produs.entity.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

import static com.produs.dto.PlatformDtos.toPackageInstanceResponse;
import static com.produs.dto.PlatformDtos.toProductizationCartResponse;
import static com.produs.dto.PlatformDtos.toProjectWorkspaceResponse;

@RestController
@RequestMapping("/api/productization-cart")
@RequiredArgsConstructor
public class ProductizationCartController {

    private final ProductizationCartService cartService;

    @GetMapping("/current")
    public ProductizationCartResponse current(@AuthenticationPrincipal User user) {
        ProductizationCart cart = cartService.current(user);
        return toProductizationCartResponse(cart, cartService.services(cart), cartService.talent(cart));
    }

    @PutMapping("/current")
    public ProductizationCartResponse update(
            @AuthenticationPrincipal User user,
            @RequestBody ProductizationCartService.CartUpdateRequest request
    ) {
        ProductizationCart cart = cartService.update(user, request);
        return toProductizationCartResponse(cart, cartService.services(cart), cartService.talent(cart));
    }

    @PostMapping("/services")
    public ProductizationCartResponse addService(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody AddServiceRequest request
    ) {
        cartService.addService(user, new ProductizationCartService.ServiceItemRequest(request.serviceModuleId(), request.notes()));
        ProductizationCart cart = cartService.current(user);
        return toProductizationCartResponse(cart, cartService.services(cart), cartService.talent(cart));
    }

    @DeleteMapping("/services/{itemId}")
    public ProductizationCartResponse removeService(@AuthenticationPrincipal User user, @PathVariable UUID itemId) {
        cartService.removeService(user, itemId);
        ProductizationCart cart = cartService.current(user);
        return toProductizationCartResponse(cart, cartService.services(cart), cartService.talent(cart));
    }

    @PostMapping("/talent")
    public ProductizationCartResponse addTalent(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody AddTalentRequest request
    ) {
        cartService.addTalent(user, new ProductizationCartService.TalentItemRequest(
                request.itemType(),
                request.teamId(),
                request.expertProfileId(),
                request.notes()
        ));
        ProductizationCart cart = cartService.current(user);
        return toProductizationCartResponse(cart, cartService.services(cart), cartService.talent(cart));
    }

    @DeleteMapping("/talent/{itemId}")
    public ProductizationCartResponse removeTalent(@AuthenticationPrincipal User user, @PathVariable UUID itemId) {
        cartService.removeTalent(user, itemId);
        ProductizationCart cart = cartService.current(user);
        return toProductizationCartResponse(cart, cartService.services(cart), cartService.talent(cart));
    }

    @PostMapping("/convert")
    public ProductizationCartConvertResponse convert(
            @AuthenticationPrincipal User user,
            @RequestBody ProductizationCartService.CartConvertRequest request
    ) {
        ProductizationCartService.ConversionResult result = cartService.convert(user, request);
        ProductizationCartResponse cartResponse = toProductizationCartResponse(
                result.cart(),
                result.serviceItems(),
                result.talentItems()
        );
        return new ProductizationCartConvertResponse(
                cartResponse,
                toPackageInstanceResponse(result.packageInstance()),
                toProjectWorkspaceResponse(result.workspace())
        );
    }

    public record AddServiceRequest(
            @NotNull(message = "Service module is required")
            UUID serviceModuleId,
            String notes
    ) {}

    public record AddTalentRequest(
            @NotNull(message = "Talent type is required")
            ProductizationCartTalentItem.TalentItemType itemType,
            UUID teamId,
            UUID expertProfileId,
            String notes
    ) {}
}
