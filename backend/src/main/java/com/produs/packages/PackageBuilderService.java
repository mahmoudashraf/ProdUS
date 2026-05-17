package com.produs.packages;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.produs.ai.AIRecommendation;
import com.produs.ai.AIRecommendationRepository;
import com.produs.ai.PackageGovernanceProvider;
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
    private final PackageGovernanceProvider packageGovernanceProvider;
    private final ObjectMapper objectMapper;

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
        String deterministicOutputJson = deterministicOutput(requirement, packageInstance, moduleNames);
        PackageGovernanceProvider.PackageGovernanceResult result = packageGovernanceProvider.reviewPackage(
                new PackageGovernanceProvider.PackageGovernanceRequest(
                        requirement.getId(),
                        packageInstance.getId(),
                        packageInstance.getProductProfile().getId(),
                        packageInstance.getProductProfile().getName(),
                        requirement.getBusinessGoal(),
                        requirement.getRiskSignals(),
                        List.copyOf(moduleNames),
                        deterministicOutputJson,
                        fallbackConfidence
                )
        );
        recommendation.setPromptVersion(result.promptVersion());
        recommendation.setProviderName(result.provider());
        recommendation.setProviderRequestId(result.providerRequestId());
        recommendation.setFallback(result.fallback());
        recommendation.setFallbackReason(result.fallbackReason());
        recommendation.setConfidence(result.confidence());
        recommendation.setRationale(result.rationale());
        recommendation.setOutputJson(result.outputJson());
        recommendationRepository.save(recommendation);
    }

    private String deterministicOutput(RequirementIntake requirement, PackageInstance packageInstance, List<String> moduleNames) {
        ObjectNode output = objectMapper.createObjectNode();
        output.put("mode", "DETERMINISTIC_CATALOG");
        output.put("packageId", packageInstance.getId().toString());
        output.put("packageName", packageInstance.getName());
        output.put("requirementId", requirement.getId().toString());
        output.put("productId", packageInstance.getProductProfile().getId().toString());
        output.put("productName", packageInstance.getProductProfile().getName());
        ArrayNode modules = output.putArray("modules");
        moduleNames.forEach(modules::add);
        try {
            return objectMapper.writeValueAsString(output);
        } catch (Exception exception) {
            return "{\"mode\":\"DETERMINISTIC_CATALOG\",\"packageId\":\"%s\"}".formatted(packageInstance.getId());
        }
    }
}
