'use client';

import { VerifiedOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  SectionTitle,
  Surface,
  appleColors,
  categoryPalette,
  formatLabel,
} from './PlatformComponents';
import { TeamRecommendation, TeamShortlist } from './types';

export function TeamMatchShortlistPanel({
  activeShortlists,
  recommendations,
  onInspect,
}: {
  activeShortlists: TeamShortlist[];
  recommendations: TeamRecommendation[];
  onInspect: (teamId: string) => void;
}) {
  const items = (activeShortlists.length
    ? activeShortlists.map((shortlist) => ({
        team: shortlist.team,
        score: recommendations.find((match) => match.team.id === shortlist.team.id)?.score || 0.82,
        status: shortlist.status,
      }))
    : recommendations.slice(0, 3).map((item) => ({ team: item.team, score: item.score, status: 'SUGGESTED' }))
  ).slice(0, 5);

  return (
    <Surface>
      <SectionTitle title="Owner Shortlist" action={<VerifiedOutlined sx={{ color: appleColors.purple }} />} />
      {items.length ? (
        <Stack spacing={1.25}>
          {items.map((item, index) => {
            const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
            return (
              <Box
                key={item.team.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr auto auto' },
                  gap: 1.5,
                  alignItems: 'center',
                  p: 1.5,
                  border: '1px solid',
                  borderColor: appleColors.line,
                  borderRadius: 1,
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 1, bgcolor: palette.bg, color: palette.accent, display: 'grid', placeItems: 'center', fontWeight: 900 }}>
                    {index + 1}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900 }}>{item.team.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.team.timezone || item.team.typicalProjectSize || 'Remote delivery'}</Typography>
                  </Box>
                </Stack>
                <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={0.25}>
                  <Typography color="success.main" sx={{ fontWeight: 900 }}>{Math.round(item.score * 100)}%</Typography>
                  <Typography variant="caption" color="text.secondary">{formatLabel(item.status)}</Typography>
                </Stack>
                <Button variant="outlined" size="small" onClick={() => onInspect(item.team.id)}>
                  Inspect proof
                </Button>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <EmptyState label="Choose a delivery team from the match list to create an owner shortlist." />
      )}
    </Surface>
  );
}
