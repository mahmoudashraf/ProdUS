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
import { Box, Button, Container, GlobalStyles, Stack, Typography } from '@mui/material';
import useAuth from '@/hooks/useAuth';

const rw = {
  canvas: '#f3f6fc',
  ink: '#180f3d',
  muted: '#3f3a67',
  softMuted: '#625f81',
  line: '#dce3ef',
  white: '#fff',
  orange: '#ff6b3d',
  amber: '#ffb100',
  violet: '#8000e8',
  purple: '#34206d',
  blue: '#2b6eea',
  teal: '#15a7a1',
};

const outcomes = [
  {
    title: 'Know what blocks launch',
    description: 'A plain-language verdict with the blockers, risks, and proof behind the decision.',
    icon: <ShieldOutlined />,
    accent: rw.orange,
  },
  {
    title: 'Find the AI opportunities',
    description: 'Product moments where AI can improve workflow, support, search, or automation.',
    icon: <AutoAwesomeOutlined />,
    accent: rw.violet,
  },
  {
    title: 'Pick the next work',
    description: 'A focused service path with the right proof, team options, and delivery next step.',
    icon: <RocketLaunchOutlined />,
    accent: rw.teal,
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

export default function RailswareColorTrialLandingPage() {
  const { isLoggedIn, user } = useAuth();
  const dashboardLabel = isLoggedIn ? `Open ${user?.role === 'PRODUCT_OWNER' ? 'Product Home' : 'Dashboard'}` : 'Start product review';
  const dashboardHref = isLoggedIn ? '/dashboard' : '/register';

  return (
    <Box data-railsware-trial-root sx={{ minHeight: '100vh', bgcolor: rw.canvas, color: rw.ink, overflowX: 'hidden' }}>
      <GlobalStyles styles={{ html: { backgroundColor: rw.canvas }, body: { backgroundColor: `${rw.canvas} !important` } }} />
      <TrialHeader isLoggedIn={isLoggedIn} />

      <Box component="main" sx={{ bgcolor: rw.canvas }}>
        <Container maxWidth="xl" sx={{ minHeight: { xs: 760, md: 820 }, display: 'flex', alignItems: 'center', py: { xs: 6, md: 8 } }}>
          <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.86fr 1.14fr' }, gap: { xs: 5, lg: 7 }, alignItems: 'center' }}>
            <Stack spacing={3.2} sx={{ maxWidth: 720 }}>
              <Typography
                component="p"
                sx={{
                  display: 'inline-flex',
                  alignSelf: 'flex-start',
                  px: 1.15,
                  py: 0.72,
                  borderRadius: 999,
                  bgcolor: '#fff0df',
                  color: '#9b390f',
                  fontWeight: 900,
                  fontSize: 13,
                }}
              >
                AI-guided product launch workspace
              </Typography>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 46, sm: 62, md: 84 },
                  lineHeight: { xs: 1.02, md: 1.02 },
                  fontWeight: 950,
                  letterSpacing: 0,
                  color: rw.ink,
                }}
              >
                Turn a prototype into a launch-ready product.
              </Typography>
              <Typography sx={{ fontSize: { xs: 20, md: 25 }, lineHeight: 1.6, color: rw.ink, maxWidth: 710, fontWeight: 400 }}>
                ProdUS shows founders what to fix, where AI can help, and which service path should start next. No scanner clutter. No endless planning page. Just the decision and the proof behind it.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ maxWidth: { xs: '100%', sm: 560 } }}>
                <Button component={NextLink} href={dashboardHref} size="large" variant="contained" endIcon={<ArrowForwardOutlined />} sx={primaryButtonSx}>
                  {dashboardLabel}
                </Button>
                <Button component={NextLink} href="/catalog" size="large" variant="outlined" startIcon={<TravelExploreOutlined />} sx={secondaryButtonSx}>
                  Explore services
                </Button>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.4, sm: 2.8 }}>
                {['Owner-ready verdict', 'AI opportunities', 'Verified delivery paths'].map((label) => (
                  <Stack key={label} direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlineOutlined sx={{ color: rw.orange, fontSize: 22 }} />
                    <Typography sx={{ fontWeight: 900, color: rw.ink }}>{label}</Typography>
                  </Stack>
                ))}
              </Stack>
              <MobileHeroProofPreview />
            </Stack>

            <RailswareLikeHeroVisual />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 9 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.78fr 1.22fr' }, gap: { xs: 4, lg: 7 }, alignItems: 'start' }}>
          <Stack spacing={2} sx={{ maxWidth: 580 }}>
            <SectionEyebrow>What the owner gets</SectionEyebrow>
            <SectionTitle>One workspace that explains the next decision.</SectionTitle>
            <SectionBody>
              The product home should feel like a clear launch conversation: what is ready, what is blocked, what AI can unlock, and what service work should start first.
            </SectionBody>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 2.5, md: 3.2 } }}>
            {outcomes.map((item) => (
              <OutcomePanel key={item.title} {...item} />
            ))}
          </Box>
        </Box>
      </Container>

      <Box sx={{ bgcolor: rw.white, borderTop: `1px solid ${rw.line}`, borderBottom: `1px solid ${rw.line}` }}>
        <Container maxWidth="xl" sx={{ py: { xs: 6, md: 9 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.04fr 0.96fr' }, gap: { xs: 4, lg: 7 }, alignItems: 'center' }}>
            <WorkspaceStory />
            <Stack spacing={3}>
              <SectionEyebrow>Product journey</SectionEyebrow>
              <SectionTitle>From idea to scoped delivery, without losing the story.</SectionTitle>
              <SectionBody>
                ProdUS keeps the journey simple for a nontechnical owner. Start with the product, understand the verdict, then move into the service path and proof only when needed.
              </SectionBody>
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
              <SectionTitle>Practical workstreams, not a confusing catalog.</SectionTitle>
            </Box>
            <SectionBody>
              Services stay tied to the product verdict. A founder can see why a path matters before comparing teams or approving work.
            </SectionBody>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.8 }}>
            {servicePaths.map((path, index) => (
              <ServicePathTile key={path} path={path} index={index} />
            ))}
          </Box>
        </Stack>
      </Container>

      <Box sx={{ bgcolor: rw.ink, color: rw.white }}>
        <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }} justifyContent="space-between">
            <Box sx={{ maxWidth: 780 }}>
              <Typography component="h2" sx={{ fontSize: { xs: 34, md: 54 }, lineHeight: 1.05, fontWeight: 950, letterSpacing: 0 }}>
                Give every product a clear next step.
              </Typography>
              <Typography sx={{ mt: 1.5, color: '#d7d5ea', fontSize: 18, lineHeight: 1.65 }}>
                Start with the product context. ProdUS turns it into a launch verdict, AI opportunity map, and service plan the owner can actually use.
              </Typography>
            </Box>
            <Button component={NextLink} href={dashboardHref} size="large" variant="contained" endIcon={<ArrowForwardOutlined />} sx={primaryButtonSx}>
              {dashboardLabel}
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

