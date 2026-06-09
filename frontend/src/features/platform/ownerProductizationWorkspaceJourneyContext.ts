import type {
  ActionJourneyView,
  FindingsJourneyView,
  OverviewJourneyView,
  ServicesJourneyView,
  ShareJourneyView,
} from './ownerWorkspaceJourneyConfig';
import { buildOwnerWorkspaceJourneyItems } from './ownerWorkspaceJourneyConfig';
import { getOwnerWorkspaceCurrentJourney } from './ownerWorkspaceCurrentJourney';
import type { OwnerLaunchStatus, WorkspaceTab } from './ownerWorkspaceModel';

interface OwnerProductizationWorkspaceJourneyContextInput {
  actionView: ActionJourneyView;
  findingsView: FindingsJourneyView;
  hasLaunchReadinessReport: boolean;
  hasSelectedPackage: boolean;
  latestDiagnosisFindingCount?: number | undefined;
  launchStatus: OwnerLaunchStatus;
  overviewView: OverviewJourneyView;
  scannerFindingCount: number;
  scannerOpenFindingCount: number;
  servicesView: ServicesJourneyView;
  serviceFamilyCount: number;
  shareView: ShareJourneyView;
  storedProofCount: number;
  teamMatchCount: number;
  topOwnerRiskCount: number;
  workspaceDetailOpen: boolean;
  workspaceTab: WorkspaceTab;
}

export const buildOwnerProductizationWorkspaceJourneyContext = ({
  actionView,
  findingsView,
  hasLaunchReadinessReport,
  hasSelectedPackage,
  latestDiagnosisFindingCount,
  launchStatus,
  overviewView,
  scannerFindingCount,
  scannerOpenFindingCount,
  servicesView,
  serviceFamilyCount,
  shareView,
  storedProofCount,
  teamMatchCount,
  topOwnerRiskCount,
  workspaceDetailOpen,
  workspaceTab,
}: OwnerProductizationWorkspaceJourneyContextInput) => {
  const journeyGroups = buildOwnerWorkspaceJourneyItems({
    launchStatus,
    hasLaunchReadinessReport,
    latestDiagnosisFindingCount,
    topOwnerRiskCount,
    storedProofCount,
    scannerFindingCount,
    scannerOpenFindingCount,
    serviceFamilyCount,
    hasSelectedPackage,
    teamMatchCount,
  });

  return {
    ...journeyGroups,
    ...getOwnerWorkspaceCurrentJourney({
      ...journeyGroups,
      actionView,
      findingsView,
      overviewView,
      servicesView,
      shareView,
      workspaceTab,
    }),
    isProductHome: workspaceTab === 'overview' && !workspaceDetailOpen,
  };
};
