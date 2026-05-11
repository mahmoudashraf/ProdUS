'use client';

import {
  Avatar,
  Box,
  Button,
  CardActions,
  Chip,
  ClickAwayListener,
  Divider,
  Grid,
  Paper,
  Popper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconBell } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';

import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';
import apiClient from '@/lib/api-client';
import { NotificationSummary, PlatformNotification } from '@/features/platform/types';

import NotificationList from './NotificationList';

const statusOptions = [
  { value: '', label: 'All notifications' },
  { value: 'UNREAD', label: 'Unread' },
  { value: 'READ', label: 'Read' },
];

const fetchSummary = async () => {
  const response = await apiClient.get<NotificationSummary>('/notifications/summary');
  return response.data;
};

const fetchNotifications = async (status: string) => {
  const response = await apiClient.get<PlatformNotification[]>('/notifications', {
    params: status ? { status } : undefined,
  });
  return response.data;
};

const NotificationSection = () => {
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const summary = useQuery({
    queryKey: ['notification-summary'],
    queryFn: fetchSummary,
    refetchInterval: 30000,
    retry: false,
  });
  const notifications = useQuery({
    queryKey: ['notifications', status],
    queryFn: () => fetchNotifications(status),
    enabled: open,
    retry: false,
  });

  const markRead = useMutation({
    mutationFn: (notification: PlatformNotification) => apiClient.put(`/notifications/${notification.id}/read`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notification-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => apiClient.put('/notifications/read-all'),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notification-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
    },
  });

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as Node)) {
      return;
    }
    setOpen(false);
  };

  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current?.focus();
    }
    prevOpen.current = open;
  }, [open]);

  const unreadCount = summary.data?.unreadCount || 0;
  const list = notifications.data || summary.data?.latest || [];

  return (
    <>
      <Box
        sx={{
          ml: 2,
          [theme.breakpoints.down('lg')]: {
            mr: 2,
          },
        }}
      >
        <Avatar
          component="div"
          variant="rounded"
          sx={{
            ...theme.typography.commonAvatar,
            ...theme.typography.mediumAvatar,
            transition: 'all .2s ease-in-out',
            background: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.secondary.light,
            color: theme.palette.mode === 'dark' ? theme.palette.warning.dark : theme.palette.secondary.dark,
            position: 'relative',
            '&[aria-controls="menu-list-grow"],&:hover': {
              background: theme.palette.mode === 'dark' ? theme.palette.warning.dark : theme.palette.secondary.dark,
              color: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.secondary.light,
            },
          } as any}
          ref={anchorRef}
          aria-controls={open ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
          color="inherit"
        >
          <IconBell stroke={1.5} size="20px" />
          {unreadCount > 0 && (
            <Box
              component="span"
              sx={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'error.main',
              }}
            />
          )}
        </Avatar>
      </Box>

      <Popper
        placement={matchesXs ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [matchesXs ? 5 : 0, 20],
            },
          },
        ]}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Transitions position={matchesXs ? 'top' : 'top-right'} in={open} {...TransitionProps}>
              <Paper>
                {open && (
                  <MainCard border={false} elevation={16} content={false} boxShadow shadow={theme.shadows[16]}>
                    <Grid container direction="column" spacing={2}>
                      <Grid size={{ xs: 12 }}>
                        <Grid container alignItems="center" justifyContent="space-between" sx={{ pt: 2, px: 2 }}>
                          <Grid>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Typography variant="subtitle1">Notifications</Typography>
                              <Chip
                                size="small"
                                label={unreadCount}
                                sx={{
                                  color: theme.palette.background.default,
                                  bgcolor: unreadCount > 0 ? theme.palette.warning.dark : theme.palette.grey[500],
                                }}
                              />
                            </Stack>
                          </Grid>
                          <Grid>
                            <Button
                              size="small"
                              variant="text"
                              disabled={!unreadCount || markAllRead.isPending}
                              onClick={() => markAllRead.mutate()}
                            >
                              Mark all read
                            </Button>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <PerfectScrollbar style={{ height: '100%', maxHeight: 'calc(100vh - 205px)', overflowX: 'hidden' }}>
                          <Grid container direction="column" spacing={2}>
                            <Grid size={{ xs: 12 }}>
                              <Box sx={{ px: 2, pt: 0.25 }}>
                                <TextField select fullWidth value={status} onChange={(event) => setStatus(event.target.value)} SelectProps={{ native: true }}>
                                  {statusOptions.map((option) => (
                                    <option key={option.value || 'all'} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </TextField>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 12 }} p={0}>
                              <Divider sx={{ my: 0 }} />
                            </Grid>
                          </Grid>
                          {notifications.isLoading ? (
                            <Box sx={{ width: 330, px: 2, py: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Loading notifications...
                              </Typography>
                            </Box>
                          ) : (
                            <NotificationList notifications={list} onMarkRead={(notification) => markRead.mutate(notification)} />
                          )}
                        </PerfectScrollbar>
                      </Grid>
                    </Grid>
                    <Divider />
                    <CardActions sx={{ p: 1.25, justifyContent: 'center' }}>
                      <Button component={Link} href="/dashboard" size="small" disableElevation>
                        View dashboard
                      </Button>
                    </CardActions>
                  </MainCard>
                )}
              </Paper>
            </Transitions>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
};

export default NotificationSection;
