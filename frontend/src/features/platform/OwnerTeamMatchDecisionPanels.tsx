'use client';

import NextLink from 'next/link';
import { BookmarkBorderOutlined, FactCheckOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  DotLabel,
  PastelChip,
  ProgressRing,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import { TeamMatchView, teamMatchColor, teamMatchViews } from './ownerTeamMatchConfig';
import { PackageInstance, TeamRecommendation } from './types';

export function TeamMatchDecisionPanel({
  selectedPackageId,
  packages,
  topRecommendation,
  averageMatch,
  shortlistCount,
  onPackageChange,
  onOpenShortlist,
}: {
  selectedPackageId: string;
  packages: PackageInstance[];
  topRecommendation?: TeamRecommendation | undefined;
  averageMatch: number;
  shortlistCount: number;
  onPackageChange: (packageId: string) => void;
  onOpenShortlist: () => void;
}) {
  const topScore = topRecommendation ? Math.round(topRecommendation.score * 100) : 0;

  return (
    <Surface sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} justifyContent="space-between" alignItems={{ lg: 'center' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3">Choose the team most likely to unblock launch.</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65, maxWidth: 780 }}>
              Match strength is based on the service plan, verified capability evidence, and delivery reputation. Use the top match first, then inspect proof before requesting proposal.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <ProgressRing value={topScore || averageMatch} size={86} color={teamMatchColor(topScore || averageMatch)} label="match" />
            <Box>
              <Typography sx={{ fontWeight: 900 }}>{topRecommendation?.team.name || 'No top match yet'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {topRecommendation ? `${topScore}% top match` : 'Choose a service plan to calculate fit'}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.4fr) auto auto' },
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <TextField
            select
            size="small"
            label="Start plan"
            value={selectedPackageId}
            onChange={(event) => onPackageChange(event.target.value)}
          >
            {packages.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.productProfile?.name || item.name}
              </MenuItem>
            ))}
          </TextField>
          <Button component={NextLink} href="/packages?view=team" variant="outlined" sx={{ minHeight: 40 }}>
            Adjust plan
          </Button>
          <Button variant="contained" startIcon={<BookmarkBorderOutlined />} onClick={onOpenShortlist} sx={{ minHeight: 40 }}>
            {shortlistCount ? `Review shortlist (${shortlistCount})` : 'Build shortlist'}
          </Button>
        </Box>
      </Stack>
    </Surface>
  );
}

export function TeamMatchFocusNav({
  activeView,
  counts,
  onChange,
}: {
  activeView: TeamMatchView;
  counts: Record<TeamMatchView, number>;
  onChange: (view: TeamMatchView) => void;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
        gap: 1.25,
      }}
    >
      {teamMatchViews.map((view) => {
        const selected = activeView === view.value;
        return (
          <Button
            key={view.value}
            data-testid={`owner-team-match-step-${view.value}`}
            variant="outlined"
            onClick={() => onChange(view.value)}
            sx={{
              justifyContent: 'flex-start',
              alignItems: 'stretch',
              p: 0,
              borderColor: selected ? appleColors.purple : appleColors.line,
              bgcolor: selected ? '#f8f7ff' : '#fff',
              color: appleColors.ink,
              textTransform: 'none',
              whiteSpace: 'normal',
              boxShadow: selected ? '0 16px 40px rgba(98,92,255,0.12)' : 'none',
            }}
          >
            <Stack spacing={0.75} sx={{ p: 1.75, width: '100%', minWidth: 0, textAlign: 'left' }}>
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
                  {view.eyebrow}
                </Typography>
                <PastelChip label={`${counts[view.value]}`} accent={selected ? appleColors.purple : appleColors.cyan} />
              </Stack>
              <Typography sx={{ fontWeight: 900 }}>{view.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                {view.description}
              </Typography>
            </Stack>
          </Button>
        );
      })}
    </Box>
  );
}

export function TeamMatchMethodPanel() {
  return (
    <Surface sx={{ background: '#f4fdfe' }}>
      <SectionTitle title="How Matching Works" action={<FactCheckOutlined sx={{ color: appleColors.cyan }} />} />
      <Stack spacing={1}>
        <DotLabel label="Service-plan modules define the delivery skills needed." color={appleColors.green} />
        <DotLabel label="Capability evidence and verification status shape team fit." color={appleColors.purple} />
        <DotLabel label="Workspace reputation confirms the team has delivered comparable outcomes." color={appleColors.cyan} />
      </Stack>
    </Surface>
  );
}
