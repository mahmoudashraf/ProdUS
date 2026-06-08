'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { TeamProfileStudioView } from './TeamProfileStudioNavigation';

const isTeamProfileStudioView = (value: string | null | undefined): value is TeamProfileStudioView =>
  value === 'profile' || value === 'team' || value === 'expert' || value === 'requests';

export function useTeamProfileStudioNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewParam = searchParams?.get('view');
  const activeView: TeamProfileStudioView = isTeamProfileStudioView(viewParam) ? viewParam : 'profile';
  const hasActiveView = isTeamProfileStudioView(viewParam);
  const setActiveView = (view: TeamProfileStudioView) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('view', view);
    router.replace(`${pathname || '/teams'}?${params.toString()}`, { scroll: false });
  };
  const openHub = () => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('view');
    const suffix = params.toString();
    router.replace(suffix ? `${pathname || '/teams'}?${suffix}` : pathname || '/teams', { scroll: false });
  };

  return {
    activeView,
    hasActiveView,
    openHub,
    setActiveView,
  };
}
