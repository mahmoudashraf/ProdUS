'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type {
  ActionJourneyView,
  AiJourneyView,
  FindingsJourneyView,
  OverviewJourneyView,
  ShareJourneyView,
  ServicesJourneyView,
} from './ownerWorkspaceJourneyConfig';
import { workspaceViewValues } from './ownerWorkspaceJourneyConfig';
import { isTechnicalProofView, type TechnicalProofView } from './ownerTechnicalProofJourneyModel';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import { workspaceDefaultViewByTab, workspaceTabs } from './ownerWorkspaceModel';

const isWorkspaceTabValue = (value: string | null): value is WorkspaceTab =>
  !!value && workspaceTabs.some((tab) => tab.value === value);

const isWorkspaceViewValue = (tab: WorkspaceTab, value: string | null) =>
  !!value && workspaceViewValues[tab].includes(value);

export function useOwnerWorkspaceNavigationState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('overview');
  const [overviewView, setOverviewView] = useState<OverviewJourneyView>('decision');
  const [actionView, setActionView] = useState<ActionJourneyView>('plan');
  const [findingsView, setFindingsView] = useState<FindingsJourneyView>('risks');
  const [servicesView, setServicesView] = useState<ServicesJourneyView>('recommend');
  const [aiView, setAiView] = useState<AiJourneyView>('opportunities');
  const [shareView, setShareView] = useState<ShareJourneyView>('create');
  const [technicalProofView, setTechnicalProofView] = useState<TechnicalProofView>('run');
  const [technicalProofDetailOpen, setTechnicalProofDetailOpen] = useState(false);
  const [workspaceDetailOpen, setWorkspaceDetailOpen] = useState(false);
  const searchParamString = searchParams?.toString() || '';

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamString);
    const tabParam = currentParams.get('tab');
    const viewParam = currentParams.get('view');
    const proofParam = currentParams.get('proof');
    const nextTab = isWorkspaceTabValue(tabParam) ? tabParam : 'overview';

    setWorkspaceTab(nextTab);
    if (isWorkspaceViewValue(nextTab, viewParam)) {
      setWorkspaceDetailOpen(true);
      if (nextTab === 'overview') setOverviewView(viewParam as OverviewJourneyView);
      if (nextTab === 'actions') setActionView(viewParam as ActionJourneyView);
      if (nextTab === 'findings') setFindingsView(viewParam as FindingsJourneyView);
      if (nextTab === 'services') setServicesView(viewParam as ServicesJourneyView);
      if (nextTab === 'ai') setAiView(viewParam as AiJourneyView);
      if (nextTab === 'share') setShareView(viewParam as ShareJourneyView);
    } else {
      setWorkspaceDetailOpen(false);
    }

    const hasTechnicalProofRoute = nextTab === 'findings' && viewParam === 'technical';
    if (hasTechnicalProofRoute && isTechnicalProofView(proofParam)) {
      setTechnicalProofView(proofParam);
      setTechnicalProofDetailOpen(true);
    } else {
      setTechnicalProofDetailOpen(false);
      if (!hasTechnicalProofRoute) {
        setTechnicalProofView('run');
      }
    }
  }, [searchParamString]);

  const pushWorkspaceLocation = (tab: WorkspaceTab, view?: string) => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || '/products';
    next.set('tab', tab);
    if (view) {
      next.set('view', view);
    } else {
      next.delete('view');
    }
    next.delete('proof');
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const pushProductHome = () => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
    const currentSearch = typeof window !== 'undefined' ? window.location.search : searchParamString;
    const next = new URLSearchParams(currentSearch);
    const routePath = currentPath || pathname || '/products';
    next.delete('tab');
    next.delete('view');
    next.delete('proof');
    const suffix = next.toString();
    router.push(`${routePath}${suffix ? `?${suffix}` : ''}`, { scroll: false });
  };

  const openWorkspaceArea = (tab: WorkspaceTab) => {
    setWorkspaceTab(tab);
    if (tab === 'overview') {
      setWorkspaceDetailOpen(false);
      setOverviewView('decision');
      pushProductHome();
      return;
    }
    const defaultView = workspaceDefaultViewByTab[tab];
    if (defaultView) {
      openWorkspaceDetail(tab, defaultView);
      return;
    }
    setWorkspaceDetailOpen(false);
    pushWorkspaceLocation(tab);
  };

  const openWorkspaceAreaHub = (tab: WorkspaceTab) => {
    setWorkspaceTab(tab);
    setWorkspaceDetailOpen(false);
    if (tab === 'overview') {
      setOverviewView('decision');
      pushProductHome();
      return;
    }
    pushWorkspaceLocation(tab);
  };

  const openWorkspaceDetail = (tab: WorkspaceTab, view: string) => {
    setWorkspaceTab(tab);
    setWorkspaceDetailOpen(true);
    if (tab === 'overview') setOverviewView(view as OverviewJourneyView);
    if (tab === 'actions') setActionView(view as ActionJourneyView);
    if (tab === 'findings') setFindingsView(view as FindingsJourneyView);
    if (tab === 'services') setServicesView(view as ServicesJourneyView);
    if (tab === 'ai') setAiView(view as AiJourneyView);
    if (tab === 'share') setShareView(view as ShareJourneyView);
    pushWorkspaceLocation(tab, view);
  };

  const openTechnicalProofHub = () => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || '/products';
    next.set('tab', 'findings');
    next.set('view', 'technical');
    next.delete('proof');
    setWorkspaceTab('findings');
    setFindingsView('technical');
    setWorkspaceDetailOpen(true);
    setTechnicalProofDetailOpen(false);
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const openTechnicalProofView = (view: TechnicalProofView) => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || '/products';
    next.set('tab', 'findings');
    next.set('view', 'technical');
    next.set('proof', view);
    setWorkspaceTab('findings');
    setFindingsView('technical');
    setWorkspaceDetailOpen(true);
    setTechnicalProofView(view);
    setTechnicalProofDetailOpen(true);
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  return {
    workspaceTab,
    overviewView,
    actionView,
    findingsView,
    servicesView,
    aiView,
    shareView,
    technicalProofView,
    technicalProofDetailOpen,
    workspaceDetailOpen,
    openProductHome: () => {
      setWorkspaceTab('overview');
      setWorkspaceDetailOpen(false);
      setOverviewView('decision');
      pushProductHome();
    },
    openWorkspaceArea,
    openWorkspaceAreaHub,
    openWorkspaceDetail,
    openActionView: (view: ActionJourneyView) => openWorkspaceDetail('actions', view),
    openFindingsView: (view: FindingsJourneyView) => openWorkspaceDetail('findings', view),
    openServicesView: (view: ServicesJourneyView) => openWorkspaceDetail('services', view),
    openAiView: (view: AiJourneyView) => openWorkspaceDetail('ai', view),
    openShareView: (view: ShareJourneyView) => openWorkspaceDetail('share', view),
    openTechnicalProofHub,
    openTechnicalProofView,
  };
}
