'use client';

import { useQuery } from '@tanstack/react-query';
import { getJson } from './api';
import { useWorkspaceCommandMilestoneSelection, useWorkspaceCommandSelection } from './useWorkspaceCommandSelection';
import { useWorkspaceEvidenceAttachmentControls } from './useWorkspaceEvidenceAttachmentControls';
import type {
  Deliverable,
  DisputeCase,
  LaunchReadinessReport,
  Milestone,
  PackageInstance,
  ProjectWorkspace,
  ScannerEvidenceItem,
  ShipConfidenceHistory,
  SupportRequest,
  Team,
  WorkspaceGovernance,
  WorkspaceParticipant,
  WorkspaceScannerReadiness,
} from './types';

interface WorkspaceCommandDataInput {
  canAttachEvidence: boolean;
}

export function useWorkspaceCommandData({ canAttachEvidence }: WorkspaceCommandDataInput) {
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });

  const {
    selectedWorkspace,
    selectedWorkspaceProductId,
    setSelectedWorkspaceId,
    workspaceList,
  } = useWorkspaceCommandSelection(workspaces.data || []);

  const milestones = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<Milestone[]>(`/workspaces/${selectedWorkspace?.id}/milestones`),
  });
  const milestoneList = milestones.data || [];
  const {
    clearSelectedMilestone,
    selectedMilestone,
    setSelectedMilestoneId,
  } = useWorkspaceCommandMilestoneSelection(milestoneList);

  const deliverables = useQuery({
    queryKey: ['workspaces', 'milestones', selectedMilestone?.id, 'deliverables'],
    enabled: !!selectedMilestone?.id,
    queryFn: () => getJson<Deliverable[]>(`/workspaces/milestones/${selectedMilestone?.id}/deliverables`),
  });
  const participants = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'participants'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<WorkspaceParticipant[]>(`/workspaces/${selectedWorkspace?.id}/participants`),
  });
  const supportRequests = useQuery({
    queryKey: ['commerce-support-requests', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<SupportRequest[]>(`/commerce/workspaces/${selectedWorkspace?.id}/support-requests`),
  });
  const disputes = useQuery({
    queryKey: ['commerce-disputes', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<DisputeCase[]>(`/commerce/workspaces/${selectedWorkspace?.id}/disputes`),
  });
  const attachmentControls = useWorkspaceEvidenceAttachmentControls({
    canAttachEvidence,
    selectedWorkspaceId: selectedWorkspace?.id,
  });
  const governance = useQuery({
    queryKey: ['productization-engine', 'workspace-governance', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<WorkspaceGovernance>(`/productization-engine/workspaces/${selectedWorkspace?.id}/governance`),
  });
  const scannerEvidence = useQuery({
    queryKey: ['scanner-evidence', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<ScannerEvidenceItem[]>(`/scanner/evidence?workspaceId=${selectedWorkspace?.id}`),
  });
  const workspaceScannerReadiness = useQuery({
    queryKey: ['productization-engine', 'workspace-scanner-readiness', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<WorkspaceScannerReadiness>(`/productization-engine/workspaces/${selectedWorkspace?.id}/scanner-readiness`),
  });
  const shipConfidence = useQuery({
    queryKey: ['productization-engine', 'workspace-ship-confidence', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<ShipConfidenceHistory>(`/productization-engine/workspaces/${selectedWorkspace?.id}/ship-confidence`),
  });
  const launchReadinessReport = useQuery({
    queryKey: ['productization-engine', 'workspace-launch-readiness-report', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    retry: false,
    queryFn: async () => {
      try {
        return await getJson<LaunchReadinessReport>(`/productization-engine/workspaces/${selectedWorkspace?.id}/launch-readiness-report/latest`);
      } catch (error: any) {
        if (error?.response?.status === 400 && String(error?.response?.data?.detail || '').includes('No launch readiness report')) {
          return null;
        }
        throw error;
      }
    },
  });

  const deliverableList = deliverables.data || [];
  const participantList = participants.data || [];
  const supportList = supportRequests.data || [];
  const disputeList = disputes.data || [];
  const scannerEvidenceList = scannerEvidence.data || [];
  const readiness = workspaceScannerReadiness.data;
  const queries = [
    packages,
    workspaces,
    teams,
    milestones,
    deliverables,
    participants,
    supportRequests,
    disputes,
    attachmentControls.attachments,
    governance,
    scannerEvidence,
    workspaceScannerReadiness,
    shipConfidence,
    launchReadinessReport,
  ];

  return {
    ...attachmentControls,
    clearSelectedMilestone,
    deliverableList,
    deliverables,
    disputeList,
    disputes,
    governance,
    launchReadinessReport,
    milestoneList,
    milestones,
    packages,
    participantList,
    participants,
    queriesLoading: queries.some((query) => query.isLoading),
    queryError: queries.find((query) => query.error)?.error,
    readiness,
    scannerEvidence,
    scannerEvidenceList,
    selectedMilestone,
    selectedWorkspace,
    selectedWorkspaceProductId,
    setSelectedMilestoneId,
    setSelectedWorkspaceId,
    shipConfidence,
    supportList,
    supportRequests,
    teams,
    workspaceList,
    workspaceScannerReadiness,
  };
}
