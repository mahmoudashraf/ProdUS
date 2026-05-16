'use client';

import NextLink from 'next/link';
import {
  AddShoppingCartOutlined,
  AutoAwesomeOutlined,
  GroupsOutlined,
  PersonSearchOutlined,
  RocketLaunchOutlined,
  VerifiedOutlined,
} from '@mui/icons-material';
import { Avatar, Box, Button, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson } from './api';
import {
  DotLabel,
  EmptyState,
  PageHeader,
  PastelChip,
  ProgressRing,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  categoryPalette,
  formatLabel,
} from './PlatformComponents';
import { ExpertProfile, ProductizationCart, ServiceCategory, ServiceModule, Team } from './types';

type DirectoryView = 'directory' | 'experts';

const splitTags = (value?: string) =>
  (value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const teamScore = (team: Team) => {
  const scores: Record<Team['verificationStatus'], number> = {
    APPLIED: 58,
    VERIFIED: 82,
    CERTIFIED: 88,
    SPECIALIST: 92,
    OPERATIONS_READY: 96,
    SUSPENDED: 30,
  };
  return scores[team.verificationStatus] || 76;
};

const availabilityColor = (availability: ExpertProfile['availability']) => {
  if (availability === 'AVAILABLE') return appleColors.green;
  if (availability === 'LIMITED') return appleColors.amber;
  if (availability === 'BUSY') return appleColors.red;
  return appleColors.muted;
};

function PublicTeamCard({
  team,
  isLoggedIn,
  canUseProjectCart,
  inCart,
  onAdd,
  isAdding,
}: {
  team: Team;
  isLoggedIn: boolean;
  canUseProjectCart: boolean;
  inCart: boolean;
  onAdd: () => void;
  isAdding: boolean;
}) {
  const tags = splitTags(team.capabilitiesSummary || team.description).slice(0, 5);

  return (
    <Surface sx={{ p: 0, overflow: 'hidden', height: '100%' }}>
      <Box
        sx={{
          height: 92,
          background: team.coverPhotoUrl
            ? `linear-gradient(90deg, rgba(98,92,255,0.38), rgba(14,165,198,0.16)), url(${team.coverPhotoUrl}) center/cover`
            : 'linear-gradient(135deg, #eef2ff, #ecfeff)',
          borderBottom: `1px solid ${appleColors.line}`,
        }}
      />
      <Stack spacing={2} sx={{ p: 2.5, pt: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: -3 }}>
          <Avatar
            variant="rounded"
            {...(team.profilePhotoUrl ? { src: team.profilePhotoUrl } : {})}
            sx={{
              width: 64,
              height: 64,
              border: '4px solid #fff',
              bgcolor: '#eef2ff',
              color: appleColors.purple,
              fontWeight: 900,
            }}
          >
            {team.name.slice(0, 1)}
          </Avatar>
          <ProgressRing value={teamScore(team)} size={70} color={appleColors.purple} label="match" />
        </Stack>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h3">{team.name}</Typography>
            <StatusChip label={team.verificationStatus} />
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
            {team.headline || team.description || 'Verified productization team.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {tags.map((tag) => (
            <PastelChip key={tag} label={tag} accent={appleColors.cyan} bg="#e4f9fd" />
          ))}
        </Stack>
        <Stack spacing={1}>
          <DotLabel label={team.timezone || 'Remote delivery'} color={appleColors.green} />
          <Typography color="text.secondary">
            Typical project: <Box component="span" sx={{ color: appleColors.ink, fontWeight: 800 }}>{team.typicalProjectSize || 'Scoped after intake'}</Box>
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component={NextLink} href={`/teams/${team.id}`} variant="outlined" fullWidth sx={{ minHeight: 42 }}>
            View Profile
          </Button>
          <Button
            component={NextLink}
            href={!isLoggedIn ? '/login' : canUseProjectCart ? '#' : '/dashboard'}
            variant="contained"
            fullWidth
            startIcon={<AddShoppingCartOutlined />}
            disabled={canUseProjectCart && isAdding}
            onClick={(event) => {
              if (!canUseProjectCart) return;
              event.preventDefault();
              onAdd();
            }}
            sx={{ minHeight: 42 }}
          >
            {!isLoggedIn ? 'Sign In To Add Team' : canUseProjectCart ? (inCart ? 'In Draft Cart' : 'Add Team To Draft') : 'Open Dashboard'}
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

function ExpertCard({
  expert,
  isLoggedIn,
  canUseProjectCart,
  inCart,
  onAdd,
  isAdding,
}: {
  expert: ExpertProfile;
  isLoggedIn: boolean;
  canUseProjectCart: boolean;
  inCart: boolean;
  onAdd: () => void;
  isAdding: boolean;
}) {
  const skills = splitTags(expert.skills).slice(0, 5);
  const accent = availabilityColor(expert.availability);

  return (
    <Surface sx={{ p: 0, overflow: 'hidden', height: '100%' }}>
      <Box
        sx={{
          height: 92,
          background: expert.coverPhotoUrl
            ? `linear-gradient(90deg, rgba(14,165,198,0.28), rgba(98,92,255,0.16)), url(${expert.coverPhotoUrl}) center/cover`
            : 'linear-gradient(135deg, #ecfeff, #f8f7ff)',
          borderBottom: `1px solid ${appleColors.line}`,
        }}
      />
      <Stack spacing={2} sx={{ p: 2.5, pt: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: -3 }}>
          <Avatar
            {...(expert.profilePhotoUrl ? { src: expert.profilePhotoUrl } : {})}
            sx={{
              width: 64,
              height: 64,
              border: '4px solid #fff',
              bgcolor: '#ecfeff',
              color: appleColors.cyan,
              fontWeight: 900,
            }}
          >
            {expert.displayName.slice(0, 1)}
          </Avatar>
          <DotLabel label={formatLabel(expert.availability)} color={accent} />
        </Stack>
        <Box>
          <Typography variant="h3">{expert.displayName}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
            {expert.headline || 'Independent productization expert.'}
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
          {expert.bio || 'Profile evidence, services, and availability are maintained by the expert.'}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {skills.map((skill) => (
            <PastelChip key={skill} label={skill} accent={appleColors.green} bg="#e7f8ee" />
          ))}
        </Stack>
        <Stack spacing={1}>
          <DotLabel label={expert.location || 'Remote'} color={appleColors.cyan} />
          <Typography color="text.secondary">
            Project range: <Box component="span" sx={{ color: appleColors.ink, fontWeight: 800 }}>{expert.preferredProjectSize || 'Scoped after intake'}</Box>
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component={NextLink} href={`/solo-experts/${expert.id}`} variant="outlined" fullWidth sx={{ minHeight: 42 }}>
            View Profile
          </Button>
          <Button
            component={NextLink}
            href={!isLoggedIn ? '/login' : canUseProjectCart ? '#' : '/dashboard'}
            variant="contained"
            fullWidth
            startIcon={<AddShoppingCartOutlined />}
            disabled={canUseProjectCart && isAdding}
            onClick={(event) => {
              if (!canUseProjectCart) return;
              event.preventDefault();
              onAdd();
            }}
            sx={{ minHeight: 42 }}
          >
            {!isLoggedIn ? 'Sign In To Add Expert' : canUseProjectCart ? (inCart ? 'In Draft Cart' : 'Add Expert To Draft') : 'Open Dashboard'}
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

function ServiceStrip({ categories, modules }: { categories: ServiceCategory[]; modules: ServiceModule[] }) {
  const modulesByCategory = modules.reduce<Record<string, ServiceModule[]>>((grouped, module) => {
    const categoryId = module.category?.id || 'unknown';
    grouped[categoryId] = [...(grouped[categoryId] || []), module];
    return grouped;
  }, {});

  return (
    <Surface>
      <SectionTitle
        title="Lifecycle Services"
        action={
          <Button component={NextLink} href="/services" variant="outlined" sx={{ minHeight: 40 }}>
            View Services
          </Button>
        }
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          gap: 1.5,
        }}
      >
        {categories.slice(0, 8).map((category, index) => {
          const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
          const categoryModules = modulesByCategory[category.id] || [];

          return (
            <Box
              key={category.id}
              sx={{
                p: 2,
                border: `1px solid ${appleColors.line}`,
                borderTop: `3px solid ${palette.accent}`,
                borderRadius: 1,
                bgcolor: palette.soft,
              }}
            >
              <Typography sx={{ fontWeight: 900, mb: 0.75 }}>{category.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, minHeight: 42 }}>
                {category.description || 'Production readiness workstream.'}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                {categoryModules.slice(0, 3).map((module) => (
                  <PastelChip key={module.id} label={module.name} accent={palette.accent} bg={palette.bg} />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Surface>
  );
}

export default function PublicTalentDirectoryPage({ view = 'directory' }: { view?: DirectoryView }) {
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuth();
  const canUseProjectCart = user?.role === UserRole.PRODUCT_OWNER;
  const cartHref = canUseProjectCart ? '/owner/project-cart#project-cart' : isLoggedIn ? '/dashboard' : '/login';
  const cartActionLabel = canUseProjectCart ? 'Review draft cart' : isLoggedIn ? 'Open dashboard' : 'Sign in to start';
  const teams = useQuery({ queryKey: ['public-teams'], queryFn: () => getJson<Team[]>('/teams') });
  const experts = useQuery({ queryKey: ['public-expert-profiles'], queryFn: () => getJson<ExpertProfile[]>('/expert-profiles') });
  const categories = useQuery({ queryKey: ['public-catalog-categories'], queryFn: () => getJson<ServiceCategory[]>('/catalog/categories') });
  const modules = useQuery({ queryKey: ['public-catalog-modules'], queryFn: () => getJson<ServiceModule[]>('/catalog/modules') });
  const cart = useQuery({ queryKey: ['productization-cart'], enabled: canUseProjectCart, queryFn: () => getJson<ProductizationCart>('/productization-cart/current') });
  const addTeamToCart = useMutation({
    mutationFn: (payload: { teamId: string; notes: string }) => postJson<ProductizationCart, { itemType: 'TEAM'; teamId: string; notes: string }>('/productization-cart/talent', { itemType: 'TEAM', ...payload }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const addExpertToCart = useMutation({
    mutationFn: (payload: { expertProfileId: string; notes: string }) => postJson<ProductizationCart, { itemType: 'EXPERT'; expertProfileId: string; notes: string }>('/productization-cart/talent', { itemType: 'EXPERT', ...payload }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });

  const teamList = teams.data || [];
  const soloExperts = (experts.data || []).filter((expert) => expert.soloMode && expert.active);
  const categoryList = (categories.data || []).filter((category) => category.active);
  const moduleList = (modules.data || []).filter((module) => module.active);
  const showingExpertsOnly = view === 'experts';
  const cartTeamIds = new Set((cart.data?.talentItems || []).map((item) => item.team?.id).filter(Boolean) as string[]);
  const cartExpertIds = new Set((cart.data?.talentItems || []).map((item) => item.expertProfile?.id).filter(Boolean) as string[]);

  return (
    <Stack spacing={3}>
      <PageHeader
        title={showingExpertsOnly ? 'Solo Expert Network' : 'Teams And Solo Experts'}
        description={
          showingExpertsOnly
            ? 'Browse independent productization experts with service focus, availability, proof, and clear project fit before signing in.'
            : 'Browse verified teams, independent experts, and lifecycle services before creating an account or starting a productization workspace.'
        }
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={NextLink} href="/services" variant="outlined" sx={{ minHeight: 42, minWidth: 130 }}>
              Explore Services
            </Button>
            <Button
              component={NextLink}
              href={cartHref}
              variant="contained"
              sx={{ minHeight: 42, minWidth: 130 }}
            >
              {cartActionLabel}
            </Button>
          </Stack>
        }
      />

      <QueryState
        isLoading={teams.isLoading || experts.isLoading || categories.isLoading || modules.isLoading}
        error={teams.error || experts.error || categories.error || modules.error}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {[
          { label: 'Verified teams', value: teamList.length, icon: <GroupsOutlined />, color: appleColors.purple },
          { label: 'Solo experts', value: soloExperts.length, icon: <PersonSearchOutlined />, color: appleColors.cyan },
          { label: 'Lifecycle services', value: categoryList.length, icon: <RocketLaunchOutlined />, color: appleColors.green },
        ].map((metric) => (
          <Surface key={metric.label}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1,
                  bgcolor: `${metric.color}14`,
                  color: metric.color,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {metric.icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{metric.value}</Typography>
                <Typography color="text.secondary">{metric.label}</Typography>
              </Box>
            </Stack>
          </Surface>
        ))}
      </Box>

      {!showingExpertsOnly && (
        <Box>
          <SectionTitle
            title="Verified Teams"
            action={
              <Button component={NextLink} href="/services" variant="outlined" sx={{ minHeight: 40 }}>
                Match By Service
              </Button>
            }
          />
          {teamList.length ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              {teamList.map((team) => (
                <PublicTeamCard
                  key={team.id}
                  team={team}
                  isLoggedIn={isLoggedIn}
                  canUseProjectCart={canUseProjectCart}
                  inCart={cartTeamIds.has(team.id)}
                  isAdding={addTeamToCart.isPending}
                  onAdd={() => addTeamToCart.mutate({ teamId: team.id, notes: 'Owner saved team from public directory.' })}
                />
              ))}
            </Box>
          ) : (
            <EmptyState label="No public teams are available yet." />
          )}
        </Box>
      )}

      <Box>
        <SectionTitle
          title={showingExpertsOnly ? 'Available Solo Experts' : 'Solo Experts'}
          action={
            !showingExpertsOnly && (
              <Button component={NextLink} href="/solo-experts" variant="outlined" sx={{ minHeight: 40 }}>
                View All Experts
              </Button>
            )
          }
        />
        {soloExperts.length ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            {soloExperts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                isLoggedIn={isLoggedIn}
                canUseProjectCart={canUseProjectCart}
                inCart={cartExpertIds.has(expert.id)}
                isAdding={addExpertToCart.isPending}
                onAdd={() => addExpertToCart.mutate({ expertProfileId: expert.id, notes: 'Owner saved solo expert from public directory.' })}
              />
            ))}
          </Box>
        ) : (
          <EmptyState label="No public solo expert profiles are available yet." />
        )}
      </Box>

      {categoryList.length > 0 && <ServiceStrip categories={categoryList} modules={moduleList} />}

      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #eef2ff)' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AutoAwesomeOutlined sx={{ color: appleColors.purple }} />
            <Box>
              <Typography variant="h4">Ready to turn discovery into a governed workspace?</Typography>
              <Typography color="text.secondary">
                Sign in to create a product brief, save teams and experts to a draft cart, and convert it into a project workspace.
              </Typography>
            </Box>
          </Stack>
          <Button
            component={NextLink}
            href={isLoggedIn ? '/dashboard' : '/login'}
            variant="contained"
            startIcon={<VerifiedOutlined />}
            sx={{ minHeight: 44, minWidth: 170 }}
          >
            {isLoggedIn ? 'Open Dashboard' : 'Sign In'}
          </Button>
        </Stack>
      </Surface>
    </Stack>
  );
}
