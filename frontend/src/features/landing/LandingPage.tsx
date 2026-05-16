'use client';

import NextLink from 'next/link';
import {
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  RocketLaunchOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import useAuth from '@/hooks/useAuth';
import Logo from '@/components/ui-component/Logo';

const services = [
  {
    title: 'Diagnose',
    description: 'Turn prototype state, codebase risk, dependencies, and business goals into a concrete productization brief.',
    icon: <AutoAwesomeOutlined />,
    color: '#625cff',
  },
  {
    title: 'Plan',
    description: 'Build a governed service plan with dependencies, milestones, deliverables, acceptance criteria, and budget range.',
    icon: <Inventory2Outlined />,
    color: '#0ea5e9',
  },
  {
    title: 'Match',
    description: 'Compare verified teams against service-plan needs, capability evidence, reputation, timeline, and operating fit.',
    icon: <GroupsOutlined />,
    color: '#14b8a6',
  },
  {
    title: 'Deliver',
    description: 'Run milestone evidence, support risk, proposal decisions, contracts, and handoff from a single workspace.',
    icon: <RocketLaunchOutlined />,
    color: '#f59e0b',
  },
];

const catalog = [
  'Validation',
  'Code Rewrite',
  'Scaling',
  'Cloud / DevOps',
  'Database',
  'Security',
  'Launch Readiness',
  'Operations / Support',
];

export default function LandingPage() {
  const { isLoggedIn, user } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fbff', color: '#101828' }}>
      <Box component="header" sx={{ bgcolor: 'rgba(255,255,255,0.86)', borderBottom: '1px solid #dbe4f0', backdropFilter: 'blur(18px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: 78 }}>
            <NextLink href="/" aria-label="ProdOps Network home" style={{ color: 'inherit', textDecoration: 'none' }}>
              <Logo />
            </NextLink>
            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Button component={NextLink} href="/services" variant="text" sx={{ minHeight: 42, color: '#334155', fontWeight: 800 }}>
                Services
              </Button>
              <Button component={NextLink} href="/teams" variant="text" sx={{ minHeight: 42, color: '#334155', fontWeight: 800 }}>
                Teams
              </Button>
              <Button component={NextLink} href="/solo-experts" variant="text" sx={{ minHeight: 42, color: '#334155', fontWeight: 800 }}>
                Solo Experts
              </Button>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button component={NextLink} href="/dashboard" variant={isLoggedIn ? 'contained' : 'outlined'}>
                Dashboard
              </Button>
              {!isLoggedIn && (
                <Button component={NextLink} href="/login" variant="contained">
                  Log in
                </Button>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 8 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.95fr 1.05fr' }, gap: { xs: 4, lg: 7 }, alignItems: 'center' }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'inline-flex', alignSelf: 'flex-start', px: 1.25, py: 0.75, borderRadius: 1, bgcolor: '#eeedff', color: '#5147ff', fontWeight: 900, fontSize: 12, letterSpacing: 0 }}>
              AI-governed productization platform
            </Box>
            <Typography component="h1" sx={{ fontSize: { xs: 44, md: 74 }, lineHeight: 0.96, fontWeight: 900, letterSpacing: 0 }}>
              Turn prototypes into products.
            </Typography>
            <Typography sx={{ fontSize: { xs: 18, md: 22 }, lineHeight: 1.55, color: '#475569', maxWidth: 720 }}>
              ProdOps Network helps owners diagnose what blocks production, select lifecycle services, compare verified teams, and govern delivery with evidence at every milestone.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button component={NextLink} href={isLoggedIn ? '/dashboard' : '/services'} size="large" variant="contained">
                {isLoggedIn ? `Open ${user?.role === 'PRODUCT_OWNER' ? 'Productization' : 'Dashboard'}` : 'Explore Services'}
              </Button>
              <Button component={NextLink} href="/teams" size="large" variant="outlined">
                Browse Teams
              </Button>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ pt: 1 }}>
              {['AI governed', 'Verified teams', 'Outcome focused'].map((label) => (
                <Stack key={label} direction="row" spacing={1} alignItems="center">
                  <CheckCircleOutlineOutlined sx={{ color: '#0f9f6e' }} />
                  <Typography sx={{ fontWeight: 800 }}>{label}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Box sx={{ border: '1px solid #dbe4f0', borderRadius: 2, bgcolor: '#fff', boxShadow: '0 30px 90px rgba(15,23,42,0.10)', p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h3">Product Health Overview</Typography>
                <Button component={NextLink} href="/dashboard" variant="outlined" size="small">Dashboard</Button>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '170px 1fr 180px' }, gap: 1.5 }}>
                <Box sx={{ p: 2, border: '1px solid #e4eaf5', borderRadius: 1 }}>
                  <Typography color="text.secondary">Health score</Typography>
                  <Typography sx={{ fontSize: 44, fontWeight: 900 }}>82</Typography>
                  <Typography color="success.main" sx={{ fontWeight: 800 }}>Production path clear</Typography>
                </Box>
                <Box sx={{ p: 2, border: '1px solid #e4eaf5', borderRadius: 1 }}>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Top blockers</Typography>
                  {['Security scan needs closure', 'CI/CD release gate missing', 'Support runbook incomplete'].map((item) => (
                    <Stack key={item} direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
                      <ShieldOutlined sx={{ fontSize: 18, color: '#ef4444' }} />
                      <Typography>{item}</Typography>
                    </Stack>
                  ))}
                </Box>
                <Box sx={{ p: 2, border: '1px solid #e4eaf5', borderRadius: 1 }}>
                  <Typography sx={{ fontWeight: 900 }}>Recommended next step</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>Build a dependency-aware service plan and shortlist two verified teams.</Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>

        <Box sx={{ mt: { xs: 6, md: 9 }, p: { xs: 2, md: 3 }, borderRadius: 2, bgcolor: '#fff', border: '1px solid #dbe4f0', boxShadow: '0 24px 70px rgba(15,23,42,0.08)' }}>
          <Typography align="center" variant="h2">How ProdOps Network Works</Typography>
          <Typography align="center" color="text.secondary" sx={{ mt: 1, mb: 3 }}>Structured productization with AI governance, verified specialists, and concrete delivery evidence.</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            {services.map((service, index) => (
              <Box key={service.title} sx={{ p: 2.5, border: '1px solid #e4eaf5', borderRadius: 1, background: `linear-gradient(180deg, ${service.color}14, #fff)` }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 1, bgcolor: '#fff', color: service.color, display: 'grid', placeItems: 'center', fontWeight: 900, mb: 1.5 }}>
                  {service.icon}
                </Box>
                <Typography variant="h4">{index + 1}. {service.title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.65 }}>{service.description}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 4, p: { xs: 2, md: 3 }, borderRadius: 2, bgcolor: '#fff', border: '1px solid #dbe4f0' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ md: 'center' }}>
            <Box>
              <Typography variant="h2">Service Catalog</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>Production-ready workstreams with clear descriptions, inputs, deliverables, and acceptance criteria.</Typography>
            </Box>
            <Button component={NextLink} href="/services" variant="outlined">View catalog</Button>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5, mt: 2.5 }}>
            {catalog.map((item, index) => (
              <Box key={item} sx={{ p: 2, borderRadius: 1, border: '1px solid #e4eaf5', borderTop: `3px solid ${['#625cff', '#2563eb', '#f59e0b', '#0891b2', '#0ea5e9', '#ef4444', '#16a34a', '#7c3aed'][index]}` }}>
                <Typography sx={{ fontWeight: 900 }}>{item}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>Concrete services, dependencies, milestones, and evidence checkpoints.</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
