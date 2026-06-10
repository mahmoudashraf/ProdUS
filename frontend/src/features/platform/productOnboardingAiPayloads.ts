import type {
  AiAssistedProductAnalysisResponse,
  ProductProfile,
  ServiceModuleRecommendation,
} from './types';

export interface ProductOnboardingProfileValues {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  productUrl: string;
  repositoryUrl: string;
  riskProfile: string;
}

const cleanList = (values?: string[]) => (values ?? []).filter(Boolean).slice(0, 6);

const selectedRecommendationCodes = (
  recommendations: ServiceModuleRecommendation[],
  selectedServiceCodes: string[]
) =>
  selectedServiceCodes.length
    ? selectedServiceCodes
    : recommendations
        .filter(recommendation => recommendation.accepted !== false)
        .map(recommendation => recommendation.moduleCode);

export function buildProductCreationActionPayload({
  aiAnalysis,
  profile,
  reviewedServiceRecommendations,
  selectedServiceCodes,
}: {
  aiAnalysis: AiAssistedProductAnalysisResponse;
  profile: ProductOnboardingProfileValues;
  reviewedServiceRecommendations: ServiceModuleRecommendation[];
  selectedServiceCodes: string[];
}): Record<string, unknown> {
  const analysisRecommendations = aiAnalysis.analysis.recommendedServiceModules ?? [];
  const effectiveRecommendations = reviewedServiceRecommendations.length
    ? reviewedServiceRecommendations
    : analysisRecommendations;
  const effectiveSelectedCodes = selectedRecommendationCodes(
    effectiveRecommendations,
    selectedServiceCodes
  );
  const liveAiOpportunityReport = aiAnalysis.aiOpportunityReport?.live
    ? aiAnalysis.aiOpportunityReport
    : undefined;
  const liveLoomaiIntegrationOverview = aiAnalysis.loomaiIntegrationOverview?.live
    ? aiAnalysis.loomaiIntegrationOverview
    : undefined;

  return {
    ...aiAnalysis.runtimeActionPayload,
    analysisMode: aiAnalysis.analysisMode,
    creationIntentId: aiAnalysis.intent.id,
    consentToken: aiAnalysis.intent.consentToken,
    idempotencyKey: aiAnalysis.intent.idempotencyKey,
    analysisProviderRequestId: aiAnalysis.aiApplied
      ? aiAnalysis.intent.analysisProviderRequestId
      : '',
    productName: profile.name || aiAnalysis.analysis.productName,
    summary: profile.summary || aiAnalysis.analysis.summary,
    businessStage: profile.businessStage || aiAnalysis.analysis.businessStage,
    techStack: profile.techStack || aiAnalysis.analysis.techStack,
    productUrl: profile.productUrl || aiAnalysis.analysis.productUrl,
    repositoryUrl: profile.repositoryUrl || aiAnalysis.analysis.repositoryUrl,
    riskProfile: profile.riskProfile || aiAnalysis.analysis.riskProfile,
    aiCreationSummary: aiAnalysis.analysis.aiCreationSummary,
    projectDescription: aiAnalysis.analysis.projectDescription,
    businessProblem: aiAnalysis.analysis.businessProblem,
    targetUsers: aiAnalysis.analysis.targetUsers,
    coreCapabilities: aiAnalysis.analysis.coreCapabilities ?? [],
    businessOutcomes: aiAnalysis.analysis.businessOutcomes ?? [],
    readinessGoals: aiAnalysis.analysis.readinessGoals ?? [],
    recommendedServices: aiAnalysis.analysis.recommendedServices ?? [],
    recommendedServiceModules: effectiveRecommendations.map((recommendation, index) => ({
      ...recommendation,
      sequence: index + 1,
      accepted: effectiveSelectedCodes.includes(recommendation.moduleCode),
    })),
    missingCatalogCoverage: aiAnalysis.analysis.missingCatalogCoverage ?? [],
    scannerFocusAreas: aiAnalysis.analysis.scannerFocusAreas ?? [],
    suggestedNextSteps: aiAnalysis.analysis.suggestedNextSteps ?? [],
    sourceInsights: aiAnalysis.analysis.sourceInsights ?? [],
    assumptions: aiAnalysis.analysis.assumptions,
    missingEvidence: aiAnalysis.analysis.missingEvidence,
    documentUsage: aiAnalysis.analysis.documentUsage ?? [],
    aiOpportunityReport: liveAiOpportunityReport,
    loomaiIntegrationOverview: liveLoomaiIntegrationOverview,
  };
}

