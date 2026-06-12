import type { JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import type {
  ActionJourneyView,
  AiJourneyView,
  FindingsJourneyView,
  OverviewJourneyView,
  WorkspacesJourneyView,
  ShareJourneyView,
  ServicesJourneyView,
} from './ownerWorkspaceJourneyConfig';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import { workspaceTabs } from './ownerWorkspaceModel';

interface OwnerWorkspaceCurrentJourneyInput {
  actionJourneyItems: JourneyStepItem<ActionJourneyView>[];
  actionView: ActionJourneyView;
  aiJourneyItems: JourneyStepItem<AiJourneyView>[];
  aiView: AiJourneyView;
  findingsJourneyItems: JourneyStepItem<FindingsJourneyView>[];
  findingsView: FindingsJourneyView;
  overviewJourneyItems: JourneyStepItem<OverviewJourneyView>[];
  overviewView: OverviewJourneyView;
  workspacesJourneyItems: JourneyStepItem<WorkspacesJourneyView>[];
  servicesJourneyItems: JourneyStepItem<ServicesJourneyView>[];
  servicesView: ServicesJourneyView;
  shareJourneyItems: JourneyStepItem<ShareJourneyView>[];
  shareView: ShareJourneyView;
  workspaceTab: WorkspaceTab;
}

export const getOwnerWorkspaceCurrentJourney = ({
  actionJourneyItems,
  actionView,
  aiJourneyItems,
  aiView,
  findingsJourneyItems,
  findingsView,
  overviewJourneyItems,
  overviewView,
  workspacesJourneyItems,
  servicesJourneyItems,
  servicesView,
  shareJourneyItems,
  shareView,
  workspaceTab,
}: OwnerWorkspaceCurrentJourneyInput) => {
  const currentJourneyItems: JourneyStepItem<string>[] =
    workspaceTab === 'overview'
      ? overviewJourneyItems
      : workspaceTab === 'workspaces'
        ? workspacesJourneyItems
        : workspaceTab === 'actions'
          ? actionJourneyItems
          : workspaceTab === 'findings'
            ? findingsJourneyItems
            : workspaceTab === 'services'
              ? servicesJourneyItems
              : workspaceTab === 'ai'
                ? aiJourneyItems
                : shareJourneyItems;
  const currentJourneyValue: string =
    workspaceTab === 'overview'
      ? overviewView
      : workspaceTab === 'workspaces'
        ? 'list'
        : workspaceTab === 'actions'
          ? actionView
          : workspaceTab === 'findings'
            ? findingsView
            : workspaceTab === 'services'
              ? servicesView
              : workspaceTab === 'ai'
                ? aiView
                : shareView;
  const currentAreaLabel = workspaceTabs.find((tab) => tab.value === workspaceTab)?.label || 'Product Details';
  const currentDetailLabel = currentJourneyItems.find((item) => item.value === currentJourneyValue)?.label || currentAreaLabel;

  return {
    currentAreaLabel,
    currentDetailLabel,
    currentJourneyItems,
    currentJourneyValue,
  };
};
