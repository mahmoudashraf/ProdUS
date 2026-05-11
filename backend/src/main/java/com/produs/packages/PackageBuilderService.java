package com.produs.packages;

import com.produs.ai.AIRecommendation;
import com.produs.ai.AIRecommendationRepository;
import com.produs.ai.loom.LoomAIProvider;
import com.produs.catalog.ServiceDependency;
import com.produs.catalog.ServiceDependencyRepository;
import com.produs.catalog.ServiceModule;
import com.produs.entity.User;
import com.produs.requirements.RequirementIntake;
import com.produs.requirements.RequirementIntakeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PackageBuilderService {

    private final RequirementIntakeRepository requirementRepository;
    private final ServiceDependencyRepository dependencyRepository;
    private final PackageInstanceRepository packageRepository;
    private final PackageModuleRepository packageModuleRepository;
    private final AIRecommendationRepository recommendationRepository;
    private final LoomAIProvider loomAIProvider;

    @Transactional
    public PackageInstance buildFromRequirement(User owner, UUID requirementId) {
        RequirementIntake requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new IllegalArgumentException("Requirement intake not found"));
        if (owner.getRole() != User.UserRole.ADMIN
                && !requirement.getProductProfile().getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Requirement belongs to another owner");
        }

        PackageInstance packageInstance = new PackageInstance();
        packageInstance.setOwner(owner);
        packageInstance.setProductProfile(requirement.getProductProfile());
        packageInstance.setRequirementIntake(requirement);
        packageInstance.setName(requirement.getProductProfile().getName() + " productization package");
        packageInstance.setSummary(requirement.getRequirementBrief() == null
                ? requirement.getBusinessGoal()
                : requirement.getRequirementBrief());
        packageInstance.setStatus(PackageInstance.PackageStatus.AWAITING_TEAM);
        packageInstance = packageRepository.save(packageInstance);

        List<String> moduleNames = new ArrayList<>();
        ServiceModule requested = requirement.getRequestedServiceModule();
        if (requested != null) {
            Set<ServiceModule> modules = new LinkedHashSet<>();
            modules.add(requested);
            for (ServiceDependency dependency : dependencyRepository.findBySourceModuleAndRequiredTrue(requested)) {
                modules.add(dependency.getDependsOnModule());
            }

            int order = 1;
            for (ServiceModule module : modules) {
                PackageModule packageModule = new PackageModule();
                packageModule.setPackageInstance(packageInstance);
                packageModule.setServiceModule(module);
                packageModule.setSequenceOrder(order++);
                packageModule.setRequired(true);
                packageModule.setRationale(module.getId().equals(requested.getId())
                        ? "Requested service module"
                        : "Required dependency for a complete productization package");
                packageModule.setDeliverables(module.getExpectedDeliverables());
                packageModule.setAcceptanceCriteria(module.getAcceptanceCriteria());
                packageModuleRepository.save(packageModule);
                moduleNames.add(module.getName());
            }
        }

        requirement.setStatus(RequirementIntake.RequirementStatus.PACKAGE_RECOMMENDED);
        recordRecommendation(owner, requirement, packageInstance, moduleNames);
        return packageInstance;
    }

    private void recordRecommendation(
            User owner,
            RequirementIntake requirement,
            PackageInstance packageInstance,
            List<String> moduleNames
    ) {
        AIRecommendation recommendation = new AIRecommendation();
        recommendation.setCreatedBy(owner);
        recommendation.setRecommendationType("PACKAGE_COMPOSITION");
        recommendation.setSourceEntityType("REQUIREMENT_INTAKE");
        recommendation.setSourceEntityId(requirement.getId().toString());
        double fallbackConfidence = moduleNames.isEmpty() ? 0.64 : 0.86;
        String deterministicOutputJson = """
                {"packageId":"%s","packageName":"%s","modules":[%s]}
                """.formatted(
                packageInstance.getId(),
                escapeJson(packageInstance.getName()),
                moduleNames.stream()
                        .map(moduleName -> "\"" + escapeJson(moduleName) + "\"")
                        .reduce((left, right) -> left + "," + right)
                        .orElse("")
        ).trim();
        LoomAIProvider.PackageGovernanceResult governance = loomAIProvider.reviewPackage(
                requirement,
                packageInstance,
                moduleNames,
                deterministicOutputJson,
                fallbackConfidence
        );
        recommendation.setPromptVersion(governance.promptVersion());
        recommendation.setConfidence(governance.confidence());
        recommendation.setRationale(governance.rationale());
        recommendation.setOutputJson(governance.outputJson());
        recommendationRepository.save(recommendation);
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