const primaryButtonSx = {
  minHeight: 54,
  px: 2.6,
  borderRadius: 999,
  bgcolor: rw.orange,
  color: rw.white,
  fontWeight: 950,
  boxShadow: 'none',
  '&:hover': { bgcolor: '#ec572b', boxShadow: 'none' },
};

const secondaryButtonSx = {
  minHeight: 54,
  px: 2.6,
  borderRadius: 999,
  borderColor: rw.ink,
  color: rw.ink,
  bgcolor: 'transparent',
  fontWeight: 950,
  '&:hover': { borderColor: rw.ink, bgcolor: 'rgba(255,255,255,0.48)' },
};

function TrialHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Box component="header" sx={{ bgcolor: 'rgba(243,246,252,0.92)', borderBottom: `1px solid ${rw.line}`, backdropFilter: 'blur(18px)', position: 'sticky', top: 0, zIndex: 10 }}>
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: 76 }}>
          <NextLink href="/" aria-label="ProdUS home" style={{ color: 'inherit', textDecoration: 'none' }}>
            <Stack direction="row" spacing={1.15} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 32,
                  borderRadius: 1.4,
                  overflow: 'hidden',
                  bgcolor: rw.orange,
                  backgroundImage: `repeating-linear-gradient(45deg, ${rw.orange} 0 8px, ${rw.amber} 8px 14px, #fff2d8 14px 18px)`,
                }}
              />
              <Box sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1 }}>
                <Typography sx={{ fontWeight: 950, fontSize: 18, lineHeight: 1.05, letterSpacing: 0.5 }}>ProdUS</Typography>
                <Typography sx={{ color: rw.softMuted, fontWeight: 800, fontSize: 12 }}>Launch workspace</Typography>
              </Box>
            </Stack>
          </NextLink>

          <Stack direction="row" spacing={1.2} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <HeaderLink href="/catalog">Services</HeaderLink>
            <HeaderLink href="/teams">Teams</HeaderLink>
            <HeaderLink href="/solo-experts">Experts</HeaderLink>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button component={NextLink} href="/dashboard" variant="outlined" sx={{ minHeight: 42, borderColor: rw.ink, borderRadius: 999, color: rw.ink, fontWeight: 900 }}>
              Dashboard
            </Button>
            {!isLoggedIn && (
              <Button component={NextLink} href="/login" variant="text" sx={{ minHeight: 42, color: rw.ink, fontWeight: 950 }}>
                Log in
              </Button>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button component={NextLink} href={href} variant="text" sx={{ minHeight: 42, color: rw.ink, fontWeight: 950 }}>
      {children}
    </Button>
  );
}

