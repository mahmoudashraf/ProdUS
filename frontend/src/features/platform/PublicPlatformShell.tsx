'use client';

import NextLink from 'next/link';
import { ReactNode } from 'react';
import { Box, Button, Container, Stack } from '@mui/material';
import Logo from '@/components/ui-component/Logo';
import useAuth from '@/hooks/useAuth';
import { appleColors } from './PlatformComponents';

const navItems = [
  { label: 'Services', href: '/services' },
  { label: 'Teams', href: '/teams' },
  { label: 'Solo Experts', href: '/solo-experts' },
];

export default function PublicPlatformShell({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fbff', color: appleColors.ink }}>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          bgcolor: 'rgba(255,255,255,0.9)',
          borderBottom: `1px solid ${appleColors.line}`,
          backdropFilter: 'blur(18px)',
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ minHeight: 76 }}
          >
            <NextLink href="/" aria-label="ProdOps Network home" style={{ color: 'inherit', textDecoration: 'none' }}>
              <Logo />
            </NextLink>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  component={NextLink}
                  href={item.href}
                  variant="text"
                  sx={{ minHeight: 42, px: 1.5, color: '#334155', fontWeight: 800 }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                component={NextLink}
                href={isLoggedIn ? '/dashboard' : '/login'}
                variant="outlined"
                sx={{ minHeight: 42, minWidth: 104 }}
              >
                Dashboard
              </Button>
              {!isLoggedIn && (
                <Button component={NextLink} href="/login" variant="contained" sx={{ minHeight: 42, minWidth: 104 }}>
                  Log in
                </Button>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        {children}
      </Container>
    </Box>
  );
}
