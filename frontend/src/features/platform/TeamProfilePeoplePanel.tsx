'use client';

import type { FormEventHandler } from 'react';
import { HowToRegOutlined, PersonAddAltOutlined } from '@mui/icons-material';
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  TextInput,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { Team, TeamInvitation, TeamJoinRequest, TeamMember } from './types';
import type { TeamInvitationPayload } from './teamProfileStudioTypes';

const roleOptions: TeamMember['role'][] = ['SPECIALIST', 'DELIVERY_MANAGER', 'QUALITY_REVIEWER', 'ADVISOR', 'LEAD'];

export default function TeamProfilePeoplePanel({
  selectedTeam,
  canManageSelectedTeam,
  inviteForm,
  inviteNotice,
  invitePending,
  respondInvitationPending,
  reviewJoinPending,
  members,
  invitations,
  joinRequests,
  onInviteFormChange,
  onSubmitInvitation,
  onCancelInvitation,
  onReviewJoinRequest,
}: {
  selectedTeam?: Team | undefined;
  canManageSelectedTeam: boolean;
  inviteForm: TeamInvitationPayload;
  inviteNotice: { severity: 'success' | 'error'; message: string } | null;
  invitePending: boolean;
  respondInvitationPending: boolean;
  reviewJoinPending: boolean;
  members: TeamMember[];
  invitations: TeamInvitation[];
  joinRequests: TeamJoinRequest[];
  onInviteFormChange: (patch: Partial<TeamInvitationPayload>) => void;
  onSubmitInvitation: FormEventHandler<HTMLFormElement>;
  onCancelInvitation: (id: string) => void;
  onReviewJoinRequest: (id: string, status: TeamJoinRequest['status']) => void;
}) {
  if (!selectedTeam) {
    return <EmptyState label="Create or select a team profile before managing people." />;
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: canManageSelectedTeam ? '1fr 1fr' : '1fr' }, gap: 2.5 }}>
      <Surface>
        <SectionTitle title="Members and Invitations" action={<PersonAddAltOutlined sx={{ color: appleColors.green }} />} />
        <Stack spacing={2}>
          {canManageSelectedTeam && (
            <Box
              component="form"
              noValidate
              onSubmit={onSubmitInvitation}
              sx={{
                p: 1.5,
                border: '1px solid',
                borderColor: appleColors.line,
                borderRadius: 1,
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
              }}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 170px' }, gap: 1 }}>
                <TextField
                  size="small"
                  label="Invite email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) => onInviteFormChange({ email: event.target.value })}
                />
                <TextField
                  select
                  size="small"
                  label="Role"
                  value={inviteForm.role}
                  onChange={(event) => onInviteFormChange({ role: event.target.value as TeamMember['role'] })}
                >
                  {roleOptions.map((role) => <MenuItem key={role} value={role}>{formatLabel(role)}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ mt: 1 }}>
                <TextInput label="Invitation note" value={inviteForm.message} onChange={(value) => onInviteFormChange({ message: value })} multiline />
              </Box>
              {inviteNotice && (
                <Alert severity={inviteNotice.severity} sx={{ mt: 1.25, borderRadius: 1 }}>
                  {inviteNotice.message}
                </Alert>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={!inviteForm.email.trim() || invitePending}
                sx={{ mt: 1.25, minHeight: 44, minWidth: 160, boxShadow: '0 12px 26px rgba(98, 92, 255, 0.18)' }}
              >
                {invitePending ? 'Sending...' : 'Send invitation'}
              </Button>
            </Box>
          )}

          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0, fontWeight: 900 }}>Active members</Typography>
            {members.length ? members.map((member) => (
              <Stack key={member.id} direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800 }} noWrap>{member.user.email}</Typography>
                  <Typography variant="body2" color="text.secondary">{member.active ? 'Active team access' : 'Inactive access'}</Typography>
                </Box>
                <PastelChip label={formatLabel(member.role)} accent={appleColors.cyan} />
              </Stack>
            )) : (
              <Typography variant="body2" color="text.secondary">Members appear after profile creation, invitation acceptance, or approved join requests.</Typography>
            )}
          </Stack>

          {canManageSelectedTeam && (
            <Stack spacing={1}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0, fontWeight: 900 }}>Invitation pipeline</Typography>
              {invitations.length ? invitations.slice(0, 6).map((invitation) => (
                <Stack key={invitation.id} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} noWrap>{invitation.email}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {formatLabel(invitation.role)}{invitation.message ? ` - ${invitation.message}` : ''}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StatusChip label={invitation.status} color={invitation.status === 'PENDING' ? 'warning' : invitation.status === 'CANCELLED' || invitation.status === 'DECLINED' ? 'error' : 'success'} />
                    {invitation.status === 'PENDING' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onCancelInvitation(invitation.id)}
                        disabled={respondInvitationPending}
                        sx={{ minHeight: 34 }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Stack>
                </Stack>
              )) : (
                <Typography variant="body2" color="text.secondary">Sent invitations and acceptance status appear here.</Typography>
              )}
            </Stack>
          )}
        </Stack>
      </Surface>

      {canManageSelectedTeam && (
        <Surface>
          <SectionTitle title="Join Requests" action={<HowToRegOutlined sx={{ color: appleColors.amber }} />} />
          <Stack spacing={1.25}>
            {joinRequests.length ? joinRequests.map((request) => (
              <Box key={request.id} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.25 }}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>{request.requester?.email}</Typography>
                    <Typography variant="body2" color="text.secondary">{request.message || 'No note provided.'}</Typography>
                  </Box>
                  <StatusChip label={request.status} color={request.status === 'PENDING' ? 'warning' : 'success'} />
                </Stack>
                {request.status === 'PENDING' && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button size="small" variant="contained" onClick={() => onReviewJoinRequest(request.id, 'APPROVED')} disabled={reviewJoinPending}>Approve</Button>
                    <Button size="small" variant="outlined" onClick={() => onReviewJoinRequest(request.id, 'DECLINED')} disabled={reviewJoinPending}>Decline</Button>
                  </Stack>
                )}
              </Box>
            )) : (
              <Typography variant="body2" color="text.secondary">Requests from solo experts appear here for team lead review.</Typography>
            )}
          </Stack>
        </Surface>
      )}
    </Box>
  );
}
