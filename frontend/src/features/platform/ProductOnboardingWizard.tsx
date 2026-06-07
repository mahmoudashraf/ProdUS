'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AutoAwesomeOutlined,
  ArrowForwardOutlined,
  CheckCircleOutlineOutlined,
  CloudUploadOutlined,
  ErrorOutlineOutlined,
  PsychologyAltOutlined,
  RuleOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import {
  AiOpportunityDiscoveryPanel,
  ProductAnalysisProgress,
  ProductIntakeFrontDoor,
} from './OwnerJourneyCards';
import {
  AiAttributeCard,
  AiDocumentUsageList,
  AiReviewList,
  AiServicePlanReview,
  LoomAIOverviewPanel,
  ProjectAnalysisChatPanel,
  ValidationRow,
  type ValidationState,
} from './ProductOnboardingAiPanels';
import { postFormData, postJson, putJson } from './api';
import {
  DotLabel,
  PageHeader,
  QueryState,
  SectionTitle,
  Surface,
  TextInput,
  appleColors,
  errorMessageFromUnknown,
  formatLabel,
} from './PlatformComponents';
import ProductOnboardingManualProfilePanel from './ProductOnboardingManualProfilePanel';
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

const errorCodeFromUnknown = (error: unknown) => {
  const responseData =
    typeof error === 'object' && error !== null && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined;

  if (responseData && typeof responseData === 'object') {
    const value = (responseData as Record<string, unknown>).errorCode;
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return '';
};

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
  const aiDocumentUsage = aiAnalysis?.analysis.documentUsage ?? [];
  const aiOpenedDocumentCount = aiDocumentUsage.filter(
    item => item.status === 'USED' && item.accessMethod === 'TEMPORARY_URL'
  ).length;
  const aiNotUsedDocumentCount = aiDocumentUsage.filter(item => item.status === 'NOT_USED').length;
  const aiDocumentUsageMissing =
    Boolean(aiAnalysis?.aiSharedDocuments.length) && aiDocumentUsage.length === 0;
  const aiSharedDocumentCount = aiAnalysis?.aiSharedDocuments.length ?? 0;
  const aiDocumentProofRequired = aiAnalysis?.blockUnprovenAiDocumentUsage === true;
  const aiDocumentProofGap =
    aiSharedDocumentCount > 0
    && (
      aiDocumentUsageMissing
      || aiNotUsedDocumentCount > 0
      || aiOpenedDocumentCount < aiSharedDocumentCount
    );
  const aiDocumentProofBlocked = aiDocumentProofRequired && aiDocumentProofGap;
  const aiBusy = analyzeProductWithAI.isPending || createProductFromAIAction.isPending;
  const productNameReady = form.values.name.trim().length > 0;
  const productSummaryReady = form.values.summary.trim().length > 0;
  const aiMissingEvidence = aiAnalysis?.analysis.missingEvidence ?? [];
  const aiAssumptions = aiAnalysis?.analysis.assumptions ?? [];
  const aiIntentExpiresAt = formatExpiry(aiAnalysis?.intent.expiresAt);
  const aiActionErrorMessage = createProductFromAIAction.error
    ? errorMessageFromUnknown(
        createProductFromAIAction.error,
        'The AI project creation action was rejected.'
      )
    : '';
  const aiActionErrorCode = createProductFromAIAction.error
    ? errorCodeFromUnknown(createProductFromAIAction.error)
    : '';
  const selectedAiServiceCount = selectedServiceCodes.length;
  const missingCatalogCoverage = aiAnalysis?.analysis.missingCatalogCoverage ?? [];
  const aiOpportunityCount = aiAnalysis?.aiOpportunityReport?.useCases?.length ?? 0;
  const fullAnalysisMode = analysisMode === 'FULL_WITH_AI_OPPORTUNITIES';
  const aiValidationItems: Array<{
    title: string;
    detail: string;
    state: ValidationState;
  }> = [
    {
      title: 'Owner intent',
      detail: aiBrief.trim()
        ? 'Conversation brief is captured and will be used as the owner request.'
        : 'Describe what should become production-ready before asking AI to analyze it.',
      state: aiBrief.trim() ? 'ready' : 'blocked',
    },
    {
      title: 'AI project analysis',
      detail: aiAnalysis
        ? aiAnalysis.aiApplied
          ? `LoomAI returned structured project attributes${aiAnalysis.intent.analysisProviderRequestId ? ` with trace ${aiAnalysis.intent.analysisProviderRequestId}.` : '.'}`
          : `Fallback analysis is available${aiAnalysis.fallbackReason ? `: ${aiAnalysis.fallbackReason}` : '.'}`
        : 'Run AI analysis to extract project fields, assumptions, proof gaps, and the creation payload.',
      state: aiAnalysis ? (aiAnalysis.aiApplied ? 'ready' : 'attention') : 'blocked',
    },
    {
      title: 'AI opportunities',
      detail: aiAnalysis
        ? aiAnalysis.aiOpportunityReport
          ? `${compactCount(aiOpportunityCount, 'AI use case')} found and added to project creation context.`
          : 'AI opportunities were requested, but no opportunity report was returned.'
        : fullAnalysisMode
          ? 'Full analysis will include AI opportunities and LoomAI integration guidance.'
          : 'AI integration-only mode will focus on opportunities and the LoomAI implementation overview.',
      state: aiAnalysis ? (aiAnalysis.aiOpportunityReport ? 'ready' : 'attention') : 'blocked',
    },
    {
      title: 'Required creation fields',
      detail:
        productNameReady && productSummaryReady
          ? `Ready to create "${form.values.name.trim()}".`
          : 'Product name and product outcome must be present before the action can run.',
      state: productNameReady && productSummaryReady ? 'ready' : 'blocked',
    },
    {
      title: 'Document access boundary',
      detail: aiAnalysis?.aiSharedDocuments.length
        ? aiDocumentUsage.length
          ? `${compactCount(aiOpenedDocumentCount, 'document')} opened by AI through temporary URL; ${compactCount(aiNotUsedDocumentCount, 'document')} not used.`
          : `${compactCount(aiAnalysis.aiSharedDocuments.length, 'selected document')} received temporary AI access. LoomAI did not return per-file usage evidence.`
        : aiDocumentFiles.length
          ? `${compactCount(aiDocumentFiles.length, 'private attachment')} will stay with the project; ${compactCount(selectedAiDocumentCount, 'file')} ${selectedAiDocumentCount === 1 ? 'is' : 'are'} shared with AI temporarily.`
          : 'No documents attached. You can still create the project from the conversation and links.',
      state:
        aiDocumentFiles.length > 0 && selectedAiDocumentCount === 0
          ? 'attention'
          : aiDocumentProofGap
            ? (aiDocumentProofRequired ? 'blocked' : 'attention')
            : 'ready',
    },
    {
      title: 'Service plan seed',
      detail: aiAnalysis
        ? reviewedServiceRecommendations.length
          ? `${compactCount(selectedAiServiceCount, 'catalog service')} selected for persistence from ${compactCount(reviewedServiceRecommendations.length, 'AI recommendation')}.`
          : 'No catalog-backed service module was returned. You can still create and add services later.'
        : 'AI service recommendations appear after analysis.',
      state: aiAnalysis ? (reviewedServiceRecommendations.length && selectedAiServiceCount === 0 ? 'attention' : 'ready') : 'blocked',
    },
    {
      title: 'AI validation notes',
      detail: aiAnalysis
        ? aiMissingEvidence.length
          ? `${compactCount(aiMissingEvidence.length, 'proof gap')} found. The project can be created, but these should become follow-up tasks.`
          : aiAssumptions.length
            ? `${compactCount(aiAssumptions.length, 'assumption')} captured for owner review. No missing evidence was flagged for creation.`
            : 'AI did not flag missing evidence for the creation step.'
        : 'AI review notes appear after analysis.',
      state: aiAnalysis ? (aiMissingEvidence.length ? 'attention' : 'ready') : 'blocked',
    },
    {
      title: 'Action guard',
      detail: aiAnalysis
        ? `One-time owner-approved action payload expires ${aiIntentExpiresAt}. Consent and idempotency are checked again by the backend.`
        : 'The action guard is created only after AI analysis succeeds.',
      state: aiAnalysis ? 'ready' : 'blocked',
    },
  ];
  const aiBlockedValidationCount = aiValidationItems.filter(
    item => item.state === 'blocked'
  ).length;
  const aiAttentionValidationCount = aiValidationItems.filter(
    item => item.state === 'attention'
  ).length;
  const aiProjectAttributes = aiAnalysis
    ? [
        {
          label: 'Product name',
          value: aiAnalysis.analysis.productName,
          source: 'AI',
          accent: appleColors.purple,
        },
        {
          label: 'Business stage',
          value: formatLabel(aiAnalysis.analysis.businessStage || form.values.businessStage),
          source: aiAnalysis.analysis.businessStage ? 'AI' : 'Owner',
          accent: appleColors.amber,
        },
        {
          label: 'Outcome summary',
          value: aiAnalysis.analysis.summary,
          source: 'AI',
          accent: appleColors.blue,
          wide: true,
        },
        {
          label: 'Project understanding',
          value: aiAnalysis.analysis.projectDescription,
          source: aiAnalysis.analysis.projectDescription ? 'AI' : 'Needs input',
          accent: appleColors.purple,
          wide: true,
        },
        {
          label: 'Business problem',
          value: aiAnalysis.analysis.businessProblem,
          source: aiAnalysis.analysis.businessProblem ? 'AI' : 'Needs input',
          accent: appleColors.amber,
        },
        {
          label: 'Target users',
          value: aiAnalysis.analysis.targetUsers,
          source: aiAnalysis.analysis.targetUsers ? 'AI' : 'Needs input',
          accent: appleColors.cyan,
        },
        {
          label: 'Tech stack',
          value: aiAnalysis.analysis.techStack || form.values.techStack,
          source: aiAnalysis.analysis.techStack ? 'AI' : 'Owner',
          accent: appleColors.cyan,
        },
        {
          label: 'Repository',
          value: aiAnalysis.analysis.repositoryUrl || form.values.repositoryUrl,
          source: aiAnalysis.analysis.repositoryUrl ? 'AI' : 'Owner',
          accent: appleColors.green,
        },
        {
          label: 'Product URL',
          value: aiAnalysis.analysis.productUrl || form.values.productUrl,
          source: aiAnalysis.analysis.productUrl ? 'AI' : 'Owner',
          accent: appleColors.blue,
        },
        {
          label: 'Known rough edges',
          value: aiAnalysis.analysis.riskProfile || form.values.riskProfile,
          source: aiAnalysis.analysis.riskProfile ? 'AI' : 'Owner',
          accent: appleColors.red,
        },
        {
          label: 'AI creation summary',
          value: aiAnalysis.analysis.aiCreationSummary,
          source: 'AI',
          accent: appleColors.purple,
          wide: true,
        },
      ]
    : [];
  const canCreateWithAi = Boolean(aiAnalysis) && productNameReady && productSummaryReady && !aiDocumentProofBlocked && !aiBusy;

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
              const files = Array.from(event.target.files || []).map(file => ({
                file,
                shareWithAi: true,
              }));
              setAiDocumentFiles(current => [...current, ...files]);
              resetAiAnalysis();
              event.target.value = '';
            }}
            onToggleDocument={(index, shareWithAi) => {
              setAiDocumentFiles(current =>
                current.map((doc, docIndex) =>
                  docIndex === index ? { ...doc, shareWithAi } : doc
                )
              );
              resetAiAnalysis();
            }}
            onRemoveDocument={index => {
              setAiDocumentFiles(current => current.filter((_, docIndex) => docIndex !== index));
              resetAiAnalysis();
            }}
            onAnalyze={() => analyzeProductWithAI.mutate()}
            onManualSetup={() => {
              document.getElementById('manual-product-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />

          {analyzeProductWithAI.isPending && (
            <ProductAnalysisProgress modeLabel={fullAnalysisMode ? 'Full analysis with AI opportunities' : 'AI opportunity analysis'} />
          )}

          {aiAnalysis && (
          <Surface
            sx={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 48%, #f8f7ff 100%)',
              borderColor: '#dfe7f5',
            }}
          >
            <Stack spacing={2.25}>
              <SectionTitle
                title="Here's what ProdUS understood"
                action={<DotLabel label={aiAnalysis.intent.analysisProviderRequestId ? 'LoomAI analyzed' : 'Fallback analysis'} color={aiAnalysis.intent.analysisProviderRequestId ? appleColors.green : appleColors.amber} />}
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
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      gap: 1,
                    }}
                  >
                    {analysisModeOptions.map(option => {
                      const selected = analysisMode === option.mode;
                      return (
                        <Button
                          key={option.mode}
                          variant="outlined"
                          onClick={() => {
                            setAnalysisMode(option.mode);
                            resetAiAnalysis();
                          }}
                          sx={{
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            alignItems: 'stretch',
                            minHeight: 92,
                            p: 1.25,
                            borderRadius: 1,
                            borderColor: selected ? option.accent : '#dfe7f5',
                            borderWidth: selected ? 2 : 1,
                            bgcolor: selected ? `${option.accent}08` : '#fff',
                            color: appleColors.ink,
                            '&:hover': {
                              borderColor: option.accent,
                              bgcolor: `${option.accent}0f`,
                            },
                          }}
                        >
                          <Stack spacing={0.5} sx={{ width: '100%' }}>
                            <Stack direction="row" spacing={0.8} alignItems="center">
                              <DotLabel
                                label={selected ? 'Selected' : 'Available'}
                                color={selected ? option.accent : appleColors.muted}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 950 }}>
                                {option.title}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ lineHeight: 1.45, whiteSpace: 'normal' }}
                            >
                              {option.detail}
                            </Typography>
                          </Stack>
                        </Button>
                      );
                    })}
                  </Box>
                  <TextField
                    label="Tell ProdUS what you want to productize"
                    value={aiBrief}
                    onChange={event => {
                      setAiBrief(event.target.value);
                      resetAiAnalysis();
                    }}
                    multiline
                    minRows={5}
                    fullWidth
                    placeholder="Describe the prototype, target users, links, rough edges, and what ready-to-ship should mean."
                  />
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      gap: 1.5,
                    }}
                  >
                    <TextInput
                      label="Product or app URL"
                      value={form.values.productUrl}
                      onChange={productUrl => form.setValue('productUrl', productUrl)}
                    />
                    <TextInput
                      label="Repository URL"
                      value={form.values.repositoryUrl}
                      onChange={repositoryUrl => form.setValue('repositoryUrl', repositoryUrl)}
                    />
                  </Box>
                  <Box
                    sx={{
                      border: '1px dashed #c8d4e5',
                      borderRadius: 1,
                      bgcolor: '#fff',
                      p: 1.5,
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.25}
                      justifyContent="space-between"
                      alignItems={{ sm: 'center' }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1,
                            bgcolor: '#ecfeff',
                            color: appleColors.cyan,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <CloudUploadOutlined fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>
                            Project documents
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {aiDocumentFiles.length
                              ? `${aiDocumentFiles.length} attached, ${selectedAiDocumentCount} shared temporarily with AI`
                              : 'Attach briefs, screenshots, notes, or specs'}
                          </Typography>
                        </Box>
                      </Stack>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadOutlined />}
                        sx={{ minHeight: 40, flexShrink: 0 }}
                      >
                        Add files
                        <input
                          hidden
                          multiple
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.json,.zip,image/png,image/jpeg,image/webp"
                          onChange={event => {
                            const files = Array.from(event.target.files || []).map(file => ({
                              file,
                              shareWithAi: true,
                            }));
                            setAiDocumentFiles(current => [...current, ...files]);
                            resetAiAnalysis();
                            event.target.value = '';
                          }}
                        />
                      </Button>
                    </Stack>
                    {aiDocumentFiles.length > 0 && (
                      <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                        {aiDocumentFiles.map((item, index) => (
                          <Box
                            key={`${item.file.name}-${index}`}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto auto' },
                              gap: 1,
                              alignItems: 'center',
                              p: 1,
                              borderRadius: 1,
                              border: '1px solid #edf2f7',
                              bgcolor: item.shareWithAi ? '#f8f7ff' : '#fff',
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 800,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.file.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {(item.file.size / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                            </Box>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={item.shareWithAi}
                                  onChange={event => {
                                    setAiDocumentFiles(current =>
                                      current.map((doc, docIndex) =>
                                        docIndex === index
                                          ? { ...doc, shareWithAi: event.target.checked }
                                          : doc
                                      )
                                    );
                                    resetAiAnalysis();
                                  }}
                                />
                              }
                              label="Share with AI"
                              sx={{
                                m: 0,
                                '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 800 },
                              }}
                            />
                            <Button
                              variant="text"
                              color="inherit"
                              onClick={() => {
                                setAiDocumentFiles(current =>
                                  current.filter((_, docIndex) => docIndex !== index)
                                );
                                resetAiAnalysis();
                              }}
                              sx={{ minHeight: 34, minWidth: 72 }}
                            >
                              Remove
                            </Button>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                  {aiAnalysis && (
                    <Alert severity={aiAnalysis.aiApplied ? 'success' : 'info'}>
                      {aiAnalysis.aiApplied
                        ? 'AI analysis is ready. Review the generated attributes, then create the productization project through the action flow.'
                        : 'Analysis used deterministic fallback because AI did not return the expected strict JSON contract.'}
                    </Alert>
                  )}
                  {aiAnalysis && (
                    <Box
                      sx={{
                        border: '1px solid #dfe7f5',
                        borderRadius: 1,
                        bgcolor: '#fff',
                        p: 1.5,
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          justifyContent="space-between"
                          alignItems={{ sm: 'center' }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>
                            AI project attributes
                          </Typography>
                          <DotLabel
                            label={
                              aiAnalysis.intent.analysisProviderRequestId
                                ? 'LoomAI analyzed'
                                : 'Fallback analysis'
                            }
                            color={
                              aiAnalysis.intent.analysisProviderRequestId
                                ? appleColors.green
                                : appleColors.amber
                            }
                          />
                        </Stack>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: 1,
                          }}
                        >
                          {aiProjectAttributes.map(item => (
                            <AiAttributeCard
                              key={item.label}
                              label={item.label}
                              value={item.value}
                              source={item.source}
                              accent={item.accent}
                              wide={item.wide}
                            />
                          ))}
                        </Box>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: 'repeat(3, 1fr)' },
                            gap: 1,
                          }}
                        >
                          <AiReviewList
                            title="Core capabilities"
                            items={aiAnalysis.analysis.coreCapabilities ?? []}
                            empty="No capabilities extracted yet."
                            accent={appleColors.purple}
                          />
                          <AiReviewList
                            title="Business outcomes"
                            items={aiAnalysis.analysis.businessOutcomes ?? []}
                            empty="No outcomes extracted yet."
                            accent={appleColors.green}
                          />
                          <AiReviewList
                            title="Launch goals"
                            items={aiAnalysis.analysis.readinessGoals ?? []}
                            empty="No launch goals extracted yet."
                            accent={appleColors.blue}
                          />
                          <AiReviewList
                            title="Scanner focus"
                            items={aiAnalysis.analysis.scannerFocusAreas ?? []}
                            empty="No scanner focus returned."
                            accent={appleColors.red}
                          />
                          <AiReviewList
                            title="Source insights"
                            items={aiAnalysis.analysis.sourceInsights ?? []}
                            empty="No source insights returned."
                            accent={appleColors.cyan}
                          />
                        </Box>
                        <AiServicePlanReview
                          recommendations={reviewedServiceRecommendations}
                          selectedCodes={selectedServiceCodes}
                          onToggle={toggleServiceRecommendation}
                          onMove={moveServiceRecommendation}
                        />
                        <AiOpportunityDiscoveryPanel report={aiAnalysis.aiOpportunityReport} />
                        <LoomAIOverviewPanel overview={aiAnalysis.loomaiIntegrationOverview} />
                        {missingCatalogCoverage.length > 0 && (
                          <Box
                            sx={{
                              p: 1.2,
                              borderRadius: 1,
                              border: `1px solid ${appleColors.amber}28`,
                              bgcolor: `${appleColors.amber}08`,
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 950 }}>
                              Service gaps
                            </Typography>
                            <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                              {missingCatalogCoverage.slice(0, 4).map(item => (
                                <Typography
                                  key={`${item.need}-${item.reason}`}
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block', lineHeight: 1.5 }}
                                >
                                  <Box component="strong" sx={{ color: appleColors.ink }}>
                                    {item.need}
                                  </Box>
                                  {item.reason ? ` - ${item.reason}` : ''}
                                  {item.suggestedCatalogAction
                                    ? ` (${item.suggestedCatalogAction})`
                                    : ''}
                                </Typography>
                              ))}
                            </Stack>
                          </Box>
                        )}
                        <AiReviewList
                          title="Suggested next steps"
                          items={aiAnalysis.analysis.suggestedNextSteps ?? []}
                          empty="No next steps returned."
                          accent={appleColors.green}
                        />
                        {aiDocumentUsage.length > 0 && (
                          <AiDocumentUsageList usage={aiDocumentUsage} />
                        )}
                        {aiDocumentUsageMissing && (
                          <Alert severity="warning" sx={{ borderRadius: 1 }}>
                            LoomAI analyzed the brief but did not return document usage evidence.
                            Re-run analysis or treat the uploaded file as not proven for this
                            creation decision.
                          </Alert>
                        )}
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: 1,
                          }}
                        >
                          <AiReviewList
                            title="Assumptions"
                            items={aiAnalysis.analysis.assumptions}
                            empty="No assumptions returned."
                            accent={appleColors.blue}
                          />
                          <AiReviewList
                            title="Missing proof"
                            items={aiAnalysis.analysis.missingEvidence}
                            empty="No missing proof returned."
                            accent={appleColors.amber}
                          />
                        </Box>
                      </Stack>
                    </Box>
                  )}
                </Stack>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid #e4e9f3',
                    bgcolor: '#fff',
                    boxShadow: '0 20px 48px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1,
                        bgcolor: '#f0efff',
                        color: appleColors.purple,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <AutoAwesomeOutlined />
                    </Box>
                    <Box>
                      <Typography variant="h4">Create from conversation</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
                        ProdUS stores the product profile and keeps uploaded documents private. Only
                        selected files receive short-lived AI access for this creation run.
                      </Typography>
                    </Box>
                    <Divider />
                    <Stack spacing={0.8}>
                      <DotLabel
                        label={`${aiDocumentFiles.length} private attachments`}
                        color={appleColors.blue}
                      />
                      <DotLabel
                        label={`${selectedAiDocumentCount} temporary AI shares`}
                        color={selectedAiDocumentCount ? appleColors.purple : appleColors.muted}
                      />
                      {aiAnalysis && (
                        <>
                          <DotLabel
                            label={`${aiOpenedDocumentCount} opened through temporary URL`}
                            color={aiOpenedDocumentCount ? appleColors.green : appleColors.amber}
                          />
                          {aiNotUsedDocumentCount > 0 && (
                          <DotLabel
                            label={`${aiNotUsedDocumentCount} not used`}
                            color={appleColors.red}
                          />
                          )}
                          {aiDocumentUsageMissing && (
                            <DotLabel label="Document evidence missing" color={appleColors.red} />
                          )}
                        </>
                      )}
                      <DotLabel label="No document indexing" color={appleColors.green} />
                      {aiAnalysis && (
                        <DotLabel
                          label={`${selectedAiServiceCount} service modules selected`}
                          color={selectedAiServiceCount ? appleColors.green : appleColors.amber}
                        />
                      )}
                      <DotLabel
                        label={
                          fullAnalysisMode
                            ? aiAnalysis?.aiOpportunityReport
                              ? `${aiOpportunityCount} AI opportunities`
                              : 'Full analysis + AI'
                            : aiAnalysis?.aiOpportunityReport
                              ? `${aiOpportunityCount} AI opportunities`
                              : 'AI integration only'
                        }
                        color={
                          fullAnalysisMode
                            ? aiAnalysis?.aiOpportunityReport
                              ? appleColors.green
                              : appleColors.purple
                            : aiAnalysis?.aiOpportunityReport
                              ? appleColors.green
                              : appleColors.cyan
                        }
                      />
                    </Stack>
                    <Box
                      sx={{
                        borderRadius: 1,
                        border: '1px solid #dfe7f5',
                        bgcolor: '#fbfdff',
                        p: 1.25,
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Stack direction="row" spacing={0.8} alignItems="center">
                            <RuleOutlined sx={{ color: appleColors.purple, fontSize: 19 }} />
                            <Typography variant="body2" sx={{ fontWeight: 900 }}>
                              AI journey validation
                            </Typography>
                          </Stack>
                          <DotLabel
                            label={
                              aiBlockedValidationCount
                                ? `${aiBlockedValidationCount} blocked`
                                : aiAttentionValidationCount
                                  ? `${aiAttentionValidationCount} review`
                                  : 'Ready'
                            }
                            color={
                              aiBlockedValidationCount
                                ? appleColors.red
                                : aiAttentionValidationCount
                                  ? appleColors.amber
                                  : appleColors.green
                            }
                          />
                        </Stack>
                        <Stack spacing={0.75}>
                          {aiValidationItems.map(item => (
                            <ValidationRow
                              key={item.title}
                              title={item.title}
                              detail={item.detail}
                              state={item.state}
                            />
                          ))}
                        </Stack>
                      </Stack>
                    </Box>
                    {aiActionErrorMessage && (
                      <Alert
                        severity="error"
                        icon={<ErrorOutlineOutlined />}
                        sx={{ borderRadius: 1 }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>
                          AI action validation failed
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.45 }}>
                          {aiActionErrorMessage}
                        </Typography>
                        {aiActionErrorCode && (
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', mt: 0.5, fontWeight: 800, opacity: 0.8 }}
                          >
                            Code: {aiActionErrorCode}
                          </Typography>
                        )}
                      </Alert>
                    )}
                    <ProjectAnalysisChatPanel
                      disabled={!aiAnalysis || aiBusy}
                      requestContext={analysisChatContext()}
                      conversationId={aiAnalysis ? `project-analysis-${aiAnalysis.intent.id}` : 'project-analysis-draft'}
                    />
                    {aiDocumentProofGap && (
                      <Alert severity={aiDocumentProofRequired ? 'warning' : 'info'} sx={{ borderRadius: 1 }}>
                        {aiDocumentProofRequired
                          ? 'LoomAI did not prove it opened every AI-shared document. Re-run analysis after document access is available, or unshare the file from AI before creating this project.'
                          : 'LoomAI did not return formal proof for every AI-shared document. Creation is still allowed; ProdUS will keep the file attached privately and store this evidence gap for follow-up.'}
                      </Alert>
                    )}
                    <Button
                      variant={aiAnalysis ? 'outlined' : 'contained'}
                      size="large"
                      startIcon={<AutoAwesomeOutlined />}
                      disabled={!aiBrief.trim() || aiBusy}
                      onClick={() => analyzeProductWithAI.mutate()}
                      sx={{ minHeight: 48, mt: 0.5 }}
                    >
                      {analyzeProductWithAI.isPending
                        ? 'Analyzing...'
                        : aiAnalysis
                          ? `Re-run ${fullAnalysisMode ? 'Full' : 'AI Integration'} Analysis`
                          : fullAnalysisMode
                            ? 'Run Full AI Analysis'
                            : 'Run AI Integration Analysis'}
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardOutlined />}
                      disabled={!canCreateWithAi}
                      onClick={() => createProductFromAIAction.mutate()}
                      sx={{ minHeight: 48 }}
                    >
                      {createProductFromAIAction.isPending
                        ? 'Creating project...'
                        : canCreateWithAi
                          ? 'Create Project with AI Action'
                          : 'Resolve Validation First'}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Stack>
          </Surface>
          )}

          <ProductOnboardingManualProfilePanel
            values={form.values}
            isCreating={createProduct.isPending}
            onValueChange={form.setValue}
            onSubmit={submit}
          />
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle
              title="What Happens Next"
              action={<PsychologyAltOutlined sx={{ color: appleColors.purple }} />}
            />
            <Stack spacing={1.5}>
              {[
                'The product becomes the selected owner context.',
                'Private documents remain attached to that product.',
                'AI-selected document access expires after a short window.',
                'You can edit the product normally after creation.',
              ].map(item => (
                <Stack key={item} direction="row" spacing={1.2} alignItems="flex-start">
                  <CheckCircleOutlineOutlined
                    sx={{ color: appleColors.green, fontSize: 20, mt: 0.2 }}
                  />
                  <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {item}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Surface>

          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
            <SectionTitle title="Design Principle" />
            <Typography variant="h4">Product first, pages second.</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
              Owners should not hunt across scattered pages. Each route should answer where the
              product is, what needs to happen next, and which decisions are ready.
            </Typography>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
