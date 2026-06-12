'use client';

import type { ReactNode } from 'react';
import NextLink from 'next/link';
import { ArrowForwardOutlined } from '@mui/icons-material';
import { Box, Button, Container, Stack, Typography } from '@mui/material';

export const colors = {
  ink: '#191435',
  muted: '#596275',
  line: '#e5dfd5',
  paper: '#fffaf2',
  cream: '#f7f1e8',
  white: '#fff',
  coral: '#ff6b3d',
  amber: '#ffb020',
  teal: '#0f9f8f',
  blue: '#2f6fed',
  purple: '#5c4bff',
  navy: '#171033',
};

const proofItems = [
  { label: 'Launch verdict', value: '2 blockers', detail: 'Security and release proof need closure.', accent: colors.coral },
  { label: 'AI opportunities', value: '5 found', detail: 'Three are ready for owner review.', accent: colors.purple },
  { label: 'Service path', value: 'Drafted', detail: 'Launch hardening is the next best step.', accent: colors.teal },
];

export const primaryButtonSx = {
  minHeight: 52,
  px: 2.4,
  borderRadius: 2,
  bgcolor: colors.coral,
  color: colors.white,
  fontWeight: 950,
  boxShadow: '0 16px 34px rgba(255,107,61,0.24)',
  '&:hover': { bgcolor: '#e95b31', boxShadow: '0 18px 38px rgba(255,107,61,0.30)' },
};

export const secondaryButtonSx = {
  minHeight: 52,
  px: 2.4,
  borderRadius: 2,
  borderColor: '#cfc6b8',
  color: colors.ink,
  bgcolor: 'rgba(255,255,255,0.52)',
  fontWeight: 950,
  '&:hover': { borderColor: colors.ink, bgcolor: 'rgba(255,255,255,0.82)' },
};

export const sectionTitleSx = {
  fontSize: { xs: 34, md: 52 },
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: 0,
  color: colors.ink,
};

export const sectionBodySx = {
  color: colors.muted,
  fontSize: { xs: 17, md: 19 },
  lineHeight: 1.7,
};

export function LandingHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Box component="header" sx={{ bgcolor: 'rgba(255,250,242,0.88)', borderBottom: `1px solid ${colors.line}`, backdropFilter: 'blur(18px)', position: 'sticky', top: 0, zIndex: 10 }}>
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: 76 }}>
          <NextLink href="/" aria-label="ProdUS home" style={{ color: 'inherit', textDecoration: 'none' }}>
            <Stack direction="row" spacing={1.15} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: colors.ink,
                  color: colors.white,
                  boxShadow: '0 12px 28px rgba(25,20,53,0.18)',
                }}
              >
                <Typography sx={{ fontWeight: 950, fontSize: 22, lineHeight: 1 }}>P</Typography>
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1 }}>
                <Typography sx={{ fontWeight: 950, fontSize: 19, lineHeight: 1.05 }}>ProdUS</Typography>
                <Typography sx={{ color: colors.muted, fontWeight: 800, fontSize: 12 }}>Launch workspace</Typography>
              </Box>
            </Stack>
          </NextLink>

          <Stack direction="row" spacing={1.2} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <HeaderLink href="/catalog">Services</HeaderLink>
            <HeaderLink href="/teams">Teams</HeaderLink>
            <HeaderLink href="/solo-experts">Experts</HeaderLink>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button component={NextLink} href="/dashboard" variant="outlined" sx={{ minHeight: 42, borderColor: colors.line, color: colors.ink, fontWeight: 900 }}>
              Dashboard
            </Button>
            {!isLoggedIn && (
              <Button component={NextLink} href="/login" variant="contained" sx={{ minHeight: 42, bgcolor: colors.ink, fontWeight: 900, '&:hover': { bgcolor: '#27204c' } }}>
                Log in
              </Button>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function HeaderLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button component={NextLink} href={href} variant="text" sx={{ minHeight: 42, color: colors.ink, fontWeight: 900 }}>
      {children}
    </Button>
  );
}

