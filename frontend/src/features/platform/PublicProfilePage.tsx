'use client';

import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import { ReactNode } from 'react';
import {
  AddShoppingCartOutlined,
  AutoAwesomeOutlined,
  LanguageOutlined,
  LaunchOutlined,
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
import { ExpertProfile, ProductizationCart, Team, TeamCapability } from './types';

type ProfileKind = 'team' | 'expert';

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

function ProfileHero({
  name,
  title,
  body,
  photoUrl,
  coverUrl,
  badge,
  children,
}: {
  name: string;
  title?: string | undefined;
  body?: string | undefined;
  photoUrl?: string | undefined;
  coverUrl?: string | undefined;
  badge: ReactNode;
  children: ReactNode;
}) {
  return (
    <Surface sx={{ p: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          minHeight: { xs: 170, md: 220 },
          background: coverUrl
            ? `linear-gradient(90deg, rgba(15,23,42,0.52), rgba(98,92,255,0.20)), url(${coverUrl}) center/cover`
            : 'linear-gradient(135deg, #eef2ff, #ecfeff)',
        }}
      />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.5}
        alignItems={{ xs: 'flex-start', md: 'flex-end' }}
        justifyContent="space-between"
        sx={{ p: { xs: 2.5, md: 3 }, pt: 0 }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
          <Avatar
            variant="rounded"
            {...(photoUrl ? { src: photoUrl } : {})}
            sx={{
              width: 96,
              height: 96,
              mt: -6,
              border: '5px solid #fff',
              bgcolor: '#eef2ff',
              color: appleColors.purple,
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            {name.slice(0, 1)}
          </Avatar>
          <Box sx={{ pb: { sm: 0.5 } }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h2">{name}</Typography>
              {badge}
            </Stack>
            <Typography sx={{ mt: 0.75, fontSize: 18, color: appleColors.muted, lineHeight: 1.55 }}>
              {title || body || 'Public ProdOps profile.'}
            </Typography>
          </Box>
        </Stack>
        {children}
      </Stack>
    </Surface>
  );
}

function TeamProfile({
  team,
  capabilities,
  isLoggedIn,
  canUseProjectCart,
  inCart,
  onAddTeam,
  isAdding,
}: {
  team: Team;
  capabilities: TeamCapability[];
  isLoggedIn: boolean;
  canUseProjectCart: boolean;
  inCart: boolean;
  onAddTeam: () => void;
  isAdding: boolean;
}) {
  const tags = splitTags(team.capabilitiesSummary || team.description);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Team Profile"
        description="Public capability profile for product owners reviewing production-ready delivery partners."
      />
      <ProfileHero
        name={team.name}
        title={team.headline || team.description}
        body={team.bio}
        photoUrl={team.profilePhotoUrl}
        coverUrl={team.coverPhotoUrl}
        badge={<StatusChip label={team.verificationStatus} />}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            component={NextLink}
            href={!isLoggedIn ? '/login' : canUseProjectCart ? '#' : '/dashboard'}
            variant="contained"
            startIcon={<AddShoppingCartOutlined />}
            disabled={canUseProjectCart && isAdding}
            onClick={(event) => {
              if (!canUseProjectCart) return;
              event.preventDefault();
              onAddTeam();
            }}
            sx={{ minHeight: 44, minWidth: 180 }}
          >
            {!isLoggedIn ? 'Sign In To Add Team' : canUseProjectCart ? (inCart ? 'In Draft Cart' : 'Add Team To Draft') : 'Open Dashboard'}
          </Button>
          <Button component={NextLink} href={canUseProjectCart ? '/owner/project-cart' : isLoggedIn ? '/dashboard' : '/login'} variant="outlined" sx={{ minHeight: 44, minWidth: 170 }}>
            {canUseProjectCart ? 'Review draft cart' : isLoggedIn ? 'Open dashboard' : 'Sign in to start'}
          </Button>
        </Stack>
      </ProfileHero>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 0.8fr' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="Delivery Focus" />
            <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
              {team.bio || team.description || 'This team maintains a public profile for service fit, delivery proof, and owner evaluation.'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {tags.map((tag) => (
                <PastelChip key={tag} label={tag} accent={appleColors.cyan} bg="#e4f9fd" />
              ))}
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle title="Verified Service Capabilities" />
            {capabilities.length ? (
              <Stack spacing={1.25}>
                {capabilities.map((capability, index) => {
                  const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;

                  return (
                    <Box
                      key={capability.id}
                      sx={{
                        p: 1.75,
                        border: `1px solid ${appleColors.line}`,
                        borderRadius: 1,
                        bgcolor: palette.soft,
                      }}
                    >
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                        <Box>
                          <Typography sx={{ fontWeight: 900 }}>
                            {capability.serviceModule?.name || capability.serviceCategory.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                            {capability.notes || capability.serviceModule?.description || capability.serviceCategory.description}
                          </Typography>
                        </Box>
                        <PastelChip label={capability.serviceCategory.name} accent={palette.accent} bg={palette.bg} />
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <EmptyState label="No public service capabilities have been published for this team yet." />
            )}
          </Surface>
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <Stack spacing={2} alignItems="center" textAlign="center">
              <ProgressRing value={teamScore(team)} size={110} color={appleColors.purple} label="match" />
              <Box>
                <Typography variant="h4">Public Readiness Score</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  Based on verification status, capability coverage, and profile completeness.
                </Typography>
              </Box>
            </Stack>
          </Surface>
          <Surface>
            <SectionTitle title="Profile Signals" />
            <Stack spacing={1.5}>
              <DotLabel label={team.timezone || 'Remote delivery'} color={appleColors.green} />
              <DotLabel label={team.typicalProjectSize || 'Scoped after intake'} color={appleColors.cyan} />
              <DotLabel label={formatLabel(team.verificationStatus)} color={appleColors.purple} />
              {team.websiteUrl && (
                <Button
                  component={NextLink}
                  href={team.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="outlined"
                  startIcon={<LanguageOutlined />}
                  sx={{ minHeight: 42 }}
                >
                  Visit Website
                </Button>
              )}
            </Stack>
          </Surface>
        </Stack>
      </Box>
    </Stack>
  );
}

function ExpertProfileView({
  expert,
  isLoggedIn,
  canUseProjectCart,
  inCart,
  onAddExpert,
  isAdding,
}: {
  expert: ExpertProfile;
  isLoggedIn: boolean;
  canUseProjectCart: boolean;
  inCart: boolean;
  onAddExpert: () => void;
  isAdding: boolean;
}) {
  const skills = splitTags(expert.skills);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Solo Expert Profile"
        description="Public expert profile for owners and teams evaluating independent productization support."
      />
      <ProfileHero
        name={expert.displayName}
        title={expert.headline}
        body={expert.bio}
        photoUrl={expert.profilePhotoUrl}
        coverUrl={expert.coverPhotoUrl}
        badge={<StatusChip label={expert.availability} />}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            component={NextLink}
            href={!isLoggedIn ? '/login' : canUseProjectCart ? '#' : '/dashboard'}
            variant="contained"
            startIcon={<AddShoppingCartOutlined />}
            disabled={canUseProjectCart && isAdding}
            onClick={(event) => {
              if (!canUseProjectCart) return;
              event.preventDefault();
              onAddExpert();
            }}
            sx={{ minHeight: 44, minWidth: 180 }}
          >
            {!isLoggedIn ? 'Sign In To Add Expert' : canUseProjectCart ? (inCart ? 'In Draft Cart' : 'Add Expert To Draft') : 'Open Dashboard'}
          </Button>
          <Button component={NextLink} href="/solo-experts" variant="outlined" sx={{ minHeight: 44, minWidth: 150 }}>
            Browse Experts
          </Button>
        </Stack>
      </ProfileHero>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.3fr 0.8fr' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="Expert Bio" />
            <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
              {expert.bio || 'This solo expert maintains a public profile for capability, availability, and owner fit.'}
            </Typography>
          </Surface>
          <Surface>
            <SectionTitle title="Skills And Services" />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {skills.length ? (
                skills.map((skill) => <PastelChip key={skill} label={skill} accent={appleColors.green} bg="#e7f8ee" />)
              ) : (
                <PastelChip label="Productization support" accent={appleColors.green} bg="#e7f8ee" />
              )}
            </Stack>
          </Surface>
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="Availability" />
            <Stack spacing={1.5}>
              <DotLabel label={formatLabel(expert.availability)} color={expert.availability === 'AVAILABLE' ? appleColors.green : appleColors.amber} />
              <DotLabel label={expert.location || 'Remote'} color={appleColors.cyan} />
              <DotLabel label={expert.preferredProjectSize || 'Scoped after intake'} color={appleColors.purple} />
            </Stack>
          </Surface>
          <Surface>
            <SectionTitle title="Profile Links" />
            <Stack spacing={1}>
              {expert.websiteUrl && (
                <Button component={NextLink} href={expert.websiteUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<LanguageOutlined />} sx={{ minHeight: 42 }}>
                  Website
                </Button>
              )}
              {expert.portfolioUrl && (
                <Button component={NextLink} href={expert.portfolioUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<LaunchOutlined />} sx={{ minHeight: 42 }}>
                  Portfolio
                </Button>
              )}
              <Button component={NextLink} href={canUseProjectCart ? '/owner/project-cart' : isLoggedIn ? '/dashboard' : '/login'} variant="contained" startIcon={<RocketLaunchOutlined />} sx={{ minHeight: 42 }}>
                {canUseProjectCart ? 'Review draft cart' : isLoggedIn ? 'Open dashboard' : 'Sign in to start'}
              </Button>
            </Stack>
          </Surface>
        </Stack>
      </Box>
    </Stack>
  );
}

export default function PublicProfilePage({ kind }: { kind: ProfileKind }) {
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuth();
  const canUseProjectCart = user?.role === UserRole.PRODUCT_OWNER;
  const params = useParams<{ id: string }>();
  const id = params?.id || '';

  const team = useQuery({
    queryKey: ['public-team-profile', id],
    enabled: kind === 'team' && !!id,
    queryFn: () => getJson<Team>(`/teams/${id}`),
  });
  const capabilities = useQuery({
    queryKey: ['public-team-profile', id, 'capabilities'],
    enabled: kind === 'team' && !!id,
    queryFn: () => getJson<TeamCapability[]>(`/teams/${id}/capabilities`),
  });
  const expert = useQuery({
    queryKey: ['public-expert-profile', id],
    enabled: kind === 'expert' && !!id,
    queryFn: () => getJson<ExpertProfile>(`/expert-profiles/${id}`),
  });
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

  const isLoading = kind === 'team' ? team.isLoading || capabilities.isLoading : expert.isLoading;
  const error = (kind === 'team' ? team.error || capabilities.error : expert.error) || cart.error || addTeamToCart.error || addExpertToCart.error;
  const cartTeamIds = new Set((cart.data?.talentItems || []).map((item) => item.team?.id).filter(Boolean) as string[]);
  const cartExpertIds = new Set((cart.data?.talentItems || []).map((item) => item.expertProfile?.id).filter(Boolean) as string[]);

  return (
    <>
      <QueryState isLoading={isLoading} error={error} />
      {kind === 'team' && team.data && (
        <TeamProfile
          team={team.data}
          capabilities={capabilities.data || []}
          isLoggedIn={isLoggedIn}
          canUseProjectCart={canUseProjectCart}
          inCart={cartTeamIds.has(team.data.id)}
          isAdding={addTeamToCart.isPending}
          onAddTeam={() => addTeamToCart.mutate({ teamId: team.data.id, notes: 'Owner saved team from public profile.' })}
        />
      )}
      {kind === 'expert' && expert.data && (
        <ExpertProfileView
          expert={expert.data}
          isLoggedIn={isLoggedIn}
          canUseProjectCart={canUseProjectCart}
          inCart={cartExpertIds.has(expert.data.id)}
          isAdding={addExpertToCart.isPending}
          onAddExpert={() => addExpertToCart.mutate({ expertProfileId: expert.data.id, notes: 'Owner saved solo expert from public profile.' })}
        />
      )}
      {!isLoading && !team.data && !expert.data && !error && (
        <EmptyState label="This public profile is not available." />
      )}
      <Surface sx={{ mt: 3, background: 'linear-gradient(135deg, #ffffff, #eef2ff)' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AutoAwesomeOutlined sx={{ color: appleColors.purple }} />
            <Box>
              <Typography variant="h4">Need a governed production path?</Typography>
              <Typography color="text.secondary">Compare profiles, save delivery partners to a draft cart, and convert it into a governed workspace after sign in.</Typography>
            </Box>
          </Stack>
          <Button component={NextLink} href={canUseProjectCart ? '/owner/project-cart' : isLoggedIn ? '/dashboard' : '/login'} variant="contained" startIcon={<VerifiedOutlined />} sx={{ minHeight: 44, minWidth: 160 }}>
            {canUseProjectCart ? 'Review draft cart' : isLoggedIn ? 'Dashboard' : 'Sign in'}
          </Button>
        </Stack>
      </Surface>
    </>
  );
}
