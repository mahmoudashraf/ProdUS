import type {
  AiAssistedProductAnalysisResponse,
  AiOpportunityUseCase,
  ServiceModuleRecommendation,
} from './types';

export interface AiOpportunitySelectionState {
  useCaseKeys: string[];
  serviceModuleKeys: string[];
  scannerFocus: string[];
  nextSteps: string[];
}

export const emptyAiOpportunitySelection: AiOpportunitySelectionState = {
  useCaseKeys: [],
  serviceModuleKeys: [],
  scannerFocus: [],
  nextSteps: [],
};

export const useCaseKey = (useCase: AiOpportunityUseCase, index: number) =>
  `${(useCase.title || `Opportunity ${index + 1}`).trim().toLowerCase()}::${index}`;

export const serviceRecommendationKey = (recommendation: ServiceModuleRecommendation) =>
  (recommendation.moduleCode || recommendation.moduleName || '').trim().toLowerCase();

const cleanList = (values?: string[]) => (values ?? []).map(value => value.trim()).filter(Boolean);

export const hasLiveAiOpportunityResult = (
  analysis: AiAssistedProductAnalysisResponse | null | undefined
) => Boolean(analysis?.aiOpportunityReport?.live || analysis?.loomaiIntegrationOverview?.live);

export const aiOpportunityResultStatusLabel = (
  analysis: AiAssistedProductAnalysisResponse | null | undefined
) => {
  if (!analysis) return 'No AI result yet';
  if (hasLiveAiOpportunityResult(analysis)) return 'Live LoomAI result';
  return 'AI result failed';
};

const recommendationSourceLists = (
  analysis: AiAssistedProductAnalysisResponse
): ServiceModuleRecommendation[][] => [
  analysis.aiOpportunityReport?.live
    ? (analysis.aiOpportunityReport.recommendedServiceModules ?? [])
    : [],
  analysis.aiOpportunityReport?.live
    ? (analysis.aiOpportunityReport.useCases ?? []).flatMap(
        useCase => useCase.recommendedServiceModules ?? []
      )
    : [],
  analysis.loomaiIntegrationOverview?.live
    ? (analysis.loomaiIntegrationOverview.recommendedServiceModules ?? [])
    : [],
];

export function collectAiServiceRecommendations(analysis: AiAssistedProductAnalysisResponse) {
  const byKey = new Map<string, ServiceModuleRecommendation>();
  recommendationSourceLists(analysis)
    .flat()
    .forEach(recommendation => {
      const key = serviceRecommendationKey(recommendation);
      if (!key || byKey.has(key)) return;
      byKey.set(key, recommendation);
    });
  return Array.from(byKey.values()).map((recommendation, index) => ({
    ...recommendation,
    sequence: index + 1,
    accepted: recommendation.accepted !== false,
  }));
}

export function selectableScannerFocus(analysis: AiAssistedProductAnalysisResponse) {
  return analysis.aiOpportunityReport?.live
    ? Array.from(new Set(cleanList(analysis.aiOpportunityReport.scannerFocusAreas)))
    : [];
}

export function selectableNextSteps(analysis: AiAssistedProductAnalysisResponse) {
  return Array.from(
    new Set([
      ...(analysis.aiOpportunityReport?.live
        ? cleanList(analysis.aiOpportunityReport.suggestedNextSteps)
        : []),
      ...(analysis.loomaiIntegrationOverview?.live
        ? cleanList(analysis.loomaiIntegrationOverview.implementationSteps)
        : []),
    ])
  );
}

export function defaultAiOpportunitySelection(
  analysis: AiAssistedProductAnalysisResponse
): AiOpportunitySelectionState {
  if (!hasLiveAiOpportunityResult(analysis)) {
    return emptyAiOpportunitySelection;
  }
  return {
    useCaseKeys: (analysis.aiOpportunityReport?.live
      ? (analysis.aiOpportunityReport.useCases ?? [])
      : []
    ).map(useCaseKey),
    serviceModuleKeys: collectAiServiceRecommendations(analysis)
      .map(serviceRecommendationKey)
      .filter(Boolean),
    scannerFocus: selectableScannerFocus(analysis),
    nextSteps: selectableNextSteps(analysis),
  };
}