export function HeroProofPanel() {
  return (
    <Box
      sx={{
        justifySelf: { lg: 'end' },
        width: '100%',
        maxWidth: 560,
        p: { xs: 2, sm: 2.4 },
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.82)',
        border: `1px solid rgba(229,223,213,0.92)`,
        boxShadow: '0 28px 90px rgba(25,20,53,0.16)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <Stack spacing={2.3}>
        <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
          <Box>
            <Typography sx={{ color: colors.muted, fontWeight: 900, fontSize: 13 }}>Product snapshot</Typography>
            <Typography sx={{ fontWeight: 950, fontSize: { xs: 24, md: 30 }, color: colors.ink, lineHeight: 1.15 }}>
              Founder Launch App
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ color: colors.muted, fontWeight: 900, fontSize: 12 }}>Readiness</Typography>
            <Typography sx={{ fontWeight: 950, fontSize: 38, color: colors.teal, lineHeight: 1 }}>82</Typography>
          </Box>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.2 }}>
          {proofItems.map((item) => (
            <Box key={item.label} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff', border: `1px solid ${colors.line}` }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.accent, mb: 1 }} />
              <Typography sx={{ color: colors.muted, fontWeight: 900, fontSize: 12 }}>{item.label}</Typography>
              <Typography sx={{ fontWeight: 950, color: colors.ink, mt: 0.35 }}>{item.value}</Typography>
              <Typography sx={{ color: colors.muted, fontSize: 12, lineHeight: 1.45, mt: 0.4 }}>{item.detail}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '0.76fr 1.24fr' }, gap: 1.4, alignItems: 'stretch' }}>
          <Box
            component="img"
            src="/assets/images/widget/dashboard-1.jpg"
            alt="Product planning notes"
            sx={{ width: '100%', minHeight: 176, height: '100%', objectFit: 'cover', borderRadius: 2, border: `1px solid ${colors.line}` }}
          />
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#191435', color: '#fff' }}>
            <Typography sx={{ color: '#ffd8c8', fontWeight: 900, fontSize: 13 }}>Next best action</Typography>
            <Typography sx={{ fontWeight: 950, fontSize: 22, lineHeight: 1.18, mt: 0.8 }}>
              Fix launch blockers, then review AI opportunities.
            </Typography>
            <Typography sx={{ color: '#d9d5ff', lineHeight: 1.6, mt: 1 }}>
              The owner sees the decision first, then can go deeper into scanners, proof, and service work.
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <Typography component="p" sx={{ color: colors.coral, fontWeight: 950, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0 }}>
      {children}
    </Typography>
  );
}

export function OutcomePanel({ title, description, icon, accent }: { title: string; description: string; icon: ReactNode; accent: string }) {
  return (
    <Stack spacing={1.6} sx={{ p: { xs: 0, md: 0.5 } }}>
      <Box sx={{ width: 54, height: 54, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: `${accent}18`, color: accent, '& svg': { fontSize: 30 } }}>
        {icon}
      </Box>
      <Typography component="h3" sx={{ fontSize: 25, lineHeight: 1.15, fontWeight: 950, color: colors.ink }}>
        {title}
      </Typography>
      <Typography sx={{ color: colors.muted, lineHeight: 1.65, fontSize: 16.5 }}>{description}</Typography>
    </Stack>
  );
}

export function WorkspaceStory() {
  return (
    <Box sx={{ position: 'relative', minHeight: { xs: 420, md: 520 }, borderRadius: 2, overflow: 'hidden', bgcolor: '#f4eadb', border: `1px solid ${colors.line}` }}>
      <Box component="img" src="/assets/images/cards/card-2.jpg" alt="Desk with product planning notes" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.78 }} />
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,250,242,0.08), rgba(25,20,53,0.34))' }} />
      <Stack spacing={1.4} sx={{ position: 'absolute', left: { xs: 18, sm: 28 }, right: { xs: 18, sm: 28 }, bottom: { xs: 18, sm: 28 } }}>
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.92)', border: `1px solid ${colors.line}`, maxWidth: 520 }}>
          <Typography sx={{ color: colors.muted, fontWeight: 900, fontSize: 13 }}>Workspace view</Typography>
          <Typography sx={{ fontWeight: 950, fontSize: { xs: 24, md: 30 }, lineHeight: 1.14, color: colors.ink, mt: 0.6 }}>
            Product, scan proof, AI ideas, and service plan stay connected.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {['Verdict', 'Scanners', 'AI opportunities', 'Services'].map((item) => (
            <Box key={item} sx={{ px: 1.2, py: 0.8, borderRadius: 2, bgcolor: '#fff', border: `1px solid ${colors.line}`, fontWeight: 900, color: colors.ink }}>
              {item}
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}

export function JourneyStep({ index, title, description, icon }: { index: number; title: string; description: string; icon: ReactNode }) {
  return (
    <Stack direction="row" spacing={2.1} alignItems="flex-start">
      <Box sx={{ width: 50, height: 50, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: index === 1 ? '#fff2dc' : index === 2 ? '#efeefe' : '#e8f8f5', color: index === 1 ? colors.coral : index === 2 ? colors.purple : colors.teal, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ color: colors.muted, fontWeight: 900, fontSize: 13 }}>Step {index}</Typography>
        <Typography component="h3" sx={{ fontWeight: 950, color: colors.ink, fontSize: 22, mt: 0.3 }}>
          {title}
        </Typography>
        <Typography sx={{ color: colors.muted, lineHeight: 1.65, mt: 0.6 }}>{description}</Typography>
      </Box>
    </Stack>
  );
}

export function ServicePathTile({ path, index }: { path: string; index: number }) {
  return (
    <Box
      component={NextLink}
      href="/catalog"
      sx={{
        minHeight: 92,
        p: 2,
        borderRadius: 2,
        bgcolor: index % 2 === 0 ? '#fff8ec' : '#eef9f7',
        border: `1px solid ${colors.line}`,
        color: 'inherit',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: index % 2 === 0 ? '#ffc3ad' : '#9ee0d8',
          boxShadow: '0 16px 34px rgba(25,20,53,0.08)',
        },
      }}
    >
      <Typography sx={{ fontWeight: 950, color: colors.ink }}>{path}</Typography>
      <ArrowForwardOutlined sx={{ color: index % 2 === 0 ? colors.coral : colors.teal }} />
    </Box>
  );
}
