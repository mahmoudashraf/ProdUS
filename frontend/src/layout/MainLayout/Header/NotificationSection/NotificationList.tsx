import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import {
  IconAlertTriangle,
  IconBell,
  IconChecks,
  IconFileInvoice,
  IconFileUpload,
  IconHeadset,
  IconPackage,
  IconSignature,
} from '@tabler/icons-react';
import Link from 'next/link';

import { PlatformNotification } from '@/features/platform/types';

const ListItemWrapper = styled('div')(({ theme }) => ({
  padding: 16,
  '&:hover': {
    background: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.primary.light,
  },
  '& .MuiListItem-root': {
    padding: 0,
  },
}));

const formatTime = (value?: string) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const iconForType = (type: PlatformNotification['type']) => {
  if (type.startsWith('PROPOSAL')) {
    return IconPackage;
  }
  if (type.startsWith('CONTRACT')) {
    return IconSignature;
  }
  if (type.startsWith('INVOICE')) {
    return IconFileInvoice;
  }
  if (type.startsWith('SUPPORT')) {
    return IconHeadset;
  }
  if (type.startsWith('DISPUTE')) {
    return IconAlertTriangle;
  }
  if (type === 'EVIDENCE_ATTACHED') {
    return IconFileUpload;
  }
  return IconBell;
};

const colorForPriority = (priority: PlatformNotification['priority']) => {
  if (priority === 'CRITICAL') {
    return 'error';
  }
  if (priority === 'HIGH') {
    return 'warning';
  }
  if (priority === 'LOW') {
    return 'success';
  }
  return 'primary';
};

const NotificationList = ({
  notifications,
  onMarkRead,
}: {
  notifications: PlatformNotification[];
  onMarkRead: (notification: PlatformNotification) => void;
}) => {
  const theme = useTheme();

  if (!notifications.length) {
    return (
      <Box sx={{ width: 330, px: 2, py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          No notifications for this filter.
        </Typography>
      </Box>
    );
  }

  return (
    <List
      sx={{
        width: '100%',
        maxWidth: 360,
        py: 0,
        borderRadius: 1,
        [theme.breakpoints.down('md')]: {
          maxWidth: 320,
        },
      }}
    >
      {notifications.map((notification, index) => {
        const Icon = iconForType(notification.type);
        const priorityColor = colorForPriority(notification.priority);
        const actionUrl = notification.actionUrl || '/dashboard';
        return (
          <Box key={notification.id}>
            <ListItemWrapper>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      color: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette[priorityColor].dark,
                      backgroundColor:
                        theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette[priorityColor].light,
                      border: theme.palette.mode === 'dark' ? '1px solid' : 'none',
                      borderColor: theme.palette[priorityColor].main,
                    }}
                  >
                    <Icon stroke={1.5} size="20px" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle1">{notification.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(notification.createdAt)}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={1} sx={{ mt: 0.75 }}>
                      {notification.body && (
                        <Typography variant="body2" color="text.secondary">
                          {notification.body}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        {notification.status === 'UNREAD' && <Chip size="small" label="Unread" color="warning" />}
                        <Chip size="small" label={notification.priority.toLowerCase()} color={priorityColor} variant="outlined" />
                        <Button component={Link} href={actionUrl} size="small" variant="text" startIcon={<IconChecks size="16px" />}>
                          Open
                        </Button>
                        {notification.status === 'UNREAD' && (
                          <Button size="small" variant="text" onClick={() => onMarkRead(notification)}>
                            Mark read
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  }
                />
              </ListItem>
            </ListItemWrapper>
            {index < notifications.length - 1 && <Divider />}
          </Box>
        );
      })}
    </List>
  );
};

export default NotificationList;
