'use client';

import type { ComponentProps } from 'react';
import { EventRepeatOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';
import OwnerWorkspaceSideRailPane from './OwnerWorkspaceSideRailPane';
import type { ServicesJourneyView } from './ownerWorkspaceJourneyConfig';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import { scanToolOptions, shortDateTime } from './ownerProductizationWorkspaceConfig';
import type { StudioAssistantContext } from './StudioAssistantCard';
import type { ServiceModule } from './types';

type SideRailPaneProps = ComponentProps<typeof OwnerWorkspaceSideRailPane>;
type ControlProps = NonNullable<SideRailPaneProps['control']>;
type ProjectStartProps = NonNullable<SideRailPaneProps['projectStart']>;
type AiBriefProps = NonNullable<SideRailPaneProps['aiBrief']>;
type DeliveryWorkspaceProps = NonNullable<SideRailPaneProps['deliveryWorkspace']>;
type SupportRiskProps = NonNullable<SideRailPaneProps['supportRisk']>;
type NextDecisionProps = NonNullable<SideRailPaneProps['nextDecision']>;

interface ScannerRunSummary {
  recentRuns?: { completedAt?: string | null | undefined }[];
}

export default function OwnerWorkspaceSideRailHost({
  activeSuggestions,
  assistantActions,
  assistantContext,
  blockedMilestoneCount,
  blockingGaps,
  blockingRecommendationNames,
  blockers,
  buildTargetRequirementId,
  canStartWorkspace,
  cart,
  deliveryMilestones,
  fallbackReason,
  hasServicePlan,
  hasStartWorkspace,
  hasWorkspace,
  isAddingService,
  isBuildingPlan,
  isConverting,
  isFetchingSuggestions,
  isRemovingService,
  isRemovingTalent,
  launchStatus,
  latestCompletedTools,
  mode,
  notice,
  onAddGapService,
  onBuildPlan,
  onCloseNotice,
  onConvert,
  onOpenActionPlan,
  onOpenFindingsEvidence,
  onOpenServicesRecommend,
  onOpenTimeline,
  onProjectNameChange,
  onRefreshSuggestions,
  onRemoveService,
  onRemoveTalent,
  product,
  productSupport,
  projectName,
  proposals,
  recommendationRationale,
  scannerSummary,
  selectedMilestone,
  servicesView,
  topRecommendedServiceName,
  workspace,
  workspaceDetailOpen,
  workspaceTab,
}: {
  activeSuggestions: AiBriefProps['suggestions'];
  assistantActions: DeliveryWorkspaceProps['assistantActions'];
  assistantContext: (pageType: string, overrides?: Partial<StudioAssistantContext>) => StudioAssistantContext;
  blockedMilestoneCount: NextDecisionProps['blockedMilestoneCount'];
  blockingGaps: ProjectStartProps['blockingGaps'];
  blockingRecommendationNames: ProjectStartProps['blockingRecommendationNames'];
  blockers: ProjectStartProps['blockers'];
  buildTargetRequirementId: string;
  canStartWorkspace: ProjectStartProps['canStartWorkspace'];
  cart: ProjectStartProps['cart'];
  deliveryMilestones: DeliveryWorkspaceProps['milestones'];
  fallbackReason: AiBriefProps['fallbackReason'];
  hasServicePlan: NextDecisionProps['hasServicePlan'];
  hasStartWorkspace: ProjectStartProps['hasWorkspace'];
  hasWorkspace: boolean;
  isAddingService: ProjectStartProps['isAddingService'];
  isBuildingPlan: NextDecisionProps['isBuilding'];
  isConverting: ProjectStartProps['isConverting'];
  isFetchingSuggestions: AiBriefProps['isFetching'];
  isRemovingService: ProjectStartProps['isRemovingService'];
  isRemovingTalent: ProjectStartProps['isRemovingTalent'];
  launchStatus: ControlProps['status'];
  latestCompletedTools: number;
  mode: AiBriefProps['mode'];
  notice: ProjectStartProps['notice'];
  onAddGapService: (serviceModule: ServiceModule, notes: string) => void;
  onBuildPlan: NextDecisionProps['onBuildPlan'];
  onCloseNotice: ProjectStartProps['onNoticeClose'];
  onConvert: ProjectStartProps['onConvert'];
  onOpenActionPlan: () => void;
  onOpenFindingsEvidence: () => void;
  onOpenServicesRecommend: () => void;
  onOpenTimeline: () => void;
  onProjectNameChange: ProjectStartProps['onProjectNameChange'];
  onRefreshSuggestions: AiBriefProps['onSuggest'];
  onRemoveService: ProjectStartProps['onRemoveService'];
  onRemoveTalent: ProjectStartProps['onRemoveTalent'];
  product: ProjectStartProps['product'];
  productSupport: SupportRiskProps['supportRequests'];
  projectName: ProjectStartProps['projectName'];
  proposals: NextDecisionProps['proposals'];
  recommendationRationale: AiBriefProps['recommendationRationale'];
  scannerSummary?: ScannerRunSummary | undefined;
  selectedMilestone: DeliveryWorkspaceProps['selectedMilestone'];
  servicesView: ServicesJourneyView;
  topRecommendedServiceName?: string | undefined;
  workspace: DeliveryWorkspaceProps['workspace'];
  workspaceDetailOpen: boolean;
  workspaceTab: WorkspaceTab;
}) {
  const lastScanLabel = scannerSummary?.recentRuns?.[0]?.completedAt
    ? shortDateTime(scannerSummary.recentRuns[0].completedAt)
    : latestCompletedTools
      ? `${latestCompletedTools} checks completed`
      : 'No completed check yet';
  const servicesDetailOpen = workspaceTab === 'services' && workspaceDetailOpen;
  const showStartPlan = servicesDetailOpen && (servicesView === 'plan' || servicesView === 'team');
  const showTeamDetail = servicesDetailOpen && servicesView === 'team';
  const showAiBrief = workspaceDetailOpen && (workspaceTab === 'overview' || workspaceTab === 'actions');

  return (
    <OwnerWorkspaceSideRailPane
      control={product ? {
        status: launchStatus,
        primaryAction: launchStatus.blockerCount ? 'Open action plan' : topRecommendedServiceName ? 'Review service path' : 'Open proof',
        lastScanLabel,
        evidenceLabel: `${latestCompletedTools}/${scanToolOptions.length} checks`,
        onPrimaryAction: () => launchStatus.blockerCount ? onOpenActionPlan() : topRecommendedServiceName ? onOpenServicesRecommend() : onOpenFindingsEvidence(),
        secondary: (
          <Button variant="outlined" startIcon={<EventRepeatOutlined />} onClick={onOpenTimeline} sx={{ minHeight: 38 }}>
            View timeline
          </Button>
        ),
      } : undefined}
      projectStart={showStartPlan ? {
        ...(product ? { product } : {}),
        ...(cart ? { cart } : {}),
        ...(notice ? { notice } : {}),
        canStartWorkspace,
        blockers,
        blockingGaps,
        blockingRecommendationNames,
        projectName,
        hasWorkspace: hasStartWorkspace,
        isAddingService,
        isRemovingService,
        isRemovingTalent,
        isConverting,
        onNoticeClose: onCloseNotice,
        onProjectNameChange,
        onAddGapService,
        onRemoveService,
        onRemoveTalent,
        onConvert,
      } : undefined}
      aiBrief={showAiBrief ? {
        fallbackReason,
        isDisabled: !product?.id,
        isFetching: isFetchingSuggestions,
        mode,
        recommendationRationale,
        suggestions: activeSuggestions,
        onSuggest: onRefreshSuggestions,
      } : undefined}
      deliveryWorkspace={showTeamDetail ? {
        assistantActions,
        assistantContext: assistantContext('milestone-evidence-readiness', { milestoneId: selectedMilestone?.id }),
        blockedMilestoneCount,
        milestones: deliveryMilestones,
        selectedMilestone,
        workspace,
      } : undefined}
      supportRisk={showTeamDetail ? {
        supportRequests: productSupport,
      } : undefined}
      nextDecision={{
        blockedMilestoneCount,
        buildTargetRequirementId: buildTargetRequirementId || undefined,
        hasServicePlan,
        hasWorkspace,
        isBuilding: isBuildingPlan,
        proposals,
        onBuildPlan,
      }}
    />
  );
}
