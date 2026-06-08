'use client';

import { Inventory2Outlined, NotificationsNoneOutlined } from '@mui/icons-material';
import { Box, Button, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EmptyState,
  MetricTile,
  PageHeader,
  QueryState,
  Surface,
  appleColors,
} from '@/features/platform/PlatformComponents';
import { networkApi } from './api';
import { ActivityRow } from './NetworkSharedPanels';

export function NetworkNotificationsPage() {
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: ['network', 'notifications'], queryFn: networkApi.notifications });
  const markRead = useMutation({
    mutationFn: (id: string) => networkApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network', 'notifications'] });
      queryClient.invalidateQueries({ queryKey: ['network', 'notification-summary'] });
    },
  });
  const markAllRead = useMutation({
    mutationFn: networkApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network', 'notifications'] });
      queryClient.invalidateQueries({ queryKey: ['network', 'notification-summary'] });
    },
  });
  const unreadCount = (notifications.data || []).filter((notification) => notification.status === 'UNREAD').length;

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Notifications"
        description="Network activity from messages, formation posts, join requests, channel replies, and trial collaboration."
        action={<Button variant="outlined" onClick={() => markAllRead.mutate()} disabled={!unreadCount || markAllRead.isPending}>Mark all read</Button>}
      />
      <QueryState isLoading={notifications.isLoading} error={notifications.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '280px 1fr' }, gap: 2.5 }}>
        <Surface>
          <Stack spacing={2}>
            <MetricTile label="Unread" value={unreadCount} detail="Need attention" icon={<NotificationsNoneOutlined />} accent={appleColors.purple} />
            <MetricTile label="All activity" value={notifications.data?.length || 0} detail="Latest 50 events" icon={<Inventory2Outlined />} accent={appleColors.cyan} />
          </Stack>
        </Surface>
        <Surface>
          <Stack spacing={1.25}>
            {(notifications.data || []).map((notification) => (
              <ActivityRow
                key={notification.id}
                notification={notification}
                action={
                  notification.status === 'UNREAD' ? (
                    <Button size="small" variant="outlined" onClick={() => markRead.mutate(notification.id)} disabled={markRead.isPending}>
                      Mark read
                    </Button>
                  ) : undefined
                }
              />
            ))}
            {!notifications.data?.length && <EmptyState label="No notifications yet. Network activity will appear here as teams and experts collaborate." />}
          </Stack>
        </Surface>
      </Box>
    </Stack>
  );
}
