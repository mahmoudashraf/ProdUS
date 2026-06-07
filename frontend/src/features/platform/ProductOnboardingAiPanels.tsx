'use client';

import {
  CheckCircleOutlineOutlined,
  ErrorOutlineOutlined,
  RuleOutlined,
} from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { LoomAIMaxModeAssistant } from './LoomAIMaxModeAssistant';
import {
  DotLabel,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type {
  AiAssistedProductAnalysisResponse,
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
