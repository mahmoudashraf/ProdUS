import type {
  HandoffPayload,
  HealthPayload,
  WorkspaceScannerReadinessPayload,
} from './workspaceCommandActionTypes';
import type {
  WorkspaceScannerUploadFormValues,
  WorkspaceScannerUploadPayload,
} from './workspaceCommandTeamTypes';

export const buildWorkspaceHandoffPayload = (workspaceName?: string): HandoffPayload => ({
  title: `${workspaceName || 'Workspace'} owner handoff`,
  runbook: 'Operating runbook, release notes, rollback path, monitoring ownership, and escalation contacts are ready for owner review.',
  accessChecklist: 'Repository, deployment, database, monitoring, support, and billing access boundaries reviewed.',
  knownIssues: 'Open risks are tracked in the workspace risk section before handoff acceptance.',
  supportScope: 'Post-launch support covers monitoring, incident response, minor fixes, and owner health reporting.',
  status: 'READY_FOR_OWNER',
});

export const buildWorkspaceHealthPayload = ({
  disputeCount,
  supportCount,
  workspaceProgress,
}: {
  disputeCount: number;
  supportCount: number;
  workspaceProgress: number;
}): HealthPayload => ({
  healthScore: Math.max(55, workspaceProgress || 70),
  summary: 'Workspace health review generated from milestone acceptance, open support, risk, and evidence status.',
  risks: disputeCount ? `${disputeCount} open workspace risk records need review.` : 'No open workspace disputes are recorded.',
  actions: supportCount ? 'Review support requests and close overdue items before owner handoff.' : 'Keep evidence current and prepare handoff acceptance.',
  status: 'PUBLISHED',
});

export const buildWorkspaceScannerReadinessPayload = (): WorkspaceScannerReadinessPayload => ({
  createCriteria: true,
  createServiceRecommendations: true,
  includeAcceptedRisk: false,
  summary: 'Owner requested workspace scanner readiness refresh from the workspace board.',
});

export const buildWorkspaceLaunchReportPayload = () => ({
  focus: 'Summarize launch readiness for a prototype-to-product owner decision using current workspace proof, scanner findings, and selected services.',
});

export const buildWorkspaceScannerUploadPayload = ({
  scannerUploadForm,
  selectedMilestoneId,
  selectedWorkspaceId,
  selectedWorkspaceProductId,
}: {
  scannerUploadForm: WorkspaceScannerUploadFormValues;
  selectedMilestoneId?: string | undefined;
  selectedWorkspaceId: string;
  selectedWorkspaceProductId: string;
}): WorkspaceScannerUploadPayload => {
  const payload: WorkspaceScannerUploadPayload = {
    productId: selectedWorkspaceProductId,
    workspaceId: selectedWorkspaceId,
    toolName: scannerUploadForm.toolName,
    toolVersion: scannerUploadForm.toolVersion,
    format: scannerUploadForm.format,
    artifactFileName: scannerUploadForm.artifactFileName,
    artifactPayload: scannerUploadForm.artifactPayload,
  };
  const milestoneId = scannerUploadForm.milestoneId || selectedMilestoneId;
  if (milestoneId) payload.milestoneId = milestoneId;
  return payload;
};
