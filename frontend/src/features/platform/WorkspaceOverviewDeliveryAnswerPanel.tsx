'use client';

import PlatformAssistantCard from './PlatformAssistantCard';
import { appleColors } from './PlatformComponents';
import type {
  AcceptanceCriterion,
  Deliverable,
  Milestone,
  PackageModule,
  ProjectWorkspace,
  ScannerRiskSummary,
  SupportRequest,
  WorkspaceParticipant,
} from './types';
import WorkspaceOverviewFocusPanel from './WorkspaceOverviewFocusPanel';

export default function WorkspaceOverviewDeliveryAnswerPanel({
  blockerCount,
  deliverableList,
  milestoneCount,
  missingEvidenceCount,
  packageModules,
  productId,
  scannerEvidenceCount,
  selectedMilestone,
  selectedMilestoneCriteria,
  participantList,
  riskSummary,
  supportList,
  workspace,
  onManageTeam,
  onPrepareHandoff,
  onManageServices,
  onReviewProof,
}: {
  blockerCount: number;
  deliverableList: Deliverable[];
  milestoneCount: number;
  missingEvidenceCount: number;
  packageModules: PackageModule[];
  participantList: WorkspaceParticipant[];
  productId: string;
  roughEdgeCount: number;
  riskSummary?: ScannerRiskSummary | undefined;
  scannerEvidenceCount: number;
  selectedMilestone?: Milestone | undefined;
  selectedMilestoneCriteria: AcceptanceCriterion[];
  supportList: SupportRequest[];
  workspace: ProjectWorkspace;
  onManageTeam: () => void;
  onPrepareHandoff: () => void;
  onManageServices: () => void;
  onReviewProof: () => void;
}) {
  return (
    <>
      <WorkspaceOverviewFocusPanel
        workspace={workspace}
        packageModules={packageModules}
        participantList={participantList}
        riskSummary={riskSummary}
        supportList={supportList}
        missingEvidenceCount={missingEvidenceCount}
        onOpenFindings={onReviewProof}
        onOpenHandoff={onPrepareHandoff}
        onOpenServices={onManageServices}
        onOpenTeam={onManageTeam}
      />

      <PlatformAssistantCard
        title="Launch proof assistant"
        description="Summarize what is supported, what is still fuzzy, and what decision is safe next."
        prompt={`Do not call tools for this answer. Use only the facts in this prompt and the supplied safe summaries. Create an owner-facing proof readiness note for the delivery named "${workspace.name}". Product is ${workspace.packageInstance?.productProfile?.name || 'not recorded'}. Service plan is ${workspace.packageInstance?.name || 'not recorded'}. Current review area is "${selectedMilestone?.title || 'not selected'}", status ${selectedMilestone?.status || 'unknown'}. Workspace checkpoints count is ${milestoneCount}. Deliverables in focus: ${
          deliverableList
            .slice(0, 5)
            .map(deliverable => `${deliverable.title} (${deliverable.status})`)
            .join('; ') || 'none'
        }. Acceptance checklist: ${
          selectedMilestoneCriteria
            .slice(0, 5)
            .map(criterion => `${criterion.title} (${criterion.status})`)
            .join('; ') || 'none generated'
        }. Missing proof count is ${missingEvidenceCount}. Scanner proof count is ${scannerEvidenceCount}. Workspace blockers are ${blockerCount}. Visible services are ${
          packageModules
            .slice(0, 5)
            .map(module => module.serviceModule.name)
            .join(', ') || 'not recorded'
        }. Assigned people are ${
          participantList
            .slice(0, 5)
            .map(participant => `${participant.user.email} (${participant.role})`)
            .join(', ') || 'none'
        }. Explain what is already supported, what is still missing, what needs human review, and what owner decision is safe next. Do not certify production readiness.`}
        conversationId={`workspace-evidence-advisor-${workspace.id}-${selectedMilestone?.id || 'summary'}`}
        context={{
          pageType: 'milestone-review',
          productId,
          packageId: workspace.packageInstance?.id,
          workspaceId: workspace.id,
          milestoneId: selectedMilestone?.id,
        }}
        accent={missingEvidenceCount ? appleColors.amber : appleColors.green}
        cta="Review proof"
      />
    </>
  );
}
