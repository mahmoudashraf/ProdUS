'use client';

import { Alert, Box, Stack } from '@mui/material';
import ProductOnboardingAnalysisActionPanel, {
  type ProductOnboardingValidationItem,
} from './ProductOnboardingAnalysisActionPanel';
import ProductOnboardingAnalysisContextEditor from './ProductOnboardingAnalysisContextEditor';
import type {
  ProductAnalysisModeOption,
  ProductOnboardingAnalysisDocument,
  ProductOnboardingProfileDraft,
} from './ProductOnboardingAnalysisTypes';
import ProductOnboardingAiReviewContent from './ProductOnboardingAiReviewContent';
import { DotLabel, SectionTitle, Surface, appleColors } from './PlatformComponents';
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

export default function ProductOnboardingAnalysisResultPanel({
  actionError,
  aiBusy,
  analysis,
  analysisMode,
  analysisModeOptions,
  brief,
  documents,
  isAnalyzing,
  isCreatingFromAi,
  profile,
  requestContext,
  reviewedServiceRecommendations,
  selectedServiceCodes,
  onAddFiles,
  onAnalysisModeChange,
  onBriefChange,
  onCreateWithAiAction,
  onMoveServiceRecommendation,
  onProductUrlChange,
  onRemoveDocument,
  onRepositoryUrlChange,
  onRunAnalysis,
  onToggleDocument,
  onToggleServiceRecommendation,
}: {
  actionError: unknown;
  aiBusy: boolean;
  analysis: AiAssistedProductAnalysisResponse;
  analysisMode: ProductAnalysisMode;
  analysisModeOptions: ProductAnalysisModeOption[];
  brief: string;
  documents: ProductOnboardingAnalysisDocument[];
  isAnalyzing: boolean;
  isCreatingFromAi: boolean;
  profile: ProductOnboardingProfileDraft;
  requestContext: Record<string, unknown>;
  reviewedServiceRecommendations: ServiceModuleRecommendation[];
  selectedServiceCodes: string[];
  onAddFiles: (files: File[]) => void;
  onAnalysisModeChange: (mode: ProductAnalysisMode) => void;
  onBriefChange: (value: string) => void;
  onCreateWithAiAction: () => void;
  onMoveServiceRecommendation: (moduleCode: string, direction: -1 | 1) => void;
  onProductUrlChange: (value: string) => void;
  onRemoveDocument: (index: number) => void;
  onRepositoryUrlChange: (value: string) => void;
  onRunAnalysis: () => void;
  onToggleDocument: (index: number, shareWithAi: boolean) => void;
  onToggleServiceRecommendation: (moduleCode: string) => void;
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
  return (
    <Surface
      sx={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 48%, #f8f7ff 100%)',
        borderColor: '#dfe7f5',
      }}
    >
      <Stack spacing={2.25}>
        <SectionTitle
          title="Here's what ProdUS understood"
          action={
            <DotLabel
              label={analysis.intent.analysisProviderRequestId ? 'LoomAI analyzed' : 'Fallback analysis'}
              color={analysis.intent.analysisProviderRequestId ? appleColors.green : appleColors.amber}
            />
          }
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 300px' },
            gap: 2.25,
            alignItems: 'stretch',
          }}
        >
          <Stack spacing={1.5}>
            <ProductOnboardingAnalysisContextEditor
              analysisMode={analysisMode}
              analysisModeOptions={analysisModeOptions}
              brief={brief}
              documents={documents}
              profile={profile}
              selectedDocumentCount={selectedDocumentCount}
              onAddFiles={onAddFiles}
              onAnalysisModeChange={onAnalysisModeChange}
              onBriefChange={onBriefChange}
              onProductUrlChange={onProductUrlChange}
              onRemoveDocument={onRemoveDocument}
              onRepositoryUrlChange={onRepositoryUrlChange}
              onToggleDocument={onToggleDocument}
            />
            <Alert severity={analysis.aiApplied ? 'success' : 'info'}>
              {analysis.aiApplied
                ? 'AI analysis is ready. Review the generated attributes, then create the productization project through the action flow.'
                : 'Analysis used deterministic fallback because AI did not return the expected strict JSON contract.'}
            </Alert>
            <ProductOnboardingAiReviewContent
              analysis={analysis}
              profile={profile}
              reviewedServiceRecommendations={reviewedServiceRecommendations}
              selectedServiceCodes={selectedServiceCodes}
              onMoveServiceRecommendation={onMoveServiceRecommendation}
              onToggleServiceRecommendation={onToggleServiceRecommendation}
            />
          </Stack>
          <ProductOnboardingAnalysisActionPanel
            analysis={analysis}
            actionError={actionError}
            aiBusy={aiBusy}
            aiOpportunityCount={aiOpportunityCount}
            brief={brief}
            canCreate={canCreateWithAi}
            documentProofGap={documentProofGap}
            documentProofRequired={documentProofRequired}
            documentUsageMissing={documentUsageMissing}
            fullAnalysisMode={fullAnalysisMode}
            isAnalyzing={isAnalyzing}
            isCreating={isCreatingFromAi}
            notUsedDocumentCount={notUsedDocumentCount}
            openedDocumentCount={openedDocumentCount}
            privateAttachmentCount={documents.length}
            requestContext={requestContext}
            selectedDocumentCount={selectedDocumentCount}
            selectedServiceCount={selectedServiceCount}
            validationItems={validationItems}
            onCreate={onCreateWithAiAction}
            onRunAnalysis={onRunAnalysis}
          />
        </Box>
      </Stack>
    </Surface>
  );
}
