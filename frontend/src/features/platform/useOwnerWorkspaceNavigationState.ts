'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type {
  ActionJourneyView,
  FindingsJourneyView,
  OverviewJourneyView,
  ShareJourneyView,
  ServicesJourneyView,
} from './ownerWorkspaceJourneyConfig';
import { workspaceViewValues } from './ownerWorkspaceJourneyConfig';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import { workspaceTabs } from './ownerWorkspaceModel';

const isWorkspaceTabValue = (value: string | null): value is WorkspaceTab =>
  !!value && workspaceTabs.some((tab) => tab.value === value);

const isWorkspaceViewValue = (tab: WorkspaceTab, value: string | null) =>
  !!value && workspaceViewValues[tab].includes(value);

const defaultWorkspaceView = (tab: WorkspaceTab) => workspaceViewValues[tab][0] || '';

export function useOwnerWorkspaceNavigationState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('overview');
  const [overviewView, setOverviewView] = useState<OverviewJourneyView>('decision');
  const [actionView, setActionView] = useState<ActionJourneyView>('plan');
  const [findingsView, setFindingsView] = useState<FindingsJourneyView>('risks');
  const [servicesView, setServicesView] = useState<ServicesJourneyView>('recommend');
  const [shareView, setShareView] = useState<ShareJourneyView>('links');
  const [workspaceDetailOpen, setWorkspaceDetailOpen] = useState(false);
  const searchParamString = searchParams?.toString() || '';

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamString);
    const tabParam = currentParams.get('tab');
    const viewParam = currentParams.get('view');
    const nextTab = isWorkspaceTabValue(tabParam) ? tabParam : 'overview';

    setWorkspaceTab(nextTab);
    if (isWorkspaceViewValue(nextTab, viewParam)) {
      setWorkspaceDetailOpen(true);
      if (nextTab === 'overview') setOverviewView(viewParam as OverviewJourneyView);
      if (nextTab === 'actions') setActionView(viewParam as ActionJourneyView);
      if (nextTab === 'findings') setFindingsView(viewParam as FindingsJourneyView);
      if (nextTab === 'services') setServicesView(viewParam as ServicesJourneyView);
      if (nextTab === 'share') setShareView(viewParam as ShareJourneyView);
    } else if (tabParam && nextTab !== 'overview') {
      const defaultView = defaultWorkspaceView(nextTab);
      setWorkspaceDetailOpen(true);
      if (nextTab === 'actions') setActionView(defaultView as ActionJourneyView);
      if (nextTab === 'findings') setFindingsView(defaultView as FindingsJourneyView);
      if (nextTab === 'services') setServicesView(defaultView as ServicesJourneyView);
      if (nextTab === 'share') setShareView(defaultView as ShareJourneyView);
    } else {
      setWorkspaceDetailOpen(false);
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
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const pushProductHome = () => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
    const currentSearch = typeof window !== 'undefined' ? window.location.search : searchParamString;
    const next = new URLSearchParams(currentSearch);
    const routePath = currentPath || pathname || '/products';
    next.delete('tab');
    next.delete('view');
    const suffix = next.toString();
    router.push(`${routePath}${suffix ? `?${suffix}` : ''}`, { scroll: false });
  };

  const openWorkspaceArea = (tab: WorkspaceTab) => {
    setWorkspaceTab(tab);
    setWorkspaceDetailOpen(tab !== 'overview');
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
    if (tab === 'share') setShareView(view as ShareJourneyView);
    pushWorkspaceLocation(tab, view);
  };

  return {
    workspaceTab,
    overviewView,
    actionView,
    findingsView,
    servicesView,
    shareView,
    workspaceDetailOpen,
    openProductHome: () => {
      setWorkspaceTab('overview');
      setWorkspaceDetailOpen(false);
      setOverviewView('decision');
      pushProductHome();
    },
    openWorkspaceArea,
    openWorkspaceDetail,
    openActionView: (view: ActionJourneyView) => openWorkspaceDetail('actions', view),
    openFindingsView: (view: FindingsJourneyView) => openWorkspaceDetail('findings', view),
    openServicesView: (view: ServicesJourneyView) => openWorkspaceDetail('services', view),
    openShareView: (view: ShareJourneyView) => openWorkspaceDetail('share', view),
  };
}
