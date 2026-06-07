'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import {
  ProductAnalysisProgress,
  ProductIntakeFrontDoor,
} from './OwnerJourneyCards';
import { postFormData, postJson, putJson } from './api';
import {
  appleColors,
  PageHeader,
  QueryState,
} from './PlatformComponents';
import ProductOnboardingAnalysisResultPanel from './ProductOnboardingAnalysisResultPanel';
import ProductOnboardingManualProfilePanel from './ProductOnboardingManualProfilePanel';
import ProductOnboardingSideGuidePanel from './ProductOnboardingSideGuidePanel';
import {
  AiAssistedProductAnalysisResponse,
  ProductAnalysisMode,
  ServiceModuleRecommendation,
  ProductCreationActionResponse,
  ProductProfile,
  ProductizationCart,
} from './types';

interface ProductProfilePayload {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  productUrl: string;
  repositoryUrl: string;
  riskProfile: string;
}

const initialValues: ProductProfilePayload = {
  name: '',
  summary: '',
  businessStage: 'PROTOTYPE',
  techStack: '',
  productUrl: '',
  repositoryUrl: '',
  riskProfile: '',
};

const analysisModeOptions: Array<{
  mode: ProductAnalysisMode;
  title: string;
  detail: string;
  accent: string;
}> = [
  {
    mode: 'FULL_WITH_AI_OPPORTUNITIES',
    title: 'Full analysis',
    detail: 'Project intelligence, service plan, scanner focus, AI opportunities, and LoomAI integration path.',
    accent: appleColors.purple,
  },
  {
    mode: 'AI_OPPORTUNITIES',
    title: 'AI integration only',
    detail: 'Evaluate AI opportunities and the LoomAI implementation overview without the full readiness analysis.',
    accent: appleColors.cyan,
  },
];

