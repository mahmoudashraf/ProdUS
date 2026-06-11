'use client';

import PlatformAssistantCard from './PlatformAssistantCard';
import { appleColors } from './PlatformComponents';
import type { Milestone, ProjectWorkspace } from './types';

interface WorkspaceHandoffAssistantPanelProps {
  workspace: ProjectWorkspace;
  productId: string;
  selectedMilestone: Milestone | undefined;
  completedCheckpointCount: number;
  milestoneCount: number;
  supportCount: number;
  riskCount: number;
  missingEvidenceCount: number;
  integrationCount: number;
  hasHandoff: boolean;
}

export default function WorkspaceHandoffAssistantPanel({
  workspace,
  productId,
  selectedMilestone,
  completedCheckpointCount,
  milestoneCount,
  supportCount,
  riskCount,
  missingEvidenceCount,
  integrationCount,
  hasHandoff,
}: WorkspaceHandoffAssistantPanelProps) {
  return (
    <PlatformAssistantCard
      title="AI handoff readiness"
      description="Identify support handoff gaps across runbooks, access, monitoring, unresolved risks, and proof quality."
      prompt={`Do not call tools for this answer. Use only the facts in this prompt and the supplied safe summaries. Assess support handoff readiness for delivery "${workspace.name}". Delivery status is ${workspace.status}. Product is ${workspace.packageInstance?.productProfile?.name || 'not recorded'}. Completed checkpoints: ${completedCheckpointCount}/${milestoneCount}. Open support requests: ${supportCount}. Open risks: ${riskCount}. Missing required proof: ${missingEvidenceCount}. Integration records: ${integrationCount}. Handoff documents: ${hasHandoff ? 1 : 0}. Explain missing runbooks, access, monitoring, known issue, and ownership proof. Recommend safe owner/team questions and next actions. Do not claim handoff is complete unless the proof supports human review.`}
      conversationId={`workspace-handoff-${workspace.id}`}
      context={{
        pageType: 'active-workspace',
        productId,
        packageId: workspace.packageInstance?.id,
        workspaceId: workspace.id,
        milestoneId: selectedMilestone?.id,
      }}
      accent={supportCount || riskCount || missingEvidenceCount ? appleColors.amber : appleColors.green}
      cta="Check handoff"
    />
  );
}
