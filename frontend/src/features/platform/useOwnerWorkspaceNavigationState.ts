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
import { isEvidenceLibraryView, type EvidenceLibraryView } from './ownerEvidenceLibraryModel';
import { isOwnerRiskGroupView, type OwnerRiskGroupView } from './ownerRiskGroupRouteModel';
import { isScannerProofOperationView, type ScannerProofOperationView } from './scannerProofOperationModel';
import { isTechnicalProofView, type TechnicalProofView } from './ownerTechnicalProofJourneyModel';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import { workspaceDefaultViewByTab, workspaceTabs } from './ownerWorkspaceModel';

const isWorkspaceTabValue = (value: string | null): value is WorkspaceTab =>
  !!value && workspaceTabs.some((tab) => tab.value === value);

const isWorkspaceViewValue = (tab: WorkspaceTab, value: string | null) =>
  !!value && workspaceViewValues[tab].includes(value);

const normalizedWorkspaceViewValue = (tab: WorkspaceTab, value: string) =>
  tab === 'ai' && value === 'loomai' ? 'details' : value;

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
  const [riskGroupView, setRiskGroupView] = useState<OwnerRiskGroupView | null>(null);
  const [evidenceLibraryView, setEvidenceLibraryView] = useState<EvidenceLibraryView | null>(null);
  const [technicalProofView, setTechnicalProofView] = useState<TechnicalProofView>('run');
  const [technicalProofDetailOpen, setTechnicalProofDetailOpen] = useState(false);
  const [scannerProofOperationView, setScannerProofOperationView] = useState<ScannerProofOperationView | null>(null);
  const [workspaceDetailOpen, setWorkspaceDetailOpen] = useState(false);
  const searchParamString = searchParams?.toString() || '';

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamString);
    const tabParam = currentParams.get('tab');
    const viewParam = currentParams.get('view');
    const riskGroupParam = currentParams.get('riskGroup');
    const proofLibraryParam = currentParams.get('proofLibrary');
    const proofParam = currentParams.get('proof');
    const setupParam = currentParams.get('setup');
    const nextTab = isWorkspaceTabValue(tabParam) ? tabParam : 'overview';

    setWorkspaceTab(nextTab);
    if (isWorkspaceViewValue(nextTab, viewParam)) {
      const normalizedViewParam = normalizedWorkspaceViewValue(nextTab, viewParam || '');
      setWorkspaceDetailOpen(true);
      if (nextTab === 'overview') setOverviewView(normalizedViewParam as OverviewJourneyView);
      if (nextTab === 'actions') setActionView(normalizedViewParam as ActionJourneyView);
      if (nextTab === 'findings') setFindingsView(normalizedViewParam as FindingsJourneyView);
      if (nextTab === 'services') setServicesView(normalizedViewParam as ServicesJourneyView);
      if (nextTab === 'ai') setAiView(normalizedViewParam as AiJourneyView);
      if (nextTab === 'share') setShareView(normalizedViewParam as ShareJourneyView);
      setRiskGroupView(nextTab === 'findings' && normalizedViewParam === 'risks' && isOwnerRiskGroupView(riskGroupParam) ? riskGroupParam : null);
      setEvidenceLibraryView(nextTab === 'findings' && normalizedViewParam === 'evidence' && isEvidenceLibraryView(proofLibraryParam) ? proofLibraryParam : null);
    } else {
      setWorkspaceDetailOpen(false);
      setRiskGroupView(null);
      setEvidenceLibraryView(null);
    }

    const hasTechnicalProofRoute = nextTab === 'findings' && viewParam === 'technical';
    if (hasTechnicalProofRoute && isTechnicalProofView(proofParam)) {
      setTechnicalProofView(proofParam);
      setTechnicalProofDetailOpen(true);
      setScannerProofOperationView(proofParam === 'run' && isScannerProofOperationView(setupParam) ? setupParam : null);
    } else {
      setTechnicalProofDetailOpen(false);
      setScannerProofOperationView(null);
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
    next.delete('riskGroup');
    next.delete('proofLibrary');
    next.delete('proof');
    next.delete('setup');
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const pushProductHome = () => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
    const currentSearch = typeof window !== 'undefined' ? window.location.search : searchParamString;
    const next = new URLSearchParams(currentSearch);
    const routePath = currentPath || pathname || '/products';
    next.delete('tab');
    next.delete('view');
    next.delete('riskGroup');
    next.delete('proofLibrary');
    next.delete('proof');
    next.delete('setup');
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
    next.delete('riskGroup');
    next.delete('proofLibrary');
    next.delete('proof');
    next.delete('setup');
    setWorkspaceTab('findings');
    setFindingsView('technical');
    setWorkspaceDetailOpen(true);
    setTechnicalProofDetailOpen(false);
    setScannerProofOperationView(null);
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const openTechnicalProofView = (view: TechnicalProofView) => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || '/products';
    next.set('tab', 'findings');
    next.set('view', 'technical');
    next.delete('riskGroup');
    next.delete('proofLibrary');
    next.set('proof', view);
    next.delete('setup');
    setWorkspaceTab('findings');
    setFindingsView('technical');
    setWorkspaceDetailOpen(true);
    setTechnicalProofView(view);
    setTechnicalProofDetailOpen(true);
    setScannerProofOperationView(null);
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const openEvidenceLibraryHub = () => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || '/products';
    next.set('tab', 'findings');
    next.set('view', 'evidence');
    next.delete('riskGroup');
    next.delete('proofLibrary');
    next.delete('proof');
    next.delete('setup');
    setWorkspaceTab('findings');
    setFindingsView('evidence');
    setWorkspaceDetailOpen(true);
    setRiskGroupView(null);
    setEvidenceLibraryView(null);
    setTechnicalProofDetailOpen(false);
    setScannerProofOperationView(null);
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const openEvidenceLibraryView = (view: EvidenceLibraryView) => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || '/products';
    next.set('tab', 'findings');
    next.set('view', 'evidence');
    next.delete('riskGroup');
    next.set('proofLibrary', view);
    next.delete('proof');
    next.delete('setup');
    setWorkspaceTab('findings');
    setFindingsView('evidence');
    setWorkspaceDetailOpen(true);
    setRiskGroupView(null);
    setEvidenceLibraryView(view);
    setTechnicalProofDetailOpen(false);
    setScannerProofOperationView(null);
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const openRiskGroupHub = () => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || '/products';
    next.set('tab', 'findings');
    next.set('view', 'risks');
    next.delete('riskGroup');
    next.delete('proofLibrary');
    next.delete('proof');
    next.delete('setup');
    setWorkspaceTab('findings');
    setFindingsView('risks');
    setWorkspaceDetailOpen(true);
    setRiskGroupView(null);
    setEvidenceLibraryView(null);
    setTechnicalProofDetailOpen(false);
    setScannerProofOperationView(null);
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const openRiskGroupView = (view: OwnerRiskGroupView) => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || '/products';
    next.set('tab', 'findings');
    next.set('view', 'risks');
    next.set('riskGroup', view);
    next.delete('proofLibrary');
    next.delete('proof');
    next.delete('setup');
    setWorkspaceTab('findings');
    setFindingsView('risks');
    setWorkspaceDetailOpen(true);
    setRiskGroupView(view);
    setEvidenceLibraryView(null);
    setTechnicalProofDetailOpen(false);
    setScannerProofOperationView(null);
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const openScannerProofOperationHub = () => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || '/products';
    next.set('tab', 'findings');
    next.set('view', 'technical');
    next.delete('riskGroup');
    next.delete('proofLibrary');
    next.set('proof', 'run');
    next.delete('setup');
    setWorkspaceTab('findings');
    setFindingsView('technical');
    setWorkspaceDetailOpen(true);
    setRiskGroupView(null);
    setTechnicalProofView('run');
    setTechnicalProofDetailOpen(true);
    setScannerProofOperationView(null);
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const openScannerProofOperationView = (view: ScannerProofOperationView) => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || '/products';
    next.set('tab', 'findings');
    next.set('view', 'technical');
    next.delete('riskGroup');
    next.delete('proofLibrary');
    next.set('proof', 'run');
    next.set('setup', view);
    setWorkspaceTab('findings');
    setFindingsView('technical');
    setWorkspaceDetailOpen(true);
    setRiskGroupView(null);
    setTechnicalProofView('run');
    setTechnicalProofDetailOpen(true);
    setScannerProofOperationView(view);
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
    riskGroupView,
    evidenceLibraryView,
    technicalProofView,
    technicalProofDetailOpen,
    scannerProofOperationView,
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
    openRiskGroupHub,
    openRiskGroupView,
    openEvidenceLibraryHub,
    openEvidenceLibraryView,
    openTechnicalProofHub,
    openTechnicalProofView,
    openScannerProofOperationHub,
    openScannerProofOperationView,
  };
}
