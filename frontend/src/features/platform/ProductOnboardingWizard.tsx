'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AutoAwesomeOutlined,
  ArrowForwardOutlined,
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

const documentUsageMeta = (status?: string, accessMethod?: string) => {
  const normalizedStatus = (status ?? '').toUpperCase();
  const normalizedMethod = (accessMethod ?? '').toUpperCase();
  if (normalizedStatus === 'USED' && normalizedMethod === 'TEMPORARY_URL') {
    return { label: 'Opened by AI', color: appleColors.green };
  }
  if (normalizedStatus === 'FALLBACK_EXCERPT_USED') {
    return { label: 'Fallback used', color: appleColors.amber };
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
                key={`${item.fileName}-${index}`}
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

export default function ProductOnboardingWizard() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [aiBrief, setAiBrief] = useState('');
  const [aiDocumentFiles, setAiDocumentFiles] = useState<
    Array<{ file: File; shareWithAi: boolean }>
  >([]);
  const [aiAnalysis, setAiAnalysis] = useState<AiAssistedProductAnalysisResponse | null>(null);
  const form = useAdvancedForm<ProductProfilePayload>({
    initialValues,
    validationRules: {
      name: [{ type: 'required', message: 'Product name is required' }],
      summary: [{ type: 'required', message: 'Product summary is required' }],
    },
  });

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
        payload
      );
    },
    onSuccess: response => {
      setAiAnalysis(response);
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
        assumptions: aiAnalysis.analysis.assumptions,
        missingEvidence: aiAnalysis.analysis.missingEvidence,
      };
      const response = await postJson<ProductCreationActionResponse, Record<string, unknown>>(
        `/products/ai-assisted/intents/${aiAnalysis.intent.id}/create`,
        actionPayload
      );
      await putJson<
        ProductizationCart,
        { productProfileId: string; title: string; businessGoal: string }
      >('/productization-cart/current', {
        productProfileId: response.product.id,
        title: `${response.product.name} productization draft`,
        businessGoal: response.product.summary || aiBrief,
      });
      return response;
    },
    onSuccess: async response => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      router.push(`/products/${response.product.id}`);
    },
  });

  const submit = form.handleSubmit(() => createProduct.mutate());
  const selectedAiDocumentCount = aiDocumentFiles.filter(item => item.shareWithAi).length;
  const aiDocumentUsage = aiAnalysis?.analysis.documentUsage ?? [];
  const aiOpenedDocumentCount = aiDocumentUsage.filter(
    item => item.status === 'USED' && item.accessMethod === 'TEMPORARY_URL'
  ).length;
  const aiFallbackDocumentCount = aiDocumentUsage.filter(
    item => item.status === 'FALLBACK_EXCERPT_USED'
  ).length;
  const aiNotUsedDocumentCount = aiDocumentUsage.filter(item => item.status === 'NOT_USED').length;
  const aiDocumentUsageMissing =
    Boolean(aiAnalysis?.aiSharedDocuments.length) && aiDocumentUsage.length === 0;
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
          ? `${compactCount(aiOpenedDocumentCount, 'document')} opened by AI through temporary URL; ${compactCount(aiFallbackDocumentCount, 'document')} used fallback excerpt; ${compactCount(aiNotUsedDocumentCount, 'document')} not used.`
          : `${compactCount(aiAnalysis.aiSharedDocuments.length, 'selected document')} received temporary AI access. LoomAI did not return per-file usage evidence.`
        : aiDocumentFiles.length
          ? `${compactCount(aiDocumentFiles.length, 'private attachment')} will stay with the project; ${compactCount(selectedAiDocumentCount, 'file')} ${selectedAiDocumentCount === 1 ? 'is' : 'are'} shared with AI temporarily.`
          : 'No documents attached. You can still create the project from the conversation and links.',
      state:
        aiDocumentFiles.length > 0 && selectedAiDocumentCount === 0
          ? 'attention'
          : aiDocumentUsageMissing || aiNotUsedDocumentCount > 0 || aiFallbackDocumentCount > 0
            ? 'attention'
            : 'ready',
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
  const canCreateWithAi = Boolean(aiAnalysis) && productNameReady && productSummaryReady && !aiBusy;

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
                  <TextField
                    label="Tell ProdUS what you want to productize"
                    value={aiBrief}
                    onChange={event => {
                      setAiBrief(event.target.value);
                      setAiAnalysis(null);
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
                            setAiAnalysis(null);
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
                                    setAiAnalysis(null);
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
                                setAiAnalysis(null);
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
                          {(aiFallbackDocumentCount > 0 || aiNotUsedDocumentCount > 0) && (
                            <DotLabel
                              label={`${aiFallbackDocumentCount} fallback, ${aiNotUsedDocumentCount} not used`}
                              color={aiNotUsedDocumentCount ? appleColors.red : appleColors.amber}
                            />
                          )}
                          {aiDocumentUsageMissing && (
                            <DotLabel label="Document evidence missing" color={appleColors.red} />
                          )}
                        </>
                      )}
                      <DotLabel label="No document indexing" color={appleColors.green} />
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
                          ? 'Re-run AI Analysis'
                          : 'Analyze with AI'}
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
