'use client';

import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  categoryPalette,
} from './PlatformComponents';
import { servicePlanStatusAccent } from './servicePlanBuilderConfig';
import type { PackageModule, TeamRecommendation } from './types';

export function ServicePlanServicesPanel({
  modules,
  isFetching,
}: {
  modules: PackageModule[];
  isFetching: boolean;
}) {
  return (
    <Stack spacing={2.5}>
      {isFetching && <LinearProgress sx={{ borderRadius: 999 }} />}
      <Surface>
        <SectionTitle title="Selected Services" action={<PastelChip label={`${modules.length} included`} accent={appleColors.green} bg="#e7f8ee" />} />
        {modules.length ? (
          <Stack spacing={0}>
            {modules.map((module, index) => {
              const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
              return (
                <Box
                  key={module.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '44px minmax(0, 1fr)', md: '56px minmax(0, 1.2fr) minmax(180px, 0.8fr) auto' },
                    gap: 1.5,
                    alignItems: 'center',
                    py: 1.75,
                    borderTop: index === 0 ? 0 : '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: palette.bg, color: palette.accent, display: 'grid', placeItems: 'center', fontWeight: 900 }}>
                    {module.sequenceOrder}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900 }}>{module.serviceModule.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.6 }}>
                      {module.rationale || module.serviceModule.description}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, lineHeight: 1.55 }}>
                    {module.deliverables || module.serviceModule.expectedDeliverables || 'Deliverables pending.'}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ gridColumn: { xs: '2 / -1', md: 'auto' }, minWidth: 0 }}
                  >
                    <PastelChip label={module.required ? 'Included' : 'Optional'} accent={module.required ? appleColors.green : appleColors.amber} bg={module.required ? '#e7f8ee' : '#fff4dc'} />
                    <StatusChip label={module.status} />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <EmptyState label="No service modules are attached to this service plan yet." />
        )}
      </Surface>
    </Stack>
  );
}

export function ServicePlanMilestonesPanel({
  modules,
}: {
  modules: PackageModule[];
}) {
  return (
    <Stack spacing={2.5}>
      <Surface>
        <SectionTitle title="Milestone Path" />
        {modules.length ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: `repeat(${Math.min(4, Math.max(1, modules.length))}, minmax(0, 1fr))` }, gap: 1.5 }}>
            {modules.map((module, index) => {
              const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
              return (
                <Box key={module.id} sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: palette.soft }}>
                  <PastelChip label={`Step ${index + 1}`} accent={palette.accent} bg={palette.bg} />
                  <Typography sx={{ mt: 1, fontWeight: 900 }}>{module.serviceModule.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                    Week {index * 2 + 1}-{index * 2 + 2}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        ) : (
          <EmptyState label="Milestones appear after services are attached to the plan." />
        )}
      </Surface>
    </Stack>
  );
}

export function ServicePlanTeamMatchPanel({
  teamRecommendations,
  isFetching,
}: {
  teamRecommendations: TeamRecommendation[];
  isFetching: boolean;
}) {
  return (
    <Surface>
      <SectionTitle title="Matched Teams" action={<PastelChip label={`${teamRecommendations.length} matches`} accent={appleColors.cyan} bg="#e4f9fd" />} />
      {isFetching && <LinearProgress sx={{ mb: 2, borderRadius: 999 }} />}
      {teamRecommendations.length ? (
        <Stack spacing={1.5}>
          {teamRecommendations.map((recommendation, index) => (
            <Box
              key={recommendation.team.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '72px minmax(0, 1fr)', lg: '88px 1.1fr minmax(0, 1.4fr) auto' },
                gap: 1.5,
                alignItems: 'center',
                py: 1.5,
                borderTop: index === 0 ? 0 : '1px solid',
                borderColor: 'divider',
              }}
            >
              <ProgressRing value={Math.round(recommendation.score * 100)} size={68} color={servicePlanStatusAccent(recommendation.team.verificationStatus)} label="match" />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900 }}>{recommendation.team.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                  {recommendation.team.timezone || recommendation.team.typicalProjectSize || 'Delivery profile'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', lg: 'block' }, lineHeight: 1.55 }}>
                {recommendation.reasons.join(' · ') || recommendation.team.capabilitiesSummary || 'Match reasons pending.'}
              </Typography>
              <Box sx={{ gridColumn: { xs: '2 / -1', lg: 'auto' }, justifySelf: { lg: 'end' } }}>
                <StatusChip label={recommendation.team.verificationStatus} color="success" />
              </Box>
            </Box>
          ))}
        </Stack>
      ) : (
        <EmptyState label="Choose verified teams or complete team capability profiles to unlock recommendations." />
      )}
    </Surface>
  );
}
