'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { TeamProfileStudioView } from './TeamProfileStudioNavigation';

const isTeamProfileStudioView = (value: string | null | undefined): value is TeamProfileStudioView =>
  value === 'profile' || value === 'team' || value === 'expert' || value === 'requests';

export function useTeamProfileStudioNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams?.get('view');
  const activeView: TeamProfileStudioView = isTeamProfileStudioView(viewParam) ? viewParam : 'profile';
  const setActiveView = (view: TeamProfileStudioView) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('view', view);
    router.replace(`/teams?${params.toString()}`, { scroll: false });
  };

  return {
    activeView,
    setActiveView,
  };
}
