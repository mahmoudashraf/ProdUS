'use client';

import NextLink from 'next/link';
import { AddCircleOutlineOutlined, LanguageOutlined, LaunchOutlined, RocketLaunchOutlined } from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';
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
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import { splitProfileTags } from './publicProfileUtils';
import type { ExpertProfile } from './types';

export default function PublicExpertProfilePanel({
  expert,
  activeView,
  hasActiveView,
  isLoggedIn,
  canUseProjectCart,
  inPlan,
  isAdding,
  onChangeView,
  onOpenHub,
  onAddExpert,
}: {
  expert: ExpertProfile;
  activeView: PublicProfileView;
  hasActiveView: boolean;
  isLoggedIn: boolean;
  canUseProjectCart: boolean;
  inPlan: boolean;
  isAdding: boolean;
  onChangeView: (view: PublicProfileView) => void;
  onOpenHub: () => void;
  onAddExpert: () => void;
}) {
  const skills = splitProfileTags(expert.skills);
  const counts = {
    overview: expert.bio ? 1 : 0,
    proof: Math.max(skills.length, 1),
    signals: [expert.availability, expert.location, expert.preferredProjectSize, expert.websiteUrl, expert.portfolioUrl].filter(Boolean).length,
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
          onAddExpert();
        }}
        sx={{ minHeight: 44, minWidth: 180 }}
      >
        {!isLoggedIn ? 'Sign in to attach expert' : canUseProjectCart ? (inPlan ? 'In Start Plan' : 'Attach expert to plan') : 'Open dashboard'}
      </Button>
      <Button component={NextLink} href="/solo-experts" variant="outlined" sx={{ minHeight: 44, minWidth: 150 }}>
        Browse experts
      </Button>
    </Stack>
  );

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Solo Expert Profile"
        description="Evaluate whether this specialist belongs in the project start plan."
      />

      {!hasActiveView ? (
        <>
          <PublicProfileHeroPanel
            name={expert.displayName}
            title={expert.headline}
            body={expert.bio}
            photoUrl={expert.profilePhotoUrl}
            coverUrl={expert.coverPhotoUrl}
            badge={<StatusChip label={expert.availability} />}
          >
            {actionButtons}
          </PublicProfileHeroPanel>
          <PublicProfileFocusNav activeView={null} counts={counts} onChange={onChangeView} />
        </>
      ) : (
        <>
          <PublicProfileInternalHeader activeView={activeView} profileLabel="Solo Expert Profile" onOpenHub={onOpenHub} />
          <PublicProfileContextPanel
            activeView={activeView}
            actions={actionButtons}
            badge={<StatusChip label={expert.availability} />}
            counts={counts}
            name={expert.displayName}
            summary={expert.headline || expert.bio}
            onOpenProof={() => onChangeView('proof')}
            onOpenSignals={() => onChangeView('signals')}
          />
        </>
      )}

      {hasActiveView && activeView === 'overview' && (
        <Surface>
          <SectionTitle title="Expert Bio" />
          <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
            {expert.bio || 'This solo expert maintains a public profile for capability, availability, and owner fit.'}
          </Typography>
        </Surface>
      )}

      {hasActiveView && activeView === 'proof' && (
        <Surface>
          <SectionTitle title="Skills And Services" />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {skills.length ? (
              skills.map((skill) => <PastelChip key={skill} label={skill} accent={appleColors.green} bg="#e7f8ee" />)
            ) : (
              <PastelChip label="Productization support" accent={appleColors.green} bg="#e7f8ee" />
            )}
          </Stack>
        </Surface>
      )}

      {hasActiveView && activeView === 'signals' && (
        <Surface>
          <SectionTitle title="Availability And Links" />
          <Stack spacing={1.5}>
            <DotLabel label={formatLabel(expert.availability)} color={expert.availability === 'AVAILABLE' ? appleColors.green : appleColors.amber} />
            <DotLabel label={expert.location || 'Remote'} color={appleColors.cyan} />
            <DotLabel label={expert.preferredProjectSize || 'Scoped after intake'} color={appleColors.purple} />
            {expert.websiteUrl && (
              <Button component={NextLink} href={expert.websiteUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<LanguageOutlined />} sx={{ minHeight: 42 }}>
                Website
              </Button>
            )}
            {expert.portfolioUrl && (
              <Button component={NextLink} href={expert.portfolioUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<LaunchOutlined />} sx={{ minHeight: 42 }}>
                Portfolio
              </Button>
            )}
            <Button component={NextLink} href={canUseProjectCart ? PROJECT_START_PLAN_HREF : isLoggedIn ? '/dashboard' : '/login'} variant="contained" startIcon={<RocketLaunchOutlined />} sx={{ minHeight: 42 }}>
              {canUseProjectCart ? 'Project Start Plan' : isLoggedIn ? 'Open dashboard' : 'Sign in to start'}
            </Button>
          </Stack>
        </Surface>
      )}
    </Stack>
  );
}