export function buildProductAnalysisChatContext({
  aiAnalysis,
  profile,
  reviewedServiceRecommendations,
  selectedServiceCodes,
}: {
  aiAnalysis: AiAssistedProductAnalysisResponse | null;
  profile: ProductOnboardingProfileValues;
  reviewedServiceRecommendations: ServiceModuleRecommendation[];
  selectedServiceCodes: string[];
}) {
  const analysis = aiAnalysis?.analysis;

  return {
    pageType: 'owner-project-ai-analysis',
    pageContext: {
      pageType: 'owner-project-ai-analysis',
      pagePosition: 'product_intake_analysis',
      assistantIntent: 'project-analysis-follow-up-chat',
      actionProfile: 'loomai-productization-read',
      productCreationIntentId: aiAnalysis?.intent.id,
      analysisProviderRequestId: aiAnalysis?.aiApplied
        ? aiAnalysis.intent.analysisProviderRequestId
        : '',
      productName: profile.name || analysis?.productName,
      businessStage: profile.businessStage || analysis?.businessStage,
      summary: profile.summary || analysis?.summary,
      projectDescription: analysis?.projectDescription,
      businessProblem: analysis?.businessProblem,
      targetUsers: analysis?.targetUsers,
      techStack: profile.techStack || analysis?.techStack,
      productUrlAvailable: Boolean(profile.productUrl || analysis?.productUrl),
      repositoryUrlAvailable: Boolean(profile.repositoryUrl || analysis?.repositoryUrl),
      riskProfile: profile.riskProfile || analysis?.riskProfile,
      coreCapabilities: cleanList(analysis?.coreCapabilities),
      businessOutcomes: cleanList(analysis?.businessOutcomes),
      readinessGoals: cleanList(analysis?.readinessGoals),
      recommendedServices: cleanList(analysis?.recommendedServices),
      recommendedServiceModules: reviewedServiceRecommendations
        .slice(0, 8)
        .map((recommendation, index) => ({
          moduleCode: recommendation.moduleCode,
          moduleName: recommendation.moduleName,
          categorySlug: recommendation.categorySlug,
          priority: recommendation.priority,
          sequence: index + 1,
          includedByOwner: selectedServiceCodes.includes(recommendation.moduleCode),
          reason: recommendation.reason,
        })),
      missingCatalogCoverage: (analysis?.missingCatalogCoverage ?? []).slice(0, 5),
      scannerFocusAreas: cleanList(analysis?.scannerFocusAreas),
      suggestedNextSteps: cleanList(analysis?.suggestedNextSteps),
      sourceInsights: cleanList(analysis?.sourceInsights),
      assumptions: cleanList(analysis?.assumptions),
      missingEvidence: cleanList(analysis?.missingEvidence),
      aiOpportunityReport: aiAnalysis?.aiOpportunityReport
        ? {
            status: aiAnalysis.aiOpportunityReport.status,
            summary: aiAnalysis.aiOpportunityReport.summary,
            opportunityScore: aiAnalysis.aiOpportunityReport.opportunityScore,
            strategicRationale: aiAnalysis.aiOpportunityReport.strategicRationale,
            useCases: (aiAnalysis.aiOpportunityReport.useCases ?? []).slice(0, 6).map(useCase => ({
              title: useCase.title,
              workflow: useCase.workflow,
              userValue: useCase.userValue,
              businessValue: useCase.businessValue,
              loomaiCapabilityCode: useCase.loomaiCapabilityCode,
              loomaiCapability: useCase.loomaiCapability,
              priority: useCase.priority,
            })),
            suggestedNextSteps: cleanList(aiAnalysis.aiOpportunityReport.suggestedNextSteps),
          }
        : undefined,
      loomaiIntegrationOverview: aiAnalysis?.loomaiIntegrationOverview
        ? {
            summary: aiAnalysis.loomaiIntegrationOverview.summary,
            recommendedStartingPoint: aiAnalysis.loomaiIntegrationOverview.recommendedStartingPoint,
            capabilities: cleanList(aiAnalysis.loomaiIntegrationOverview.capabilities),
            implementationSteps: cleanList(
              aiAnalysis.loomaiIntegrationOverview.implementationSteps
            ),
            ownerDecisions: cleanList(aiAnalysis.loomaiIntegrationOverview.ownerDecisions),
            risks: cleanList(aiAnalysis.loomaiIntegrationOverview.risks),
          }
        : undefined,
      documentUsage: cleanList(
        analysis?.documentUsage?.map(item => {
          const evidence = item.evidence?.length
            ? ` Evidence: ${item.evidence.slice(0, 2).join('; ')}`
            : '';
          const reason = item.reason ? ` Reason: ${item.reason}` : '';
          return `${item.fileName}: ${item.status} via ${item.accessMethod}.${evidence}${reason}`;
        })
      ),
      ownerInstruction:
        'Answer about this project AI analysis and the next owner decision. You may use read-only ProdUS actions when needed. Do not create products, packages, workspaces, team selections, invitations, or participants from chat.',
    },
  };
}