export default function ProductOnboardingWizard() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [aiBrief, setAiBrief] = useState('');
  const [aiDocumentFiles, setAiDocumentFiles] = useState<
    Array<{ file: File; shareWithAi: boolean }>
  >([]);
  const [aiAnalysis, setAiAnalysis] = useState<AiAssistedProductAnalysisResponse | null>(null);
  const [analysisMode, setAnalysisMode] = useState<ProductAnalysisMode>('FULL_WITH_AI_OPPORTUNITIES');
  const [reviewedServiceRecommendations, setReviewedServiceRecommendations] = useState<
    ServiceModuleRecommendation[]
  >([]);
  const [selectedServiceCodes, setSelectedServiceCodes] = useState<string[]>([]);
  const form = useAdvancedForm<ProductProfilePayload>({
    initialValues,
    validationRules: {
      name: [{ type: 'required', message: 'Product name is required' }],
      summary: [{ type: 'required', message: 'Product summary is required' }],
    },
  });

  const resetAiAnalysis = () => {
    setAiAnalysis(null);
    setReviewedServiceRecommendations([]);
    setSelectedServiceCodes([]);
  };

  const addAiDocumentFiles = (files: File[]) => {
    if (!files.length) return;
    setAiDocumentFiles(current => [
      ...current,
      ...files.map(file => ({
        file,
        shareWithAi: true,
      })),
    ]);
    resetAiAnalysis();
  };

  const updateAiDocumentShare = (index: number, shareWithAi: boolean) => {
    setAiDocumentFiles(current =>
      current.map((doc, docIndex) => (docIndex === index ? { ...doc, shareWithAi } : doc))
    );
    resetAiAnalysis();
  };

  const removeAiDocumentFile = (index: number) => {
    setAiDocumentFiles(current => current.filter((_, docIndex) => docIndex !== index));
    resetAiAnalysis();
  };

  const createProduct = useMutation({
    mutationFn: async () => {
      const product = await postJson<ProductProfile, ProductProfilePayload>(
        '/products',
        form.values
      );
      await putJson<
        ProductizationCart,
        { productProfileId: string; title: string; businessGoal: string }
      >('/productization-cart/current', {
        productProfileId: product.id,
        title: `${product.name} productization draft`,
        businessGoal: form.values.summary,
      });
      return product;
    },
    onSuccess: async product => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      router.push(`/products/${product.id}`);
    },
  });

  const analyzeProductWithAI = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append('ownerMessage', aiBrief);
      payload.append('analysisMode', analysisMode);
      if (form.values.name) payload.append('productName', form.values.name);
      if (form.values.businessStage) payload.append('businessStage', form.values.businessStage);
      if (form.values.techStack) payload.append('techStack', form.values.techStack);
      if (form.values.productUrl) payload.append('productUrl', form.values.productUrl);
      if (form.values.repositoryUrl) payload.append('repositoryUrl', form.values.repositoryUrl);
      if (form.values.riskProfile) payload.append('knownRisks', form.values.riskProfile);
      aiDocumentFiles.forEach((item, index) => {
        payload.append('files', item.file);
        if (item.shareWithAi) {
          payload.append('aiSharedFileIndexes', String(index));
        }
      });
      return postFormData<AiAssistedProductAnalysisResponse>(
        '/products/ai-assisted/analyze',
        payload,
        { timeoutMs: 360000 }
      );
    },
    onSuccess: response => {
      setAiAnalysis(response);
      const recommendations = [...(response.analysis.recommendedServiceModules ?? [])].sort(
        (left, right) => (left.sequence ?? 999) - (right.sequence ?? 999)
      );
      setReviewedServiceRecommendations(recommendations);
      setSelectedServiceCodes(
        recommendations
          .filter(recommendation => recommendation.accepted !== false)
          .map(recommendation => recommendation.moduleCode)
      );
      form.setValue('name', response.analysis.productName || form.values.name);
      form.setValue('summary', response.analysis.summary || form.values.summary);
      form.setValue('businessStage', response.analysis.businessStage || form.values.businessStage);
      form.setValue('techStack', response.analysis.techStack || form.values.techStack);
      form.setValue('productUrl', response.analysis.productUrl || form.values.productUrl);
      form.setValue('repositoryUrl', response.analysis.repositoryUrl || form.values.repositoryUrl);
      form.setValue('riskProfile', response.analysis.riskProfile || form.values.riskProfile);
    },
  });

  const createProductFromAIAction = useMutation({
    mutationFn: async () => {
      if (!aiAnalysis) {
        throw new Error('Run AI analysis before creating the project.');
      }
      const analysisRecommendations = aiAnalysis.analysis.recommendedServiceModules ?? [];
      const effectiveRecommendations = reviewedServiceRecommendations.length
        ? reviewedServiceRecommendations
        : analysisRecommendations;
      const effectiveSelectedCodes = selectedServiceCodes.length
        ? selectedServiceCodes
        : effectiveRecommendations
            .filter(recommendation => recommendation.accepted !== false)
            .map(recommendation => recommendation.moduleCode);
      const actionPayload: Record<string, unknown> = {
        ...aiAnalysis.runtimeActionPayload,
        analysisMode: aiAnalysis.analysisMode,
        creationIntentId: aiAnalysis.intent.id,
        consentToken: aiAnalysis.intent.consentToken,
        idempotencyKey: aiAnalysis.intent.idempotencyKey,
        analysisProviderRequestId: aiAnalysis.intent.analysisProviderRequestId,
        productName: form.values.name || aiAnalysis.analysis.productName,
        summary: form.values.summary || aiAnalysis.analysis.summary,
        businessStage: form.values.businessStage || aiAnalysis.analysis.businessStage,
        techStack: form.values.techStack || aiAnalysis.analysis.techStack,
        productUrl: form.values.productUrl || aiAnalysis.analysis.productUrl,
        repositoryUrl: form.values.repositoryUrl || aiAnalysis.analysis.repositoryUrl,
        riskProfile: form.values.riskProfile || aiAnalysis.analysis.riskProfile,
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
        aiOpportunityReport: aiAnalysis.aiOpportunityReport,
        loomaiIntegrationOverview: aiAnalysis.loomaiIntegrationOverview,
      };
      const response = await postJson<ProductCreationActionResponse, Record<string, unknown>>(
        `/products/ai-assisted/intents/${aiAnalysis.intent.id}/create`,
        actionPayload
      );
      return response;
    },
    onSuccess: async response => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      router.push(`/products/${response.product.id}`);
    },
  });

  const analysisChatContext = () => {
    const analysis = aiAnalysis?.analysis;
    const cleanList = (values?: string[]) => (values ?? []).filter(Boolean).slice(0, 6);
    return {
      pageType: 'owner-project-ai-analysis',
      pageContext: {
        pageType: 'owner-project-ai-analysis',
        pagePosition: 'product_intake_analysis',
        assistantIntent: 'project-analysis-follow-up-chat',
        actionProfile: 'loomai-productization-read',
        productCreationIntentId: aiAnalysis?.intent.id,
        analysisProviderRequestId: aiAnalysis?.intent.analysisProviderRequestId,
        productName: form.values.name || analysis?.productName,
        businessStage: form.values.businessStage || analysis?.businessStage,
        summary: form.values.summary || analysis?.summary,
        projectDescription: analysis?.projectDescription,
        businessProblem: analysis?.businessProblem,
        targetUsers: analysis?.targetUsers,
        techStack: form.values.techStack || analysis?.techStack,
        productUrlAvailable: Boolean(form.values.productUrl || analysis?.productUrl),
        repositoryUrlAvailable: Boolean(form.values.repositoryUrl || analysis?.repositoryUrl),
        riskProfile: form.values.riskProfile || analysis?.riskProfile,
        coreCapabilities: cleanList(analysis?.coreCapabilities),
        businessOutcomes: cleanList(analysis?.businessOutcomes),
        readinessGoals: cleanList(analysis?.readinessGoals),
        recommendedServices: cleanList(analysis?.recommendedServices),
        recommendedServiceModules: reviewedServiceRecommendations.slice(0, 8).map((recommendation, index) => ({
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
              implementationSteps: cleanList(aiAnalysis.loomaiIntegrationOverview.implementationSteps),
              ownerDecisions: cleanList(aiAnalysis.loomaiIntegrationOverview.ownerDecisions),
              risks: cleanList(aiAnalysis.loomaiIntegrationOverview.risks),
            }
          : undefined,
        documentUsage: cleanList(
          analysis?.documentUsage?.map(item => {
            const evidence = item.evidence?.length ? ` Evidence: ${item.evidence.slice(0, 2).join('; ')}` : '';
            const reason = item.reason ? ` Reason: ${item.reason}` : '';
            return `${item.fileName}: ${item.status} via ${item.accessMethod}.${evidence}${reason}`;
          })
        ),
        ownerInstruction:
          'Answer about this project AI analysis and the next owner decision. You may use read-only ProdUS actions when needed. Do not create products, packages, workspaces, team selections, invitations, or participants from chat.',
      },
    };
  };

  const toggleServiceRecommendation = (moduleCode: string) => {
    setSelectedServiceCodes(current =>
      current.includes(moduleCode)
        ? current.filter(code => code !== moduleCode)
        : [...current, moduleCode]
    );
  };

  const moveServiceRecommendation = (moduleCode: string, direction: -1 | 1) => {
    setReviewedServiceRecommendations(current => {
      const index = current.findIndex(item => item.moduleCode === moduleCode);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (!item) return current;
      next.splice(target, 0, item);
      return next.map((recommendation, orderIndex) => ({
        ...recommendation,
        sequence: orderIndex + 1,
      }));
    });
  };

  const submit = form.handleSubmit(() => createProduct.mutate());
  const selectedAiDocumentCount = aiDocumentFiles.filter(item => item.shareWithAi).length;
  const aiBusy = analyzeProductWithAI.isPending || createProductFromAIAction.isPending;
  const fullAnalysisMode = analysisMode === 'FULL_WITH_AI_OPPORTUNITIES';

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
