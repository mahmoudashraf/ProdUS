'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AutoAwesomeOutlined,
  ArrowForwardOutlined,
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  CheckCircleOutlineOutlined,
  CloudUploadOutlined,
  ErrorOutlineOutlined,
  Inventory2Outlined,
  LinkOutlined,
  PsychologyAltOutlined,
  RuleOutlined,
  SecurityOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import { LoomAIMaxModeAssistant } from './LoomAIMaxModeAssistant';
import { postFormData, postJson, putJson } from './api';
import {
  DotLabel,
  PageHeader,
  QueryState,
  SaveButton,
  SectionTitle,
  Surface,
  TextInput,
  appleColors,
  categoryPalette,
  errorMessageFromUnknown,
  formatLabel,
} from './PlatformComponents';
import {
  AiAssistedProductAnalysisResponse,
  AiOpportunityReport,
  LoomAIIntegrationOverview,
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

const stages: ProductProfile['businessStage'][] = [
  'IDEA',
  'PROTOTYPE',
  'VALIDATED',
  'LIVE',
  'SCALING',
];

const initialValues: ProductProfilePayload = {
  name: '',
  summary: '',
  businessStage: 'PROTOTYPE',
  techStack: '',
  productUrl: '',
  repositoryUrl: '',
  riskProfile: '',
};

const setupSteps = [
  {
    title: 'Product context',
    detail: 'Name the product and explain what outcome production readiness should unlock.',
    icon: Inventory2Outlined,
    accent: appleColors.purple,
  },
  {
    title: 'Evidence links',
    detail: 'Attach product and repository URLs so diagnosis and delivery work can stay grounded.',
    icon: LinkOutlined,
    accent: appleColors.cyan,
  },
  {
    title: 'Risks and constraints',
    detail: 'Capture known blockers early so the created project starts with grounded analysis.',
    icon: SecurityOutlined,
    accent: appleColors.amber,
  },
];

const analysisQuickQuestions = [
  'What is the strongest productization path?',
  'Which service should I add first?',
  'What evidence is missing before I create the project?',
  'Did AI use my document and what did it learn?',
];

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

type ValidationState = 'ready' | 'attention' | 'blocked';

const validationMeta: Record<
  ValidationState,
  { label: string; color: string; background: string }
> = {
  ready: { label: 'Ready', color: appleColors.green, background: '#f0fdf6' },
  attention: { label: 'Review', color: appleColors.amber, background: '#fff8eb' },
  blocked: { label: 'Needed', color: appleColors.red, background: '#fff3f4' },
};

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

const cleanText = (value?: string | null) => value?.trim() ?? '';

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

function ValidationRow({
  title,
  detail,
  state,
}: {
  title: string;
  detail: string;
  state: ValidationState;
}) {
  const meta = validationMeta[state];
  const Icon =
    state === 'ready'
      ? CheckCircleOutlineOutlined
      : state === 'attention'
        ? ErrorOutlineOutlined
        : RuleOutlined;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        gap: 1,
        alignItems: 'start',
        p: 1,
        borderRadius: 1,
        border: `1px solid ${meta.color}24`,
        bgcolor: meta.background,
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1,
          display: 'grid',
          placeItems: 'center',
          color: meta.color,
          bgcolor: '#fff',
          border: `1px solid ${meta.color}20`,
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 900 }}>
          {title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', lineHeight: 1.45 }}
        >
          {detail}
        </Typography>
      </Box>
      <Typography
        variant="caption"
        sx={{
          px: 0.85,
          py: 0.35,
          borderRadius: 1,
          color: meta.color,
          bgcolor: '#fff',
          border: `1px solid ${meta.color}24`,
          fontWeight: 900,
          whiteSpace: 'nowrap',
        }}
      >
        {meta.label}
      </Typography>
    </Box>
  );
}

