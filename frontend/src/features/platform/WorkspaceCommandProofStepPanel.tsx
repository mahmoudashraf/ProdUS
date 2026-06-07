'use client';

import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react';
import WorkspaceAcceptanceReviewPanel from './WorkspaceAcceptanceReviewPanel';
import WorkspaceProofEvidencePanel, { type WorkspaceScannerUploadForm } from './WorkspaceProofEvidencePanel';
import WorkspaceProofMilestonesPanel from './WorkspaceProofMilestonesPanel';
import WorkspaceProofReadinessPanel from './WorkspaceProofReadinessPanel';
import type {
  AcceptanceCriterion,
  AttachmentScope,
  AutomatedCheck,
  Deliverable,
  EvidenceRequirement,
  LaunchReadinessReport,
  Milestone,
  ProjectWorkspace,
  ReviewDecision,
  ScannerEvidenceItem,
  ShipConfidenceHistory,
  WorkspaceScannerReadiness,
} from './types';

type FormController<TValues> = {
  values: TValues;
  setValue: <TKey extends keyof TValues>(key: TKey, value: TValues[TKey]) => void;
  handleSubmit: (onSubmit: () => void) => (event: FormEvent<HTMLFormElement>) => void;
};

type MilestoneFormValues = {
  title: string;
  description: string;
  dueDate: string | null;
  status: Milestone['status'];
};

type DeliverableFormValues = {
  title: string;
  evidence: string;
  status: Deliverable['status'];
};

type EvidenceStatusPayload = {
  status: EvidenceRequirement['status'];
  evidenceReference?: string;
};

type CheckPayload = {
  checkType: string;
  provider: string;
  externalRef?: string;
  status: AutomatedCheck['status'];
  summary?: string;
  rawPayload?: string;
};

type ReviewPayload = {
  decision: ReviewDecision['decision'];
  note: string;
};

type MilestoneRisk = WorkspaceScannerReadiness['milestoneRisks'][number];

type WorkspaceCommandProofStepPanelProps = {
  workspace: ProjectWorkspace;
  productId: string;
  selectedMilestone: Milestone | undefined;
  milestoneList: Milestone[];
  deliverableList: Deliverable[];
  milestoneRiskById: Record<string, MilestoneRisk>;
  milestoneForm: FormController<MilestoneFormValues>;
  deliverableForm: FormController<DeliverableFormValues>;
  scannerEvidenceList: ScannerEvidenceItem[];
  scannerUploadForm: WorkspaceScannerUploadForm;
  selectedMilestoneCriteria: AcceptanceCriterion[];
  totalCriteriaCount: number;
  passedCriteriaCount: number;
  readiness: WorkspaceScannerReadiness | undefined;
  readinessScore: number;
  readinessStatus: string;
  launchReport: LaunchReadinessReport | null;
  shipConfidence: ShipConfidenceHistory | undefined;
  proofFileCount: number;
  isCreatingMilestone: boolean;
  isCreatingDeliverable: boolean;
  isUploadingScannerEvidence: boolean;
  isGeneratingLaunchReport: boolean;
  isLaunchReportLoading: boolean;
  isRefreshingReadiness: boolean;
  isScannerLoading: boolean;
  isShipConfidenceLoading: boolean;
  isGovernanceFetching: boolean;
  isGeneratingCriteria: boolean;
  isUpdatingEvidenceRequirement: boolean;
  isCreatingCheck: boolean;
  isReviewingCriterion: boolean;
  canSubmitScannerEvidence: boolean;
  onCreateMilestone: () => void;
  onCreateDeliverable: () => void;
  onSelectMilestone: (milestoneId: string) => void;
  onScannerUploadFormChange: Dispatch<SetStateAction<WorkspaceScannerUploadForm>>;
  onSubmitScannerEvidence: () => void;
  onGenerateLaunchReport: () => void;
  onRefreshReadiness: () => void;
  onGenerateCriteria: () => void;
  onUpdateEvidenceRequirement: (id: string, payload: EvidenceStatusPayload) => void;
  onCreateCheck: (criterionId: string, payload: CheckPayload) => void;
  onReviewCriterion: (criterionId: string, payload: ReviewPayload) => void;
  evidencePanel: (scopeType: AttachmentScope, scopeId: string) => ReactNode;
};

