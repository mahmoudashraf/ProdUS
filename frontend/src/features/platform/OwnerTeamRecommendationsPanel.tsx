'use client';

import {
  BookmarkBorderOutlined,
  GroupsOutlined,
  ManageSearchOutlined,
  TuneOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  EmptyState,
  PastelChip,
  ProgressRing,
  SectionTitle,
  Surface,
  appleColors,
  categoryPalette,
  formatLabel,
} from './PlatformComponents';
import { teamMatchColor } from './ownerTeamMatchConfig';
import { TeamRecommendation, TeamShortlist } from './types';

const shortlistContains = (shortlists: TeamShortlist[], teamId: string, status?: TeamShortlist['status']) =>
  shortlists.some((item) => item.team.id === teamId && (!status || item.status === status));

export function TeamRecommendationsPanel({
  recommendations,
  activeShortlists,
  isLoading,
  selectedPackageId,
  isUpdating,
  onCompare,
  onChoose,
  onInspect,
}: {
  recommendations: TeamRecommendation[];
  activeShortlists: TeamShortlist[];
  isLoading: boolean;
  selectedPackageId: string;
  isUpdating: boolean;
  onCompare: (teamId: string) => void;
  onChoose: (teamId: string) => void;
  onInspect: (teamId: string) => void;
}) {
  return (
    <Surface>
      <SectionTitle title="Recommended Delivery Teams" action={<GroupsOutlined sx={{ color: appleColors.purple }} />} />
      {isLoading ? (
        <EmptyState label="Matching verified teams against the current planning scope..." />
      ) : recommendations.length ? (
        <Stack spacing={1.25}>
          {recommendations.slice(0, 6).map((recommendation, index) => {
            const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
            const score = Math.round(recommendation.score * 100);
            const compared = shortlistContains(activeShortlists, recommendation.team.id, 'COMPARED');
            const shortlisted = shortlistContains(activeShortlists, recommendation.team.id);

            return (
              <Box
                key={recommendation.team.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '72px minmax(0, 1.15fr) minmax(0, 1.35fr) auto' },
                  gap: 1.5,
                  alignItems: 'center',
                  p: { xs: 1.5, md: 1.75 },
                  border: '1px solid',
                  borderColor: index === 0 ? `${appleColors.green}55` : appleColors.line,
                  borderRadius: 1,
                  bgcolor: index === 0 ? '#f6fff9' : '#fff',
                }}
              >
                <ProgressRing value={score} size={72} color={teamMatchColor(score)} label="match" />
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 1,
                      bgcolor: palette.bg,
                      color: palette.accent,
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 900,
                      flex: '0 0 auto',
                    }}
                  >
                    {recommendation.team.name.charAt(0)}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h4">{recommendation.team.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {recommendation.team.timezone || recommendation.team.typicalProjectSize || 'Remote delivery'}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                      <PastelChip label={formatLabel(recommendation.team.verificationStatus)} accent={palette.accent} bg={palette.bg} />
                      <PastelChip label={recommendation.team.typicalProjectSize || 'Scoped after intake'} accent={appleColors.green} />
                    </Stack>
                  </Box>
                </Stack>
                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 0.75 }}>Why this match</Typography>
                  <Stack spacing={0.5}>
                    {recommendation.reasons.slice(0, 3).map((reason) => (
                      <DotLabel key={reason} label={reason} color={appleColors.green} />
                    ))}
                  </Stack>
                </Box>
                <Stack spacing={1} sx={{ minWidth: { lg: 148 } }}>
                  <Button
                    variant={shortlisted ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<BookmarkBorderOutlined />}
                    onClick={() => onChoose(recommendation.team.id)}
                    disabled={!selectedPackageId || isUpdating}
                  >
                    {shortlisted ? 'In shortlist' : 'Choose team'}
                  </Button>
                  <Button
                    variant={compared ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<TuneOutlined />}
                    onClick={() => onCompare(recommendation.team.id)}
                    disabled={!selectedPackageId || isUpdating}
                  >
                    Compare proof
                  </Button>
                  <Button variant="text" size="small" startIcon={<ManageSearchOutlined />} onClick={() => onInspect(recommendation.team.id)}>
                    Inspect
                  </Button>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <EmptyState label={selectedPackageId ? 'No verified team matches for this planning scope yet.' : 'Choose a planning scope to unlock ranked team matches.'} />
      )}
    </Surface>
  );
}
