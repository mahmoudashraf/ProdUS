import type { JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import type {
  ActionJourneyView,
  FindingsJourneyView,
  OverviewJourneyView,
  ServicesJourneyView,
} from './ownerWorkspaceJourneyConfig';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import { workspaceTabs } from './ownerWorkspaceModel';

interface OwnerWorkspaceCurrentJourneyInput {
  actionJourneyItems: JourneyStepItem<ActionJourneyView>[];
  actionView: ActionJourneyView;
  findingsJourneyItems: JourneyStepItem<FindingsJourneyView>[];
  findingsView: FindingsJourneyView;
  overviewJourneyItems: JourneyStepItem<OverviewJourneyView>[];
  overviewView: OverviewJourneyView;
  servicesJourneyItems: JourneyStepItem<ServicesJourneyView>[];
  servicesView: ServicesJourneyView;
  workspaceTab: WorkspaceTab;
}

export const getOwnerWorkspaceCurrentJourney = ({
  actionJourneyItems,
  actionView,
  findingsJourneyItems,
  findingsView,
  overviewJourneyItems,
  overviewView,
  servicesJourneyItems,
  servicesView,
  workspaceTab,
}: OwnerWorkspaceCurrentJourneyInput) => {
  const currentJourneyItems: JourneyStepItem<string>[] =
    workspaceTab === 'overview'
      ? overviewJourneyItems
      : workspaceTab === 'actions'
        ? actionJourneyItems
        : workspaceTab === 'findings'
          ? findingsJourneyItems
          : servicesJourneyItems;
  const currentJourneyValue: string =
    workspaceTab === 'overview'
      ? overviewView
      : workspaceTab === 'actions'
        ? actionView
        : workspaceTab === 'findings'
          ? findingsView
          : servicesView;
  const currentAreaLabel = workspaceTabs.find((tab) => tab.value === workspaceTab)?.label || 'Workspace';
  const currentDetailLabel = currentJourneyItems.find((item) => item.value === currentJourneyValue)?.label || currentAreaLabel;

  return {
    currentAreaLabel,
    currentDetailLabel,
    currentJourneyItems,
    currentJourneyValue,
  };
};
