'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { isCartJourneyView, type CartJourneyView } from './DraftCartJourneyNavigation';

export function useDraftCartJourneyState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cartView, setCartView] = useState<CartJourneyView>('readiness');
  const [cartDetailOpen, setCartDetailOpen] = useState(false);
  const searchParamString = searchParams?.toString() || '';

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamString);
    const stepParam = currentParams.get('step');
    if (isCartJourneyView(stepParam)) {
      setCartView(stepParam);
      setCartDetailOpen(true);
    } else {
      setCartDetailOpen(false);
    }
  }, [searchParamString]);

  const pushCartLocation = (step?: CartJourneyView) => {
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

  const openCartHub = () => {
    setCartDetailOpen(false);
    pushCartLocation();
  };

  const openCartDetail = (step: CartJourneyView) => {
    setCartView(step);
    setCartDetailOpen(true);
    pushCartLocation(step);
  };

  return {
    cartView,
    cartDetailOpen,
    openCartHub,
    openCartDetail,
  };
}
