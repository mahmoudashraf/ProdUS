'use client';

import NextLink from 'next/link';
import {
  ArrowForwardOutlined,
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
  FactCheckOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  RocketLaunchOutlined,
  ShieldOutlined,
  TravelExploreOutlined,
} from '@mui/icons-material';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import useAuth from '@/hooks/useAuth';
import {
  colors,
  HeroProofPanel,
  JourneyStep,
  LandingHeader,
  OutcomePanel,
  primaryButtonSx,
  secondaryButtonSx,
  SectionEyebrow,
  sectionBodySx,
  sectionTitleSx,
  ServicePathTile,
  WorkspaceStory,
} from './LandingPagePanels';

const outcomes = [
  {
    title: 'Know what blocks launch',
    description: 'Get a plain-language verdict with the blockers, risks, and proof behind the decision.',
    icon: <ShieldOutlined />,
    accent: colors.coral,
  },
  {
    title: 'Find the AI opportunities',
    description: 'See the product moments where AI can improve workflow, support, search, or automation.',
    icon: <AutoAwesomeOutlined />,
    accent: colors.purple,
  },
  {
    title: 'Pick the next work to start',
    description: 'Turn the diagnosis into a focused service path, then compare the right people to deliver it.',
    icon: <RocketLaunchOutlined />,
    accent: colors.teal,
  },
];

const journey = [
  {
    title: 'Add the product',
    description: 'Start from an idea, app link, repo, README, or files.',
    icon: <Inventory2Outlined />,
  },
  {
    title: 'Review the diagnosis',
    description: 'ProdUS explains readiness, scanners, AI opportunities, and evidence in owner language.',
    icon: <FactCheckOutlined />,
  },
  {
    title: 'Choose the work',
    description: 'Accept the service path, compare teams, and keep delivery proof in one workspace.',
    icon: <GroupsOutlined />,
  },
];

const servicePaths = [
  'Launch readiness',
  'AI integration',
  'Security review',
  'Cloud and DevOps',
  'Code rewrite',
  'Scale and performance',
  'Support handoff',
  'Product validation',
];

