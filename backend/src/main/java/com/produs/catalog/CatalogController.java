package com.produs.catalog;

import com.produs.dto.PlatformDtos.ServiceCategoryResponse;
import com.produs.dto.PlatformDtos.ServiceDependencyResponse;
import com.produs.dto.PlatformDtos.ServiceModuleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toServiceCategoryResponse;
import static com.produs.dto.PlatformDtos.toServiceDependencyResponse;
import static com.produs.dto.PlatformDtos.toServiceModuleResponse;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceModuleRepository moduleRepository;
    private final ServiceDependencyRepository dependencyRepository;

    @GetMapping("/categories")
    public List<ServiceCategoryResponse> categories() {
        return categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(category -> toServiceCategoryResponse(category))
                .toList();
    }

    @GetMapping("/modules")
    public List<ServiceModuleResponse> modules(@RequestParam(required = false) UUID categoryId) {
        if (categoryId != null) {
            return moduleRepository.findByCategoryIdAndActiveTrueOrderBySortOrderAscNameAsc(categoryId).stream()
                    .map(module -> toServiceModuleResponse(module))
                    .toList();
        }
        return moduleRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(module -> toServiceModuleResponse(module))
                .toList();
    }

    @GetMapping("/dependencies")
    public List<ServiceDependencyResponse> dependencies(@RequestParam(required = false) UUID moduleId) {
        if (moduleId == null) {
            return dependencyRepository.findAll().stream()
                    .sorted(Comparator
                            .comparing((ServiceDependency dependency) -> dependency.getSourceModule().getSortOrder())
                            .thenComparing(dependency -> dependency.getSourceModule().getName())
                            .thenComparing(dependency -> dependency.getDependsOnModule().getSortOrder())
                            .thenComparing(dependency -> dependency.getDependsOnModule().getName()))
                    .map(dependency -> toServiceDependencyResponse(dependency))
                    .toList();
        }
        return dependencyRepository.findBySourceModuleId(moduleId).stream()
                .map(dependency -> toServiceDependencyResponse(dependency))
                .toList();
    }
}
