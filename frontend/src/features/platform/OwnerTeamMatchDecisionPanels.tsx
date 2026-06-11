'use client';

import NextLink from 'next/link';
import { BookmarkBorderOutlined, FactCheckOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import { WorkspaceBreadcrumbs } from './OwnerWorkspaceJourneyNav';
import { TeamMatchView, teamMatchColor, teamMatchViews } from './ownerTeamMatchConfig';
import { PackageInstance, Team, TeamRecommendation } from './types';

export function TeamMatchDecisionPanel({
  selectedPackageId,
  selectedPackage,
  topRecommendation,
  averageMatch,
  shortlistCount,
  onChangePlan,
  onOpenShortlist,
}: {
  selectedPackageId: string;
  selectedPackage?: PackageInstance | undefined;
  topRecommendation?: TeamRecommendation | undefined;
  averageMatch: number;
  shortlistCount: number;
  onChangePlan: () => void;
  onOpenShortlist: () => void;
}) {
  const topScore = topRecommendation ? Math.round(topRecommendation.score * 100) : 0;
  const adjustPlanHref = selectedPackageId ? `/packages?planId=${encodeURIComponent(selectedPackageId)}&view=team` : '/packages';
  const planName = selectedPackage?.productProfile?.name || selectedPackage?.name || 'Selected planning scope';

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
                {topRecommendation ? `${topScore}% top match` : 'No ranked team for this plan yet'}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto auto auto' }, gap: 1.5, alignItems: 'center' }}>
          <Box sx={{ minWidth: 0, p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
              <PastelChip label="Selected planning scope" accent={appleColors.cyan} bg="#e4f9fd" />
              {selectedPackage && <StatusChip label={selectedPackage.status} />}
            </Stack>
            <Typography sx={{ mt: 0.65, fontWeight: 950, overflowWrap: 'anywhere' }}>
              {planName}
            </Typography>
          </Box>
          <Button variant="outlined" onClick={onChangePlan} sx={{ minHeight: 40 }}>
            Change plan
          </Button>
          <Button component={NextLink} href={adjustPlanHref} variant="outlined" sx={{ minHeight: 40 }}>
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

export function TeamMatchInternalHeader({
  activeView,
  onBack,
}: {
  activeView: TeamMatchView;
  onBack: () => void;
}) {
  const view = teamMatchViews.find((item) => item.value === activeView) || teamMatchViews[0]!;

  return (
    <Stack spacing={1.25}>
      <WorkspaceBreadcrumbs
        items={[
          { label: 'Team Match', onClick: onBack },
          { label: view.title },
        ]}
        backLabel="Team Match hub"
        onBack={onBack}
      />
      <Surface sx={{ p: { xs: 2, md: 2.5 }, background: '#fbfcff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
              {view.eyebrow}
            </Typography>
            <Typography variant="h3" sx={{ mt: 0.4 }}>
              {view.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55, maxWidth: 780 }}>
              {view.description}
            </Typography>
          </Box>
        </Stack>
      </Surface>
    </Stack>
  );
}

export function TeamMatchSelectedContextPanel({
  activeView,
  averageMatch,
  selectedPackage,
  selectedTeam,
  shortlistCount,
  topRecommendation,
  onOpenMatches,
  onOpenProfile,
  onOpenShortlist,
}: {
  activeView: TeamMatchView;
  averageMatch: number;
  selectedPackage?: PackageInstance | undefined;
  selectedTeam?: Team | undefined;
  shortlistCount: number;
  topRecommendation?: TeamRecommendation | undefined;
  onOpenMatches: () => void;
  onOpenProfile: () => void;
  onOpenShortlist: () => void;
}) {
  const score = topRecommendation ? Math.round(topRecommendation.score * 100) : averageMatch;
  const planName = selectedPackage?.productProfile?.name || selectedPackage?.name || 'No planning scope selected';
  const teamName = selectedTeam?.name || topRecommendation?.team.name || 'Top match pending';
  const currentView = teamMatchViews.find((item) => item.value === activeView) || teamMatchViews[0]!;
  const routeActions: Array<{ value: TeamMatchView; label: string; onClick: () => void }> = [
    { value: 'matches', label: 'Team Matches', onClick: onOpenMatches },
    { value: 'profile', label: 'Inspect Team', onClick: onOpenProfile },
    { value: 'shortlist', label: 'Shortlist', onClick: onOpenShortlist },
  ];

  return (
    <Surface sx={{ p: { xs: 1.5, md: 2 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '86px minmax(0, 1fr) minmax(0, 1fr) auto' },
          gap: 1.5,
          alignItems: 'center',
        }}
      >
        <ProgressRing value={score || 0} size={72} color={teamMatchColor(score || 0)} label="match" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
            Selected planning scope
          </Typography>
          <Typography sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}>{planName}</Typography>
          <Typography variant="body2" color="text.secondary">
            Use the hub to change the plan before comparing teams.
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
            Current team context
          </Typography>
          <Typography sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}>{teamName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {shortlistCount ? `${shortlistCount} team${shortlistCount === 1 ? '' : 's'} saved for proposal review.` : 'No teams saved yet.'}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1} sx={{ minWidth: { md: 150 } }}>
          <PastelChip label={`Current: ${currentView.title}`} accent={teamMatchColor(score || 0)} bg={`${teamMatchColor(score || 0)}14`} />
          {routeActions.filter((action) => action.value !== activeView).map((action) => (
            <Button key={action.value} variant="outlined" size="small" onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
        </Stack>
      </Box>
    </Surface>
  );
}

export function TeamMatchFocusNav({
  activeView,
  counts,
  onChange,
}: {
  activeView?: TeamMatchView | null;
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
