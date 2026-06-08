'use client';

import { Box, Button, Stack } from '@mui/material';
import { ProductAnalysisProgress } from './ProductAnalysisProgress';
import { ProductIntakeFrontDoor } from './ProductIntakeFrontDoor';
import {
  PageHeader,
  QueryState,
} from './PlatformComponents';
import ProductOnboardingAnalysisResultPanel from './ProductOnboardingAnalysisResultPanel';
import ProductOnboardingManualProfilePanel from './ProductOnboardingManualProfilePanel';
import ProductOnboardingSideGuidePanel from './ProductOnboardingSideGuidePanel';
import {
  analysisModeOptions,
  useProductOnboardingWizardState,
} from './useProductOnboardingWizardState';

export default function ProductOnboardingWizard() {
  const {
    addAiDocumentFiles,
    aiAnalysis,
    aiBrief,
    aiBusy,
    aiDocumentFiles,
    analysisChatContext,
    analysisMode,
    analyzeProductWithAI,
    createProduct,
    createProductFromAIAction,
    form,
    fullAnalysisMode,
    moveServiceRecommendation,
    removeAiDocumentFile,
    resetAiAnalysis,
    reviewedServiceRecommendations,
    router,
    selectedAiDocumentCount,
    selectedServiceCodes,
    setAiBrief,
    setAnalysisMode,
    submit,
    toggleServiceRecommendation,
    updateAiDocumentShare,
  } = useProductOnboardingWizardState();

  return (
    <>
      <PageHeader
        title="Create Product"
        description="Create the owner product context with optional private documents and AI-assisted analysis."
        action={
          <Button
            variant="outlined"
            onClick={() => router.push('/dashboard')}
            sx={{ minHeight: 42 }}
          >
            Back to dashboard
          </Button>
        }
      />
      <QueryState
        isLoading={createProduct.isPending || aiBusy}
        error={createProduct.error || analyzeProductWithAI.error}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 340px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <ProductIntakeFrontDoor
            brief={aiBrief}
            productUrl={form.values.productUrl}
            repositoryUrl={form.values.repositoryUrl}
            analysisMode={analysisMode}
            analysisModeOptions={analysisModeOptions}
            documents={aiDocumentFiles.map(item => ({
              name: item.file.name,
              size: item.file.size,
              shareWithAi: item.shareWithAi,
            }))}
            selectedDocumentCount={selectedAiDocumentCount}
            isBusy={aiBusy}
            onBriefChange={value => {
              setAiBrief(value);
              resetAiAnalysis();
            }}
            onProductUrlChange={productUrl => form.setValue('productUrl', productUrl)}
            onRepositoryUrlChange={repositoryUrl => form.setValue('repositoryUrl', repositoryUrl)}
            onAnalysisModeChange={mode => {
              setAnalysisMode(mode);
              resetAiAnalysis();
            }}
            onFileInput={event => {
              addAiDocumentFiles(Array.from(event.target.files || []));
              event.target.value = '';
            }}
            onToggleDocument={updateAiDocumentShare}
            onRemoveDocument={removeAiDocumentFile}
            onAnalyze={() => analyzeProductWithAI.mutate()}
            onManualSetup={() => {
              document.getElementById('manual-product-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />

          {analyzeProductWithAI.isPending && (
            <ProductAnalysisProgress modeLabel={fullAnalysisMode ? 'Full analysis with AI opportunities' : 'AI opportunity analysis'} />
          )}

          {aiAnalysis && (
            <ProductOnboardingAnalysisResultPanel
              actionError={createProductFromAIAction.error}
              aiBusy={aiBusy}
              analysis={aiAnalysis}
              analysisMode={analysisMode}
              analysisModeOptions={analysisModeOptions}
              brief={aiBrief}
              documents={aiDocumentFiles}
              isAnalyzing={analyzeProductWithAI.isPending}
              isCreatingFromAi={createProductFromAIAction.isPending}
              profile={form.values}
              requestContext={analysisChatContext()}
              reviewedServiceRecommendations={reviewedServiceRecommendations}
              selectedServiceCodes={selectedServiceCodes}
              onAddFiles={addAiDocumentFiles}
              onAnalysisModeChange={mode => {
                setAnalysisMode(mode);
                resetAiAnalysis();
              }}
              onBriefChange={value => {
                setAiBrief(value);
                resetAiAnalysis();
              }}
              onCreateWithAiAction={() => createProductFromAIAction.mutate()}
              onMoveServiceRecommendation={moveServiceRecommendation}
              onProductUrlChange={productUrl => form.setValue('productUrl', productUrl)}
              onRemoveDocument={removeAiDocumentFile}
              onRepositoryUrlChange={repositoryUrl => form.setValue('repositoryUrl', repositoryUrl)}
              onRunAnalysis={() => analyzeProductWithAI.mutate()}
              onToggleDocument={updateAiDocumentShare}
              onToggleServiceRecommendation={toggleServiceRecommendation}
            />
          )}

          <ProductOnboardingManualProfilePanel
            values={form.values}
            isCreating={createProduct.isPending}
            onValueChange={form.setValue}
            onSubmit={submit}
          />
        </Stack>

        <ProductOnboardingSideGuidePanel />
      </Box>
    </>
  );
}
