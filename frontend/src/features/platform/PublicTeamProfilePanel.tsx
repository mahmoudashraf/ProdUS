'use client';

import NextLink from 'next/link';
import { AddCircleOutlineOutlined, LanguageOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import PublicProfileHeroPanel from './PublicProfileHeroPanel';
import {
  PublicProfileContextPanel,
  PublicProfileFocusNav,
  PublicProfileInternalHeader,
  PublicProfileView,
} from './PublicProfileFocusNav';
import {
  DotLabel,
  PageHeader,
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  categoryPalette,
  formatLabel,
} from './PlatformComponents';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import { splitProfileTags, teamReadinessScore } from './publicProfileUtils';
import type { Team, TeamCapability } from './types';

export default function PublicTeamProfilePanel({
  team,
  capabilities,
  activeView,
  hasActiveView,
  isLoggedIn,
  canUseProjectCart,
  inPlan,
  isAdding,
  onChangeView,
  onOpenHub,
  onAddTeam,
}: {
  team: Team;
  capabilities: TeamCapability[];
  activeView: PublicProfileView;
  hasActiveView: boolean;
  isLoggedIn: boolean;
  canUseProjectCart: boolean;
  inPlan: boolean;
  isAdding: boolean;
  onChangeView: (view: PublicProfileView) => void;
  onOpenHub: () => void;
  onAddTeam: () => void;
}) {
  const tags = splitProfileTags(team.capabilitiesSummary || team.description);
  const counts = {
    overview: Math.max(tags.length, 1),
    proof: capabilities.length,
    signals: [team.timezone, team.typicalProjectSize, team.verificationStatus, team.websiteUrl].filter(Boolean).length,
  };
  const actionButtons = (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button
        component={NextLink}
        href={!isLoggedIn ? '/login' : canUseProjectCart ? '#' : '/dashboard'}
        variant="contained"
        startIcon={<AddCircleOutlineOutlined />}
        disabled={canUseProjectCart && (isAdding || inPlan)}
        onClick={(event) => {
          if (!canUseProjectCart || inPlan) return;
          event.preventDefault();
          onAddTeam();
        }}
        sx={{ minHeight: 44, minWidth: 180 }}
      >
        {!isLoggedIn ? 'Sign in to attach team' : canUseProjectCart ? (inPlan ? 'In Product Plan' : 'Attach team to plan') : 'Open dashboard'}
      </Button>
      <Button component={NextLink} href={canUseProjectCart ? PROJECT_START_PLAN_HREF : isLoggedIn ? '/dashboard' : '/login'} variant="outlined" sx={{ minHeight: 44, minWidth: 170 }}>
        {canUseProjectCart ? 'Product Plan' : isLoggedIn ? 'Open dashboard' : 'Sign in to start'}
      </Button>
    </Stack>
  );

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Team Profile"
        description="Evaluate whether this delivery team belongs in the product plan."
      />

      {!hasActiveView ? (
        <>
          <PublicProfileHeroPanel
            name={team.name}
            title={team.headline || team.description}
            body={team.bio}
            photoUrl={team.profilePhotoUrl}
            coverUrl={team.coverPhotoUrl}
            badge={<StatusChip label={team.verificationStatus} />}
          >
            {actionButtons}
          </PublicProfileHeroPanel>
          <PublicProfileFocusNav activeView={null} counts={counts} onChange={onChangeView} />
        </>
      ) : (
        <>
          <PublicProfileInternalHeader activeView={activeView} profileLabel="Team Profile" onOpenHub={onOpenHub} />
          <PublicProfileContextPanel
            activeView={activeView}
            actions={actionButtons}
            badge={<StatusChip label={team.verificationStatus} />}
            counts={counts}
            name={team.name}
            summary={team.headline || team.description || team.bio}
            onOpenOverview={() => onChangeView('overview')}
            onOpenProof={() => onChangeView('proof')}
            onOpenSignals={() => onChangeView('signals')}
          />
        </>
      )}

      {hasActiveView && activeView === 'overview' && (
        <Surface>
          <SectionTitle title="Delivery Focus" />
          <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
            {team.bio || team.description || 'This team maintains a public profile for service fit, delivery proof, and owner evaluation.'}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {tags.length ? tags.map((tag) => (
              <PastelChip key={tag} label={tag} accent={appleColors.cyan} bg="#e4f9fd" />
            )) : (
              <PastelChip label="Scoped delivery support" accent={appleColors.cyan} bg="#e4f9fd" />
            )}
          </Stack>
        </Surface>
      )}

      {hasActiveView && activeView === 'proof' && (
        <Surface>
          <SectionTitle title="Verified Service Capabilities" />
          {capabilities.length ? (
            <Stack spacing={1.25}>
              {capabilities.map((capability, index) => {
                const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;

                return (
                  <Box
                    key={capability.id}
                    sx={{
                      p: 1.75,
                      border: `1px solid ${appleColors.line}`,
                      borderRadius: 1,
                      bgcolor: palette.soft,
                    }}
                  >
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                      <Box>
                        <Typography sx={{ fontWeight: 900 }}>
                          {capability.serviceModule?.name || capability.serviceCategory.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                          {capability.notes || capability.serviceModule?.description || capability.serviceCategory.description}
                        </Typography>
                      </Box>
                      <PastelChip label={capability.serviceCategory.name} accent={palette.accent} bg={palette.bg} />
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              No public service capabilities have been published for this team yet.
            </Typography>
          )}
        </Surface>
      )}

      {hasActiveView && activeView === 'signals' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.8fr 1.2fr' }, gap: 2.5 }}>
          <Surface>
            <Stack spacing={2} alignItems="center" textAlign="center">
              <ProgressRing value={teamReadinessScore(team)} size={110} color={appleColors.purple} label="match" />
              <Box>
                <Typography variant="h4">Public Readiness Score</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  Based on verification status, capability coverage, and profile completeness.
                </Typography>
              </Box>
            </Stack>
          </Surface>
          <Surface>
            <SectionTitle title="Profile Signals" />
            <Stack spacing={1.5}>
              <DotLabel label={team.timezone || 'Remote delivery'} color={appleColors.green} />
              <DotLabel label={team.typicalProjectSize || 'Scoped after intake'} color={appleColors.cyan} />
              <DotLabel label={formatLabel(team.verificationStatus)} color={appleColors.purple} />
              {team.websiteUrl && (
                <Button
                  component={NextLink}
                  href={team.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="outlined"
                  startIcon={<LanguageOutlined />}
                  sx={{ minHeight: 42 }}
                >
                  Visit website
                </Button>
              )}
            </Stack>
          </Surface>
        </Box>
      )}
    </Stack>
  );
}