function AiAttributeCard({
  label,
  value,
  source,
  accent,
  wide = false,
}: {
  label: string;
  value?: string | null | undefined;
  source: string;
  accent: string;
  wide?: boolean | undefined;
}) {
  const hasValue = cleanText(value).length > 0;

  return (
    <Box
      sx={{
        minWidth: 0,
        gridColumn: wide ? { xs: 'auto', md: 'span 2' } : 'auto',
        p: 1.2,
        borderRadius: 1,
        border: `1px solid ${hasValue ? `${accent}30` : '#e4e9f3'}`,
        bgcolor: hasValue ? `${accent}08` : '#f8fafc',
      }}
    >
      <Stack spacing={0.7}>
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
            {label}
          </Typography>
          <DotLabel
            label={hasValue ? source : 'Needs input'}
            color={hasValue ? accent : '#94a3b8'}
          />
        </Stack>
        <Typography
          variant={wide ? 'body1' : 'body2'}
          sx={{
            fontWeight: wide ? 700 : 800,
            color: hasValue ? 'text.primary' : 'text.secondary',
            lineHeight: 1.5,
            overflowWrap: 'anywhere',
            whiteSpace: wide ? 'pre-wrap' : 'normal',
          }}
        >
          {hasValue ? value : 'Not provided yet'}
        </Typography>
      </Stack>
    </Box>
  );
}

