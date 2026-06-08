'use client';

import NextLink from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson } from './api';
import { ExpertCard, PublicTeamCard } from './PublicTalentCards';
import {
  PublicTalentCta,
  PublicTalentFocusNav,
  PublicTalentContextPanel,
  PublicTalentInternalHeader,
  PublicTalentServicesPanel,
  PublicTalentView,
} from './PublicTalentPanels';
import {
  EmptyState,
  PageHeader,
  QueryState,
  SectionTitle,
} from './PlatformComponents';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import { ExpertProfile, ProductizationCart, ServiceCategory, ServiceModule, Team } from './types';

type DirectoryRouteView = 'directory' | 'experts';

const isPublicTalentView = (value: string | null): value is PublicTalentView =>
  value === 'teams' || value === 'experts' || value === 'services';

export default function PublicTalentDirectoryPage({ view = 'directory' }: { view?: DirectoryRouteView }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoggedIn, user } = useAuth();
  const canUseProjectCart = user?.role === UserRole.PRODUCT_OWNER;
  const cartHref = canUseProjectCart ? PROJECT_START_PLAN_HREF : isLoggedIn ? '/dashboard' : '/login';
  const cartActionLabel = canUseProjectCart ? 'Project Start Plan' : isLoggedIn ? 'Open dashboard' : 'Sign in to start';
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

  const routeDefaultView: PublicTalentView = view === 'experts' ? 'experts' : 'teams';
  const requestedView = searchParams?.get('view') || null;
  const hasActiveView = isPublicTalentView(requestedView) || view === 'experts';
  const activeView: PublicTalentView = isPublicTalentView(requestedView) ? requestedView : routeDefaultView;
  const setActiveView = (nextView: PublicTalentView) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('view', nextView);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const openTalentHub = () => {
    if (view === 'experts') {
      router.push('/teams', { scroll: false });
      return;
    }
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('view');
    const nextQueryString = params.toString();
    router.push(`${pathname || '/teams'}${nextQueryString ? `?${nextQueryString}` : ''}`, { scroll: false });
  };

  const teamList = teams.data || [];
  const soloExperts = (experts.data || []).filter((expert) => expert.soloMode && expert.active);
  const categoryList = (categories.data || []).filter((category) => category.active);
  const moduleList = (modules.data || []).filter((module) => module.active);
  const cartTeamIds = new Set((cart.data?.talentItems || []).map((item) => item.team?.id).filter(Boolean) as string[]);
  const cartExpertIds = new Set((cart.data?.talentItems || []).map((item) => item.expertProfile?.id).filter(Boolean) as string[]);
  const viewCounts: Record<PublicTalentView, number> = {
    teams: teamList.length,
    experts: soloExperts.length,
    services: categoryList.length,
  };
  const pageTitle = hasActiveView
    ? activeView === 'experts'
      ? 'Solo Expert Network'
      : activeView === 'services'
        ? 'Service Workstreams'
        : 'Verified Team Network'
    : 'Delivery Talent Network';
  const pageDescription = hasActiveView
    ? 'Move through one discovery path at a time, then save the right delivery help into a product start plan.'
    : 'Find the delivery help that belongs in a startup-owner launch plan: verified teams, focused experts, and the service workstreams they can execute.';

  return (
    <Stack spacing={3}>
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button onClick={() => setActiveView('services')} variant="outlined" sx={{ minHeight: 42, minWidth: 130 }}>
              See services
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

      {hasActiveView ? (
        <>
          <PublicTalentInternalHeader activeView={activeView} onOpenHub={openTalentHub} />
          <PublicTalentContextPanel
            activeView={activeView}
            cartActionLabel={cartActionLabel}
            cartHref={cartHref}
            counts={viewCounts}
            onOpenServices={() => setActiveView('services')}
            onOpenTeams={() => setActiveView('teams')}
          />
        </>
      ) : (
        <PublicTalentFocusNav activeView={null} counts={viewCounts} onChange={setActiveView} />
      )}

      {hasActiveView && activeView === 'teams' && (
        <Box>
          <SectionTitle
            title="Verified Teams"
            action={
              <Button component={NextLink} href="/services" variant="outlined" sx={{ minHeight: 40 }}>
                Match by service
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
                  isAttaching={addTeamToCart.isPending}
                  onAttach={() => addTeamToCart.mutate({ teamId: team.id, notes: 'Owner saved team from public directory.' })}
                />
              ))}
            </Box>
          ) : (
            <EmptyState label="No public teams are available yet." />
          )}
        </Box>
      )}

      {hasActiveView && activeView === 'experts' && (
        <Box>
          <SectionTitle
            title="Available Solo Experts"
            action={
              view !== 'experts' && (
                <Button component={NextLink} href="/solo-experts" variant="outlined" sx={{ minHeight: 40 }}>
                  Open expert network
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
                  isAttaching={addExpertToCart.isPending}
                  onAttach={() => addExpertToCart.mutate({ expertProfileId: expert.id, notes: 'Owner saved solo expert from public directory.' })}
                />
              ))}
            </Box>
          ) : (
            <EmptyState label="No public solo expert profiles are available yet." />
          )}
        </Box>
      )}

      {hasActiveView && activeView === 'services' && (
        categoryList.length > 0 ? (
          <PublicTalentServicesPanel categories={categoryList} modules={moduleList} />
        ) : (
          <EmptyState label="No lifecycle services are visible yet." />
        )
      )}

      {!hasActiveView && <PublicTalentCta isLoggedIn={isLoggedIn} />}
    </Stack>
  );
}
