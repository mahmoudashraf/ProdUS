package com.produs.dto;

import com.produs.ai.AIRecommendation;
import com.produs.attachments.EvidenceAttachment;
import com.produs.cart.ProductizationCart;
import com.produs.cart.ProductizationCartServiceItem;
import com.produs.cart.ProductizationCartTalentItem;
import com.produs.catalog.AICapabilityConfig;
import com.produs.catalog.CatalogRule;
import com.produs.catalog.CatalogTemplateDefinition;
import com.produs.catalog.PackageTemplate;
import com.produs.catalog.PackageTemplateModule;
import com.produs.catalog.ServiceCategory;
import com.produs.catalog.ServiceDependency;
import com.produs.catalog.ServiceModule;
import com.produs.commerce.ContractAgreement;
import com.produs.commerce.DisputeCase;
import com.produs.commerce.InvoiceRecord;
import com.produs.commerce.PaymentWebhookEvent;
import com.produs.commerce.QuoteProposal;
import com.produs.commerce.SignatureWebhookEvent;
import com.produs.commerce.SupportRequest;
import com.produs.commerce.SupportSubscription;
import com.produs.commerce.TeamReputationEvent;
import com.produs.entity.User;
import com.produs.experts.ExpertProfile;
import com.produs.notifications.NotificationDelivery;
import com.produs.notifications.PlatformNotification;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageModule;
import com.produs.packages.TeamMatchService;
import com.produs.product.ProductProfile;
import com.produs.requirements.RequirementIntake;
import com.produs.shortlist.TeamShortlist;
import com.produs.teams.Team;
import com.produs.teams.TeamCapability;
import com.produs.teams.TeamInvitation;
import com.produs.teams.TeamJoinRequest;
import com.produs.teams.TeamMember;
import com.produs.workspace.Deliverable;
import com.produs.workspace.Milestone;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.WorkspaceParticipant;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class PlatformDtos {

    private PlatformDtos() {
    }

    public record ServiceCategoryResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String name,
            String slug,
            String description,
            Integer sortOrder,
            boolean active
    ) {}

    public record ServiceModuleResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ServiceCategoryResponse category,
            String name,
            String slug,
            String stableCode,
            String serviceLayer,
            String description,
            String ownerOutcome,
            String requiredInputs,
            String expectedDeliverables,
            String acceptanceCriteria,
            String timelineRange,
            String priceRange,
            String workflowSteps,
            String requiredEvidenceTypes,
            String suggestedTeamRoles,
            String aiAssistanceTags,
            boolean humanReviewRequired,
            boolean visible,
            String releaseStage,
            String maturityLevel,
            String sourceAliases,
            Integer sortOrder,
            boolean active
    ) {}

    public record ServiceDependencyResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ServiceModuleResponse sourceModule,
            ServiceModuleResponse dependsOnModule,
            String reason,
            String message,
            ServiceDependency.DependencyType dependencyType,
            ServiceDependency.DependencySeverity severity,
            String ruleMetadata,
            boolean required
    ) {}

    public record PackageTemplateResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String name,
            String slug,
            String description,
            String targetProductStage,
            String customerFit,
            String timelineRange,
            String budgetRange,
            String outcomeSummary,
            String aiReadinessNotes,
            boolean humanReviewRequired,
            boolean active,
            Integer sortOrder,
            List<PackageTemplateModuleResponse> modules
    ) {}

    public record PackageTemplateModuleResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ServiceModuleResponse serviceModule,
            Integer sequenceOrder,
            boolean required,
            String phaseName,
            String rationale
    ) {}

    public record CatalogRuleResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String slug,
            CatalogRule.RuleType ruleType,
            String triggerKey,
            ServiceModuleResponse sourceModule,
            ServiceModuleResponse recommendedModule,
            ServiceDependency.DependencySeverity severity,
            String message,
            String ruleMetadata,
            boolean humanReviewRequired,
            boolean active,
            Integer sortOrder
    ) {}

    public record CatalogTemplateDefinitionResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String slug,
            CatalogTemplateDefinition.TemplateType templateType,
            String name,
            String description,
            String requiredInputs,
            String content,
            String outputContract,
            boolean active,
            Integer sortOrder
    ) {}

    public record AICapabilityConfigResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String slug,
            String name,
            String capabilityType,
            String description,
            String inputContract,
            String outputContract,
            String allowedSources,
            String forbiddenClaims,
            boolean humanReviewRequired,
            boolean enabled,
            Integer sortOrder
    ) {}

    public record CatalogRuleItemResponse(
            String source,
            ServiceModuleResponse sourceModule,
            ServiceModuleResponse recommendedModule,
            String reason,
            ServiceDependency.DependencySeverity severity,
            boolean required,
            boolean alreadySelected
    ) {}

    public record CatalogRuleEvaluationResponse(
            List<ServiceModuleResponse> selectedModules,
            List<CatalogRuleItemResponse> recommendations,
            int blockerCount,
            int warningCount,
            List<String> nextBestActions,
            boolean aiReady,
            boolean aiExecuted
    ) {}

    public record ProductProfileResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String name,
            String summary,
            ProductProfile.BusinessStage businessStage,
            String techStack,
            String productUrl,
            String repositoryUrl,
            String riskProfile
    ) {}

    public record RequirementIntakeResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ProductProfileResponse productProfile,
            ServiceModuleResponse requestedServiceModule,
            String businessGoal,
            String currentProblems,
            String constraints,
            String riskSignals,
            String requirementBrief,
            RequirementIntake.RequirementStatus status
    ) {}

    public record PackageInstanceResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ProductProfileResponse productProfile,
            RequirementIntakeResponse requirementIntake,
            String name,
            String summary,
            PackageInstance.PackageStatus status
    ) {}

    public record PackageModuleResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            PackageInstanceResponse packageInstance,
            ServiceModuleResponse serviceModule,
            Integer sequenceOrder,
            boolean required,
            String rationale,
            String deliverables,
            String acceptanceCriteria,
            PackageModule.ModuleStatus status
    ) {}

    public record TeamResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            CurrentUserSummary manager,
            String name,
            String description,
            String headline,
            String bio,
            String profilePhotoUrl,
            String coverPhotoUrl,
            String websiteUrl,
            String timezone,
            String capabilitiesSummary,
            String typicalProjectSize,
            Team.VerificationStatus verificationStatus,
            boolean active
    ) {}

    public record TeamCapabilityResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            TeamResponse team,
            ServiceCategoryResponse serviceCategory,
            ServiceModuleResponse serviceModule,
            String evidenceUrl,
            String notes
    ) {}

    public record TeamMemberResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            TeamResponse team,
            CurrentUserSummary user,
            TeamMember.MemberRole role,
            boolean active
    ) {}

    public record TeamInvitationResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            TeamResponse team,
            CurrentUserSummary invitedBy,
            String email,
            TeamMember.MemberRole role,
            String message,
            TeamInvitation.InvitationStatus status
    ) {}

    public record TeamJoinRequestResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            TeamResponse team,
            CurrentUserSummary requester,
            String message,
            TeamJoinRequest.RequestStatus status,
            CurrentUserSummary reviewedBy,
            String reviewNote
    ) {}

    public record ExpertProfileResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            CurrentUserSummary user,
            String displayName,
            String headline,
            String bio,
            String profilePhotoUrl,
            String coverPhotoUrl,
            String location,
            String timezone,
            String websiteUrl,
            String portfolioUrl,
            String skills,
            String preferredProjectSize,
            ExpertProfile.Availability availability,
            boolean soloMode,
            boolean active
    ) {}

    public record TeamRecommendationResponse(
            TeamResponse team,
            double score,
            List<String> reasons
    ) {}

    public record ProductizationCartServiceItemResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ServiceModuleResponse serviceModule,
            Integer sequenceOrder,
            String notes
    ) {}

    public record ProductizationCartTalentItemResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ProductizationCartTalentItem.TalentItemType itemType,
            TeamResponse team,
            ExpertProfileResponse expertProfile,
            String notes
    ) {}

    public record ProductizationCartResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            CurrentUserSummary owner,
            ProductProfileResponse productProfile,
            String title,
            String businessGoal,
            ProductizationCart.CartStatus status,
            List<ProductizationCartServiceItemResponse> serviceItems,
            List<ProductizationCartTalentItemResponse> talentItems,
            PackageInstanceResponse convertedPackage,
            ProjectWorkspaceResponse convertedWorkspace,
            CatalogRuleEvaluationResponse catalogEvaluation
    ) {}

    public record ProductizationCartConvertResponse(
            ProductizationCartResponse cart,
            PackageInstanceResponse packageInstance,
            ProjectWorkspaceResponse workspace
    ) {}

    public record TeamShortlistResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            CurrentUserSummary owner,
            PackageInstanceResponse packageInstance,
            TeamResponse team,
            TeamShortlist.ShortlistStatus status,
            String notes
    ) {}

    public record ProjectWorkspaceResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            PackageInstanceResponse packageInstance,
            String name,
            ProjectWorkspace.WorkspaceStatus status
    ) {}

    public record WorkspaceParticipantResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ProjectWorkspaceResponse workspace,
            CurrentUserSummary user,
            CurrentUserSummary addedBy,
            WorkspaceParticipant.ParticipantRole role,
            boolean active
    ) {}

    public record MilestoneResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ProjectWorkspaceResponse workspace,
            String title,
            String description,
            LocalDate dueDate,
            Milestone.MilestoneStatus status
    ) {}

    public record DeliverableResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            MilestoneResponse milestone,
            String title,
            String evidence,
            Deliverable.DeliverableStatus status
    ) {}

    public record QuoteProposalResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            PackageInstanceResponse packageInstance,
            TeamResponse team,
            CurrentUserSummary submittedBy,
            String title,
            String scope,
            String assumptions,
            Integer timelineDays,
            String currency,
            Long fixedPriceCents,
            Long platformFeeCents,
            QuoteProposal.ProposalStatus status
    ) {}

    public record ContractAgreementResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            QuoteProposalResponse proposal,
            ProjectWorkspaceResponse workspace,
            CurrentUserSummary owner,
            TeamResponse team,
            String title,
            String terms,
            LocalDate effectiveOn,
            LocalDateTime signedAt,
            ContractAgreement.ContractStatus status
    ) {}

    public record InvoiceRecordResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ContractAgreementResponse contractAgreement,
            CurrentUserSummary owner,
            CurrentUserSummary issuedBy,
            String invoiceNumber,
            String description,
            Long amountCents,
            String currency,
            LocalDate dueDate,
            InvoiceRecord.InvoiceStatus status
    ) {}

    public record SupportSubscriptionResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ProjectWorkspaceResponse workspace,
            CurrentUserSummary owner,
            TeamResponse team,
            CurrentUserSummary createdBy,
            String planName,
            String sla,
            Long monthlyAmountCents,
            String currency,
            LocalDate startsOn,
            LocalDate renewsOn,
            SupportSubscription.SubscriptionStatus status
    ) {}

    public record SupportRequestResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ProjectWorkspaceResponse workspace,
            SupportSubscriptionResponse supportSubscription,
            TeamResponse team,
            CurrentUserSummary owner,
            CurrentUserSummary openedBy,
            String title,
            String description,
            SupportRequest.SupportPriority priority,
            SupportRequest.SupportStatus status,
            SupportRequest.SlaStatus slaStatus,
            LocalDate dueOn,
            LocalDateTime resolvedAt,
            LocalDateTime escalatedAt,
            LocalDateTime lastSlaCheckAt,
            int escalationCount,
            String resolution
    ) {}

    public record TeamReputationEventResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            TeamResponse team,
            ProjectWorkspaceResponse workspace,
            CurrentUserSummary createdBy,
            TeamReputationEvent.ReputationEventType eventType,
            Integer rating,
            boolean verified,
            String notes
    ) {}

    public record PaymentWebhookEventResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            InvoiceRecordResponse invoice,
            String provider,
            String eventId,
            String eventType,
            boolean signatureValid,
            boolean processed,
            LocalDateTime processedAt,
            String errorMessage
    ) {}

    public record SignatureWebhookEventResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ContractAgreementResponse contractAgreement,
            String provider,
            String eventId,
            String eventType,
            boolean signatureValid,
            boolean processed,
            LocalDateTime processedAt,
            String errorMessage
    ) {}

    public record DisputeCaseResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ProjectWorkspaceResponse workspace,
            TeamResponse team,
            CurrentUserSummary openedBy,
            String title,
            String description,
            DisputeCase.DisputeSeverity severity,
            DisputeCase.DisputeStatus status,
            LocalDate responseDueOn,
            String resolution
    ) {}

    public record EvidenceAttachmentResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ProjectWorkspaceResponse workspace,
            DeliverableResponse deliverable,
            DisputeCaseResponse dispute,
            CurrentUserSummary uploadedBy,
            EvidenceAttachment.AttachmentScope scopeType,
            UUID scopeId,
            String fileName,
            String contentType,
            long sizeBytes,
            String label
    ) {}

    public record AIRecommendationResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String recommendationType,
            String sourceEntityType,
            String sourceEntityId,
            String promptVersion,
            Double confidence,
            String rationale,
            String outputJson,
            String humanFeedback
    ) {}

    public record AdminDashboardResponse(
            String message,
            CurrentUserSummary admin
    ) {}

    public record CurrentUserSummary(
            UUID id,
            String email,
            String role
    ) {}

    public record HealthResponse(
            String status,
            LocalDateTime timestamp,
            String service
    ) {}

    public record UploadUrlResponse(
            String presignedUrl,
            String key,
            String fileUrl,
            int expiresInSeconds
    ) {}

    public record FileDeleteResponse(
            String message,
            String key
    ) {}

    public record FileExistsResponse(
            boolean exists,
            String key
    ) {}

    public record FileMetadataResponse(
            String key,
            String contentType,
            Long contentLength,
            String lastModified,
            String etag
    ) {}

    public record AttachmentDownloadUrlResponse(
            String downloadUrl,
            int expiresInSeconds
    ) {}

    public record PlatformNotificationResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            CurrentUserSummary actor,
            ProjectWorkspaceResponse workspace,
            PlatformNotification.NotificationType type,
            PlatformNotification.NotificationPriority priority,
            PlatformNotification.NotificationStatus status,
            String title,
            String body,
            String actionUrl,
            String sourceType,
            UUID sourceId,
            LocalDateTime readAt,
            LocalDateTime expiresAt
    ) {}

    public record NotificationDeliveryResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            UUID notificationId,
            PlatformNotification.NotificationType notificationType,
            String notificationTitle,
            CurrentUserSummary recipient,
            NotificationDelivery.DeliveryChannel channel,
            NotificationDelivery.DeliveryStatus status,
            String destination,
            String provider,
            String providerMessageId,
            int attemptCount,
            LocalDateTime nextAttemptAt,
            LocalDateTime deliveredAt,
            String lastError
    ) {}

    public record NotificationSummaryResponse(
            long unreadCount,
            List<PlatformNotificationResponse> latest
    ) {}

    public record NotificationDeliveryRunResponse(
            int scannedCount,
            int sentCount,
            int failedCount,
            int skippedCount
    ) {}

    public record NotificationDeliveryConfigResponse(
            boolean enabled,
            boolean schedulerEnabled,
            boolean emailEnabled,
            boolean pushEnabled,
            String emailProvider,
            String pushProvider,
            boolean emailProviderConfigured,
            boolean pushProviderConfigured,
            int batchSize,
            int maxAttempts,
            long retryDelaySeconds,
            long webhookTimeoutMs
    ) {}

    public record SupportSlaRunResponse(
            int scannedCount,
            int dueSoonCount,
            int escalatedCount,
            int updatedCount
    ) {}

    public record ErrorMessageResponse(String error) {}

    public static CurrentUserSummary toCurrentUserSummary(User user) {
        if (user == null) {
            return null;
        }
        return new CurrentUserSummary(user.getId(), user.getEmail(), user.getRole().name());
    }

    public static ServiceCategoryResponse toServiceCategoryResponse(ServiceCategory category) {
        if (category == null) {
            return null;
        }
        return new ServiceCategoryResponse(
                category.getId(),
                category.getCreatedAt(),
                category.getUpdatedAt(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getSortOrder(),
                category.isActive()
        );
    }

    public static ServiceModuleResponse toServiceModuleResponse(ServiceModule module) {
        if (module == null) {
            return null;
        }
        return new ServiceModuleResponse(
                module.getId(),
                module.getCreatedAt(),
                module.getUpdatedAt(),
                toServiceCategoryResponse(module.getCategory()),
                module.getName(),
                module.getSlug(),
                module.getStableCode(),
                module.getServiceLayer(),
                module.getDescription(),
                module.getOwnerOutcome(),
                module.getRequiredInputs(),
                module.getExpectedDeliverables(),
                module.getAcceptanceCriteria(),
                module.getTimelineRange(),
                module.getPriceRange(),
                module.getWorkflowSteps(),
                module.getRequiredEvidenceTypes(),
                module.getSuggestedTeamRoles(),
                module.getAiAssistanceTags(),
                module.isHumanReviewRequired(),
                module.isVisible(),
                module.getReleaseStage(),
                module.getMaturityLevel(),
                module.getSourceAliases(),
                module.getSortOrder(),
                module.isActive()
        );
    }

    public static ServiceDependencyResponse toServiceDependencyResponse(ServiceDependency dependency) {
        if (dependency == null) {
            return null;
        }
        return new ServiceDependencyResponse(
                dependency.getId(),
                dependency.getCreatedAt(),
                dependency.getUpdatedAt(),
                toServiceModuleResponse(dependency.getSourceModule()),
                toServiceModuleResponse(dependency.getDependsOnModule()),
                dependency.getReason(),
                dependency.getMessage(),
                dependency.getDependencyType(),
                dependency.getSeverity(),
                dependency.getRuleMetadata(),
                dependency.isRequired()
        );
    }

    public static PackageTemplateModuleResponse toPackageTemplateModuleResponse(PackageTemplateModule templateModule) {
        if (templateModule == null) {
            return null;
        }
        return new PackageTemplateModuleResponse(
                templateModule.getId(),
                templateModule.getCreatedAt(),
                templateModule.getUpdatedAt(),
                toServiceModuleResponse(templateModule.getServiceModule()),
                templateModule.getSequenceOrder(),
                templateModule.isRequired(),
                templateModule.getPhaseName(),
                templateModule.getRationale()
        );
    }

    public static PackageTemplateResponse toPackageTemplateResponse(
            PackageTemplate template,
            List<PackageTemplateModule> modules
    ) {
        if (template == null) {
            return null;
        }
        return new PackageTemplateResponse(
                template.getId(),
                template.getCreatedAt(),
                template.getUpdatedAt(),
                template.getName(),
                template.getSlug(),
                template.getDescription(),
                template.getTargetProductStage(),
                template.getCustomerFit(),
                template.getTimelineRange(),
                template.getBudgetRange(),
                template.getOutcomeSummary(),
                template.getAiReadinessNotes(),
                template.isHumanReviewRequired(),
                template.isActive(),
                template.getSortOrder(),
                modules.stream().map(PlatformDtos::toPackageTemplateModuleResponse).toList()
        );
    }

    public static CatalogRuleResponse toCatalogRuleResponse(CatalogRule rule) {
        if (rule == null) {
            return null;
        }
        return new CatalogRuleResponse(
                rule.getId(),
                rule.getCreatedAt(),
                rule.getUpdatedAt(),
                rule.getSlug(),
                rule.getRuleType(),
                rule.getTriggerKey(),
                toServiceModuleResponse(rule.getSourceModule()),
                toServiceModuleResponse(rule.getRecommendedModule()),
                rule.getSeverity(),
                rule.getMessage(),
                rule.getRuleMetadata(),
                rule.isHumanReviewRequired(),
                rule.isActive(),
                rule.getSortOrder()
        );
    }

    public static CatalogTemplateDefinitionResponse toCatalogTemplateDefinitionResponse(CatalogTemplateDefinition definition) {
        if (definition == null) {
            return null;
        }
        return new CatalogTemplateDefinitionResponse(
                definition.getId(),
                definition.getCreatedAt(),
                definition.getUpdatedAt(),
                definition.getSlug(),
                definition.getTemplateType(),
                definition.getName(),
                definition.getDescription(),
                definition.getRequiredInputs(),
                definition.getContent(),
                definition.getOutputContract(),
                definition.isActive(),
                definition.getSortOrder()
        );
    }

    public static AICapabilityConfigResponse toAICapabilityConfigResponse(AICapabilityConfig config) {
        if (config == null) {
            return null;
        }
        return new AICapabilityConfigResponse(
                config.getId(),
                config.getCreatedAt(),
                config.getUpdatedAt(),
                config.getSlug(),
                config.getName(),
                config.getCapabilityType(),
                config.getDescription(),
                config.getInputContract(),
                config.getOutputContract(),
                config.getAllowedSources(),
                config.getForbiddenClaims(),
                config.isHumanReviewRequired(),
                config.isEnabled(),
                config.getSortOrder()
        );
    }

    public static ProductProfileResponse toProductProfileResponse(ProductProfile profile) {
        if (profile == null) {
            return null;
        }
        return new ProductProfileResponse(
                profile.getId(),
                profile.getCreatedAt(),
                profile.getUpdatedAt(),
                profile.getName(),
                profile.getSummary(),
                profile.getBusinessStage(),
                profile.getTechStack(),
                profile.getProductUrl(),
                profile.getRepositoryUrl(),
                profile.getRiskProfile()
        );
    }

    public static RequirementIntakeResponse toRequirementIntakeResponse(RequirementIntake intake) {
        if (intake == null) {
            return null;
        }
        return new RequirementIntakeResponse(
                intake.getId(),
                intake.getCreatedAt(),
                intake.getUpdatedAt(),
                toProductProfileResponse(intake.getProductProfile()),
                toServiceModuleResponse(intake.getRequestedServiceModule()),
                intake.getBusinessGoal(),
                intake.getCurrentProblems(),
                intake.getConstraints(),
                intake.getRiskSignals(),
                intake.getRequirementBrief(),
                intake.getStatus()
        );
    }

    public static PackageInstanceResponse toPackageInstanceResponse(PackageInstance packageInstance) {
        if (packageInstance == null) {
            return null;
        }
        return new PackageInstanceResponse(
                packageInstance.getId(),
                packageInstance.getCreatedAt(),
                packageInstance.getUpdatedAt(),
                toProductProfileResponse(packageInstance.getProductProfile()),
                toRequirementIntakeResponse(packageInstance.getRequirementIntake()),
                packageInstance.getName(),
                packageInstance.getSummary(),
                packageInstance.getStatus()
        );
    }

    public static PackageModuleResponse toPackageModuleResponse(PackageModule packageModule) {
        if (packageModule == null) {
            return null;
        }
        return new PackageModuleResponse(
                packageModule.getId(),
                packageModule.getCreatedAt(),
                packageModule.getUpdatedAt(),
                toPackageInstanceResponse(packageModule.getPackageInstance()),
                toServiceModuleResponse(packageModule.getServiceModule()),
                packageModule.getSequenceOrder(),
                packageModule.isRequired(),
                packageModule.getRationale(),
                packageModule.getDeliverables(),
                packageModule.getAcceptanceCriteria(),
                packageModule.getStatus()
        );
    }

    public static TeamResponse toTeamResponse(Team team) {
        if (team == null) {
            return null;
        }
        return new TeamResponse(
                team.getId(),
                team.getCreatedAt(),
                team.getUpdatedAt(),
                toCurrentUserSummary(team.getManager()),
                team.getName(),
                team.getDescription(),
                team.getHeadline(),
                team.getBio(),
                team.getProfilePhotoUrl(),
                team.getCoverPhotoUrl(),
                team.getWebsiteUrl(),
                team.getTimezone(),
                team.getCapabilitiesSummary(),
                team.getTypicalProjectSize(),
                team.getVerificationStatus(),
                team.isActive()
        );
    }

    public static TeamCapabilityResponse toTeamCapabilityResponse(TeamCapability capability) {
        if (capability == null) {
            return null;
        }
        return new TeamCapabilityResponse(
                capability.getId(),
                capability.getCreatedAt(),
                capability.getUpdatedAt(),
                toTeamResponse(capability.getTeam()),
                toServiceCategoryResponse(capability.getServiceCategory()),
                toServiceModuleResponse(capability.getServiceModule()),
                capability.getEvidenceUrl(),
                capability.getNotes()
        );
    }

    public static TeamMemberResponse toTeamMemberResponse(TeamMember member) {
        if (member == null) {
            return null;
        }
        return new TeamMemberResponse(
                member.getId(),
                member.getCreatedAt(),
                member.getUpdatedAt(),
                toTeamResponse(member.getTeam()),
                toCurrentUserSummary(member.getUser()),
                member.getRole(),
                member.isActive()
        );
    }

    public static TeamInvitationResponse toTeamInvitationResponse(TeamInvitation invitation) {
        if (invitation == null) {
            return null;
        }
        return new TeamInvitationResponse(
                invitation.getId(),
                invitation.getCreatedAt(),
                invitation.getUpdatedAt(),
                toTeamResponse(invitation.getTeam()),
                toCurrentUserSummary(invitation.getInvitedBy()),
                invitation.getEmail(),
                invitation.getRole(),
                invitation.getMessage(),
                invitation.getStatus()
        );
    }

    public static TeamJoinRequestResponse toTeamJoinRequestResponse(TeamJoinRequest request) {
        if (request == null) {
            return null;
        }
        return new TeamJoinRequestResponse(
                request.getId(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                toTeamResponse(request.getTeam()),
                toCurrentUserSummary(request.getRequester()),
                request.getMessage(),
                request.getStatus(),
                toCurrentUserSummary(request.getReviewedBy()),
                request.getReviewNote()
        );
    }

    public static ExpertProfileResponse toExpertProfileResponse(ExpertProfile profile) {
        if (profile == null) {
            return null;
        }
        return new ExpertProfileResponse(
                profile.getId(),
                profile.getCreatedAt(),
                profile.getUpdatedAt(),
                toCurrentUserSummary(profile.getUser()),
                profile.getDisplayName(),
                profile.getHeadline(),
                profile.getBio(),
                profile.getProfilePhotoUrl(),
                profile.getCoverPhotoUrl(),
                profile.getLocation(),
                profile.getTimezone(),
                profile.getWebsiteUrl(),
                profile.getPortfolioUrl(),
                profile.getSkills(),
                profile.getPreferredProjectSize(),
                profile.getAvailability(),
                profile.isSoloMode(),
                profile.isActive()
        );
    }

    public static TeamRecommendationResponse toTeamRecommendationResponse(TeamMatchService.TeamRecommendation recommendation) {
        if (recommendation == null) {
            return null;
        }
        return new TeamRecommendationResponse(
                toTeamResponse(recommendation.team()),
                recommendation.score(),
                recommendation.reasons()
        );
    }

    public static ProductizationCartServiceItemResponse toProductizationCartServiceItemResponse(ProductizationCartServiceItem item) {
        if (item == null) {
            return null;
        }
        return new ProductizationCartServiceItemResponse(
                item.getId(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                toServiceModuleResponse(item.getServiceModule()),
                item.getSequenceOrder(),
                item.getNotes()
        );
    }

    public static ProductizationCartTalentItemResponse toProductizationCartTalentItemResponse(ProductizationCartTalentItem item) {
        if (item == null) {
            return null;
        }
        return new ProductizationCartTalentItemResponse(
                item.getId(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                item.getItemType(),
                toTeamResponse(item.getTeam()),
                toExpertProfileResponse(item.getExpertProfile()),
                item.getNotes()
        );
    }

    public static ProductizationCartResponse toProductizationCartResponse(
            ProductizationCart cart,
            List<ProductizationCartServiceItem> serviceItems,
            List<ProductizationCartTalentItem> talentItems
    ) {
        if (cart == null) {
            return null;
        }
        return new ProductizationCartResponse(
                cart.getId(),
                cart.getCreatedAt(),
                cart.getUpdatedAt(),
                toCurrentUserSummary(cart.getOwner()),
                toProductProfileResponse(cart.getProductProfile()),
                cart.getTitle(),
                cart.getBusinessGoal(),
                cart.getStatus(),
                serviceItems.stream().map(PlatformDtos::toProductizationCartServiceItemResponse).toList(),
                talentItems.stream().map(PlatformDtos::toProductizationCartTalentItemResponse).toList(),
                toPackageInstanceResponse(cart.getConvertedPackage()),
                toProjectWorkspaceResponse(cart.getConvertedWorkspace()),
                null
        );
    }

    public static ProductizationCartResponse toProductizationCartResponse(
            ProductizationCart cart,
            List<ProductizationCartServiceItem> serviceItems,
            List<ProductizationCartTalentItem> talentItems,
            CatalogRuleEvaluationResponse catalogEvaluation
    ) {
        if (cart == null) {
            return null;
        }
        return new ProductizationCartResponse(
                cart.getId(),
                cart.getCreatedAt(),
                cart.getUpdatedAt(),
                toCurrentUserSummary(cart.getOwner()),
                toProductProfileResponse(cart.getProductProfile()),
                cart.getTitle(),
                cart.getBusinessGoal(),
                cart.getStatus(),
                serviceItems.stream().map(PlatformDtos::toProductizationCartServiceItemResponse).toList(),
                talentItems.stream().map(PlatformDtos::toProductizationCartTalentItemResponse).toList(),
                toPackageInstanceResponse(cart.getConvertedPackage()),
                toProjectWorkspaceResponse(cart.getConvertedWorkspace()),
                catalogEvaluation
        );
    }

    public static TeamShortlistResponse toTeamShortlistResponse(TeamShortlist shortlist) {
        if (shortlist == null) {
            return null;
        }
        return new TeamShortlistResponse(
                shortlist.getId(),
                shortlist.getCreatedAt(),
                shortlist.getUpdatedAt(),
                toCurrentUserSummary(shortlist.getOwner()),
                toPackageInstanceResponse(shortlist.getPackageInstance()),
                toTeamResponse(shortlist.getTeam()),
                shortlist.getStatus(),
                shortlist.getNotes()
        );
    }

    public static ProjectWorkspaceResponse toProjectWorkspaceResponse(ProjectWorkspace workspace) {
        if (workspace == null) {
            return null;
        }
        return new ProjectWorkspaceResponse(
                workspace.getId(),
                workspace.getCreatedAt(),
                workspace.getUpdatedAt(),
                toPackageInstanceResponse(workspace.getPackageInstance()),
                workspace.getName(),
                workspace.getStatus()
        );
    }

    public static WorkspaceParticipantResponse toWorkspaceParticipantResponse(WorkspaceParticipant participant) {
        if (participant == null) {
            return null;
        }
        return new WorkspaceParticipantResponse(
                participant.getId(),
                participant.getCreatedAt(),
                participant.getUpdatedAt(),
                toProjectWorkspaceResponse(participant.getWorkspace()),
                toCurrentUserSummary(participant.getUser()),
                toCurrentUserSummary(participant.getAddedBy()),
                participant.getRole(),
                participant.isActive()
        );
    }

    public static MilestoneResponse toMilestoneResponse(Milestone milestone) {
        if (milestone == null) {
            return null;
        }
        return new MilestoneResponse(
                milestone.getId(),
                milestone.getCreatedAt(),
                milestone.getUpdatedAt(),
                toProjectWorkspaceResponse(milestone.getWorkspace()),
                milestone.getTitle(),
                milestone.getDescription(),
                milestone.getDueDate(),
                milestone.getStatus()
        );
    }

    public static DeliverableResponse toDeliverableResponse(Deliverable deliverable) {
        if (deliverable == null) {
            return null;
        }
        return new DeliverableResponse(
                deliverable.getId(),
                deliverable.getCreatedAt(),
                deliverable.getUpdatedAt(),
                toMilestoneResponse(deliverable.getMilestone()),
                deliverable.getTitle(),
                deliverable.getEvidence(),
                deliverable.getStatus()
        );
    }

    public static QuoteProposalResponse toQuoteProposalResponse(QuoteProposal proposal) {
        if (proposal == null) {
            return null;
        }
        return new QuoteProposalResponse(
                proposal.getId(),
                proposal.getCreatedAt(),
                proposal.getUpdatedAt(),
                toPackageInstanceResponse(proposal.getPackageInstance()),
                toTeamResponse(proposal.getTeam()),
                toCurrentUserSummary(proposal.getSubmittedBy()),
                proposal.getTitle(),
                proposal.getScope(),
                proposal.getAssumptions(),
                proposal.getTimelineDays(),
                proposal.getCurrency(),
                proposal.getFixedPriceCents(),
                proposal.getPlatformFeeCents(),
                proposal.getStatus()
        );
    }

    public static ContractAgreementResponse toContractAgreementResponse(ContractAgreement contract) {
        if (contract == null) {
            return null;
        }
        return new ContractAgreementResponse(
                contract.getId(),
                contract.getCreatedAt(),
                contract.getUpdatedAt(),
                toQuoteProposalResponse(contract.getProposal()),
                toProjectWorkspaceResponse(contract.getWorkspace()),
                toCurrentUserSummary(contract.getOwner()),
                toTeamResponse(contract.getTeam()),
                contract.getTitle(),
                contract.getTerms(),
                contract.getEffectiveOn(),
                contract.getSignedAt(),
                contract.getStatus()
        );
    }

    public static InvoiceRecordResponse toInvoiceRecordResponse(InvoiceRecord invoice) {
        if (invoice == null) {
            return null;
        }
        return new InvoiceRecordResponse(
                invoice.getId(),
                invoice.getCreatedAt(),
                invoice.getUpdatedAt(),
                toContractAgreementResponse(invoice.getContractAgreement()),
                toCurrentUserSummary(invoice.getOwner()),
                toCurrentUserSummary(invoice.getIssuedBy()),
                invoice.getInvoiceNumber(),
                invoice.getDescription(),
                invoice.getAmountCents(),
                invoice.getCurrency(),
                invoice.getDueDate(),
                invoice.getStatus()
        );
    }

    public static SupportSubscriptionResponse toSupportSubscriptionResponse(SupportSubscription subscription) {
        if (subscription == null) {
            return null;
        }
        return new SupportSubscriptionResponse(
                subscription.getId(),
                subscription.getCreatedAt(),
                subscription.getUpdatedAt(),
                toProjectWorkspaceResponse(subscription.getWorkspace()),
                toCurrentUserSummary(subscription.getOwner()),
                toTeamResponse(subscription.getTeam()),
                toCurrentUserSummary(subscription.getCreatedBy()),
                subscription.getPlanName(),
                subscription.getSla(),
                subscription.getMonthlyAmountCents(),
                subscription.getCurrency(),
                subscription.getStartsOn(),
                subscription.getRenewsOn(),
                subscription.getStatus()
        );
    }

    public static SupportRequestResponse toSupportRequestResponse(SupportRequest request) {
        if (request == null) {
            return null;
        }
        return new SupportRequestResponse(
                request.getId(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                toProjectWorkspaceResponse(request.getWorkspace()),
                toSupportSubscriptionResponse(request.getSupportSubscription()),
                toTeamResponse(request.getTeam()),
                toCurrentUserSummary(request.getOwner()),
                toCurrentUserSummary(request.getOpenedBy()),
                request.getTitle(),
                request.getDescription(),
                request.getPriority(),
                request.getStatus(),
                request.getSlaStatus(),
                request.getDueOn(),
                request.getResolvedAt(),
                request.getEscalatedAt(),
                request.getLastSlaCheckAt(),
                request.getEscalationCount(),
                request.getResolution()
        );
    }

    public static TeamReputationEventResponse toTeamReputationEventResponse(TeamReputationEvent event) {
        if (event == null) {
            return null;
        }
        return new TeamReputationEventResponse(
                event.getId(),
                event.getCreatedAt(),
                event.getUpdatedAt(),
                toTeamResponse(event.getTeam()),
                toProjectWorkspaceResponse(event.getWorkspace()),
                toCurrentUserSummary(event.getCreatedBy()),
                event.getEventType(),
                event.getRating(),
                event.isVerified(),
                event.getNotes()
        );
    }

    public static PaymentWebhookEventResponse toPaymentWebhookEventResponse(PaymentWebhookEvent event) {
        if (event == null) {
            return null;
        }
        return new PaymentWebhookEventResponse(
                event.getId(),
                event.getCreatedAt(),
                event.getUpdatedAt(),
                toInvoiceRecordResponse(event.getInvoice()),
                event.getProvider(),
                event.getEventId(),
                event.getEventType(),
                event.isSignatureValid(),
                event.isProcessed(),
                event.getProcessedAt(),
                event.getErrorMessage()
        );
    }

    public static SignatureWebhookEventResponse toSignatureWebhookEventResponse(SignatureWebhookEvent event) {
        if (event == null) {
            return null;
        }
        return new SignatureWebhookEventResponse(
                event.getId(),
                event.getCreatedAt(),
                event.getUpdatedAt(),
                toContractAgreementResponse(event.getContractAgreement()),
                event.getProvider(),
                event.getEventId(),
                event.getEventType(),
                event.isSignatureValid(),
                event.isProcessed(),
                event.getProcessedAt(),
                event.getErrorMessage()
        );
    }

    public static DisputeCaseResponse toDisputeCaseResponse(DisputeCase disputeCase) {
        if (disputeCase == null) {
            return null;
        }
        return new DisputeCaseResponse(
                disputeCase.getId(),
                disputeCase.getCreatedAt(),
                disputeCase.getUpdatedAt(),
                toProjectWorkspaceResponse(disputeCase.getWorkspace()),
                toTeamResponse(disputeCase.getTeam()),
                toCurrentUserSummary(disputeCase.getOpenedBy()),
                disputeCase.getTitle(),
                disputeCase.getDescription(),
                disputeCase.getSeverity(),
                disputeCase.getStatus(),
                disputeCase.getResponseDueOn(),
                disputeCase.getResolution()
        );
    }

    public static EvidenceAttachmentResponse toEvidenceAttachmentResponse(EvidenceAttachment attachment) {
        if (attachment == null) {
            return null;
        }
        return new EvidenceAttachmentResponse(
                attachment.getId(),
                attachment.getCreatedAt(),
                attachment.getUpdatedAt(),
                toProjectWorkspaceResponse(attachment.getWorkspace()),
                toDeliverableResponse(attachment.getDeliverable()),
                toDisputeCaseResponse(attachment.getDispute()),
                toCurrentUserSummary(attachment.getUploadedBy()),
                attachment.getScopeType(),
                attachment.getScopeId(),
                attachment.getFileName(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                attachment.getLabel()
        );
    }

    public static AIRecommendationResponse toAIRecommendationResponse(AIRecommendation recommendation) {
        if (recommendation == null) {
            return null;
        }
        return new AIRecommendationResponse(
                recommendation.getId(),
                recommendation.getCreatedAt(),
                recommendation.getUpdatedAt(),
                recommendation.getRecommendationType(),
                recommendation.getSourceEntityType(),
                recommendation.getSourceEntityId(),
                recommendation.getPromptVersion(),
                recommendation.getConfidence(),
                recommendation.getRationale(),
                recommendation.getOutputJson(),
                recommendation.getHumanFeedback()
        );
    }

    public static PlatformNotificationResponse toPlatformNotificationResponse(PlatformNotification notification) {
        if (notification == null) {
            return null;
        }
        return new PlatformNotificationResponse(
                notification.getId(),
                notification.getCreatedAt(),
                notification.getUpdatedAt(),
                toCurrentUserSummary(notification.getActor()),
                toProjectWorkspaceResponse(notification.getWorkspace()),
                notification.getType(),
                notification.getPriority(),
                notification.getStatus(),
                notification.getTitle(),
                notification.getBody(),
                notification.getActionUrl(),
                notification.getSourceType(),
                notification.getSourceId(),
                notification.getReadAt(),
                notification.getExpiresAt()
        );
    }

    public static NotificationDeliveryResponse toNotificationDeliveryResponse(NotificationDelivery delivery) {
        if (delivery == null) {
            return null;
        }
        PlatformNotification notification = delivery.getNotification();
        return new NotificationDeliveryResponse(
                delivery.getId(),
                delivery.getCreatedAt(),
                delivery.getUpdatedAt(),
                notification == null ? null : notification.getId(),
                notification == null ? null : notification.getType(),
                notification == null ? null : notification.getTitle(),
                toCurrentUserSummary(delivery.getRecipient()),
                delivery.getChannel(),
                delivery.getStatus(),
                delivery.getDestination(),
                delivery.getProvider(),
                delivery.getProviderMessageId(),
                delivery.getAttemptCount(),
                delivery.getNextAttemptAt(),
                delivery.getDeliveredAt(),
                delivery.getLastError()
        );
    }

    public static NotificationDeliveryConfigResponse toNotificationDeliveryConfigResponse(
            com.produs.notifications.NotificationDeliveryService.DeliveryConfiguration configuration
    ) {
        return new NotificationDeliveryConfigResponse(
                configuration.enabled(),
                configuration.schedulerEnabled(),
                configuration.emailEnabled(),
                configuration.pushEnabled(),
                configuration.emailProvider(),
                configuration.pushProvider(),
                configuration.emailProviderConfigured(),
                configuration.pushProviderConfigured(),
                configuration.batchSize(),
                configuration.maxAttempts(),
                configuration.retryDelaySeconds(),
                configuration.webhookTimeoutMs()
        );
    }
}
