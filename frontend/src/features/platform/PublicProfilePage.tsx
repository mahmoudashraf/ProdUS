'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson } from './api';
import PublicExpertProfilePanel from './PublicExpertProfilePanel';
import PublicProfileConversionPanel from './PublicProfileConversionPanel';
import { PublicProfileView } from './PublicProfileFocusNav';
import PublicTeamProfilePanel from './PublicTeamProfilePanel';
import { EmptyState, QueryState } from './PlatformComponents';
import { ExpertProfile, ProductizationCart, Team, TeamCapability } from './types';

type ProfileKind = 'team' | 'expert';

const profileViewFromParam = (value: string | null): PublicProfileView =>
  value === 'proof' || value === 'signals' ? value : 'overview';

export default function PublicProfilePage({ kind }: { kind: ProfileKind }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, user } = useAuth();
  const canUseProjectCart = user?.role === UserRole.PRODUCT_OWNER;
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const activeView = profileViewFromParam(searchParams?.get('view') || null);
  const setActiveView = (view: PublicProfileView) => {
    const nextParams = new URLSearchParams(searchParams?.toString() || '');
    nextParams.set('view', view);
    router.replace(`${kind === 'team' ? '/teams' : '/solo-experts'}/${id}?${nextParams.toString()}`, { scroll: false });
  };

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
  const cart = useQuery({
    queryKey: ['productization-cart'],
    enabled: canUseProjectCart,
    queryFn: () => getJson<ProductizationCart>('/productization-cart/current'),
  });
  const addTeamToCart = useMutation({
    mutationFn: (payload: { teamId: string; notes: string }) =>
      postJson<ProductizationCart, { itemType: 'TEAM'; teamId: string; notes: string }>('/productization-cart/talent', { itemType: 'TEAM', ...payload }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const addExpertToCart = useMutation({
    mutationFn: (payload: { expertProfileId: string; notes: string }) =>
      postJson<ProductizationCart, { itemType: 'EXPERT'; expertProfileId: string; notes: string }>('/productization-cart/talent', { itemType: 'EXPERT', ...payload }),
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
        <PublicTeamProfilePanel
          team={team.data}
          capabilities={capabilities.data || []}
          activeView={activeView}
          isLoggedIn={isLoggedIn}
          canUseProjectCart={canUseProjectCart}
          inPlan={cartTeamIds.has(team.data.id)}
          isAdding={addTeamToCart.isPending}
          onChangeView={setActiveView}
          onAddTeam={() => addTeamToCart.mutate({ teamId: team.data.id, notes: 'Owner saved team from public profile.' })}
        />
      )}
      {kind === 'expert' && expert.data && (
        <PublicExpertProfilePanel
          expert={expert.data}
          activeView={activeView}
          isLoggedIn={isLoggedIn}
          canUseProjectCart={canUseProjectCart}
          inPlan={cartExpertIds.has(expert.data.id)}
          isAdding={addExpertToCart.isPending}
          onChangeView={setActiveView}
          onAddExpert={() => addExpertToCart.mutate({ expertProfileId: expert.data.id, notes: 'Owner saved solo expert from public profile.' })}
        />
      )}
      {!isLoading && !team.data && !expert.data && !error && (
        <EmptyState label="This public profile is not available." />
      )}
      <PublicProfileConversionPanel canUseProjectCart={canUseProjectCart} isLoggedIn={isLoggedIn} />
    </>
  );
}
