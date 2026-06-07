'use client';

import { PersonAddAltOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  SectionTitle,
  StatusChip,
  Surface,
  TextInput,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { Team, TeamInvitation, TeamJoinRequest } from './types';

export default function TeamAccessPanel({
  invitations,
  joinableTeams,
  joinRequests,
  joinMessage,
  respondInvitationPending,
  requestJoinPending,
  onJoinMessageChange,
  onRespondInvitation,
  onRequestJoin,
}: {
  invitations: TeamInvitation[];
  joinableTeams: Team[];
  joinRequests: TeamJoinRequest[];
  joinMessage: string;
  respondInvitationPending: boolean;
  requestJoinPending: boolean;
  onJoinMessageChange: (message: string) => void;
  onRespondInvitation: (id: string, status: TeamInvitation['status']) => void;
  onRequestJoin: (teamId: string) => void;
}) {
  return (
    <Stack spacing={2.5}>
      <Surface>
        <SectionTitle title="Incoming Invitations" action={<PersonAddAltOutlined sx={{ color: appleColors.green }} />} />
        <Stack spacing={1.25}>
          {invitations.length ? invitations.slice(0, 5).map((invitation) => (
            <Box key={invitation.id} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.25 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900 }} noWrap>{invitation.team?.name || 'Team invitation'}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>{formatLabel(invitation.role)} from {invitation.invitedBy?.email || 'team lead'}</Typography>
                </Box>
                <StatusChip label={invitation.status} color={invitation.status === 'PENDING' ? 'warning' : invitation.status === 'ACCEPTED' ? 'success' : 'error'} />
              </Stack>
              {invitation.message && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
                  {invitation.message}
                </Typography>
              )}
              {invitation.status === 'PENDING' && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onRespondInvitation(invitation.id, 'ACCEPTED')}
                    disabled={respondInvitationPending}
                    sx={{ minHeight: 36 }}
                  >
                    Accept
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onRespondInvitation(invitation.id, 'DECLINED')}
                    disabled={respondInvitationPending}
                    sx={{ minHeight: 36 }}
                  >
                    Decline
                  </Button>
                </Stack>
              )}
            </Box>
          )) : (
            <Typography variant="body2" color="text.secondary">Team invitations sent to your email appear here for acceptance.</Typography>
          )}
        </Stack>
      </Surface>

      <Surface>
        <SectionTitle title="Join or Create" />
        <Stack spacing={1.5}>
          <TextInput label="Join request note" value={joinMessage} onChange={onJoinMessageChange} multiline />
          {joinableTeams.slice(0, 5).map((team) => {
            const existingRequest = joinRequests.find((request) => request.team?.id === team.id);
            return (
              <Stack
                key={team.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                alignItems={{ sm: 'center' }}
                justifyContent="space-between"
                sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.25 }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900 }}>{team.name}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>{team.headline || team.capabilitiesSummary || team.description}</Typography>
                </Box>
                {existingRequest ? (
                  <StatusChip label={existingRequest.status} color={existingRequest.status === 'PENDING' ? 'warning' : 'success'} />
                ) : (
                  <Button size="small" variant="outlined" onClick={() => onRequestJoin(team.id)} disabled={requestJoinPending}>
                    Ask to join
                  </Button>
                )}
              </Stack>
            );
          })}
          {!joinableTeams.length && <DotLabel label="You currently lead or belong to every available team." color={appleColors.green} />}
        </Stack>
      </Surface>
    </Stack>
  );
}