export default function WorkspaceCommandProofStepPanel({
  workspace,
  productId,
  selectedMilestone,
  milestoneList,
  deliverableList,
  milestoneRiskById,
  milestoneForm,
  deliverableForm,
  scannerEvidenceList,
  scannerUploadForm,
  selectedMilestoneCriteria,
  totalCriteriaCount,
  passedCriteriaCount,
  readiness,
  readinessScore,
  readinessStatus,
  launchReport,
  shipConfidence,
  proofFileCount,
  isCreatingMilestone,
  isCreatingDeliverable,
  isUploadingScannerEvidence,
  isGeneratingLaunchReport,
  isLaunchReportLoading,
  isRefreshingReadiness,
  isScannerLoading,
  isShipConfidenceLoading,
  isGovernanceFetching,
  isGeneratingCriteria,
  isUpdatingEvidenceRequirement,
  isCreatingCheck,
  isReviewingCriterion,
  canSubmitScannerEvidence,
  onCreateMilestone,
  onCreateDeliverable,
  onSelectMilestone,
  onScannerUploadFormChange,
  onSubmitScannerEvidence,
  onGenerateLaunchReport,
  onRefreshReadiness,
  onGenerateCriteria,
  onUpdateEvidenceRequirement,
  onCreateCheck,
  onReviewCriterion,
  evidencePanel,
}: WorkspaceCommandProofStepPanelProps) {
  return (
    <>
      <WorkspaceProofReadinessPanel
        canRefresh={!!productId}
        isGeneratingLaunchReport={isGeneratingLaunchReport}
        isLaunchReportLoading={isLaunchReportLoading}
        isRefreshing={isRefreshingReadiness}
        isScannerLoading={isScannerLoading}
        isShipConfidenceLoading={isShipConfidenceLoading}
        launchReport={launchReport}
        productId={productId}
        readiness={readiness}
        readinessScore={readinessScore}
        readinessStatus={readinessStatus}
        scannerEvidenceCount={scannerEvidenceList.length}
        selectedMilestone={selectedMilestone}
        shipConfidence={shipConfidence}
        workspace={workspace}
        onGenerateLaunchReport={onGenerateLaunchReport}
        onRefresh={onRefreshReadiness}
      />

      <WorkspaceProofMilestonesPanel
        milestoneList={milestoneList}
        selectedMilestone={selectedMilestone}
        deliverableList={deliverableList}
        milestoneRiskById={milestoneRiskById}
        milestoneForm={milestoneForm}
        deliverableForm={deliverableForm}
        isCreatingMilestone={isCreatingMilestone}
        isCreatingDeliverable={isCreatingDeliverable}
        onCreateMilestone={onCreateMilestone}
        onCreateDeliverable={onCreateDeliverable}
        onSelectMilestone={onSelectMilestone}
        evidencePanel={evidencePanel}
      />

      <WorkspaceProofEvidencePanel
        workspaceId={workspace.id}
        proofFileCount={proofFileCount}
        scannerEvidenceList={scannerEvidenceList}
        milestoneList={milestoneList}
        selectedMilestone={selectedMilestone}
        scannerUploadForm={scannerUploadForm}
        isUploadingScannerEvidence={isUploadingScannerEvidence}
        canSubmitScannerEvidence={canSubmitScannerEvidence}
        onScannerUploadFormChange={onScannerUploadFormChange}
        onSubmitScannerEvidence={onSubmitScannerEvidence}
        evidencePanel={evidencePanel}
      />

      <WorkspaceAcceptanceReviewPanel
        selectedMilestone={selectedMilestone}
        criteria={selectedMilestoneCriteria}
        totalCriteriaCount={totalCriteriaCount}
        passedCriteriaCount={passedCriteriaCount}
        isGovernanceFetching={isGovernanceFetching}
        isGeneratingCriteria={isGeneratingCriteria}
        isUpdatingEvidenceRequirement={isUpdatingEvidenceRequirement}
        isCreatingCheck={isCreatingCheck}
        isReviewingCriterion={isReviewingCriterion}
        onGenerateCriteria={onGenerateCriteria}
        onUpdateEvidenceRequirement={onUpdateEvidenceRequirement}
        onCreateCheck={onCreateCheck}
        onReviewCriterion={onReviewCriterion}
      />
    </>
  );
}
