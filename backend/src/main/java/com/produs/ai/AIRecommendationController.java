package com.produs.ai;

import com.produs.dto.PlatformDtos.AIRecommendationResponse;
import com.produs.entity.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static com.produs.dto.PlatformDtos.toAIRecommendationResponse;

@RestController
@RequestMapping("/api/ai/recommendations")
@RequiredArgsConstructor
public class AIRecommendationController {

    private final AIRecommendationRepository recommendationRepository;

    @GetMapping
    public List<AIRecommendationResponse> list(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String sourceEntityType,
            @RequestParam(required = false) String sourceEntityId
    ) {
        if (sourceEntityType != null && sourceEntityId != null) {
            List<AIRecommendation> recommendations =
                    recommendationRepository.findBySourceEntityTypeAndSourceEntityIdOrderByCreatedAtDesc(sourceEntityType, sourceEntityId);
            if (user.getRole() == User.UserRole.ADMIN) {
                return recommendations.stream()
                        .map(recommendation -> toAIRecommendationResponse(recommendation))
                        .toList();
            }
            return recommendations.stream()
                    .filter(recommendation -> recommendation.getCreatedBy().getId().equals(user.getId()))
                    .map(recommendation -> toAIRecommendationResponse(recommendation))
                    .toList();
        }
        if (user.getRole() == User.UserRole.ADMIN) {
            return recommendationRepository.findAll().stream()
                    .map(recommendation -> toAIRecommendationResponse(recommendation))
                    .toList();
        }
        return recommendationRepository.findByCreatedByIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(recommendation -> toAIRecommendationResponse(recommendation))
                .toList();
    }

    @PostMapping
    public AIRecommendationResponse create(@AuthenticationPrincipal User user, @Valid @RequestBody AIRecommendationRequest request) {
        AIRecommendation recommendation = new AIRecommendation();
        recommendation.setCreatedBy(user);
        recommendation.setRecommendationType(request.recommendationType());
        recommendation.setSourceEntityType(request.sourceEntityType());
        recommendation.setSourceEntityId(request.sourceEntityId());
        recommendation.setPromptVersion(request.promptVersion());
        recommendation.setConfidence(request.confidence());
        recommendation.setRationale(request.rationale());
        recommendation.setOutputJson(request.outputJson());
        return toAIRecommendationResponse(recommendationRepository.save(recommendation));
    }

    public record AIRecommendationRequest(
            @NotBlank(message = "Recommendation type is required")
            String recommendationType,
            String sourceEntityType,
            String sourceEntityId,
            String promptVersion,
            Double confidence,
            String rationale,
            String outputJson
    ) {}
}
