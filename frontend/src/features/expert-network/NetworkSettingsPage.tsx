'use client';

import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader,
  QueryState,
  Surface,
  appleColors,
  formatLabel,
} from '@/features/platform/PlatformComponents';
import { networkApi } from './api';
import { NetworkNotice } from './NetworkSharedPanels';
import type { UserAccount } from './types';

export function NetworkSettingsPage() {
  const queryClient = useQueryClient();
  const account = useQuery({ queryKey: ['network', 'account'], queryFn: networkApi.account });
  const [form, setForm] = useState<Partial<UserAccount>>({});
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (account.data) {
      setForm({
        firstName: account.data.firstName || '',
        lastName: account.data.lastName || '',
      });
    }
  }, [account.data]);
  const save = useMutation({
    mutationFn: () => networkApi.updateAccount({ firstName: form.firstName || '', lastName: form.lastName || '' }),
    onSuccess: () => {
      setNotice('Account settings saved.');
      queryClient.invalidateQueries({ queryKey: ['network', 'account'] });
    },
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Account Settings" description="Manage identity details shared across Studio and Network. Email, role, and auth provider are controlled by the platform." />
      <QueryState isLoading={account.isLoading} error={account.error} />
      <NetworkNotice message={notice} />
      <Surface>
        <Stack spacing={2.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField label="First name" value={form.firstName || ''} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
            <TextField label="Last name" value={form.lastName || ''} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Email" value={account.data?.email || ''} InputProps={{ readOnly: true }} />
            <TextField label="Role" value={formatLabel(account.data?.role || 'SPECIALIST')} InputProps={{ readOnly: true }} />
          </Box>
          <Box sx={{ p: 2, border: `1px solid ${appleColors.line}`, borderRadius: 2, bgcolor: '#f8fafc' }}>
            <Typography sx={{ fontWeight: 900, mb: 0.5 }}>Subdomain session model</Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              Production auth should use a server-managed session cookie scoped to .produs.com so Network and Studio share the same signed-in account.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button component={NextLink} href="/expert-network/profile" variant="outlined">Expert profile</Button>
              <Button component={NextLink} href="/expert-network/team-profile" variant="outlined">Team profile</Button>
              <Button component={NextLink} href="/dashboard" variant="outlined">Dashboard</Button>
            </Stack>
            <Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending} sx={{ minHeight: 44 }}>
              Save Settings
            </Button>
          </Stack>
        </Stack>
      </Surface>
    </Stack>
  );
}
