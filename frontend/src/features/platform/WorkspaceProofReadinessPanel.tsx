'use client';

import PlatformAssistantCard from './PlatformAssistantCard';
import ShipConfidencePanel from './ShipConfidencePanel';
import LaunchReadinessReportPanel from './LaunchReadinessReportPanel';
import WorkspaceScannerFixPathPanel from './WorkspaceScannerFixPathPanel';
import { Surface, appleColors } from './PlatformComponents';
import type {
  LaunchReadinessReport,
  Milestone,
  ProjectWorkspace,
  ShipConfidenceHistory,
  WorkspaceScannerReadiness,
} from './types';

export default function WorkspaceProofReadinessPanel({
  canRefresh,
  isGeneratingLaunchReport,
  isLaunchReportLoading,
  isRefreshing,
  isScannerLoading,
  isShipConfidenceLoading,
  launchReport,
  productId,
  readiness,
  readinessScore,
  readinessStatus,
  scannerEvidenceCount,
  selectedMilestone,
  shipConfidence,
  workspace,
  onGenerateLaunchReport,
  onRefresh,
}: {
  canRefresh: boolean;
  isGeneratingLaunchReport: boolean;
  isLaunchReportLoading: boolean;
  isRefreshing: boolean;
  isScannerLoading: boolean;
  isShipConfidenceLoading: boolean;
  launchReport: LaunchReadinessReport | null;
  productId: string;
  readiness?: WorkspaceScannerReadiness | undefined;
  readinessScore: number;
  readinessStatus: string;
  scannerEvidenceCount: number;
  selectedMilestone?: Milestone | undefined;
  shipConfidence?: ShipConfidenceHistory | undefined;
  workspace: ProjectWorkspace;
  onGenerateLaunchReport: () => void;
  onRefresh: () => void;
}) {
  const latestCheckpoint = shipConfidence?.latest
    ? `${shipConfidence.latest.shipConfidenceScore}/100, ${shipConfidence.latest.statusLabel}, next step ${shipConfidence.latest.suggestedNextStep}`
    : 'none';

  return (
    <>
      <WorkspaceScannerFixPathPanel
        readinessScore={readinessScore}
        readinessStatus={readinessStatus}
        hasDiagnosis={!!readiness?.diagnosis}
        blockerCount={readiness?.blockerCount || 0}
        mappedFindingCount={readiness?.mappedFindingCount || 0}
        missingEvidenceCount={readiness?.missingEvidenceCount || 0}
        unmappedFindingCount={readiness?.unmappedFindingCount || 0}
        scannerEvidenceCount={scannerEvidenceCount}
        milestoneRisks={readiness?.milestoneRisks || []}
        isRefreshing={isRefreshing}
        isLoading={isScannerLoading}
        canRefresh={canRefresh}
        onRefresh={onRefresh}
      />

      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f9fcff 100%)' }}>
        <ShipConfidencePanel
          history={shipConfidence}
          isLoading={isShipConfidenceLoading}
          title="Workspace Ship Confidence"
          subtitle="Workspace scanner maps become checkpoints, so the owner can see whether this prototype is moving closer to launch."
        />
      </Surface>

      <LaunchReadinessReportPanel
        report={launchReport}
        isLoading={isLaunchReportLoading}
        isGenerating={isGeneratingLaunchReport}
        onGenerate={onGenerateLaunchReport}
        title="Workspace Launch Report"
        subtitle="Generate a shareable launch decision snapshot from workspace scanner proof, service milestones, checks, and remaining rough edges."
      />

      <PlatformAssistantCard
        title="AI Fix Path Explainer"
        description="Explain mapped findings and owner decisions from the stored scanner fix path."
        prompt={`Use thinker mode and read-only context only. Explain the scanner fix path for workspace "${workspace.name}". Product: ${workspace.packageInstance?.productProfile?.name || 'not recorded'}. Readiness score: ${readinessScore}. Status: ${readinessStatus}. Mapped findings: ${readiness?.mappedFindingCount || 0}. Priority fixes: ${readiness?.blockerCount || 0}. Missing proof: ${readiness?.missingEvidenceCount || 0}. Unmapped findings: ${readiness?.unmappedFindingCount || 0}. Ship-confidence history: ${shipConfidence?.trendSummary || 'not available yet'}. Latest checkpoint: ${latestCheckpoint}. Mapped services: ${(readiness?.milestoneRisks || []).flatMap((risk) => risk.mappedServices).slice(0, 8).join(', ') || 'none'}. Milestone risks: ${(readiness?.milestoneRisks || []).slice(0, 6).map((risk) => `${risk.milestoneTitle}: ${risk.scannerFindingCount} findings, ${risk.missingEvidenceCount} proof gaps, highest ${risk.highestSeverity || 'none'}`).join('; ') || 'none'}. Tell the owner what could stop shipping, which service work addresses it, what proof is missing, and what decision is safe next. Do not mutate workspace state.`}
        conversationId={`workspace-scanner-readiness-${workspace.id}`}
        context={{
          pageType: 'workspace-scanner-readiness',
          productId,
          packageId: workspace.packageInstance?.id,
          workspaceId: workspace.id,
          milestoneId: selectedMilestone?.id,
        }}
        accent={readiness?.blockerCount ? appleColors.red : appleColors.cyan}
        cta="Ask AI"
      />
    </>
  );
}
