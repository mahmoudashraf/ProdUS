'use client';

import NextLink from 'next/link';
import { ArrowForwardOutlined, LockOutlined, PlaylistAddCheckOutlined, PublicOutlined, ShieldOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getJson } from './api';
import {
  DotLabel,
  EmptyState,
  PastelChip,
  ProgressRing,
  QueryState,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import PublicPlatformShell from './PublicPlatformShell';
import PublicShareSummaryCard from './PublicShareSummaryCard';
import type { PublicProductShare } from './types';

export default function PublicProductSharePanel({ token }: { token: string }) {
  const share = useQuery({
    queryKey: ['public-product-share', token],
    queryFn: () => getJson<PublicProductShare>(`/public/product-shares/${token}`),
    retry: false,
  });

  const data = share.data;
  const hasLaunchReport = Boolean(data?.launchStatus?.reportAvailable && typeof data.launchStatus.score === 'number');

  return (
    <PublicPlatformShell>
      <QueryState isLoading={share.isLoading} error={share.error} />
      {data ? (
        <Stack spacing={2.5}>
          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 55%, #f6fff9 100%)' }}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems={{ lg: 'flex-start' }} justifyContent="space-between">
              <Stack spacing={1.1} sx={{ minWidth: 0, maxWidth: 820 }}>
                <PastelChip label="Shared product summary" accent={appleColors.purple} />
                <Typography variant="h1" sx={{ overflowWrap: 'anywhere' }}>
                  {data.productName}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 17, lineHeight: 1.7 }}>
                  {data.summary || 'The owner shared this product summary through ProdUS.'}
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  <PastelChip label={formatLabel(data.businessStage)} accent={appleColors.purple} bg="#f1efff" />
                  <PastelChip label={formatLabel(data.audience)} accent={appleColors.cyan} bg="#e4f9fd" />
                  <PastelChip label={`${data.visibleSections.length} public sections`} accent={appleColors.green} bg="#e7f8ee" />
                  {data.expiresAt && <PastelChip label="Time-limited link" accent={appleColors.amber} bg="#fff4dc" />}
                </Stack>
              </Stack>

              {data.launchStatus && hasLaunchReport ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <ProgressRing value={data.launchStatus.score ?? 0} size={104} color={appleColors.purple} label="ready" />
                  <Box sx={{ minWidth: 170 }}>
                    <Typography variant="caption" color="text.secondary">
                      Shared launch status
                    </Typography>
                    <Typography variant="h4" sx={{ color: appleColors.purple }}>
                      {data.launchStatus.statusLabel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {data.launchStatus.summary}
                    </Typography>
                  </Box>
                </Stack>
              ) : data.launchStatus ? (
                <Surface sx={{ boxShadow: 'none', minWidth: { lg: 300 }, background: '#fff' }}>
                  <Stack spacing={1}>
                    <ShieldOutlined sx={{ color: appleColors.amber }} />
                    <Typography sx={{ fontWeight: 950 }}>{data.launchStatus.statusLabel}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                      {data.launchStatus.summary}
                    </Typography>
                  </Stack>
                </Surface>
              ) : (
                <Surface sx={{ boxShadow: 'none', minWidth: { lg: 300 }, background: '#fff' }}>
                  <Stack spacing={1}>
                    <ShieldOutlined sx={{ color: appleColors.amber }} />
                    <Typography sx={{ fontWeight: 950 }}>Launch status not shared</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                      The owner has not included launch readiness in this public link.
                    </Typography>
                  </Stack>
                </Surface>
              )}
            </Stack>
          </Surface>

          {data.ownerNote && (
            <Alert severity="info" sx={{ borderRadius: 1 }}>
              {data.ownerNote}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' }, gap: 2.5 }}>
            <Stack spacing={2.5}>
              <Surface>
                <SectionTitle title="What The Owner Shared" action={<PublicOutlined sx={{ color: appleColors.green }} />} />
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {data.visibleSections.map((section) => (
                    <PastelChip key={section} label={formatLabel(section)} accent={appleColors.green} bg="#e7f8ee" />
                  ))}
                </Stack>
              </Surface>

              {data.selectedServices.length > 0 && (
                <Surface>
                  <SectionTitle title="Selected Services" action={<PlaylistAddCheckOutlined sx={{ color: appleColors.purple }} />} />
                  <Stack spacing={1.25}>
                    {data.selectedServices.map((service) => (
                      <Box key={service.name} sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
                        <Typography sx={{ fontWeight: 950 }}>{service.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                          {service.outcome || 'Selected by the owner as part of the product path.'}
                        </Typography>
                        {service.category && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                            {service.category}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Surface>
              )}
              {data.visibleSections.includes('SELECTED_SERVICES') && data.selectedServices.length === 0 && (
                <Surface>
                  <SectionTitle title="Selected Services" action={<PlaylistAddCheckOutlined sx={{ color: appleColors.purple }} />} />
                  <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    The owner shared service visibility, but no service plan has been published yet.
                  </Typography>
                </Surface>
              )}

              {data.findingsSummary && (
                <PublicShareSummaryCard summary={data.findingsSummary} accent={appleColors.amber} />
              )}
              {data.evidenceSummary && (
                <PublicShareSummaryCard summary={data.evidenceSummary} accent={appleColors.cyan} />
              )}
              {data.teamSummary && (
                <PublicShareSummaryCard summary={data.teamSummary} accent={appleColors.purple} />
              )}
            </Stack>

            <Stack spacing={2.5}>
              <Surface>
                <SectionTitle title="Private By Default" action={<LockOutlined sx={{ color: appleColors.amber }} />} />
                <Stack spacing={1.25}>
                  {data.lockedSections.map((section) => (
                    <Box key={section.section} sx={{ p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
                      <DotLabel label={`${section.section} locked`} color={appleColors.amber} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.65, lineHeight: 1.55 }}>
                        {section.reason}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Surface>

              <Surface sx={{ background: '#fff' }}>
                <Typography variant="h4">{data.viewerAction ? 'Next step' : 'Need deeper access?'}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
                  {data.viewerAction
                    ? 'The owner provided a preferred action for viewers who want to continue the conversation.'
                    : 'Ask the owner for a registered or invited link before expecting private findings, evidence artifacts, or delivery details.'}
                </Typography>
                {data.viewerAction ? (
                  <Button component="a" href={data.viewerAction.url} variant="contained" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 42, mt: 1.5 }}>
                    {data.viewerAction.label}
                  </Button>
                ) : (
                  <Button component={NextLink} href="/login" variant="outlined" sx={{ minHeight: 42, mt: 1.5 }}>
                    Sign in
                  </Button>
                )}
              </Surface>
            </Stack>
          </Box>
        </Stack>
      ) : !share.isLoading && !share.error ? (
        <EmptyState label="This product share link is not available." />
      ) : null}
    </PublicPlatformShell>
  );
}
