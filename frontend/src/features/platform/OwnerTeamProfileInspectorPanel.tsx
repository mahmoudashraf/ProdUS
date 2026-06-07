'use client';

import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { teamVerificationScore } from './ownerTeamMatchConfig';
import { Team, TeamCapability, TeamMember, TeamReputationEvent } from './types';

export function TeamProfileInspectorPanel({
  team,
  capabilities,
  members,
  reputation,
  canManageRoster,
  capabilityForm,
  memberForm,
  reputationForm,
}: {
  team?: Team | undefined;
  capabilities: TeamCapability[];
  members: TeamMember[];
  reputation: TeamReputationEvent[];
  canManageRoster: boolean;
  capabilityForm?: ReactNode;
  memberForm?: ReactNode;
  reputationForm?: ReactNode;
}) {
  if (!team) {
    return <EmptyState label="Select a team to inspect capability evidence, delivery members, and workspace-backed reputation." />;
  }

  return (
    <Surface>
      <SectionTitle title={team.name} action={<StatusChip label={formatLabel(team.verificationStatus)} color="success" />} />
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <ProgressRing value={teamVerificationScore(team)} size={88} color={appleColors.cyan} label="profile" />
          <Box>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {team.capabilitiesSummary || team.description || 'Capability evidence is maintained by the delivery team and platform operations.'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
              <PastelChip label={team.timezone || 'Remote delivery'} accent={appleColors.cyan} />
              <PastelChip label={team.typicalProjectSize || 'Scoped after intake'} accent={appleColors.green} />
            </Stack>
          </Box>
        </Stack>

        {capabilityForm}

        <Box>
          <SectionTitle title="Capability Evidence" />
          {capabilities.length ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {capabilities.map((capability) => (
                <PastelChip
                  key={capability.id}
                  label={capability.serviceModule?.name || capability.serviceCategory.name}
                  accent={appleColors.cyan}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Capability evidence is maintained by team leads and platform operations.
            </Typography>
          )}
        </Box>

        {canManageRoster && memberForm}

        {canManageRoster && (
          <Box>
            <SectionTitle title="Delivery Members" />
            {members.length ? (
              <Stack spacing={1}>
                {members.map((member) => (
                  <Stack key={member.id} direction="row" justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                    <Typography variant="body2">{member.user.email}</Typography>
                    <Typography variant="body2" color="text.secondary">{formatLabel(member.role)}</Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">Delivery members appear after the team lead builds the roster.</Typography>
            )}
          </Box>
        )}

        {reputationForm}

        <Box>
          <SectionTitle title="Workspace Reputation" />
          <Stack spacing={1}>
            {reputation.length ? (
              reputation.map((event) => (
                <Stack key={event.id} direction="row" justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                  <Typography variant="body2">{event.rating}/5 · {formatLabel(event.eventType)}</Typography>
                  <Typography variant="body2" color={event.verified ? 'success.main' : 'text.secondary'}>
                    {event.verified ? 'Verified' : 'Pending review'}
                  </Typography>
                </Stack>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">Reputation appears after workspace-backed owner reviews.</Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Surface>
  );
}