function RailswareLikeHeroVisual() {
  return (
    <Box sx={{ position: 'relative', minHeight: { xs: 520, md: 650 }, display: { xs: 'none', md: 'block' } }}>
      <Box
        sx={{
          position: 'absolute',
          inset: '6% 3% auto auto',
          width: '72%',
          aspectRatio: '1 / 1',
          borderRadius: '44% 44% 48% 52%',
          background: `linear-gradient(150deg, ${rw.amber} 0%, ${rw.orange} 36%, #e000a7 62%, ${rw.violet} 100%)`,
          transform: 'rotate(-3deg)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: '0 20% auto auto',
          width: '58%',
          height: '38%',
          bgcolor: 'rgba(255,224,137,0.72)',
          transform: 'rotate(45deg)',
          filter: 'blur(0.2px)',
        }}
      />
      <PhotoCard src="/assets/images/widget/dashboard-2.jpg" alt="Founder workspace" sx={{ right: '6%', top: '12%', width: '38%', height: 300, borderRadius: '34px 72px 34px 72px' }} />
      <PhotoCard src="/assets/images/cards/card-2.jpg" alt="Product planning desk" sx={{ left: '24%', top: '42%', width: '34%', height: 260, borderRadius: '42px 42px 10px 68px' }} />
      <PhotoCard src="/assets/images/cards/card-3.jpg" alt="Product collaboration" sx={{ right: '0%', top: '46%', width: '32%', height: 180, borderRadius: '52px 18px 52px 18px' }} />
      <MetricBubble sx={{ left: '39%', top: '20%', bgcolor: rw.ink, color: rw.white }} label="82" helper="ready" />
      <MetricBubble sx={{ left: '26%', top: '34%', bgcolor: rw.white, color: rw.purple }} label="AI" helper="ideas" />
      <MetricBubble sx={{ left: '47%', top: '34%', bgcolor: rw.amber, color: rw.ink }} label="5" helper="found" />
      <Box sx={{ position: 'absolute', left: '54%', bottom: '8%', color: rw.white, fontWeight: 950, fontSize: 20 }}>Product proof</Box>
    </Box>
  );
}

