'use client';

import {
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  CheckCircleOutlineOutlined,
  ErrorOutlineOutlined,
  RuleOutlined,
} from '@mui/icons-material';
import { Box, Button, Checkbox, Stack, Typography } from '@mui/material';
import { LoomAIMaxModeAssistant } from './LoomAIMaxModeAssistant';
import {
  DotLabel,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type {
  AiAssistedProductAnalysisResponse,
  LoomAIIntegrationOverview,
  ServiceModuleRecommendation,
} from './types';

export type ValidationState = 'ready' | 'attention' | 'blocked';

const analysisQuickQuestions = [
  'What is the strongest productization path?',
  'Which service should I add first?',
  'What evidence is missing before I create the project?',
  'Did AI use my document and what did it learn?',
];

const validationMeta: Record<
  ValidationState,
  { label: string; color: string; background: string }
> = {
  ready: { label: 'Ready', color: appleColors.green, background: '#f0fdf6' },
  attention: { label: 'Review', color: appleColors.amber, background: '#fff8eb' },
  blocked: { label: 'Needed', color: appleColors.red, background: '#fff3f4' },
};

const cleanText = (value?: string | null) => value?.trim() ?? '';

export function ValidationRow({
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

export function AiAttributeCard({
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

export function AiReviewList({
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

export function AiServicePlanReview({
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

export function LoomAIOverviewPanel({
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

export function AiDocumentUsageList({
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

export function ProjectAnalysisChatPanel({
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
