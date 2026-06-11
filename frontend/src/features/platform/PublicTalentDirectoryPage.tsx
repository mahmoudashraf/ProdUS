'use client';

import NextLink from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchOutlined } from '@mui/icons-material';
import { Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material';
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
  const [talentQuery, setTalentQuery] = useState('');
  const { isLoggedIn, user } = useAuth();
  const canUseProjectCart = user?.role === UserRole.PRODUCT_OWNER;
  const cartHref = canUseProjectCart ? PROJECT_START_PLAN_HREF : isLoggedIn ? '/dashboard' : '/login';
  const cartActionLabel = canUseProjectCart ? 'Planning' : isLoggedIn ? 'Open dashboard' : 'Sign in to start';
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
  const normalizedTalentQuery = talentQuery.trim().toLowerCase();
  const matchingTeams = normalizedTalentQuery
    ? teamList.filter((team) =>
        [team.name, team.headline, team.description, team.capabilitiesSummary, team.typicalProjectSize, team.verificationStatus]
          .some((value) => (value || '').toLowerCase().includes(normalizedTalentQuery))
      )
    : teamList;
  const matchingExperts = normalizedTalentQuery
    ? soloExperts.filter((expert) =>
        [expert.displayName, expert.headline, expert.bio, expert.skills, expert.location, expert.timezone, expert.availability]
          .some((value) => (value || '').toLowerCase().includes(normalizedTalentQuery))
      )
    : soloExperts;
  const visibleTalentLimit = normalizedTalentQuery ? 12 : 8;
  const visibleTeams = matchingTeams.slice(0, visibleTalentLimit);
  const visibleExperts = matchingExperts.slice(0, visibleTalentLimit);
  const hiddenTeamCount = Math.max(0, matchingTeams.length - visibleTeams.length);
  const hiddenExpertCount = Math.max(0, matchingExperts.length - visibleExperts.length);
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
    ? 'Move through one discovery path at a time, then save the right delivery help into Planning.'
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
            onOpenExperts={() => setActiveView('experts')}
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
              <Button component={NextLink} href="/catalog" variant="outlined" sx={{ minHeight: 40 }}>
                Match by service
              </Button>
            }
          />
          <Stack spacing={1.25}>
            <TalentSearchBox
              label="Search teams"
              value={talentQuery}
              onChange={setTalentQuery}
            />
            {teamList.length > 0 && visibleTeams.length > 0 ? (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
                    gap: 2,
                  }}
                >
                  {visibleTeams.map((team) => (
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
                <TalentListSummary
                  itemLabel="teams"
                  visibleCount={visibleTeams.length}
                  hiddenCount={hiddenTeamCount}
                  isSearching={Boolean(normalizedTalentQuery)}
                />
              </>
            ) : (
              <EmptyState label={teamList.length ? 'No teams match that search.' : 'No public teams are available yet.'} />
            )}
          </Stack>
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
          <Stack spacing={1.25}>
            <TalentSearchBox
              label="Search experts"
              value={talentQuery}
              onChange={setTalentQuery}
            />
            {soloExperts.length > 0 && visibleExperts.length > 0 ? (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
                    gap: 2,
                  }}
                >
                  {visibleExperts.map((expert) => (
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
                <TalentListSummary
                  itemLabel="experts"
                  visibleCount={visibleExperts.length}
                  hiddenCount={hiddenExpertCount}
                  isSearching={Boolean(normalizedTalentQuery)}
                />
              </>
            ) : (
              <EmptyState label={soloExperts.length ? 'No solo experts match that search.' : 'No public solo expert profiles are available yet.'} />
            )}
          </Stack>
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

function TalentSearchBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      size="small"
      fullWidth
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchOutlined fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );
}

function TalentListSummary({
  itemLabel,
  visibleCount,
  hiddenCount,
  isSearching,
}: {
  itemLabel: string;
  visibleCount: number;
  hiddenCount: number;
  isSearching: boolean;
}) {
  return (
    <Box sx={{ p: 1.25, border: '1px dashed', borderColor: 'divider', borderRadius: 1, bgcolor: '#fbfdff' }}>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
        {hiddenCount
          ? `Showing ${visibleCount} ${isSearching ? 'matching' : 'visible'} ${itemLabel}. ${hiddenCount} more ${isSearching ? 'matches are hidden; refine the search to narrow them' : `${itemLabel} are available through search`}.`
          : isSearching
            ? `Showing all ${visibleCount} matching ${itemLabel}.`
            : `Showing the visible ${itemLabel} first.`}
      </Typography>
    </Box>
  );
}
