'use client';

import { AutoAwesomeOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { DotLabel, PastelChip, appleColors, formatLabel } from './PlatformComponents';
import type { AiOpportunityReport } from './types';

export function AiOpportunityDiscoveryPanel({
  report,
}: {
  report: AiOpportunityReport | undefined;
}) {
  if (!report) return null;

  const useCases = report.useCases ?? [];
  const hasLiveResult = report.live === true;
  const hasUsableOpportunities = hasLiveResult && useCases.length > 0;
  return (
    <Box
      sx={{ p: 1.5, borderRadius: 1, border: `1px solid ${appleColors.purple}24`, bgcolor: '#fff' }}
    >
      <Stack spacing={1.4}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ sm: 'flex-start' }}
        >
          <Box>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <AutoAwesomeOutlined sx={{ color: appleColors.purple }} />
              <Typography variant="h4">Where AI could make this product better</Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.6 }}>
              {report.summary ||
                'Product-specific opportunities grounded in the context ProdUS inspected.'}
            </Typography>
          </Box>
          <PastelChip
            label={hasLiveResult ? 'LoomAI analyzed' : 'AI result failed'}
            accent={hasLiveResult ? appleColors.green : appleColors.red}
            bg={hasLiveResult ? '#e7f8ee' : '#ffecef'}
          />
        </Stack>

        {!hasLiveResult && (
          <Alert severity="warning" sx={{ borderRadius: 1 }}>
            LoomAI did not return usable opportunities for this run. ProdUS is showing the failed AI
            result instead of template opportunity cards.
          </Alert>
        )}

        {hasLiveResult && !useCases.length && (
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            LoomAI returned a live result, but it did not include owner-ready AI opportunity cards.
          </Alert>
        )}

        {hasUsableOpportunities && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
              gap: 1,
            }}
          >
            {useCases.slice(0, 3).map(useCase => (
              <Box
                key={useCase.title}
                sx={{ p: 1.25, borderRadius: 1, border: '1px solid #e8ddff', bgcolor: '#fbfaff' }}
              >
                <Stack spacing={0.85}>
                  <Typography variant="body2" sx={{ fontWeight: 950, lineHeight: 1.35 }}>
                    {useCase.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {useCase.userValue ||
                      useCase.businessValue ||
                      useCase.workflow ||
                      'Useful AI opportunity identified from the current product context.'}
                  </Typography>
                  <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                    {useCase.workflow && (
                      <DotLabel
                        label={`Attaches to: ${useCase.workflow}`}
                        color={appleColors.cyan}
                      />
                    )}
                    <DotLabel
                      label={formatLabel(useCase.priority || 'should')}
                      color={appleColors.purple}
                    />
                    <DotLabel
                      label={
                        useCase.confidence
                          ? `${Math.round(useCase.confidence * 100)}% confidence`
                          : 'Evidence grounded'
                      }
                      color={appleColors.green}
                    />
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Box>
        )}

        {hasUsableOpportunities && (
          <Box sx={{ p: 1.35, borderRadius: 1, bgcolor: '#eeedfe' }}>
            <Typography variant="body2" sx={{ color: '#26215c', fontWeight: 950 }}>
              Ready to explore one?
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: 'block', color: '#3c3489', lineHeight: 1.55, mt: 0.45 }}
            >
              LoomAI is the preferred integration partner for these opportunities. The owner can
              still choose another verified provider.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<AutoAwesomeOutlined />}
                sx={{ bgcolor: appleColors.purple, minHeight: 38 }}
              >
                Explore with LoomAI
              </Button>
              <Button variant="text" sx={{ color: '#3c3489', minHeight: 38 }}>
                See other providers
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
