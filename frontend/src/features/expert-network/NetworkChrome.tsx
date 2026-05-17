'use client';

import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useMemo, useState } from 'react';
import {
  AutoAwesomeOutlined,
  ChatBubbleOutline,
  Diversity3Outlined,
  ExploreOutlined,
  ForumOutlined,
  HomeOutlined,
  HubOutlined,
  Inventory2Outlined,
  LogoutOutlined,
  ManageAccountsOutlined,
  NotificationsNoneOutlined,
  PersonOutline,
  SearchOutlined,
  SettingsOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Logo from '@/components/ui-component/Logo';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { appleColors } from '@/features/platform/PlatformComponents';
import { networkApi } from './api';

const networkNav = [
  {
    label: 'Home',
    href: '/expert-network',
    icon: HomeOutlined,
    section: 'Network',
  },
  {
    label: 'Directory',
    href: '/expert-network/directory',
    icon: ExploreOutlined,
    section: 'Discover',
  },
  {
    label: 'Formation Board',
    href: '/expert-network/formation',
    icon: Diversity3Outlined,
    section: 'Discover',
  },
  {
    label: 'Messages',
    href: '/expert-network/messages',
    icon: ChatBubbleOutline,
    section: 'Communicate',
    badge: 3,
  },
  {
    label: 'Notifications',
    href: '/expert-network/notifications',
    icon: NotificationsNoneOutlined,
    section: 'Communicate',
  },
  {
    label: 'Channels',
    href: '/expert-network/channels',
    icon: ForumOutlined,
    section: 'Communicate',
  },
  {
    label: 'Join Requests',
    href: '/expert-network/join-requests',
    icon: Inventory2Outlined,
    section: 'Collaborate',
    badge: 2,
  },
  {
    label: 'Trials',
    href: '/expert-network/trials',
    icon: HubOutlined,
    section: 'Collaborate',
  },
  {
    label: 'Expert Profile',
    href: '/expert-network/profile',
    icon: PersonOutline,
    section: 'My Space',
  },
  {
    label: 'Team Profile',
    href: '/expert-network/team-profile',
    icon: ShieldOutlined,
    section: 'My Space',
  },
];

const sectionOrder = ['Network', 'Discover', 'Communicate', 'Collaborate', 'My Space'];

const roleLabel: Record<string, string> = {
  ADMIN: 'Admin',
  PRODUCT_OWNER: 'Owner',
  TEAM_MANAGER: 'Team Lead',
  SPECIALIST: 'Solo Expert',
  ADVISOR: 'Advisor',
};

const initials = (email?: string) => {
  if (!email) return 'P';
  const name = (email.split('@')[0] ?? email).replace(/[._-]/g, ' ');
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

export default function NetworkChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/expert-network';
  const router = useRouter();
  const { user, signOut, hasRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const notificationSummary = useQuery({
    queryKey: ['network', 'notification-summary'],
    queryFn: networkApi.notificationSummary,
    refetchInterval: 30000,
  });
  const home = useQuery({
    queryKey: ['network', 'home'],
    queryFn: networkApi.home,
    staleTime: 30000,
  });
  const groupedNav = useMemo(
    () =>
      sectionOrder.map((section) => ({
        section,
        items: networkNav.filter((item) => item.section === section),
      })),
    []
  );
  const studioHref = hasRole(UserRole.PRODUCT_OWNER) ? '/owner/project-cart' : '/dashboard';
  const settingsActive = pathname === '/expert-network/settings';
  const unreadNotifications = notificationSummary.data?.unreadCount || 0;
  const messageCount = home.data?.conversations.length || 0;
  const joinRequestCount = home.data?.myJoinRequests.length || 0;

  const runSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/expert-network/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', color: appleColors.ink, overflowX: 'hidden' }}>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          bgcolor: 'rgba(255,255,255,0.9)',
          borderBottom: `1px solid ${appleColors.line}`,
          backdropFilter: 'blur(18px)',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ minHeight: 72, px: { xs: 2, md: 3 } }}
        >
          <Stack direction="row" spacing={{ xs: 1.5, md: 3 }} alignItems="center" sx={{ minWidth: { xs: 0, md: 260 }, flexShrink: 1 }}>
            <NextLink href="/" aria-label="ProdUS home" style={{ color: 'inherit', textDecoration: 'none' }}>
              <Logo />
            </NextLink>
            <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Button
                component={NextLink}
                href="/expert-network"
                variant="text"
                sx={{ color: appleColors.purple, fontWeight: 900, minHeight: 40, borderBottom: `2px solid ${appleColors.purple}`, borderRadius: 0 }}
              >
                Network
              </Button>
              <Button component={NextLink} href={studioHref} variant="text" sx={{ color: '#334155', fontWeight: 800, minHeight: 40 }}>
                Studio
              </Button>
            </Stack>
          </Stack>

          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              runSearch();
            }}
            sx={{ maxWidth: 540, flex: 1, display: { xs: 'none', md: 'block' } }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search experts, teams, channels..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#fff',
                  borderRadius: 2,
                  boxShadow: '0 10px 30px rgba(15,23,42,0.04)',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Notifications">
              <IconButton component={NextLink} href="/expert-network/notifications" aria-label="Notifications">
                <Badge color="primary" badgeContent={unreadNotifications}>
                  <NotificationsNoneOutlined />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Messages">
              <IconButton component={NextLink} href="/expert-network/messages" aria-label="Messages">
                <Badge color="primary" badgeContent={messageCount}>
                  <ChatBubbleOutline />
                </Badge>
              </IconButton>
            </Tooltip>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 1, display: { xs: 'none', sm: 'flex' } }}>
              <Avatar sx={{ width: 38, height: 38, bgcolor: '#eef2ff', color: appleColors.purple, fontWeight: 900 }}>
                {initials(user?.email)}
              </Avatar>
              <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }}>{user?.email?.split('@')[0] || 'ProdUS'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.role ? roleLabel[user.role] : 'Network'}
                </Typography>
              </Box>
              <Tooltip title="Sign out">
                <IconButton aria-label="Sign out" onClick={() => signOut()}>
                  <LogoutOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px minmax(0, 1fr)' } }}>
        <Box
          component="aside"
          sx={{
            minHeight: { md: 'calc(100vh - 72px)' },
            borderRight: { md: `1px solid ${appleColors.line}` },
            bgcolor: '#f8fafc',
            p: 2,
            display: { xs: 'none', md: 'block' },
          }}
        >
          <Stack spacing={2}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${appleColors.line}`,
                bgcolor: '#fff',
                boxShadow: '0 18px 40px rgba(15,23,42,0.04)',
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: '#eef2ff',
                    color: appleColors.purple,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <AutoAwesomeOutlined fontSize="small" />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>ProdUS Network</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Team formation and expert trust
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {groupedNav.map(({ section, items }) => (
              <Box key={section}>
                <Typography
                  variant="caption"
                  sx={{ px: 1, mb: 0.75, display: 'block', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8 }}
                >
                  {section}
                </Typography>
                <Stack spacing={0.5}>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/expert-network' && pathname.startsWith(item.href));
                    const badge = item.label === 'Messages'
                      ? messageCount
                      : item.label === 'Join Requests'
                        ? joinRequestCount
                        : item.label === 'Notifications'
                          ? unreadNotifications
                          : item.badge;
                    return (
                      <Button
                        key={item.href}
                        component={NextLink}
                        href={item.href}
                        fullWidth
                        startIcon={<Icon fontSize="small" />}
                        endIcon={badge ? <Box sx={{ px: 0.8, py: 0.25, borderRadius: 999, bgcolor: appleColors.purple, color: '#fff', fontSize: 11, fontWeight: 900 }}>{badge}</Box> : undefined}
                        sx={{
                          justifyContent: 'flex-start',
                          minHeight: 42,
                          px: 1.25,
                          borderRadius: 1.5,
                          color: isActive ? appleColors.purple : '#334155',
                          bgcolor: isActive ? '#eef2ff' : 'transparent',
                          borderLeft: isActive ? `2px solid ${appleColors.purple}` : '2px solid transparent',
                          fontWeight: 850,
                          '& .MuiButton-endIcon': { ml: 'auto' },
                        }}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Stack>
              </Box>
            ))}
            <Divider />
            <Button
              component={NextLink}
              href="/dashboard"
              startIcon={<ManageAccountsOutlined />}
              sx={{ justifyContent: 'flex-start', color: '#334155', fontWeight: 800 }}
            >
              Dashboard
            </Button>
            <Button
              component={NextLink}
              href="/expert-network/settings"
              startIcon={<SettingsOutlined />}
              sx={{
                justifyContent: 'flex-start',
                color: settingsActive ? appleColors.purple : '#334155',
                bgcolor: settingsActive ? '#eef2ff' : 'transparent',
                fontWeight: 800,
                borderLeft: settingsActive ? `2px solid ${appleColors.purple}` : '2px solid transparent',
              }}
            >
              Account Settings
            </Button>
          </Stack>
        </Box>

        <Box
          component="main"
          sx={{
            minWidth: 0,
            p: { xs: 2, md: 3.5 },
            maxWidth: { xs: '100vw', md: 1440 },
            width: { xs: '100vw', md: '100%' },
            boxSizing: 'border-box',
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
