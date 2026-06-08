'use client';

import NextLink from 'next/link';
import type { ReactNode } from 'react';
import { Alert, Avatar, Box, Button, Stack, Typography } from '@mui/material';
import type { PlatformNotification } from '@/features/platform/types';
import {
  EmptyState,
  PastelChip,
  appleColors,
  formatLabel,
} from '@/features/platform/PlatformComponents';
import { displayName, formatDate, initials, serviceColors, splitTags } from './networkPresentation';

export function TagRow({ value, limit = 5 }: { value?: string | undefined; limit?: number | undefined }) {
  const tags = splitTags(value).slice(0, limit);
  if (!tags.length) return <Typography color="text.secondary">No service tags yet.</Typography>;
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {tags.map((tag, index) => (
        <PastelChip key={tag} label={tag} accent={serviceColors[index % serviceColors.length] || appleColors.purple} />
      ))}
    </Stack>
  );
}

export function PersonAvatar({
  name,
  src,
  square,
}: {
  name?: string | undefined;
  src?: string | undefined;
  square?: boolean | undefined;
}) {
  return (
    <Avatar
      variant={square ? 'rounded' : 'circular'}
      {...(src ? { src } : {})}
      sx={{
        width: 52,
        height: 52,
        bgcolor: '#eef2ff',
        color: appleColors.purple,
        fontWeight: 900,
        borderRadius: square ? 2 : undefined,
      }}
    >
      {initials(name)}
    </Avatar>
  );
}

export function NetworkNotice({
  message,
  severity = 'success',
}: {
  message: string | null;
  severity?: 'success' | 'error' | 'info';
}) {
  if (!message) return null;
  return <Alert severity={severity} sx={{ mb: 2, borderRadius: 2 }}>{message}</Alert>;
}

export function ActivityRow({
  notification,
  action,
}: {
  notification: PlatformNotification;
  action?: ReactNode;
}) {
  const unread = notification.status === 'UNREAD';
  return (
    <Box sx={{ p: 1.5, border: `1px solid ${unread ? appleColors.purple : appleColors.line}`, borderRadius: 2, bgcolor: unread ? '#eef2ff' : '#fff' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: unread ? appleColors.purple : appleColors.line, mt: 0.7, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900 }}>{notification.title}</Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>{notification.body || formatLabel(notification.type)}</Typography>
            <Typography variant="caption" color="text.secondary">{formatDate(notification.createdAt)} · {formatLabel(notification.priority)}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          {notification.actionUrl && <Button component={NextLink} href={notification.actionUrl} size="small">Open</Button>}
          {action}
        </Stack>
      </Stack>
    </Box>
  );
}

export function NetworkEmptyState({ label }: { label: string }) {
  return <EmptyState label={label} />;
}

export { displayName, formatDate };