function AiReviewList({
  title,
  items,
  empty,
  accent,
}: {
  title: string;
  items: string[];
  empty: string;
  accent: string;
}) {
  return (
    <Box
      sx={{
        p: 1.2,
        borderRadius: 1,
        border: `1px solid ${accent}24`,
        bgcolor: `${accent}08`,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 900 }}>
        {title}
      </Typography>
      <Stack spacing={0.5} sx={{ mt: 0.75 }}>
        {items.length > 0 ? (
          items.slice(0, 4).map(item => <DotLabel key={item} label={item} color={accent} />)
        ) : (
          <Typography variant="caption" color="text.secondary">
            {empty}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

const servicePriorityColor = (priority?: string) => {
  const normalized = (priority ?? '').toUpperCase();
  if (normalized === 'MUST') return appleColors.red;
  if (normalized === 'SHOULD') return appleColors.blue;
  if (normalized === 'COULD') return appleColors.green;
  return appleColors.muted;
};

function AiServicePlanReview({
  recommendations,
  selectedCodes,
  onToggle,
  onMove,
}: {
  recommendations: ServiceModuleRecommendation[];
  selectedCodes: string[];
  onToggle: (moduleCode: string) => void;
  onMove: (moduleCode: string, direction: -1 | 1) => void;
}) {
  if (!recommendations.length) {
    return (
      <AiReviewList
        title="AI selected lifecycle services"
        items={[]}
        empty="No catalog-backed services returned."
        accent={appleColors.amber}
      />
    );
  }

  return (
    <Box
      sx={{
        p: 1.2,
        borderRadius: 1,
        border: '1px solid #dfe7f5',
        background: 'linear-gradient(145deg, #ffffff, #fbfbff)',
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 950 }}>
              AI selected lifecycle services
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Included services are persisted when you create the project.
            </Typography>
          </Box>
          <DotLabel
            label={`${selectedCodes.length}/${recommendations.length} included`}
            color={selectedCodes.length ? appleColors.green : appleColors.amber}
          />
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          {recommendations.map((recommendation, index) => {
            const moduleCode = recommendation.moduleCode;
            const selected = selectedCodes.includes(moduleCode);
            const accent = servicePriorityColor(recommendation.priority);
            return (
              <Box
                key={`${moduleCode}-${index}`}
                sx={{
                  p: 1.1,
                  borderRadius: 1,
                  border: `1px solid ${selected ? `${accent}36` : '#e4e9f3'}`,
                  bgcolor: selected ? `${accent}07` : '#f8fafc',
                  minWidth: 0,
                }}
              >
                <Stack spacing={0.85}>
                  <Stack direction="row" spacing={0.8} alignItems="flex-start">
                    <Checkbox
                      checked={selected}
                      onChange={() => onToggle(moduleCode)}
                      sx={{ p: 0.2, mt: -0.2 }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 950 }} noWrap>
                        {recommendation.moduleName || moduleCode}
                      </Typography>
                      <Stack direction="row" spacing={0.6} sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                        <DotLabel label={moduleCode} color={accent} />
                        {recommendation.categorySlug && (
                          <DotLabel label={formatLabel(recommendation.categorySlug)} color={appleColors.cyan} />
                        )}
                        <DotLabel label={recommendation.priority || 'SHOULD'} color={accent} />
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.3}>
                      <Button
                        variant="text"
                        disabled={index === 0}
                        onClick={() => onMove(moduleCode, -1)}
                        sx={{ minWidth: 34, width: 34, height: 34, p: 0 }}
                        aria-label={`Move ${recommendation.moduleName || moduleCode} earlier`}
                      >
                        <ArrowUpwardOutlined sx={{ fontSize: 17 }} />
                      </Button>
                      <Button
                        variant="text"
                        disabled={index === recommendations.length - 1}
                        onClick={() => onMove(moduleCode, 1)}
                        sx={{ minWidth: 34, width: 34, height: 34, p: 0 }}
                        aria-label={`Move ${recommendation.moduleName || moduleCode} later`}
                      >
                        <ArrowDownwardOutlined sx={{ fontSize: 17 }} />
                      </Button>
                    </Stack>
                  </Stack>
                  {recommendation.reason && (
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      {recommendation.reason}
                    </Typography>
                  )}
                  {recommendation.expectedOutcome && (
                    <Typography variant="caption" sx={{ color: appleColors.green, fontWeight: 800 }}>
                      {recommendation.expectedOutcome}
                    </Typography>
                  )}
                  {recommendation.evidenceBasis?.length ? (
                    <Stack spacing={0.35}>
                      {recommendation.evidenceBasis.slice(0, 2).map(item => (
                        <DotLabel key={item} label={item} color={appleColors.purple} />
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Stack>
    </Box>
  );
}

function AiOpportunityPanel({
  report,
}: {
  report: AiOpportunityReport | undefined;
}) {
  if (!report) return null;
  const useCases = report.useCases ?? [];
  const score = Math.round((report.opportunityScore ?? 0) * 100);
  return (
    <Box
      sx={{
        p: 1.4,
        borderRadius: 1,
        border: `1px solid ${appleColors.purple}24`,
        background: 'linear-gradient(145deg, #ffffff 0%, #f7f4ff 100%)',
      }}
    >
      <Stack spacing={1.2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 950 }}>
              AI integration opportunities
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              {report.summary || 'LoomAI mapped where AI can add useful productization support.'}
            </Typography>
          </Box>
          <DotLabel
            label={report.live ? `LoomAI ${score || 'ready'}%` : `Prepared ${score || 'ready'}%`}
            color={report.live ? appleColors.green : appleColors.amber}
          />
        </Stack>
        {report.strategicRationale && (
          <Typography variant="caption" sx={{ color: appleColors.ink, fontWeight: 800, lineHeight: 1.55 }}>
            {report.strategicRationale}
          </Typography>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          {useCases.slice(0, 6).map(useCase => (
            <Box
              key={useCase.title}
              sx={{
                p: 1,
                borderRadius: 1,
                border: '1px solid #e8ddff',
                bgcolor: '#fff',
                minWidth: 0,
              }}
            >
              <Stack spacing={0.7}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 950, lineHeight: 1.25 }}>
                    {useCase.title}
                  </Typography>
                  <DotLabel label={useCase.priority || 'SHOULD'} color={servicePriorityColor(useCase.priority)} />
                </Stack>
                {useCase.workflow && (
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                    {useCase.workflow}
                  </Typography>
                )}
                {useCase.userValue && (
                  <Typography variant="caption" sx={{ color: appleColors.green, fontWeight: 800, lineHeight: 1.45 }}>
                    {useCase.userValue}
                  </Typography>
                )}
                {(useCase.loomaiCapability || useCase.loomaiCapabilityCode) && (
                  <DotLabel
                    label={useCase.loomaiCapabilityCode
                      ? `${useCase.loomaiCapabilityCode}${useCase.loomaiCapability ? ` · ${useCase.loomaiCapability}` : ''}`
                      : useCase.loomaiCapability ?? ''}
                    color={appleColors.purple}
                  />
                )}
              </Stack>
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 1,
          }}
        >
          <AiReviewList
            title="Opportunity next steps"
            items={report.suggestedNextSteps ?? []}
            empty="No AI opportunity next steps returned."
            accent={appleColors.purple}
          />
          <AiReviewList
            title="Opportunity evidence"
            items={report.sourceInsights ?? []}
            empty="No opportunity evidence returned."
            accent={appleColors.cyan}
          />
        </Box>
      </Stack>
    </Box>
  );
}

function LoomAIOverviewPanel({
  overview,
}: {
  overview: LoomAIIntegrationOverview | undefined;
}) {
  if (!overview) return null;
  return (
    <Box
      sx={{
        p: 1.4,
        borderRadius: 1,
        border: `1px solid ${appleColors.cyan}24`,
        background: 'linear-gradient(145deg, #ffffff 0%, #f0fdff 100%)',
      }}
    >
      <Stack spacing={1.1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 950 }}>
              LoomAI implementation path
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              {overview.summary || 'LoomAI can support diagnosis, service planning, scanner summaries, and owner decisions.'}
            </Typography>
          </Box>
          <DotLabel label={overview.live ? 'LoomAI live' : 'Prepared'} color={overview.live ? appleColors.green : appleColors.amber} />
        </Stack>
        {overview.recommendedStartingPoint && (
          <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#fff', border: '1px solid #d9f3f8' }}>
            <Typography variant="caption" sx={{ fontWeight: 950 }}>
              Recommended start
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.4, fontWeight: 800, lineHeight: 1.45 }}>
              {overview.recommendedStartingPoint}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          <AiReviewList title="Capabilities" items={overview.capabilities ?? []} empty="No capabilities returned." accent={appleColors.purple} />
          <AiReviewList title="Implementation steps" items={overview.implementationSteps ?? []} empty="No implementation steps returned." accent={appleColors.green} />
          <AiReviewList title="Owner decisions" items={overview.ownerDecisions ?? []} empty="No owner decisions returned." accent={appleColors.amber} />
        </Box>
      </Stack>
    </Box>
  );
}

const documentUsageMeta = (status?: string, accessMethod?: string) => {
  const normalizedStatus = (status ?? '').toUpperCase();
  const normalizedMethod = (accessMethod ?? '').toUpperCase();
  if (normalizedStatus === 'USED' && normalizedMethod === 'TEMPORARY_URL') {
    return { label: 'Opened by AI', color: appleColors.green };
  }
  if (normalizedStatus === 'USED') {
    return { label: 'Used', color: appleColors.green };
  }
  return { label: 'Not used', color: appleColors.red };
};

function AiDocumentUsageList({
  usage,
}: {
  usage: NonNullable<AiAssistedProductAnalysisResponse['analysis']['documentUsage']>;
}) {
  return (
    <Box
      sx={{
        p: 1.2,
        borderRadius: 1,
        border: '1px solid #dfe7f5',
        background: 'linear-gradient(145deg, #fff, #f8fbff)',
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Typography variant="caption" sx={{ fontWeight: 900 }}>
            Document use evidence
          </Typography>
          <DotLabel label={`${usage.length} reported`} color={appleColors.purple} />
        </Stack>
        <Stack spacing={0.75}>
          {usage.map((item, index) => {
            const meta = documentUsageMeta(item.status, item.accessMethod);
            const evidence = item.evidence ?? [];
            return (
              <Box
                key={`${item.documentId || item.fileName}-${index}`}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  border: `1px solid ${meta.color}24`,
                  bgcolor: `${meta.color}08`,
                }}
              >
                <Stack spacing={0.7}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={0.75}
                    justifyContent="space-between"
                    alignItems={{ sm: 'center' }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                        {item.fileName || 'Shared document'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatLabel(item.accessMethod || 'none')}
                      </Typography>
                    </Box>
                    <DotLabel label={meta.label} color={meta.color} />
                  </Stack>
                  {evidence.length > 0 ? (
                    <Stack spacing={0.4}>
                      {evidence.slice(0, 3).map(fact => (
                        <DotLabel key={fact} label={fact} color={meta.color} />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {item.reason || 'LoomAI did not return owner-safe file evidence.'}
                    </Typography>
                  )}
                  {item.reason && evidence.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {item.reason}
                    </Typography>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
}

function ProjectAnalysisChatPanel({
  disabled,
  requestContext,
  conversationId,
}: {
  disabled: boolean;
  requestContext: Record<string, unknown>;
  conversationId: string;
}) {
  return (
    <LoomAIMaxModeAssistant
      disabled={disabled}
      requestContext={requestContext}
      conversationId={conversationId}
      mode="thinker"
      position="product_intake_analysis"
      title="Ask about this analysis"
      eyebrow="Thinker mode with read-only context"
      description="Use the LoomAI chat dock to ask about the full project analysis, selected services, document evidence, scanner focus, and the next owner decision. Chat may use read-only ProdUS context but cannot create or mutate records."
      starterPrompts={analysisQuickQuestions}
    />
  );
}

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
        recommendedServiceModules: reviewedServiceRecommendations.map((recommendation, index) => ({
          ...recommendation,
          sequence: index + 1,
          accepted: selectedServiceCodes.includes(recommendation.moduleCode),
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
        : 'Run AI analysis to extract project fields, assumptions, missing evidence, and action payload.',
      state: aiAnalysis ? (aiAnalysis.aiApplied ? 'ready' : 'attention') : 'blocked',
    },
    {
      title: 'AI opportunities',
      detail: aiAnalysis
        ? aiAnalysis.aiOpportunityReport
          ? `${compactCount(aiOpportunityCount, 'AI use case')} found and added to project creation context.`
          : 'AI opportunities were requested, but no AI opportunity report was returned.'
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
          ? `${compactCount(aiMissingEvidence.length, 'missing evidence item')} found. The project can be created, but the items should become follow-up evidence tasks.`
          : aiAssumptions.length
            ? `${compactCount(aiAssumptions.length, 'assumption')} captured for owner review. No missing evidence was flagged for creation.`
            : 'AI did not flag missing evidence for the creation step.'
        : 'AI validation notes appear after analysis.',
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
          label: 'Risks and constraints',
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
          <Surface
            sx={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 48%, #f8f7ff 100%)',
              borderColor: '#dfe7f5',
            }}
          >
            <Stack spacing={2.25}>
              <SectionTitle
                title="AI Project Creation"
                action={<DotLabel label="Owner approved" color={appleColors.purple} />}
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
                    placeholder="Describe the prototype, target users, links, risks, current blockers, and what production-ready should mean."
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
                            title="Readiness goals"
                            items={aiAnalysis.analysis.readinessGoals ?? []}
                            empty="No readiness goals extracted yet."
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
                        <AiOpportunityPanel report={aiAnalysis.aiOpportunityReport} />
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
                              Catalog coverage gaps
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
                            title="Missing evidence"
                            items={aiAnalysis.analysis.missingEvidence}
                            empty="No missing evidence returned."
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

          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f7fbff)' }}>
            <Stack spacing={2}>
              <SectionTitle
                title="Guided Setup"
                action={<DotLabel label="Owner first" color={appleColors.purple} />}
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 1.5,
                }}
              >
                {setupSteps.map((step, index) => {
                  const Icon = step.icon;
                  const palette =
                    categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                  return (
                    <Box
                      key={step.title}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: `${step.accent}33`,
                        borderTop: `3px solid ${step.accent}`,
                        background: `linear-gradient(145deg, #fff, ${palette.soft})`,
                      }}
                    >
                      <Stack spacing={1.3}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1,
                            display: 'grid',
                            placeItems: 'center',
                            color: step.accent,
                            bgcolor: `${step.accent}14`,
                          }}
                        >
                          <Icon />
                        </Box>
                        <Box>
                          <Typography variant="h4">{step.title}</Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.75, lineHeight: 1.55 }}
                          >
                            {step.detail}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            </Stack>
          </Surface>

          <Surface>
            <Box component="form" onSubmit={submit}>
              <Stack spacing={2.25}>
                <SectionTitle
                  title="Product Profile"
                  action={<Inventory2Outlined sx={{ color: appleColors.purple }} />}
                />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
                    gap: 2,
                  }}
                >
                  <TextInput
                    label="Product name"
                    value={form.values.name}
                    onChange={name => form.setValue('name', name)}
                  />
                  <TextField
                    select
                    fullWidth
                    label="Business stage"
                    value={form.values.businessStage}
                    onChange={event =>
                      form.setValue(
                        'businessStage',
                        event.target.value as ProductProfile['businessStage']
                      )
                    }
                  >
                    {stages.map(stage => (
                      <MenuItem key={stage} value={stage}>
                        {formatLabel(stage)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <TextInput
                  label="Product outcome"
                  value={form.values.summary}
                  onChange={summary => form.setValue('summary', summary)}
                  multiline
                />
                <TextInput
                  label="Tech stack"
                  value={form.values.techStack}
                  onChange={techStack => form.setValue('techStack', techStack)}
                />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <TextInput
                    label="Product URL"
                    value={form.values.productUrl}
                    onChange={productUrl => form.setValue('productUrl', productUrl)}
                  />
                  <TextInput
                    label="Repository URL"
                    value={form.values.repositoryUrl}
                    onChange={repositoryUrl => form.setValue('repositoryUrl', repositoryUrl)}
                  />
                </Box>
                <TextInput
                  label="Known risks or constraints"
                  value={form.values.riskProfile}
                  onChange={riskProfile => form.setValue('riskProfile', riskProfile)}
                  multiline
                />
                <SaveButton
                  disabled={!form.values.name || !form.values.summary || createProduct.isPending}
                  label={createProduct.isPending ? 'Creating product...' : 'Create product'}
                  endIcon={<ArrowForwardOutlined />}
                />
              </Stack>
            </Box>
          </Surface>
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
