package com.produs.packages;

import com.produs.catalog.ServiceModule;
import com.produs.teams.Team;
import com.produs.teams.TeamCapability;
import com.produs.teams.TeamCapabilityRepository;
import com.produs.teams.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamMatchService {

    private final PackageModuleRepository packageModuleRepository;
    private final TeamRepository teamRepository;
    private final TeamCapabilityRepository capabilityRepository;

    @Transactional(readOnly = true)
    public List<TeamRecommendation> recommend(UUID packageId) {
        List<PackageModule> packageModules = packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(packageId);
        if (packageModules.isEmpty()) {
            return List.of();
        }

        List<ServiceModule> serviceModules = packageModules.stream()
                .map(PackageModule::getServiceModule)
                .toList();

        return teamRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                .filter(team -> team.getVerificationStatus() != Team.VerificationStatus.SUSPENDED)
                .map(team -> scoreTeam(team, serviceModules))
                .filter(recommendation -> recommendation.score() > 0.0)
                .sorted(Comparator.comparingDouble(TeamRecommendation::score).reversed())
                .limit(5)
                .toList();
    }

    private TeamRecommendation scoreTeam(Team team, List<ServiceModule> serviceModules) {
        double score = verificationWeight(team.getVerificationStatus());
        Set<String> reasons = new LinkedHashSet<>();
        if (score > 0.0) {
            reasons.add("Verification status: " + team.getVerificationStatus().name());
        }

        List<TeamCapability> capabilities = capabilityRepository.findByTeamId(team.getId());
        for (TeamCapability capability : capabilities) {
            for (ServiceModule module : serviceModules) {
                if (capability.getServiceModule() != null
                        && capability.getServiceModule().getId().equals(module.getId())) {
                    score += 0.35;
                    reasons.add("Direct capability for " + module.getName());
                } else if (capability.getServiceCategory().getId().equals(module.getCategory().getId())) {
                    score += 0.20;
                    reasons.add("Category coverage for " + module.getCategory().getName());
                }
            }
            if (containsAny(capability.getNotes(), serviceModules)) {
                score += 0.10;
                reasons.add("Capability notes align with requested package modules");
            }
        }

        if (containsAny(team.getCapabilitiesSummary(), serviceModules)
                || containsAny(team.getDescription(), serviceModules)
                || containsAny(team.getName(), serviceModules)) {
            score += 0.15;
            reasons.add("Team profile text matches package needs");
        }

        return new TeamRecommendation(team, Math.min(1.0, round(score)), new ArrayList<>(reasons));
    }

    private boolean containsAny(String value, List<ServiceModule> modules) {
        if (value == null || value.isBlank()) {
            return false;
        }
        String normalized = value.toLowerCase(Locale.ROOT);
        return modules.stream().anyMatch(module ->
                normalized.contains(module.getName().toLowerCase(Locale.ROOT))
                        || normalized.contains(module.getSlug().toLowerCase(Locale.ROOT))
                        || normalized.contains(module.getCategory().getName().toLowerCase(Locale.ROOT))
                        || normalized.contains(module.getCategory().getSlug().toLowerCase(Locale.ROOT))
        );
    }

    private double verificationWeight(Team.VerificationStatus status) {
        return switch (status) {
            case APPLIED -> 0.10;
            case VERIFIED -> 0.30;
            case CERTIFIED -> 0.45;
            case SPECIALIST -> 0.55;
            case OPERATIONS_READY -> 0.60;
            case SUSPENDED -> 0.0;
        };
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public record TeamRecommendation(Team team, double score, List<String> reasons) {}
}
