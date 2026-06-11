'use client';

import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react';
import WorkspaceAcceptanceReviewPanel from './WorkspaceAcceptanceReviewPanel';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import WorkspaceProofEvidencePanel, { type WorkspaceScannerUploadForm } from './WorkspaceProofEvidencePanel';
import WorkspaceProofMilestonesPanel from './WorkspaceProofMilestonesPanel';
import WorkspaceProofReadinessPanel from './WorkspaceProofReadinessPanel';
import { PastelChip, SectionTitle, Surface, appleColors } from './PlatformComponents';
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

export type WorkspaceCommandProofView = 'readiness' | 'steps' | 'proof' | 'acceptance';

const proofViewLabels: Record<WorkspaceCommandProofView, string> = {
  readiness: 'Fix path',
  steps: 'Steps',
  proof: 'Proof files',
  acceptance: 'Acceptance',
};

type WorkspaceCommandProofStepPanelProps = {
  view: WorkspaceCommandProofView | null;
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
  onOpenHub: () => void;
  onViewChange: (view: WorkspaceCommandProofView) => void;
};

export default function WorkspaceCommandProofStepPanel({
  view,
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
  onOpenHub,
  onViewChange,
}: WorkspaceCommandProofStepPanelProps) {
  const proofItems: JourneyStepItem<WorkspaceCommandProofView>[] = [
    {
      value: 'readiness',
      label: proofViewLabels.readiness,
      detail: 'Launch confidence, priority fixes, generated snapshot, and AI explanation.',
      accent: readiness?.blockerCount ? appleColors.red : appleColors.cyan,
      meta: <PastelChip label={`${readiness?.blockerCount || 0} blockers`} accent={readiness?.blockerCount ? appleColors.red : appleColors.cyan} bg={readiness?.blockerCount ? '#fff1f1' : '#e4f9fd'} />,
    },
    {
      value: 'steps',
      label: proofViewLabels.steps,
      detail: 'Workspace steps, outputs, selected milestone, and linked output proof.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${milestoneList.length} steps`} accent={appleColors.purple} bg="#f1efff" />,
    },
    {
      value: 'proof',
      label: proofViewLabels.proof,
      detail: 'Workspace proof files plus scan proof upload and recent scan records.',
      accent: appleColors.blue,
      meta: <PastelChip label={`${proofFileCount + scannerEvidenceList.length} records`} accent={appleColors.blue} bg="#eaf3ff" />,
    },
    {
      value: 'acceptance',
      label: proofViewLabels.acceptance,
      detail: 'Acceptance checklist, proof requirements, checks, and owner review decisions.',
      accent: totalCriteriaCount === passedCriteriaCount && totalCriteriaCount ? appleColors.green : appleColors.amber,
      meta: <PastelChip label={`${passedCriteriaCount}/${totalCriteriaCount} passed`} accent={totalCriteriaCount === passedCriteriaCount && totalCriteriaCount ? appleColors.green : appleColors.amber} bg={totalCriteriaCount === passedCriteriaCount && totalCriteriaCount ? '#e7f8ee' : '#fff4dc'} />,
    },
  ];

  if (!view) {
    return (
      <Surface>
        <SectionTitle
          title="Choose proof work"
          action={<PastelChip label="One job at a time" accent={appleColors.purple} bg="#f1efff" />}
        />
        <OwnerWorkspaceJourneyNav
          label="Fixes and proof internal pages"
          value={null}
          items={proofItems}
          onChange={onViewChange}
        />
      </Surface>
    );
  }

  return (
    <>
      <WorkspaceBreadcrumbs
        items={[
          { label: 'Fixes and proof', onClick: onOpenHub },
          { label: proofViewLabels[view] },
        ]}
        backLabel="Fixes and proof"
        onBack={onOpenHub}
      />

      {view === 'readiness' && (
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
      )}

      {view === 'steps' && (
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
      )}

      {view === 'proof' && (
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
      )}

      {view === 'acceptance' && (
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
      )}
    </>
  );
}
