'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteJson, getJson } from './api';
import ProductCreationReviewPanel from './ProductCreationReviewPanel';
import { ProductAnalysisProgress } from './ProductAnalysisProgress';
import { ProductIntakeFrontDoor } from './ProductIntakeFrontDoor';
import { PageHeader, QueryState } from './PlatformComponents';
import {
  ProductCreationAiReviewEmpty,
  ProductCreationAnalyzeNotice,
  ProductCreationCartSnapshot,
  ProductCreationInternalHeader,
  ProductCreationManualIntro,
  ProductCreationStartingPointPanel,
  isProductCreationStep,
  type ProductCreationStep,
} from './ProductOnboardingJourneyShell';
import ProductOnboardingAnalysisResultPanel from './ProductOnboardingAnalysisResultPanel';
import ProductOnboardingManualProfilePanel from './ProductOnboardingManualProfilePanel';
import ProductOnboardingSideGuidePanel from './ProductOnboardingSideGuidePanel';
import type { ProductizationCart } from './types';
import {
  analysisModeOptions,
  useProductOnboardingWizardState,
} from './useProductOnboardingWizardState';

export default function ProductOnboardingWizard() {
  const queryClient = useQueryClient();
  const routeRouter = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const stepParam = searchParams?.get('step') || null;
  const fromCatalog = searchParams?.get('from') === 'service-catalog';
  const fromAiCatalog = fromCatalog && searchParams?.get('ai') === '1';
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
    toggleServiceRecommendation,
    updateAiDocumentShare,
  } = useProductOnboardingWizardState();
  const currentCart = useQuery({
    queryKey: ['productization-cart'],
    queryFn: () => getJson<ProductizationCart>('/productization-cart/current'),
  });
  const removeSelectedService = useMutation({
    mutationFn: (itemId: string) =>
      deleteJson<ProductizationCart>(`/productization-cart/services/${itemId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const currentStep: ProductCreationStep = isProductCreationStep(stepParam)
    ? stepParam
    : aiAnalysis
      ? 'ai-review'
      : 'setup';
  const selectedServiceCount = currentCart.data?.serviceItems.length || 0;
  const isSetupStep = currentStep === 'setup';

  const openStep = (step: ProductCreationStep) => {
    const next = new URLSearchParams(searchParamString);
    next.set('step', step);
    routeRouter.push(`${pathname || '/products/new'}?${next.toString()}`, { scroll: false });
  };
  const openSetup = () => openStep('setup');
  const openServicesCatalog = () => {
    routeRouter.push('/services?view=templates');
  };
  const reviewManualProfile = form.handleSubmit(() => openStep('review'));
  const createFromReview = form.handleSubmit(() => createProduct.mutate());

  useEffect(() => {
    if (!aiAnalysis || currentStep === 'ai-review') return;
    const next = new URLSearchParams(searchParamString);
    next.set('step', 'ai-review');
    routeRouter.replace(`${pathname || '/products/new'}?${next.toString()}`, { scroll: false });
  }, [aiAnalysis, currentStep, pathname, routeRouter, searchParamString]);

  return (
    <>
      <PageHeader
        title="Create Product"
        description="Create the product context from a blank idea, a selected service path, or AI-assisted product understanding."
        action={
          <Button
            variant="outlined"
            onClick={() => router.push('/products')}
            sx={{ minHeight: 42 }}
          >
            Back to products
          </Button>
        }
      />
      <QueryState
        isLoading={createProduct.isPending || aiBusy || currentCart.isLoading}
        error={
          createProduct.error ||
          analyzeProductWithAI.error ||
          currentCart.error ||
          removeSelectedService.error
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: isSetupStep ? '1fr 340px' : '1fr' },
          gap: 2.5,
        }}
      >
        <Stack spacing={2.5}>
          <ProductCreationInternalHeader step={currentStep} onBackToSetup={openSetup} />
          {isSetupStep && (
            <ProductCreationStartingPointPanel
              cart={currentCart.data}
              fromAiCatalog={fromAiCatalog}
              fromCatalog={fromCatalog}
              onManualProfile={() => openStep('manual')}
            />
          )}

          {currentStep === 'setup' && (
            <ProductIntakeFrontDoor
              brief={aiBrief}
              productName={form.values.name}
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
              onProductNameChange={name => {
                form.setValue('name', name);
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
              onManualSetup={() => openStep('manual')}
            />
          )}

          {analyzeProductWithAI.isPending && (
            <>
              <ProductCreationAnalyzeNotice />
              <ProductAnalysisProgress
                modeLabel={
                  fullAnalysisMode
                    ? 'Full analysis with AI opportunities'
                    : 'AI opportunity analysis'
                }
              />
            </>
          )}

          {currentStep === 'ai-review' && aiAnalysis && (
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
              onProductNameChange={name => form.setValue('name', name)}
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

          {currentStep === 'ai-review' && !aiAnalysis && (
            <ProductCreationAiReviewEmpty onBackToSetup={openSetup} />
          )}

          {currentStep === 'manual' && (
            <>
              <ProductCreationManualIntro selectedServiceCount={selectedServiceCount} />
              <ProductOnboardingManualProfilePanel
                values={form.values}
                isCreating={createProduct.isPending}
                onValueChange={form.setValue}
                onSubmit={reviewManualProfile}
              />
            </>
          )}

          {currentStep === 'review' && (
            <ProductCreationReviewPanel
              cart={currentCart.data}
              isCreating={createProduct.isPending}
              isRemovingService={removeSelectedService.isPending}
              values={form.values}
              onBackToProfile={() => openStep('manual')}
              onChangeServices={openServicesCatalog}
              onCreate={() => createFromReview()}
              onRemoveService={itemId => removeSelectedService.mutate(itemId)}
            />
          )}
        </Stack>

        {isSetupStep && (
          <Stack spacing={2.5}>
            <ProductCreationCartSnapshot
              cart={currentCart.data}
              isRemovingService={removeSelectedService.isPending}
              onChangeServices={openServicesCatalog}
              onRemoveService={itemId => removeSelectedService.mutate(itemId)}
            />
            <ProductOnboardingSideGuidePanel />
          </Stack>
        )}
      </Box>
    </>
  );
}
