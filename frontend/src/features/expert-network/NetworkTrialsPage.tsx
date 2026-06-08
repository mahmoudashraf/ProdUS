'use client';

import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EmptyState,
  PageHeader,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  formatLabel,
} from '@/features/platform/PlatformComponents';
import { networkApi } from './api';
import { NetworkNotice, formatDate } from './NetworkSharedPanels';
import { trialActionsForStatus, type TrialAction } from './networkPresentation';
import type { TrialPayload } from './types';

export function NetworkTrialsPage() {
  const queryClient = useQueryClient();
  const trials = useQuery({ queryKey: ['network', 'trials'], queryFn: networkApi.trials });
  const myTeams = useQuery({ queryKey: ['network', 'my-teams'], queryFn: networkApi.myTeams });
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<TrialPayload>({ title: '', scope: '', proposedStartDate: '', proposedEndDate: '' });
  const create = useMutation({
    mutationFn: () => networkApi.createTrial({ ...form, teamId: myTeams.data?.[0]?.id }),
    onSuccess: () => {
      setForm({ title: '', scope: '', proposedStartDate: '', proposedEndDate: '' });
      setNotice('Trial collaboration created.');
      queryClient.invalidateQueries({ queryKey: ['network', 'trials'] });
    },
    onError: (error: Error) => setNotice(error.message),
  });
  const action = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TrialAction }) => networkApi.updateTrial(id, status),
    onSuccess: (trial) => {
      setNotice(`Trial status updated to ${formatLabel(trial.status)}.`);
      queryClient.invalidateQueries({ queryKey: ['network', 'trials'] });
    },
    onError: (error: Error) => setNotice(error.message),
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Trial Collaborations" description="Run scoped trial collaborations before team formation." />
      <QueryState isLoading={trials.isLoading || myTeams.isLoading} error={trials.error || myTeams.error} />
      <NetworkNotice message={notice} severity={create.isError || action.isError ? 'error' : 'success'} />
      <Surface>
        <SectionTitle title="Propose trial" />
        <Stack spacing={2}>
          <TextField label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <TextField label="Scope" multiline minRows={3} value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Start date" type="date" InputLabelProps={{ shrink: true }} value={form.proposedStartDate} onChange={(event) => setForm({ ...form, proposedStartDate: event.target.value })} />
            <TextField label="End date" type="date" InputLabelProps={{ shrink: true }} value={form.proposedEndDate} onChange={(event) => setForm({ ...form, proposedEndDate: event.target.value })} />
          </Box>
          <Button variant="contained" disabled={!form.title || create.isPending} onClick={() => create.mutate()} sx={{ alignSelf: 'flex-end', width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}>Create Trial</Button>
        </Stack>
      </Surface>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 2.5 }}>
        {(trials.data || []).map((trial) => (
          <Surface key={trial.id}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h3">{trial.title}</Typography>
                  <Typography color="text.secondary">{trial.team?.name || 'Independent collaboration'} · {formatDate(trial.proposedStartDate)} to {formatDate(trial.proposedEndDate)}</Typography>
                </Box>
                <StatusChip label={formatLabel(trial.status)} />
              </Stack>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{trial.scope}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {trialActionsForStatus(trial.status).map((trialAction) => {
                  const isBusy = action.isPending && action.variables?.id === trial.id;
                  return (
                    <Button
                      key={trialAction.label}
                      variant={trialAction.variant}
                      color={trialAction.color}
                      onClick={() => trialAction.action && action.mutate({ id: trial.id, status: trialAction.action })}
                      disabled={trialAction.disabled || isBusy}
                      sx={{ minHeight: 42, width: { xs: '100%', sm: 'auto' } }}
                    >
                      {trialAction.label}
                    </Button>
                  );
                })}
              </Stack>
            </Stack>
          </Surface>
        ))}
        {!trials.data?.length && <EmptyState label="No trial collaborations yet. Propose a scoped trial when a team or specialist relationship needs evidence before commitment." />}
      </Box>
    </Stack>
  );
}
