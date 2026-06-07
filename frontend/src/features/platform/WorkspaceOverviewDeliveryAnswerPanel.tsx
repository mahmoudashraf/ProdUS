'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import PlatformAssistantCard from './PlatformAssistantCard';
import { PastelChip, Surface, appleColors } from './PlatformComponents';
import type {
  AcceptanceCriterion,
  Deliverable,
  Milestone,
  ProjectWorkspace,
} from './types';

export default function WorkspaceOverviewDeliveryAnswerPanel({
  blockerCount,
  deliverableList,
  milestoneCount,
  missingEvidenceCount,
  productId,
  roughEdgeCount,
  scannerEvidenceCount,
  selectedMilestone,
  selectedMilestoneCriteria,
  workspace,
  onPrepareHandoff,
  onReviewProof,
}: {
  blockerCount: number;
  deliverableList: Deliverable[];
  milestoneCount: number;
  missingEvidenceCount: number;
  productId: string;
  roughEdgeCount: number;
  scannerEvidenceCount: number;
  selectedMilestone?: Milestone | undefined;
  selectedMilestoneCriteria: AcceptanceCriterion[];
  workspace: ProjectWorkspace;
  onPrepareHandoff: () => void;
  onReviewProof: () => void;
}) {
  return (
    <>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fffb 100%)' }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2.5}
          justifyContent="space-between"
          alignItems={{ lg: 'center' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" sx={{ fontSize: { xs: 22, md: 26 } }}>
              Delivery Answer
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65, maxWidth: 780 }}>
              {blockerCount
                ? `Not ready for owner handoff yet. ${blockerCount} priority fix${blockerCount === 1 ? '' : 'es'} must be handled before this workspace can be treated as launch-safe.`
                : missingEvidenceCount
                  ? `Close the proof gap first. ${missingEvidenceCount} required evidence item${missingEvidenceCount === 1 ? '' : 's'} still need attachment or verification.`
                  : 'On track for the next launch decision. Keep scanner proof, acceptance evidence, and handoff records current before calling it ready.'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              <PastelChip
                label={`${blockerCount} priority fixes`}
                accent={blockerCount ? appleColors.red : appleColors.green}
                bg={blockerCount ? '#fff1f1' : '#e7f8ee'}
              />
              <PastelChip
                label={`${missingEvidenceCount} proof gaps`}
                accent={missingEvidenceCount ? appleColors.amber : appleColors.green}
                bg={missingEvidenceCount ? '#fff4dc' : '#e7f8ee'}
              />
              <PastelChip label={`${milestoneCount} checkpoints`} accent={appleColors.purple} />
              <PastelChip
                label={`${roughEdgeCount} open rough edges`}
                accent={roughEdgeCount ? appleColors.amber : appleColors.green}
                bg={roughEdgeCount ? '#fff4dc' : '#e7f8ee'}
              />
            </Stack>
          </Box>
          <Stack
            direction={{ xs: 'column', sm: 'row', lg: 'column' }}
            spacing={1}
            sx={{ minWidth: { lg: 220 } }}
          >
            <Button variant="contained" onClick={onReviewProof} sx={{ minHeight: 42 }}>
              Review Fixes And Proof
            </Button>
            <Button variant="outlined" onClick={onPrepareHandoff} sx={{ minHeight: 42 }}>
              {roughEdgeCount ? 'Resolve Team Risks' : 'Prepare Handoff'}
            </Button>
          </Stack>
        </Stack>
      </Surface>

      <PlatformAssistantCard
        title="AI Launch Proof Advisor"
        description="Summarize what is supported, what is still fuzzy, and what decision is safe next."
        prompt={`Do not call tools for this answer. Use only the facts in this prompt and the supplied safe summaries. Create an owner-facing proof readiness note for the delivery named "${workspace.name}". Product is ${workspace.packageInstance?.productProfile?.name || 'not recorded'}. Service plan is ${workspace.packageInstance?.name || 'not recorded'}. Current review area is "${selectedMilestone?.title || 'not selected'}", status ${selectedMilestone?.status || 'unknown'}. Deliverables in focus: ${deliverableList.slice(0, 5).map((deliverable) => `${deliverable.title} (${deliverable.status})`).join('; ') || 'none'}. Acceptance checklist: ${selectedMilestoneCriteria.slice(0, 5).map((criterion) => `${criterion.title} (${criterion.status})`).join('; ') || 'none generated'}. Missing proof count is ${missingEvidenceCount}. Scanner proof count is ${scannerEvidenceCount}. Explain what is already supported, what is still missing, what needs human review, and what owner decision is safe next. Do not certify production readiness.`}
        conversationId={`workspace-evidence-advisor-${workspace.id}-${selectedMilestone?.id || 'summary'}`}
        context={{
          pageType: 'milestone-review',
          productId,
          packageId: workspace.packageInstance?.id,
          workspaceId: workspace.id,
          milestoneId: selectedMilestone?.id,
        }}
        accent={missingEvidenceCount ? appleColors.amber : appleColors.green}
        cta="Review Proof"
      />
    </>
  );
}