function MobileHeroProofPreview() {
  return (
    <Box
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'relative',
        mt: 0.6,
        height: 254,
        borderRadius: 4,
        overflow: 'hidden',
        bgcolor: '#edf3fb',
        border: `1px solid ${rw.line}`,
        boxShadow: '0 20px 48px rgba(24,15,61,0.10)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          right: -22,
          top: 24,
          width: 248,
          height: 248,
          borderRadius: '46% 42% 48% 52%',
          background: `linear-gradient(150deg, ${rw.amber} 0%, ${rw.orange} 35%, #e000a7 62%, ${rw.violet} 100%)`,
          transform: 'rotate(-4deg)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: 102,
          top: -18,
          width: 150,
          height: 150,
          bgcolor: 'rgba(255,224,137,0.72)',
          transform: 'rotate(45deg)',
        }}
      />
      <Box
        component="img"
        src="/assets/images/cards/card-2.jpg"
        alt="Product planning desk"
        sx={{
          position: 'absolute',
          left: 16,
          top: 72,
          width: 154,
          height: 128,
          objectFit: 'cover',
          borderRadius: '28px 28px 8px 42px',
          boxShadow: '0 18px 36px rgba(24,15,61,0.18)',
        }}
      />
      <Box
        component="img"
        src="/assets/images/widget/dashboard-2.jpg"
        alt="Founder workspace"
        sx={{
          position: 'absolute',
          right: 20,
          top: 48,
          width: 150,
          height: 118,
          objectFit: 'cover',
          borderRadius: '24px 44px 24px 44px',
          boxShadow: '0 18px 36px rgba(24,15,61,0.16)',
        }}
      />
      <Box
        component="img"
        src="/assets/images/cards/card-3.jpg"
        alt="Product collaboration"
        sx={{
          position: 'absolute',
          right: 16,
          bottom: 28,
          width: 124,
          height: 90,
          objectFit: 'cover',
          borderRadius: '34px 12px 34px 12px',
          boxShadow: '0 16px 32px rgba(24,15,61,0.16)',
        }}
      />
      <MobileMetricBubble sx={{ left: 135, top: 32, bgcolor: rw.ink, color: rw.white }} label="82" helper="ready" />
      <MobileMetricBubble sx={{ left: 76, top: 94, bgcolor: rw.white, color: rw.purple }} label="AI" helper="ideas" />
      <MobileMetricBubble sx={{ left: 171, top: 102, bgcolor: rw.amber, color: rw.ink }} label="5" helper="found" />
      <Box sx={{ position: 'absolute', left: 18, bottom: 18, px: 1.4, py: 0.9, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.94)', border: `1px solid ${rw.line}`, boxShadow: '0 14px 30px rgba(24,15,61,0.12)' }}>
        <Typography sx={{ color: rw.ink, fontWeight: 950, fontSize: 13, lineHeight: 1 }}>Product proof</Typography>
      </Box>
    </Box>
  );
}

function MobileMetricBubble({ label, helper, sx }: { label: string; helper: string; sx: object }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        boxShadow: '0 16px 32px rgba(24,15,61,0.18)',
        ...sx,
      }}
    >
      <Box>
        <Typography sx={{ fontSize: 21, lineHeight: 1, fontWeight: 950 }}>{label}</Typography>
        <Typography sx={{ fontSize: 9, fontWeight: 900, opacity: 0.82 }}>{helper}</Typography>
      </Box>
    </Box>
  );
}

function PhotoCard({ src, alt, sx }: { src: string; alt: string; sx: object }) {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        position: 'absolute',
        objectFit: 'cover',
        boxShadow: '0 24px 60px rgba(24,15,61,0.18)',
        ...sx,
      }}
    />
  );
}

function MetricBubble({ label, helper, sx }: { label: string; helper: string; sx: object }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        width: 106,
        height: 106,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        boxShadow: '0 22px 46px rgba(24,15,61,0.18)',
        ...sx,
      }}
    >
      <Box>
        <Typography sx={{ fontSize: 31, lineHeight: 1, fontWeight: 950 }}>{label}</Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 900, opacity: 0.82 }}>{helper}</Typography>
      </Box>
    </Box>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Typography component="p" sx={{ color: rw.orange, fontWeight: 950, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0 }}>
      {children}
    </Typography>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography component="h2" sx={{ fontSize: { xs: 34, md: 56 }, lineHeight: 1.05, fontWeight: 950, letterSpacing: 0, color: rw.ink }}>
      {children}
    </Typography>
  );
}

