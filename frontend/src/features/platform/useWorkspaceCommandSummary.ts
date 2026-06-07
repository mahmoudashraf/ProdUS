'use client';

import { useMemo } from 'react';
import type {
  Deliverable,
  DisputeCase,
  Milestone,
  ProjectWorkspace,
  ScannerEvidenceItem,
  SupportRequest,
  WorkspaceGovernance,
  WorkspaceParticipant,
  WorkspaceScannerReadiness,
} from './types';

interface WorkspaceCommandSummaryInput {
  workspaceList: ProjectWorkspace[];
  milestoneList: Milestone[];
  deliverableList: Deliverable[];
  participantList: WorkspaceParticipant[];
  supportList: SupportRequest[];
  disputeList: DisputeCase[];
  scannerEvidenceList: ScannerEvidenceItem[];
  readiness: WorkspaceScannerReadiness | undefined;
  governance: WorkspaceGovernance | undefined;
  selectedMilestone: Milestone | undefined;
}

export function useWorkspaceCommandSummary({
  workspaceList,
  milestoneList,
  deliverableList,
  participantList,
  supportList,
  disputeList,
  scannerEvidenceList,
  readiness,
  governance,
  selectedMilestone,
}: WorkspaceCommandSummaryInput) {
  const readinessScore = readiness?.diagnosis?.readinessScore ?? (scannerEvidenceList.length ? 100 : 0);
  const readinessStatus = readiness?.blockerCount
    ? 'Blocked by scanner evidence'
    : readiness?.diagnosis
      ? 'Evidence mapped'
      : 'No scanner map yet';

  const milestoneRiskById = useMemo(
    () =>
      (readiness?.milestoneRisks || []).reduce<Record<string, WorkspaceScannerReadiness['milestoneRisks'][number]>>((byId, risk) => {
        byId[risk.milestoneId] = risk;
        return byId;
      }, {}),
    [readiness?.milestoneRisks]
  );

  const governanceCriteria = governance?.criteria || [];
  const selectedMilestoneCriteria = selectedMilestone?.id
    ? governanceCriteria.filter((criterion) => criterion.milestoneId === selectedMilestone.id)
    : governanceCriteria;
  const latestHandoff = governance?.handoffs?.[0];
  const latestHealthReview = governance?.healthReviews?.[0];
  const integrationList = governance?.integrations || [];
  const latestIntegration = integrationList[0];
  const passedCriteriaCount = governanceCriteria.filter((criterion) => criterion.status === 'PASSED' || criterion.status === 'WAIVED').length;
  const missingEvidenceCount = governanceCriteria.flatMap((criterion) => criterion.evidenceRequirements).filter((requirement) => requirement.required && requirement.status === 'MISSING').length;
  const activeWorkspaceCount = workspaceList.filter((workspace) => workspace.status === 'ACTIVE_DELIVERY').length;
  const completedMilestones = milestoneList.filter((milestone) => milestone.status === 'ACCEPTED').length;
  const blockedItems = workspaceList.filter((workspace) => workspace.status === 'BLOCKED').length
    + supportList.filter((request) => request.priority === 'URGENT' || request.slaStatus === 'OVERDUE' || request.slaStatus === 'ESCALATED').length
    + disputeList.filter((dispute) => dispute.status !== 'RESOLVED' && dispute.status !== 'CANCELLED').length;
  const roughEdgeCount = supportList.length + disputeList.length;
  const workspaceProgress = milestoneList.length ? Math.round((completedMilestones / milestoneList.length) * 100) : 0;

  return {
    activeWorkspaceCount,
    blockedItems,
    completedMilestones,
    deliverableCount: deliverableList.length,
    governanceCriteria,
    integrationList,
    latestHandoff,
    latestHealthReview,
    latestIntegration,
    milestoneRiskById,
    missingEvidenceCount,
    participantCount: participantList.length,
    passedCriteriaCount,
    readinessScore,
    readinessStatus,
    roughEdgeCount,
    selectedMilestoneCriteria,
    workspaceProgress,
  };
}
