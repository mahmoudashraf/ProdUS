'use client';

import { type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import { PastelChip, appleColors } from './PlatformComponents';
import { WorkspaceTab } from './ownerWorkspaceModel';

export type OverviewJourneyView = 'decision' | 'profile' | 'progress' | 'refresh' | 'refresh-review';
export type WorkspacesJourneyView = 'list';
export type ActionJourneyView = 'plan' | 'diagnosis' | 'map';
export type FindingsJourneyView = 'risks' | 'evidence' | 'technical';
export type ServicesJourneyView = 'recommend' | 'browse' | 'plan' | 'team';
export type AiJourneyView = 'opportunities' | 'details' | 'refresh' | 'refresh-review' | 'loomai';
export type ShareJourneyView = 'create' | 'links' | 'preview';

export const workspaceViewValues: Record<WorkspaceTab, string[]> = {
  overview: ['decision', 'profile', 'progress', 'refresh', 'refresh-review'],
  workspaces: ['list'],
  actions: ['plan', 'diagnosis', 'map'],
  findings: ['risks', 'evidence', 'technical'],
  services: ['recommend', 'browse', 'plan', 'team'],
  ai: ['opportunities', 'details', 'refresh', 'refresh-review', 'loomai'],
  share: ['create', 'links', 'preview'],
};

interface OwnerWorkspaceJourneyConfigInput {
  launchStatus: {
    accent: string;
    confidence: string;
    blockerCount: number;
  };
  hasLaunchReadinessReport: boolean;
  latestDiagnosisFindingCount?: number | undefined;
  topOwnerRiskCount: number;
  storedProofCount: number;
  scannerFindingCount: number;
  scannerOpenFindingCount: number;
  serviceFamilyCount: number;
  hasSelectedPackage: boolean;
  teamMatchCount: number;
  shareLinkCount?: number | undefined;
}

export interface OwnerWorkspaceJourneyGroups {
  overviewJourneyItems: JourneyStepItem<OverviewJourneyView>[];
  workspacesJourneyItems: JourneyStepItem<WorkspacesJourneyView>[];
  actionJourneyItems: JourneyStepItem<ActionJourneyView>[];
  findingsJourneyItems: JourneyStepItem<FindingsJourneyView>[];
  servicesJourneyItems: JourneyStepItem<ServicesJourneyView>[];
  aiJourneyItems: JourneyStepItem<AiJourneyView>[];
  shareJourneyItems: JourneyStepItem<ShareJourneyView>[];
}

export const buildOwnerWorkspaceJourneyItems = ({
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
  shareLinkCount = 0,
}: OwnerWorkspaceJourneyConfigInput): OwnerWorkspaceJourneyGroups => ({
  overviewJourneyItems: [
    {
      value: 'decision',
      label: 'Decision',
      detail: 'Verdict, blockers, top actions, proof summary.',
      accent: launchStatus.accent,
      meta: <PastelChip label={launchStatus.confidence} accent={launchStatus.accent} bg={`${launchStatus.accent}12`} />,
    },
    {
      value: 'profile',
      label: 'Edit profile',
      detail: 'Update name, stage, links, stack, summary, and risk notes directly at any point in the product lifecycle.',
      accent: appleColors.purple,
      meta: <PastelChip label="Manual" accent={appleColors.purple} bg="#f1efff" />,
    },
    {
      value: 'refresh',
      label: 'Refresh brief',
      detail: 'Rerun AI analysis, review suggested profile updates, and save only owner-approved fields.',
      accent: appleColors.blue,
      meta: <PastelChip label="Owner chooses" accent={appleColors.blue} bg="#e8f2ff" />,
    },
    {
      value: 'refresh-review',
      label: 'Review AI result',
      detail: 'Choose which suggested product profile fields should be saved.',
      accent: appleColors.cyan,
      meta: <PastelChip label="No auto-save" accent={appleColors.cyan} bg="#e4f9fd" />,
    },
    {
      value: 'progress',
      label: 'Progress',
      detail: 'Confidence history and the shareable readiness report.',
      accent: appleColors.cyan,
      meta: <PastelChip label={hasLaunchReadinessReport ? 'Report ready' : 'Report'} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
  ],
  workspacesJourneyItems: [
    {
      value: 'list',
      label: 'Product workspaces',
      detail: 'Delivery workspaces created from approved Work Plans for this product.',
      accent: appleColors.green,
      meta: <PastelChip label="Delivery" accent={appleColors.green} bg="#e7f8ee" />,
    },
  ],
  actionJourneyItems: [
    {
      value: 'plan',
      label: 'Action plan',
      detail: 'Do now, schedule next, and monitor after launch.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${launchStatus.blockerCount} blockers`} accent={launchStatus.blockerCount ? appleColors.red : appleColors.green} bg={launchStatus.blockerCount ? '#fff1f2' : '#e7f8ee'} />,
    },
    {
      value: 'diagnosis',
      label: 'Saved diagnosis',
      detail: 'Review mapped rough edges, proof needs, services, and AI explanation.',
      accent: appleColors.blue,
      meta: <PastelChip label={latestDiagnosisFindingCount !== undefined ? `${latestDiagnosisFindingCount} findings` : 'Not run'} accent={latestDiagnosisFindingCount !== undefined ? appleColors.amber : appleColors.blue} />,
    },
    {
      value: 'map',
      label: 'Map rough edges',
      detail: 'Update the launch goal, known gaps, and repo or app signals.',
      accent: appleColors.cyan,
      meta: <PastelChip label="Owner input" accent={appleColors.cyan} bg="#e4f9fd" />,
    },
  ],
  findingsJourneyItems: [
    {
      value: 'risks',
      label: 'Risks to fix',
      detail: 'Plain-language blockers and improvements from scanner results.',
      accent: appleColors.amber,
      meta: <PastelChip label={`${topOwnerRiskCount} risks`} accent={topOwnerRiskCount ? appleColors.amber : appleColors.green} bg={topOwnerRiskCount ? '#fff4dc' : '#e7f8ee'} />,
    },
    {
      value: 'evidence',
      label: 'Proof library',
      detail: 'Authorized sources, stored evidence, exports, and repo readout.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${storedProofCount} proof`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
    {
      value: 'technical',
      label: 'Run scanners',
      detail: 'Run checks, review scanner suite status, map fixes, and rerun scans.',
      accent: appleColors.green,
      meta: <PastelChip label={`${scannerFindingCount} findings`} accent={scannerOpenFindingCount ? appleColors.amber : appleColors.green} bg={scannerOpenFindingCount ? '#fff4dc' : '#e7f8ee'} />,
    },
  ],
  servicesJourneyItems: [
    {
      value: 'recommend',
      label: 'Recommended service',
      detail: 'Start with the service work that answers the launch verdict.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${serviceFamilyCount} families`} accent={appleColors.purple} />,
    },
    {
      value: 'browse',
      label: 'Browse services',
      detail: 'Use AI help, priority services, and catalog depth only when scope needs adjustment.',
      accent: appleColors.cyan,
      meta: <PastelChip label="Optional depth" accent={appleColors.cyan} bg="#e4f9fd" />,
    },
    {
      value: 'plan',
      label: 'Service plan',
      detail: 'Turn the selected work into a scoped owner-ready plan.',
      accent: appleColors.blue,
      meta: <PastelChip label={hasSelectedPackage ? 'Plan exists' : 'Draft'} accent={hasSelectedPackage ? appleColors.green : appleColors.amber} bg={hasSelectedPackage ? '#e7f8ee' : '#fff4dc'} />,
    },
    {
      value: 'team',
      label: 'Team match',
      detail: 'Compare teams, experts, workspace handoff, and risk.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${teamMatchCount} matches`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
  ],
  aiJourneyItems: [
    {
      value: 'opportunities',
      label: 'Saved opportunities',
      detail: 'See the accepted AI opportunities and the LoomAI fit summary.',
      accent: appleColors.purple,
      meta: <PastelChip label="Accepted context" accent={appleColors.purple} bg="#f1efff" />,
    },
    {
      value: 'details',
      label: 'Opportunity details',
      detail: 'Review LoomAI fit, services, technical checks, and next owner steps.',
      accent: appleColors.cyan,
      meta: <PastelChip label="Product context" accent={appleColors.cyan} bg="#e4f9fd" />,
    },
    {
      value: 'refresh',
      label: 'Refresh analysis',
      detail: 'Add context and files, then rerun AI for product opportunities and LoomAI fit.',
      accent: appleColors.blue,
      meta: <PastelChip label="Owner approves" accent={appleColors.blue} bg="#e8f2ff" />,
    },
    {
      value: 'refresh-review',
      label: 'Review AI result',
      detail: 'Choose which opportunities, services, checks, and owner steps should be saved.',
      accent: appleColors.green,
      meta: <PastelChip label="No auto-save" accent={appleColors.green} bg="#e7f8ee" />,
    },
  ],
  shareJourneyItems: [
    {
      value: 'create',
      label: 'Create link',
      detail: 'Choose audience, safe sections, expiry, and viewer action.',
      accent: appleColors.purple,
      meta: <PastelChip label="Safe setup" accent={appleColors.purple} bg="#f1efff" />,
    },
    {
      value: 'links',
      label: 'Manage links',
      detail: 'Review, copy, preview, and revoke controlled product links.',
      accent: appleColors.blue,
      meta: <PastelChip label={`${shareLinkCount} links`} accent={shareLinkCount ? appleColors.green : appleColors.purple} bg={shareLinkCount ? '#e7f8ee' : '#f1efff'} />,
    },
    {
      value: 'preview',
      label: 'Public preview',
      detail: 'See what anonymous viewers can understand before private proof stays locked.',
      accent: appleColors.cyan,
      meta: <PastelChip label="Safe defaults" accent={appleColors.cyan} bg="#e4f9fd" />,
    },
  ],
});
