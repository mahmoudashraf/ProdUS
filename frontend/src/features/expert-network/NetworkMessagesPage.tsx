'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SendOutlined } from '@mui/icons-material';
import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EmptyState,
  PageHeader,
  QueryState,
  Surface,
  appleColors,
  formatLabel,
} from '@/features/platform/PlatformComponents';
import { networkApi } from './api';
import { displayName, formatDate } from './NetworkSharedPanels';

export function NetworkMessagesPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams?.get('thread') ?? null);
  const [body, setBody] = useState('');
  const threads = useQuery({ queryKey: ['network', 'conversations'], queryFn: networkApi.conversations });
  const selected = selectedId || threads.data?.[0]?.id;
  useEffect(() => {
    if (!selectedId && threads.data?.[0]?.id) {
      setSelectedId(threads.data[0].id);
    }
  }, [selectedId, threads.data]);
  const detail = useQuery({ queryKey: ['network', 'conversation', selected], queryFn: () => networkApi.conversation(selected!), enabled: !!selected });
  const send = useMutation({
    mutationFn: () => networkApi.addMessage(selected!, { body }),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['network', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['network', 'conversation', selected] });
    },
  });
  const mute = useMutation({
    mutationFn: () => networkApi.mute(selected!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['network', 'conversation', selected] }),
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Messages" description="Every conversation is attached to a profile, opening, request, trial, or formation context." />
      <QueryState isLoading={threads.isLoading || detail.isLoading} error={threads.error || detail.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '360px 1fr' }, gap: 2.5, minHeight: 640 }}>
        <Surface>
          <Stack spacing={1.5}>
            <TextField size="small" label="Search threads" />
            {(threads.data || []).map((thread) => (
              <Button
                key={thread.id}
                onClick={() => setSelectedId(thread.id)}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  border: `1px solid ${selected === thread.id ? appleColors.purple : appleColors.line}`,
                  bgcolor: selected === thread.id ? '#eef2ff' : '#fff',
                  borderRadius: 2,
                  p: 1.5,
                  color: appleColors.ink,
                }}
              >
                <Stack spacing={0.5} sx={{ width: '100%' }}>
                  <Typography sx={{ fontWeight: 900 }}>{thread.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatLabel(thread.scopeType)} · {formatDate(thread.lastMessageAt || thread.createdAt)}</Typography>
                </Stack>
              </Button>
            ))}
            {!threads.data?.length && <EmptyState label="No messages yet. Start from an expert, team, or formation post." />}
          </Stack>
        </Surface>
        <Surface sx={{ display: 'flex', flexDirection: 'column' }}>
          {detail.data ? (
            <Stack spacing={2} sx={{ flex: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h3">{detail.data.title}</Typography>
                  <Typography color="text.secondary">{formatLabel(detail.data.scopeType)} · {detail.data.participants.length} participants</Typography>
                </Box>
                <Button variant="outlined" onClick={() => mute.mutate()} disabled={mute.isPending} sx={{ width: { xs: '100%', sm: 'auto' } }}>Mute</Button>
              </Stack>
              <Divider />
              <Stack spacing={1.5} sx={{ flex: 1, minHeight: 420 }}>
                {detail.data.messages.map((message) => (
                  <Box key={message.id} sx={{ alignSelf: message.sender?.id === detail.data?.createdBy?.id ? 'flex-start' : 'flex-end', maxWidth: { xs: '100%', sm: '72%' } }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: message.messageType === 'SYSTEM' ? '#f8fafc' : '#fff', border: `1px solid ${appleColors.line}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>{displayName(message.sender?.email)} · {formatDate(message.createdAt)}</Typography>
                      <Typography sx={{ mt: 0.5, lineHeight: 1.65 }}>{message.body}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField fullWidth label="Type a message" value={body} onChange={(event) => setBody(event.target.value)} />
                <Button variant="contained" startIcon={<SendOutlined />} disabled={!body || send.isPending} onClick={() => send.mutate()} sx={{ minWidth: 130 }}>Send</Button>
              </Stack>
            </Stack>
          ) : (
            <EmptyState label="Select a message thread." />
          )}
        </Surface>
      </Box>
    </Stack>
  );
}
