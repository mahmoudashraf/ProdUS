'use client';

import NextLink from 'next/link';
import { ArrowForwardOutlined, AutoAwesomeOutlined, FactCheckOutlined, VerifiedUserOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { AICapabilityConfig } from './types';

const compactList = (value?: string) =>
  (value || '')
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');

export default function ServiceCatalogAiOptionsPanel({
  aiCapabilities,
  productName,
  setupHref,
  startPlanHref,
}: {
  aiCapabilities: AICapabilityConfig[];
  productName?: string | undefined;
  setupHref: string;
  startPlanHref?: string | undefined;
}) {
  const primaryHref = productName && startPlanHref ? startPlanHref : setupHref;
  const primaryLabel = productName ? 'Review AI fit in Planning' : 'Start AI-assisted product setup';
  const hiddenCount = Math.max(aiCapabilities.length - 6, 0);

  return (
    <Stack spacing={2}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f5fdff)' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ lg: 'center' }}>
          <Box sx={{ minWidth: 0 }}>
            <SectionTitle title="AI Integration Options" action={<AutoAwesomeOutlined sx={{ color: appleColors.cyan }} />} />
            <Typography color="text.secondary" sx={{ lineHeight: 1.7, maxWidth: 780 }}>
              Use this when the product needs AI to explain, search, recommend, summarize, or guide a workflow. ProdUS keeps AI suggestions reviewable, scoped to approved product context, and confirmed by the owner before work starts.
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              <PastelChip label={`${aiCapabilities.length} options`} accent={appleColors.cyan} bg="#e4f9fd" />
              <PastelChip label="Owner confirmed" accent={appleColors.green} bg="#e7f8ee" />
              <PastelChip label={productName ? `For ${productName}` : 'Before product creation'} accent={productName ? appleColors.green : appleColors.purple} bg={productName ? '#e7f8ee' : '#f1efff'} />
            </Stack>
          </Box>
          <Button
            component={NextLink}
            href={primaryHref}
            variant="contained"
            endIcon={<ArrowForwardOutlined />}
            sx={{ minHeight: 44, alignSelf: { xs: 'stretch', lg: 'center' }, whiteSpace: 'normal' }}
          >
            {primaryLabel}
          </Button>
        </Stack>
      </Surface>

      {aiCapabilities.length ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          {aiCapabilities.slice(0, 6).map((capability) => {
            const sourceSummary = compactList(capability.allowedSources);
            const guardrailSummary = compactList(capability.forbiddenClaims);
            return (
              <Surface key={capability.id} sx={{ boxShadow: 'none', background: '#fff', minHeight: 210 }}>
                <Stack spacing={1.25} sx={{ height: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h4" sx={{ overflowWrap: 'anywhere' }}>
                        {capability.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>
                        {capability.description || 'AI support option prepared for a governed product workflow.'}
                      </Typography>
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        minWidth: capability.enabled ? 58 : 78,
                        px: 1,
                        py: 0.45,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: capability.enabled ? '#15a46a33' : '#0ea5bd33',
                        bgcolor: capability.enabled ? '#e7f8ee' : '#e4f9fd',
                        color: capability.enabled ? appleColors.green : appleColors.cyan,
                        flexShrink: 0,
                        fontSize: 12,
                        fontWeight: 900,
                        lineHeight: 1.2,
                        textAlign: 'center',
                      }}
                    >
                      {capability.enabled ? 'Ready' : 'Prepared'}
                    </Box>
                  </Stack>

                  <Stack spacing={0.85} sx={{ mt: 'auto' }}>
                    <Stack direction="row" spacing={0.75} alignItems="flex-start">
                      <FactCheckOutlined sx={{ color: appleColors.blue, fontSize: 20, mt: 0.1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                        {sourceSummary ? `Uses approved context such as ${sourceSummary}.` : `Uses approved product context before making suggestions.`}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="flex-start">
                      <VerifiedUserOutlined sx={{ color: appleColors.green, fontSize: 20, mt: 0.1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                        {capability.humanReviewRequired
                          ? 'Requires human review before product or delivery actions.'
                          : guardrailSummary
                            ? `Guardrail: ${guardrailSummary}.`
                            : 'Keeps generated guidance separate from owner approval.'}
                      </Typography>
                    </Stack>
                    <PastelChip label={formatLabel(capability.capabilityType)} accent={appleColors.purple} bg="#f1efff" />
                  </Stack>
                </Stack>
              </Surface>
            );
          })}
        </Box>
      ) : (
        <EmptyState label="No AI integration options are configured yet." />
      )}

      {hiddenCount > 0 && (
        <Surface sx={{ boxShadow: 'none', background: '#fbfdff' }}>
          <Typography variant="body2" color="text.secondary">
            {hiddenCount} more AI options are available in the governed catalog. Start with the clearest fit, then refine the plan after product setup.
          </Typography>
        </Surface>
      )}
    </Stack>
  );
}
