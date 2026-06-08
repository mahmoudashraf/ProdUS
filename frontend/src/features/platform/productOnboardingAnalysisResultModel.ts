import type { ProductOnboardingValidationItem } from './ProductOnboardingValidationChecklist';
import type {
  ProductOnboardingAnalysisDocument,
  ProductOnboardingProfileDraft,
} from './ProductOnboardingAnalysisTypes';
import type {
  AiAssistedProductAnalysisResponse,
  ProductAnalysisMode,
  ServiceModuleRecommendation,
} from './types';

const formatExpiry = (value?: string) => {
  if (!value) return 'no expiry returned';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'expiry unavailable';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const compactCount = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export function buildProductOnboardingAnalysisResultModel({
  aiBusy,
  analysis,
  analysisMode,
  brief,
  documents,
  profile,
  reviewedServiceRecommendations,
  selectedServiceCodes,
}: {
  aiBusy: boolean;
  analysis: AiAssistedProductAnalysisResponse;
  analysisMode: ProductAnalysisMode;
  brief: string;
  documents: ProductOnboardingAnalysisDocument[];
  profile: ProductOnboardingProfileDraft;
  reviewedServiceRecommendations: ServiceModuleRecommendation[];
  selectedServiceCodes: string[];
}) {
  const selectedDocumentCount = documents.filter(item => item.shareWithAi).length;
  const documentUsage = analysis.analysis.documentUsage ?? [];
  const openedDocumentCount = documentUsage.filter(
    item => item.status === 'USED' && item.accessMethod === 'TEMPORARY_URL'
  ).length;
  const notUsedDocumentCount = documentUsage.filter(item => item.status === 'NOT_USED').length;
  const documentUsageMissing =
    Boolean(analysis.aiSharedDocuments.length) && documentUsage.length === 0;
  const sharedDocumentCount = analysis.aiSharedDocuments.length;
  const documentProofRequired = analysis.blockUnprovenAiDocumentUsage === true;
  const documentProofGap =
    sharedDocumentCount > 0
    && (
      documentUsageMissing
      || notUsedDocumentCount > 0
      || openedDocumentCount < sharedDocumentCount
    );
  const documentProofBlocked = documentProofRequired && documentProofGap;
  const productNameReady = profile.name.trim().length > 0;
  const productSummaryReady = profile.summary.trim().length > 0;
  const missingEvidence = analysis.analysis.missingEvidence ?? [];
  const assumptions = analysis.analysis.assumptions ?? [];
  const selectedServiceCount = selectedServiceCodes.length;
  const aiOpportunityCount = analysis.aiOpportunityReport?.useCases?.length ?? 0;
  const fullAnalysisMode = analysisMode === 'FULL_WITH_AI_OPPORTUNITIES';
  const canCreateWithAi =
    productNameReady && productSummaryReady && !documentProofBlocked && !aiBusy;
  const validationItems: ProductOnboardingValidationItem[] = [
    {
      title: 'Owner intent',
      detail: brief.trim()
        ? 'Conversation brief is captured and will be used as the owner request.'
        : 'Describe what should become production-ready before asking AI to analyze it.',
      state: brief.trim() ? 'ready' : 'blocked',
    },
    {
      title: 'AI project analysis',
      detail: analysis.aiApplied
        ? `LoomAI returned structured project attributes${analysis.intent.analysisProviderRequestId ? ` with trace ${analysis.intent.analysisProviderRequestId}.` : '.'}`
        : `Fallback analysis is available${analysis.fallbackReason ? `: ${analysis.fallbackReason}` : '.'}`,
      state: analysis.aiApplied ? 'ready' : 'attention',
    },
    {
      title: 'AI opportunities',
      detail: analysis.aiOpportunityReport
        ? `${compactCount(aiOpportunityCount, 'AI use case')} found and added to project creation context.`
        : 'AI opportunities were requested, but no opportunity report was returned.',
      state: analysis.aiOpportunityReport ? 'ready' : 'attention',
    },
    {
      title: 'Required creation fields',
      detail:
        productNameReady && productSummaryReady
          ? `Ready to create "${profile.name.trim()}".`
          : 'Product name and product outcome must be present before the action can run.',
      state: productNameReady && productSummaryReady ? 'ready' : 'blocked',
    },
    {
      title: 'Document access boundary',
      detail: analysis.aiSharedDocuments.length
        ? documentUsage.length
          ? `${compactCount(openedDocumentCount, 'document')} opened by AI through temporary URL; ${compactCount(notUsedDocumentCount, 'document')} not used.`
          : `${compactCount(analysis.aiSharedDocuments.length, 'selected document')} received temporary AI access. LoomAI did not return per-file usage evidence.`
        : documents.length
          ? `${compactCount(documents.length, 'private attachment')} will stay with the project; ${compactCount(selectedDocumentCount, 'file')} ${selectedDocumentCount === 1 ? 'is' : 'are'} shared with AI temporarily.`
          : 'No documents attached. You can still create the project from the conversation and links.',
      state:
        documents.length > 0 && selectedDocumentCount === 0
          ? 'attention'
          : documentProofGap
            ? documentProofRequired
              ? 'blocked'
              : 'attention'
            : 'ready',
    },
    {
      title: 'Service plan seed',
      detail: reviewedServiceRecommendations.length
        ? `${compactCount(selectedServiceCount, 'catalog service')} selected for persistence from ${compactCount(reviewedServiceRecommendations.length, 'AI recommendation')}.`
        : 'No catalog-backed service module was returned. You can still create and add services later.',
      state:
        reviewedServiceRecommendations.length && selectedServiceCount === 0
          ? 'attention'
          : 'ready',
    },
    {
      title: 'AI validation notes',
      detail: missingEvidence.length
        ? `${compactCount(missingEvidence.length, 'proof gap')} found. The project can be created, but these should become follow-up tasks.`
        : assumptions.length
          ? `${compactCount(assumptions.length, 'assumption')} captured for owner review. No missing evidence was flagged for creation.`
          : 'AI did not flag missing evidence for the creation step.',
      state: missingEvidence.length ? 'attention' : 'ready',
    },
    {
      title: 'Action guard',
      detail: `One-time owner-approved action payload expires ${formatExpiry(analysis.intent.expiresAt)}. Consent and idempotency are checked again by the backend.`,
      state: 'ready',
    },
  ];

  return {
    aiOpportunityCount,
    canCreateWithAi,
    documentProofGap,
    documentProofRequired,
    documentUsageMissing,
    fullAnalysisMode,
    notUsedDocumentCount,
    openedDocumentCount,
    selectedDocumentCount,
    selectedServiceCount,
    validationItems,
  };
}
