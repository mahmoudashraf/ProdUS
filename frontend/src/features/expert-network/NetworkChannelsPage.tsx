'use client';

import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AddOutlined, FavoriteBorderOutlined } from '@mui/icons-material';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EmptyState,
  PageHeader,
  PastelChip,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from '@/features/platform/PlatformComponents';
import { networkApi } from './api';
import { PersonAvatar, TagRow, displayName, formatDate } from './NetworkSharedPanels';

export function NetworkChannelsPage() {
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const channels = useQuery({ queryKey: ['network', 'channels'], queryFn: networkApi.channels });
  const selectedSlug = params?.get('channel') || channels.data?.[0]?.slug || 'introductions';
  const posts = useQuery({ queryKey: ['network', 'channel-posts', selectedSlug], queryFn: () => networkApi.channelPosts(selectedSlug), enabled: !!selectedSlug });
  const [postForm, setPostForm] = useState({ title: '', body: '', serviceTags: '' });
  const [reply, setReply] = useState<Record<string, string>>({});
  const createPost = useMutation({
    mutationFn: () => networkApi.createChannelPost(selectedSlug, postForm),
    onSuccess: () => {
      setPostForm({ title: '', body: '', serviceTags: '' });
      queryClient.invalidateQueries({ queryKey: ['network', 'channel-posts', selectedSlug] });
    },
  });
  const helpful = useMutation({
    mutationFn: (postId: string) => networkApi.markHelpful(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['network', 'channel-posts', selectedSlug] }),
  });
  const comment = useMutation({
    mutationFn: (postId: string) => networkApi.addComment(postId, { body: reply[postId] || '' }),
    onSuccess: (_, postId) => {
      setReply((current) => ({ ...current, [postId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['network', 'channel-posts', selectedSlug] });
    },
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Channels" description="Professional service-category discussion for experts and teams. No noisy public feed mechanics." />
      <QueryState isLoading={channels.isLoading || posts.isLoading} error={channels.error || posts.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' }, gap: 2.5 }}>
        <Surface>
          <SectionTitle title="All channels" />
          <Stack spacing={1}>
            {(channels.data || []).map((channel) => (
              <Button
                key={channel.id}
                component={NextLink}
                href={`/expert-network/channels?channel=${channel.slug}`}
                sx={{
                  justifyContent: 'flex-start',
                  border: `1px solid ${selectedSlug === channel.slug ? channel.color || appleColors.purple : appleColors.line}`,
                  bgcolor: selectedSlug === channel.slug ? '#eef2ff' : '#fff',
                  borderRadius: 2,
                  minHeight: 48,
                  color: appleColors.ink,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, width: '100%' }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: channel.color || appleColors.purple }} />
                  <Box sx={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 900 }}>#{channel.slug}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {channel.description}
                    </Typography>
                  </Box>
                </Stack>
              </Button>
            ))}
            {!channels.data?.length && <EmptyState label="No service channels are available yet." />}
          </Stack>
        </Surface>
        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="New post" />
            <Stack spacing={2}>
              <TextField label="Title" value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} />
              <TextField label="Body" multiline minRows={3} value={postForm.body} onChange={(event) => setPostForm({ ...postForm, body: event.target.value })} />
              <TextField label="Service tags" value={postForm.serviceTags} onChange={(event) => setPostForm({ ...postForm, serviceTags: event.target.value })} />
              <Button variant="contained" startIcon={<AddOutlined />} disabled={!postForm.title || !postForm.body || createPost.isPending} onClick={() => createPost.mutate()} sx={{ alignSelf: 'flex-end' }}>Publish</Button>
            </Stack>
          </Surface>
          {(posts.data || []).map((post) => (
            <Surface key={post.id}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5}>
                  <PersonAvatar name={post.author?.email} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h3">{post.title}</Typography>
                    <Typography color="text.secondary">{displayName(post.author?.email)} · {formatDate(post.createdAt)}</Typography>
                  </Box>
                  <StatusChip label={post.channel.name} />
                </Stack>
                <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>{post.body}</Typography>
                <TagRow value={post.serviceTags} />
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Button variant="outlined" startIcon={<FavoriteBorderOutlined />} onClick={() => helpful.mutate(post.id)}>Helpful {post.helpfulCount}</Button>
                  <PastelChip label={`${post.replyCount} replies`} accent={appleColors.cyan} />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField fullWidth size="small" label="Reply with useful context" value={reply[post.id] || ''} onChange={(event) => setReply({ ...reply, [post.id]: event.target.value })} />
                  <Button variant="contained" disabled={!reply[post.id] || comment.isPending} onClick={() => comment.mutate(post.id)}>Reply</Button>
                </Stack>
              </Stack>
            </Surface>
          ))}
          {!posts.data?.length && <EmptyState label="No posts in this channel yet." />}
        </Stack>
      </Box>
    </Stack>
  );
}
