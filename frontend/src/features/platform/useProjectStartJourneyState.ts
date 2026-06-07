'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { isProjectStartJourneyView, type ProjectStartJourneyView } from './ProjectStartJourneyNavigation';

export function useProjectStartJourneyState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [startPlanView, setStartPlanView] = useState<ProjectStartJourneyView>('readiness');
  const [startPlanDetailOpen, setStartPlanDetailOpen] = useState(false);
  const searchParamString = searchParams?.toString() || '';

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamString);
    const stepParam = currentParams.get('step');
    if (isProjectStartJourneyView(stepParam)) {
      setStartPlanView(stepParam);
      setStartPlanDetailOpen(true);
    } else {
      setStartPlanDetailOpen(false);
    }
  }, [searchParamString]);

  const pushStartPlanLocation = (step?: ProjectStartJourneyView) => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || '/owner/project-cart';
    if (step) {
      next.set('step', step);
    } else {
      next.delete('step');
    }
    const query = next.toString();
    router.push(query ? `${routePath}?${query}` : routePath, { scroll: false });
  };

  const openStartPlanHub = () => {
    setStartPlanDetailOpen(false);
    pushStartPlanLocation();
  };

  const openStartPlanDetail = (step: ProjectStartJourneyView) => {
    setStartPlanView(step);
    setStartPlanDetailOpen(true);
    pushStartPlanLocation(step);
  };

  return {
    startPlanView,
    startPlanDetailOpen,
    openStartPlanHub,
    openStartPlanDetail,
  };
}