export default function LandingPage() {
  const { isLoggedIn, user } = useAuth();
  const dashboardLabel = isLoggedIn ? `Open ${user?.role === 'PRODUCT_OWNER' ? 'Product Home' : 'Dashboard'}` : 'Start product review';
  const dashboardHref = isLoggedIn ? '/dashboard' : '/register';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.paper, color: colors.ink, overflowX: 'hidden' }}>
      <LandingHeader isLoggedIn={isLoggedIn} />

      <Box
        component="main"
        sx={{
          position: 'relative',
          bgcolor: colors.cream,
          backgroundImage: {
            xs: `linear-gradient(180deg, rgba(247,241,232,0.94), rgba(247,241,232,0.98)), url('/assets/images/cards/card-3.jpg')`,
            md: `linear-gradient(90deg, rgba(247,241,232,0.98) 0%, rgba(247,241,232,0.94) 42%, rgba(247,241,232,0.72) 68%, rgba(247,241,232,0.24) 100%), url('/assets/images/cards/card-3.jpg')`,
          },
          backgroundSize: 'cover',
          backgroundPosition: { xs: 'center top', md: 'center right' },
        }}
      >
        <Container maxWidth="xl" sx={{ minHeight: { xs: 760, md: 720 }, display: 'flex', alignItems: 'center', py: { xs: 6, md: 8 } }}>
          <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.92fr) minmax(420px, 0.78fr)' }, gap: { xs: 4, lg: 7 }, alignItems: 'center' }}>
            <Stack spacing={3.2} sx={{ maxWidth: 760 }}>
              <Typography
                component="p"
                sx={{
                  display: 'inline-flex',
                  alignSelf: 'flex-start',
                  px: 1.3,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: '#fff2dc',
                  color: '#a64a12',
                  fontWeight: 900,
                  fontSize: 13,
                }}
              >
                AI-guided product launch workspace
              </Typography>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 46, sm: 58, md: 80 },
                  lineHeight: { xs: 1.02, md: 0.96 },
                  fontWeight: 950,
                  letterSpacing: 0,
                  maxWidth: 830,
                }}
              >
                Turn a prototype into a launch-ready product.
              </Typography>
              <Typography sx={{ fontSize: { xs: 19, md: 23 }, lineHeight: 1.58, color: colors.muted, maxWidth: 690 }}>
                ProdUS shows founders what to fix, where AI can help, and which service path should start next. No scanner clutter. No endless planning page. Just the decision and the proof behind it.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4} sx={{ maxWidth: { xs: '100%', sm: 520 } }}>
                <Button component={NextLink} href={dashboardHref} size="large" variant="contained" endIcon={<ArrowForwardOutlined />} sx={primaryButtonSx}>
                  {dashboardLabel}
                </Button>
                <Button component={NextLink} href="/catalog" size="large" variant="outlined" startIcon={<TravelExploreOutlined />} sx={secondaryButtonSx}>
                  Explore services
                </Button>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.4, sm: 2.4 }}>
                {['Owner-ready verdict', 'AI opportunities', 'Verified delivery paths'].map((label) => (
                  <Stack key={label} direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlineOutlined sx={{ color: colors.teal, fontSize: 22 }} />
                    <Typography sx={{ fontWeight: 900, color: colors.ink }}>{label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>

            <HeroProofPanel />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 9 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.78fr 1.22fr' }, gap: { xs: 4, lg: 7 }, alignItems: 'start' }}>
          <Stack spacing={2} sx={{ maxWidth: 560 }}>
            <SectionEyebrow>What the owner gets</SectionEyebrow>
            <Typography component="h2" sx={sectionTitleSx}>
              One workspace that explains the next decision.
            </Typography>
            <Typography sx={sectionBodySx}>
              The product home should feel like a clear launch conversation: what is ready, what is blocked, what AI can unlock, and what service work should start first.
            </Typography>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 2.5, md: 3 } }}>
            {outcomes.map((item) => (
              <OutcomePanel key={item.title} {...item} />
            ))}
          </Box>
        </Box>
      </Container>

      <Box sx={{ bgcolor: colors.white, borderTop: `1px solid ${colors.line}`, borderBottom: `1px solid ${colors.line}` }}>
        <Container maxWidth="xl" sx={{ py: { xs: 6, md: 9 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' }, gap: { xs: 4, lg: 7 }, alignItems: 'center' }}>
            <WorkspaceStory />
            <Stack spacing={3}>
              <SectionEyebrow>Product journey</SectionEyebrow>
              <Typography component="h2" sx={sectionTitleSx}>
                From idea to scoped delivery, without losing the story.
              </Typography>
              <Typography sx={sectionBodySx}>
                ProdUS keeps the journey simple for a nontechnical owner. Start with the product, understand the verdict, then move into the service path and proof only when needed.
              </Typography>
              <Stack spacing={2.3}>
                {journey.map((step, index) => (
                  <JourneyStep key={step.title} index={index + 1} {...step} />
                ))}
              </Stack>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 9 } }}>
        <Stack spacing={4}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' }, gap: { xs: 2, md: 6 }, alignItems: 'end' }}>
            <Box>
              <SectionEyebrow>Service paths</SectionEyebrow>
              <Typography component="h2" sx={sectionTitleSx}>
                Practical workstreams, not a confusing catalog.
              </Typography>
            </Box>
            <Typography sx={sectionBodySx}>
              Services stay tied to the product verdict. A founder can see why a path matters before comparing teams or approving work.
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.6 }}>
            {servicePaths.map((path, index) => (
              <ServicePathTile key={path} path={path} index={index} />
            ))}
          </Box>
        </Stack>
      </Container>

      <Box sx={{ bgcolor: colors.navy, color: colors.white }}>
        <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }} justifyContent="space-between">
            <Box sx={{ maxWidth: 760 }}>
              <Typography component="h2" sx={{ fontSize: { xs: 34, md: 50 }, lineHeight: 1.03, fontWeight: 950, letterSpacing: 0 }}>
                Give every product a clear next step.
              </Typography>
              <Typography sx={{ mt: 1.5, color: '#d9d5ff', fontSize: 18, lineHeight: 1.65 }}>
                Start with the product context. ProdUS turns it into a launch verdict, AI opportunity map, and service plan the owner can actually use.
              </Typography>
            </Box>
            <Button component={NextLink} href={dashboardHref} size="large" variant="contained" endIcon={<ArrowForwardOutlined />} sx={{ ...primaryButtonSx, bgcolor: colors.coral, '&:hover': { bgcolor: '#e95b31' } }}>
              {dashboardLabel}
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
