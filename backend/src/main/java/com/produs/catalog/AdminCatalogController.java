package com.produs.catalog;

import com.produs.dto.PlatformDtos.ServiceCategoryResponse;
import com.produs.dto.PlatformDtos.ServiceDependencyResponse;
import com.produs.dto.PlatformDtos.ServiceModuleResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

import static com.produs.dto.PlatformDtos.toServiceCategoryResponse;
import static com.produs.dto.PlatformDtos.toServiceDependencyResponse;
import static com.produs.dto.PlatformDtos.toServiceModuleResponse;

@RestController
@RequestMapping("/api/admin/catalog")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCatalogController {

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceModuleRepository moduleRepository;
    private final ServiceDependencyRepository dependencyRepository;

    @PostMapping("/categories")
    public ServiceCategoryResponse createCategory(@Valid @RequestBody CategoryRequest request) {
        ServiceCategory category = new ServiceCategory();
        category.setName(request.name());
        category.setSlug(request.slug());
        category.setDescription(request.description());
        category.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        category.setActive(request.active() == null || request.active());
        return toServiceCategoryResponse(categoryRepository.save(category));
    }

    @PostMapping("/modules")
    public ServiceModuleResponse createModule(@Valid @RequestBody ModuleRequest request) {
        ServiceCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new IllegalArgumentException("Unknown service category"));

        ServiceModule module = new ServiceModule();
        module.setCategory(category);
        module.setName(request.name());
        module.setSlug(request.slug());
        module.setDescription(request.description());
        module.setRequiredInputs(request.requiredInputs());
        module.setExpectedDeliverables(request.expectedDeliverables());
        module.setAcceptanceCriteria(request.acceptanceCriteria());
        module.setTimelineRange(request.timelineRange());
        module.setPriceRange(request.priceRange());
        module.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        module.setActive(request.active() == null || request.active());
        return toServiceModuleResponse(moduleRepository.save(module));
    }

    @PostMapping("/dependencies")
    public ServiceDependencyResponse createDependency(@Valid @RequestBody DependencyRequest request) {
        ServiceModule source = moduleRepository.findById(request.sourceModuleId())
                .orElseThrow(() -> new IllegalArgumentException("Unknown source module"));
        ServiceModule dependency = moduleRepository.findById(request.dependsOnModuleId())
                .orElseThrow(() -> new IllegalArgumentException("Unknown dependent module"));

        ServiceDependency serviceDependency = new ServiceDependency();
        serviceDependency.setSourceModule(source);
        serviceDependency.setDependsOnModule(dependency);
        serviceDependency.setReason(request.reason());
        serviceDependency.setRequired(request.required() == null || request.required());
        return toServiceDependencyResponse(dependencyRepository.save(serviceDependency));
    }

    public record CategoryRequest(
            @NotBlank(message = "Category name is required")
            String name,
            @NotBlank(message = "Category slug is required")
            String slug,
            String description,
            Integer sortOrder,
            Boolean active
    ) {}
    public record ModuleRequest(
            @NotNull(message = "Category is required")
            UUID categoryId,
            @NotBlank(message = "Module name is required")
            String name,
            @NotBlank(message = "Module slug is required")
            String slug,
            String description,
            String requiredInputs,
            String expectedDeliverables,
            String acceptanceCriteria,
            String timelineRange,
            String priceRange,
            Integer sortOrder,
            Boolean active
    ) {}
    public record DependencyRequest(
            @NotNull(message = "Source module is required")
            UUID sourceModuleId,
            @NotNull(message = "Dependent module is required")
            UUID dependsOnModuleId,
            String reason,
            Boolean required
    ) {}
}
