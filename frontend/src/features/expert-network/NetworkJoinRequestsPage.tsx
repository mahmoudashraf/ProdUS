'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EmptyState,
  PageHeader,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from '@/features/platform/PlatformComponents';
import type { TeamJoinRequest } from '@/features/platform/types';
import { networkApi } from './api';
import { displayName } from './NetworkSharedPanels';

export function NetworkJoinRequestsPage() {
  const queryClient = useQueryClient();
  const sent = useQuery({ queryKey: ['network', 'my-join-requests'], queryFn: networkApi.myJoinRequests });
  const myTeams = useQuery({ queryKey: ['network', 'my-teams'], queryFn: networkApi.myTeams });
  const selectedTeam = myTeams.data?.[0];
  const received = useQuery({
    queryKey: ['network', 'team-join-requests', selectedTeam?.id],
    queryFn: () => networkApi.teamJoinRequests(selectedTeam!.id),
    enabled: !!selectedTeam,
  });
  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TeamJoinRequest['status'] }) => networkApi.reviewJoinRequest(id, { status, reviewNote: `Marked ${status.toLowerCase()} from Network join-request console.` }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['network', 'team-join-requests', selectedTeam?.id] }),
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Join Requests" description="Structured membership decisions with clear team, requester, status, and review trail." />
      <QueryState isLoading={sent.isLoading || myTeams.isLoading || received.isLoading} error={sent.error || myTeams.error || received.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        <Surface>
          <SectionTitle title="Requests you sent" />
          <Stack spacing={1.5}>
            {(sent.data || []).map((request) => (
              <Box key={request.id} sx={{ p: 1.5, border: `1px solid ${appleColors.line}`, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900 }}>{request.team?.name}</Typography>
                    <Typography color="text.secondary">{request.message}</Typography>
                  </Box>
                  <StatusChip label={formatLabel(request.status)} />
                </Stack>
              </Box>
            ))}
            {!sent.data?.length && <EmptyState label="No join requests sent yet. Apply from Directory or Formation Board." />}
          </Stack>
        </Surface>
        <Surface>
          <SectionTitle title={`Requests for ${selectedTeam?.name || 'your team'}`} />
          <Stack spacing={1.5}>
            {(received.data || []).map((request) => {
              const canReview = request.status === 'PENDING';
              return (
                <Box key={request.id} sx={{ p: 1.5, border: `1px solid ${appleColors.line}`, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900 }}>{displayName(request.requester?.email)}</Typography>
                        <Typography color="text.secondary">{request.message}</Typography>
                      </Box>
                      <StatusChip label={formatLabel(request.status)} />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <Button variant="contained" disabled={!canReview || review.isPending} onClick={() => review.mutate({ id: request.id, status: 'APPROVED' })} sx={{ width: { xs: '100%', sm: 'auto' } }}>Accept</Button>
                      <Button variant="outlined" color="error" disabled={!canReview || review.isPending} onClick={() => review.mutate({ id: request.id, status: 'DECLINED' })} sx={{ width: { xs: '100%', sm: 'auto' } }}>Decline</Button>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
            {!received.data?.length && <EmptyState label="No pending requests for your active team." />}
          </Stack>
        </Surface>
      </Box>
    </Stack>
  );
}
