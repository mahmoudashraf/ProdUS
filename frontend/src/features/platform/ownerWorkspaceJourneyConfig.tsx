'use client';

import { type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import { PastelChip, appleColors } from './PlatformComponents';
import { WorkspaceTab } from './ownerWorkspaceModel';

export type OverviewJourneyView = 'decision' | 'profile' | 'progress' | 'refresh';
export type ActionJourneyView = 'plan' | 'diagnosis';
export type FindingsJourneyView = 'risks' | 'evidence' | 'technical';
export type ServicesJourneyView = 'recommend' | 'plan' | 'team';
export type AiJourneyView = 'opportunities' | 'refresh' | 'loomai';
export type ShareJourneyView = 'create' | 'links' | 'preview';

export const workspaceViewValues: Record<WorkspaceTab, string[]> = {
  overview: ['decision', 'profile', 'progress', 'refresh'],
  actions: ['plan', 'diagnosis'],
  findings: ['risks', 'evidence', 'technical'],
  services: ['recommend', 'plan', 'team'],
  ai: ['opportunities', 'refresh'],
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
      value: 'progress',
      label: 'Progress',
      detail: 'Confidence history and the shareable readiness report.',
      accent: appleColors.cyan,
      meta: <PastelChip label={hasLaunchReadinessReport ? 'Report ready' : 'Report'} accent={appleColors.cyan} bg="#e4f9fd" />,
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
      label: 'Diagnosis',
      detail: 'Stored owner brief, mapped rough edges, and AI explanation.',
      accent: appleColors.blue,
      meta: <PastelChip label={latestDiagnosisFindingCount !== undefined ? `${latestDiagnosisFindingCount} findings` : 'Not run'} accent={latestDiagnosisFindingCount !== undefined ? appleColors.amber : appleColors.blue} />,
    },
  ],
  findingsJourneyItems: [
    {
      value: 'risks',
      label: 'Owner risks',
      detail: 'Plain-language launch risks before raw scanner detail.',
      accent: appleColors.amber,
      meta: <PastelChip label={`${topOwnerRiskCount} risks`} accent={topOwnerRiskCount ? appleColors.amber : appleColors.green} bg={topOwnerRiskCount ? '#fff4dc' : '#e7f8ee'} />,
    },
    {
      value: 'evidence',
      label: 'Stored proof',
      detail: 'Authorized sources, evidence exports, and repo readout.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${storedProofCount} proof`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
    {
      value: 'technical',
      label: 'Technical proof',
      detail: 'Scanner operations, fix path, decisions, and reruns.',
      accent: appleColors.green,
      meta: <PastelChip label={`${scannerFindingCount} findings`} accent={scannerOpenFindingCount ? appleColors.amber : appleColors.green} bg={scannerOpenFindingCount ? '#fff4dc' : '#e7f8ee'} />,
    },
  ],
  servicesJourneyItems: [
    {
      value: 'recommend',
      label: 'Recommended service',
      detail: 'Pick the work that answers the launch verdict.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${serviceFamilyCount} families`} accent={appleColors.purple} />,
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
      label: 'Opportunity home',
      detail: 'See the accepted AI opportunities, LoomAI fit, services, scanner focus, and next owner steps.',
      accent: appleColors.purple,
      meta: <PastelChip label="Accepted context" accent={appleColors.purple} bg="#f1efff" />,
    },
    {
      value: 'refresh',
      label: 'Refresh analysis',
      detail: 'Add context, rerun AI, review the proposal, and accept only what should update the product.',
      accent: appleColors.blue,
      meta: <PastelChip label="Owner approves" accent={appleColors.blue} bg="#e8f2ff" />,
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
