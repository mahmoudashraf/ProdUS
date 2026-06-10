'use client';

import NextLink from 'next/link';
import { GroupAddOutlined, PersonAddAltOutlined } from '@mui/icons-material';
import { Avatar, Box, Button, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  PastelChip,
  ProgressRing,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { ExpertProfile, Team } from './types';

const splitTags = (value?: string) =>
  (value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const teamScore = (team: Team) => {
  const scores: Record<Team['verificationStatus'], number> = {
    APPLIED: 58,
    VERIFIED: 82,
    CERTIFIED: 88,
    SPECIALIST: 92,
    OPERATIONS_READY: 96,
    SUSPENDED: 30,
  };
  return scores[team.verificationStatus] || 76;
};

const availabilityColor = (availability: ExpertProfile['availability']) => {
  if (availability === 'AVAILABLE') return appleColors.green;
  if (availability === 'LIMITED') return appleColors.amber;
  if (availability === 'BUSY') return appleColors.red;
  return appleColors.muted;
};

export function PublicTeamCard({
  team,
  isLoggedIn,
  canUseProjectCart,
  inCart,
  onAttach,
  isAttaching,
}: {
  team: Team;
  isLoggedIn: boolean;
  canUseProjectCart: boolean;
  inCart: boolean;
  onAttach: () => void;
  isAttaching: boolean;
}) {
  const tags = splitTags(team.capabilitiesSummary || team.description).slice(0, 5);

  return (
    <Surface sx={{ p: 0, overflow: 'hidden', height: '100%' }}>
      <Box
        sx={{
          height: 92,
          background: team.coverPhotoUrl
            ? `linear-gradient(90deg, rgba(98,92,255,0.38), rgba(14,165,198,0.16)), url(${team.coverPhotoUrl}) center/cover`
            : 'linear-gradient(135deg, #eef2ff, #ecfeff)',
          borderBottom: `1px solid ${appleColors.line}`,
        }}
      />
      <Stack spacing={2} sx={{ p: 2.5, pt: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: -3 }}>
          <Avatar
            variant="rounded"
            {...(team.profilePhotoUrl ? { src: team.profilePhotoUrl } : {})}
            sx={{
              width: 64,
              height: 64,
              border: '4px solid #fff',
              bgcolor: '#eef2ff',
              color: appleColors.purple,
              fontWeight: 900,
            }}
          >
            {team.name.slice(0, 1)}
          </Avatar>
          <ProgressRing value={teamScore(team)} size={70} color={appleColors.purple} label="match" />
        </Stack>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h3">{team.name}</Typography>
            <StatusChip label={team.verificationStatus} />
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
            {team.headline || team.description || 'Verified product team.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {tags.map((tag) => (
            <PastelChip key={tag} label={tag} accent={appleColors.cyan} bg="#e4f9fd" />
          ))}
        </Stack>
        <Stack spacing={1}>
          <DotLabel label={team.timezone || 'Remote delivery'} color={appleColors.green} />
          <Typography color="text.secondary">
            Typical project: <Box component="span" sx={{ color: appleColors.ink, fontWeight: 800 }}>{team.typicalProjectSize || 'Scoped after intake'}</Box>
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component={NextLink} href={`/teams/${team.id}`} variant="outlined" fullWidth sx={{ minHeight: 42 }}>
            View Profile
          </Button>
          <Button
            component={NextLink}
            href={!isLoggedIn ? '/login' : canUseProjectCart ? '#' : '/dashboard'}
            variant="contained"
            fullWidth
            startIcon={<GroupAddOutlined />}
            disabled={canUseProjectCart && isAttaching}
            onClick={(event) => {
              if (!canUseProjectCart) return;
              event.preventDefault();
              onAttach();
            }}
            sx={{ minHeight: 42 }}
          >
            {!isLoggedIn ? 'Sign in to attach team' : canUseProjectCart ? (inCart ? 'In Product Plan' : 'Attach team to plan') : 'Open Dashboard'}
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

export function ExpertCard({
  expert,
  isLoggedIn,
  canUseProjectCart,
  inCart,
  onAttach,
  isAttaching,
}: {
  expert: ExpertProfile;
  isLoggedIn: boolean;
  canUseProjectCart: boolean;
  inCart: boolean;
  onAttach: () => void;
  isAttaching: boolean;
}) {
  const skills = splitTags(expert.skills).slice(0, 5);
  const accent = availabilityColor(expert.availability);

  return (
    <Surface sx={{ p: 0, overflow: 'hidden', height: '100%' }}>
      <Box
        sx={{
          height: 92,
          background: expert.coverPhotoUrl
            ? `linear-gradient(90deg, rgba(14,165,198,0.28), rgba(98,92,255,0.16)), url(${expert.coverPhotoUrl}) center/cover`
            : 'linear-gradient(135deg, #ecfeff, #f8f7ff)',
          borderBottom: `1px solid ${appleColors.line}`,
        }}
      />
      <Stack spacing={2} sx={{ p: 2.5, pt: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: -3 }}>
          <Avatar
            {...(expert.profilePhotoUrl ? { src: expert.profilePhotoUrl } : {})}
            sx={{
              width: 64,
              height: 64,
              border: '4px solid #fff',
              bgcolor: '#ecfeff',
              color: appleColors.cyan,
              fontWeight: 900,
            }}
          >
            {expert.displayName.slice(0, 1)}
          </Avatar>
          <DotLabel label={formatLabel(expert.availability)} color={accent} />
        </Stack>
        <Box>
          <Typography variant="h3">{expert.displayName}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
            {expert.headline || 'Independent product expert.'}
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
          {expert.bio || 'Profile evidence, services, and availability are maintained by the expert.'}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {skills.map((skill) => (
            <PastelChip key={skill} label={skill} accent={appleColors.green} bg="#e7f8ee" />
          ))}
        </Stack>
        <Stack spacing={1}>
          <DotLabel label={expert.location || 'Remote'} color={appleColors.cyan} />
          <Typography color="text.secondary">
            Project range: <Box component="span" sx={{ color: appleColors.ink, fontWeight: 800 }}>{expert.preferredProjectSize || 'Scoped after intake'}</Box>
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component={NextLink} href={`/solo-experts/${expert.id}`} variant="outlined" fullWidth sx={{ minHeight: 42 }}>
            View Profile
          </Button>
          <Button
            component={NextLink}
            href={!isLoggedIn ? '/login' : canUseProjectCart ? '#' : '/dashboard'}
            variant="contained"
            fullWidth
            startIcon={<PersonAddAltOutlined />}
            disabled={canUseProjectCart && isAttaching}
            onClick={(event) => {
              if (!canUseProjectCart) return;
              event.preventDefault();
              onAttach();
            }}
            sx={{ minHeight: 42 }}
          >
            {!isLoggedIn ? 'Sign in to attach expert' : canUseProjectCart ? (inCart ? 'In Product Plan' : 'Attach expert to plan') : 'Open Dashboard'}
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