export function buildAiOpportunityAcceptancePayload(
  analysis: AiAssistedProductAnalysisResponse,
  selection: AiOpportunitySelectionState
): Record<string, unknown> {
  const selectedServiceKeys = new Set(selection.serviceModuleKeys);
  const selectedServiceRecommendations = collectAiServiceRecommendations(analysis)
    .filter(recommendation => selectedServiceKeys.has(serviceRecommendationKey(recommendation)))
    .map((recommendation, index) => ({
      ...recommendation,
      sequence: index + 1,
      accepted: true,
    }));
  const selectedUseCases = (analysis.aiOpportunityReport?.useCases ?? [])
    .filter((useCase, index) => selection.useCaseKeys.includes(useCaseKey(useCase, index)))
    .map(useCase => ({
      ...useCase,
      recommendedServiceModules: (useCase.recommendedServiceModules ?? [])
        .filter(recommendation => selectedServiceKeys.has(serviceRecommendationKey(recommendation)))
        .map(recommendation => ({ ...recommendation, accepted: true })),
    }));
  const recommendedServices = selectedServiceRecommendations
    .map(recommendation => recommendation.moduleName || recommendation.moduleCode)
    .filter(Boolean);
  const aiOpportunityReport = analysis.aiOpportunityReport?.live
    ? {
        ...analysis.aiOpportunityReport,
        useCases: selectedUseCases,
        recommendedServices,
        recommendedServiceModules: selectedServiceRecommendations,
        scannerFocusAreas: selection.scannerFocus,
        suggestedNextSteps: selection.nextSteps,
      }
    : undefined;
  const loomaiIntegrationOverview = analysis.loomaiIntegrationOverview?.live
    ? {
        ...analysis.loomaiIntegrationOverview,
        recommendedServiceModules: selectedServiceRecommendations,
      }
    : undefined;

  return {
    analysisMode: 'AI_OPPORTUNITIES',
    creationIntentId: analysis.intent.id,
    consentToken: analysis.intent.consentToken,
    idempotencyKey: analysis.intent.idempotencyKey,
    analysisProviderRequestId:
      (analysis.aiOpportunityReport?.live ? analysis.aiOpportunityReport.providerRequestId : '') ||
      (analysis.loomaiIntegrationOverview?.live
        ? analysis.loomaiIntegrationOverview.providerRequestId
        : '') ||
      analysis.intent.analysisProviderRequestId,
    aiCreationSummary:
      analysis.aiOpportunityReport?.summary ||
      analysis.loomaiIntegrationOverview?.summary ||
      analysis.analysis.aiCreationSummary,
    recommendedServices,
    recommendedServiceModules: selectedServiceRecommendations,
    scannerFocusAreas: selection.scannerFocus,
    suggestedNextSteps: selection.nextSteps,
    sourceInsights: [
      ...cleanList(analysis.aiOpportunityReport?.sourceInsights),
      ...cleanList(analysis.loomaiIntegrationOverview?.sourceInsights),
      ...cleanList(analysis.analysis.sourceInsights),
    ],
    assumptions: [
      ...cleanList(analysis.aiOpportunityReport?.assumptions),
      ...cleanList(analysis.analysis.assumptions),
    ],
    missingEvidence: [
      ...cleanList(analysis.aiOpportunityReport?.missingEvidence),
      ...cleanList(analysis.analysis.missingEvidence),
    ],
    documentUsage: analysis.analysis.documentUsage ?? [],
    aiOpportunityReport,
    loomaiIntegrationOverview,
    sourceAttachmentIds: analysis.attachments.map(attachment => attachment.id),
    aiAccessibleAttachmentIds: analysis.aiSharedDocuments.map(document => document.attachmentId),
  };
}
