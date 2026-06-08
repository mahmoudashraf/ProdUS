'use client';

import { useParams } from 'next/navigation';
import { ChatBubbleOutline, PersonAddAltOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PastelChip,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
} from '@/features/platform/PlatformComponents';
import type { TeamJoinRequest } from '@/features/platform/types';
import { networkApi } from './api';
import { PersonAvatar, TagRow } from './NetworkSharedPanels';
import { detailCoverSx } from './networkProfileCover';
import { joinRequestForTeam, messageFor } from './networkPresentation';
import { useNetworkMessageAction } from './useNetworkMessageAction';

export function NetworkTeamDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const queryClient = useQueryClient();
  const team = useQuery({ queryKey: ['network', 'team', id], queryFn: () => networkApi.team(id), enabled: !!id });
  const myTeams = useQuery({ queryKey: ['network', 'my-teams'], queryFn: networkApi.myTeams });
  const sentJoinRequests = useQuery({ queryKey: ['network', 'join-requests', 'mine'], queryFn: networkApi.myJoinRequests });
  const messageAction = useNetworkMessageAction();
  const join = useMutation({
    mutationFn: () => networkApi.requestToJoinTeam(id, { message: `I would like to discuss joining ${team.data?.name}.` }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['network', 'join-requests', 'mine'] }),
  });
  const cancelJoin = useMutation({
    mutationFn: (request: TeamJoinRequest) => networkApi.reviewJoinRequest(request.id, { status: 'CANCELLED', reviewNote: 'Cancelled by requester.' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['network', 'join-requests', 'mine'] }),
  });
  const record = team.data;
  const request = record ? joinRequestForTeam(sentJoinRequests.data, record.id) : undefined;
  const isMember = !!record && (myTeams.data || []).some((myTeam) => myTeam.id === record.id);
  const isPending = request?.status === 'PENDING';
  const isApproved = request?.status === 'APPROVED' || isMember;
  return (
    <Stack spacing={3}>
      <QueryState isLoading={team.isLoading || myTeams.isLoading || sentJoinRequests.isLoading} error={team.error || myTeams.error || sentJoinRequests.error} />
      {record && (
        <>
          <Surface sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={detailCoverSx(record.coverPhotoUrl)} />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }} sx={{ px: 3, pb: 3, mt: -4 }}>
              <PersonAvatar name={record.name} src={record.profilePhotoUrl} square />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h1">{record.name}</Typography>
                <Typography color="text.secondary">{record.headline || record.description}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                  <StatusChip label={record.verificationStatus} />
                  <PastelChip label={record.typicalProjectSize || 'Scoped packages'} />
                </Stack>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
                <Button variant="outlined" startIcon={<ChatBubbleOutline />} onClick={() => messageAction.mutate({ scopeType: 'TEAM_PROFILE', scopeId: record.id, title: `Conversation with ${record.name}`, initialMessage: messageFor(record.name) })} sx={{ width: { xs: '100%', sm: 'auto' } }}>Message</Button>
                <Button
                  variant={isPending || isApproved ? 'outlined' : 'contained'}
                  color={isPending ? 'error' : isApproved ? 'success' : 'primary'}
                  startIcon={<PersonAddAltOutlined />}
                  onClick={() => {
                    if (isPending && request) {
                      cancelJoin.mutate(request);
                      return;
                    }
                    join.mutate();
                  }}
                  disabled={isApproved || join.isPending || cancelJoin.isPending}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {isApproved ? 'Joined' : isPending ? 'Cancel Request' : 'Request To Join'}
                </Button>
              </Stack>
            </Stack>
          </Surface>
          {join.isSuccess && <Alert severity="success">Join request submitted.</Alert>}
          {cancelJoin.isSuccess && <Alert severity="success">Join request cancelled.</Alert>}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' }, gap: 2.5 }}>
            <Surface>
              <SectionTitle title="Team focus" />
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{record.bio || record.description}</Typography>
            </Surface>
            <Surface>
              <SectionTitle title="Verified capabilities" />
              <TagRow value={record.capabilitiesSummary} limit={12} />
            </Surface>
          </Box>
        </>
      )}
    </Stack>
  );
}
