'use client';

import { Alert, Box, Stack } from '@mui/material';
import ProductOnboardingAnalysisActionPanel from './ProductOnboardingAnalysisActionPanel';
import ProductOnboardingAnalysisContextEditor from './ProductOnboardingAnalysisContextEditor';
import type {
  ProductAnalysisModeOption,
  ProductOnboardingAnalysisDocument,
  ProductOnboardingProfileDraft,
} from './ProductOnboardingAnalysisTypes';
import ProductOnboardingAiReviewContent from './ProductOnboardingAiReviewContent';
import { DotLabel, SectionTitle, Surface, appleColors } from './PlatformComponents';
import { buildProductOnboardingAnalysisResultModel } from './productOnboardingAnalysisResultModel';
import type {
  AiAssistedProductAnalysisResponse,
  ProductAnalysisMode,
  ServiceModuleRecommendation,
} from './types';

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
  const {
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
  } = buildProductOnboardingAnalysisResultModel({
    aiBusy,
    analysis,
    analysisMode,
    brief,
    documents,
    profile,
    reviewedServiceRecommendations,
    selectedServiceCodes,
  });

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
                ? 'AI analysis is ready. Review the generated attributes, then create the product through the action flow.'
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
