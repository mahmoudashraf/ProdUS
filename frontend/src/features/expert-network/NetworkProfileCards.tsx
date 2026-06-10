'use client';

import NextLink from 'next/link';
import { ChatBubbleOutline, GroupAddOutlined, PersonAddAltOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { ExpertProfile, Team } from '@/features/platform/types';
import {
  DotLabel,
  ProgressRing,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from '@/features/platform/PlatformComponents';
import { availabilityColor, type ActionColor, type ActionVariant } from './networkPresentation';
import { PersonAvatar, TagRow } from './NetworkSharedPanels';

export function TeamCard({
  team,
  onMessage,
  onApply,
  applyLabel = 'Request To Join',
  applyVariant = 'contained',
  applyColor = 'primary',
  applyDisabled,
  busy,
}: {
  team: Team;
  onMessage: () => void;
  onApply: () => void;
  applyLabel?: string;
  applyVariant?: ActionVariant;
  applyColor?: ActionColor;
  applyDisabled?: boolean | undefined;
  busy?: boolean | undefined;
}) {
  return (
    <Surface sx={{ height: '100%', p: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          height: 92,
          background: team.coverPhotoUrl
            ? `linear-gradient(90deg, rgba(99,102,241,0.28), rgba(8,145,178,0.12)), url(${team.coverPhotoUrl}) center/cover`
            : 'linear-gradient(135deg, #eef2ff, #ecfeff)',
          borderBottom: `1px solid ${appleColors.line}`,
        }}
      />
      <Stack spacing={2} sx={{ p: 2.5, pt: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: -3 }}>
          <PersonAvatar name={team.name} src={team.profilePhotoUrl} square />
          <ProgressRing value={team.verificationStatus === 'OPERATIONS_READY' ? 96 : team.verificationStatus === 'CERTIFIED' ? 88 : 82} size={70} label="fit" />
        </Stack>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h3">{team.name}</Typography>
            <StatusChip label={team.verificationStatus} />
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
            {team.headline || team.description || 'Verified product team.'}
          </Typography>
        </Box>
        <TagRow value={team.capabilitiesSummary || team.description} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component={NextLink} href={`/expert-network/teams/${team.id}`} variant="outlined" fullWidth sx={{ minHeight: 42 }}>
            View Team
          </Button>
          <Button onClick={onApply} variant={applyVariant} color={applyColor} fullWidth disabled={!!busy || !!applyDisabled} startIcon={<PersonAddAltOutlined />} sx={{ minHeight: 42 }}>
            {applyLabel}
          </Button>
          <Button onClick={onMessage} variant="outlined" fullWidth disabled={!!busy} startIcon={<ChatBubbleOutline />} sx={{ minHeight: 42 }}>
            Message
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

export function ExpertCard({
  expert,
  onMessage,
  onInvite,
  inviteLabel = 'Invite',
  inviteVariant = 'contained',
  inviteColor = 'primary',
  inviteDisabled,
  busy,
}: {
  expert: ExpertProfile;
  onMessage: () => void;
  onInvite: () => void;
  inviteLabel?: string;
  inviteVariant?: ActionVariant;
  inviteColor?: ActionColor;
  inviteDisabled?: boolean | undefined;
  busy?: boolean | undefined;
}) {
  return (
    <Surface sx={{ height: '100%', p: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          height: 92,
          background: expert.coverPhotoUrl
            ? `linear-gradient(90deg, rgba(8,145,178,0.22), rgba(99,102,241,0.12)), url(${expert.coverPhotoUrl}) center/cover`
            : 'linear-gradient(135deg, #ecfeff, #f8f7ff)',
          borderBottom: `1px solid ${appleColors.line}`,
        }}
      />
      <Stack spacing={2} sx={{ p: 2.5, pt: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: -3 }}>
          <PersonAvatar name={expert.displayName} src={expert.profilePhotoUrl} />
          <DotLabel label={formatLabel(expert.availability)} color={availabilityColor(expert.availability)} />
        </Stack>
        <Box>
          <Typography variant="h3">{expert.displayName}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
            {expert.headline || 'Independent product expert.'}
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
          {expert.bio || 'Profile evidence, services, and availability are maintained by the expert.'}
        </Typography>
        <TagRow value={expert.skills} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component={NextLink} href={`/expert-network/experts/${expert.id}`} variant="outlined" fullWidth sx={{ minHeight: 42 }}>
            View Profile
          </Button>
          <Button onClick={onMessage} variant="outlined" fullWidth disabled={!!busy} startIcon={<ChatBubbleOutline />} sx={{ minHeight: 42 }}>
            Message
          </Button>
          <Button onClick={onInvite} variant={inviteVariant} color={inviteColor} fullWidth disabled={!!busy || !!inviteDisabled} startIcon={<GroupAddOutlined />} sx={{ minHeight: 42 }}>
            {inviteLabel}
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