function SectionBody({ children }: { children: React.ReactNode }) {
  return <Typography sx={{ color: rw.muted, fontSize: { xs: 17, md: 20 }, lineHeight: 1.72 }}>{children}</Typography>;
}

function OutcomePanel({ title, description, icon, accent }: { title: string; description: string; icon: React.ReactNode; accent: string }) {
  return (
    <Stack spacing={1.6} sx={{ p: { xs: 0, md: 0.5 } }}>
      <Box sx={{ width: 58, height: 58, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: `${accent}18`, color: accent, '& svg': { fontSize: 30 } }}>
        {icon}
      </Box>
      <Typography component="h3" sx={{ fontSize: 26, lineHeight: 1.18, fontWeight: 950, color: rw.ink }}>
        {title}
      </Typography>
      <Typography sx={{ color: rw.muted, lineHeight: 1.7, fontSize: 17 }}>{description}</Typography>
    </Stack>
  );
}

function WorkspaceStory() {
  return (
    <Box sx={{ position: 'relative', minHeight: { xs: 420, md: 520 }, borderRadius: 4, overflow: 'hidden', bgcolor: rw.canvas, border: `1px solid ${rw.line}` }}>
      <Box component="img" src="/assets/images/cards/card-2.jpg" alt="Desk with product planning notes" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.76 }} />
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(243,246,252,0.04), rgba(24,15,61,0.36))' }} />
      <Stack spacing={1.4} sx={{ position: 'absolute', left: { xs: 18, sm: 28 }, right: { xs: 18, sm: 28 }, bottom: { xs: 18, sm: 28 } }}>
        <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.94)', border: `1px solid ${rw.line}`, maxWidth: 540 }}>
          <Typography sx={{ color: rw.softMuted, fontWeight: 900, fontSize: 13 }}>Workspace view</Typography>
          <Typography sx={{ fontWeight: 950, fontSize: { xs: 24, md: 30 }, lineHeight: 1.14, color: rw.ink, mt: 0.6 }}>
            Product, scan proof, AI ideas, and service plan stay connected.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {['Verdict', 'Scanners', 'AI opportunities', 'Services'].map((item) => (
            <Box key={item} sx={{ px: 1.2, py: 0.8, borderRadius: 999, bgcolor: '#fff', border: `1px solid ${rw.line}`, fontWeight: 900, color: rw.ink }}>
              {item}
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}

function JourneyStep({ index, title, description, icon }: { index: number; title: string; description: string; icon: React.ReactNode }) {
  const accent = index === 1 ? rw.orange : index === 2 ? rw.violet : rw.teal;

  return (
    <Stack direction="row" spacing={2.1} alignItems="flex-start">
      <Box sx={{ width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: `${accent}16`, color: accent, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ color: rw.softMuted, fontWeight: 900, fontSize: 13 }}>Step {index}</Typography>
        <Typography component="h3" sx={{ fontWeight: 950, color: rw.ink, fontSize: 22, mt: 0.3 }}>
          {title}
        </Typography>
        <Typography sx={{ color: rw.muted, lineHeight: 1.65, mt: 0.6 }}>{description}</Typography>
      </Box>
    </Stack>
  );
}

function ServicePathTile({ path, index }: { path: string; index: number }) {
  const isWarm = index % 2 === 0;

  return (
    <Box
      component={NextLink}
      href="/catalog"
      sx={{
        minHeight: 96,
        p: 2.2,
        borderRadius: 2.5,
        bgcolor: isWarm ? '#fff7ed' : '#eef7ff',
        border: `1px solid ${rw.line}`,
        color: 'inherit',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: isWarm ? '#ffbd9e' : '#a7c8ff',
          boxShadow: '0 16px 34px rgba(24,15,61,0.08)',
        },
      }}
    >
      <Typography sx={{ fontWeight: 950, color: rw.ink }}>{path}</Typography>
      <ArrowForwardOutlined sx={{ color: isWarm ? rw.orange : rw.blue }} />
    </Box>
  );
}
