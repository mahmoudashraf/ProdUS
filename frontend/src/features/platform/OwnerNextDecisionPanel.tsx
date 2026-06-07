'use client';

import { SendOutlined } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { DotLabel, SectionTitle, Surface, appleColors } from './PlatformComponents';
import type { QuoteProposal } from './types';

export default function OwnerNextDecisionPanel({
  blockedMilestoneCount,
  buildTargetRequirementId,
  hasServicePlan,
  hasWorkspace,
  isBuilding,
  proposals,
  onBuildPlan,
}: {
  blockedMilestoneCount: number;
  buildTargetRequirementId?: string | undefined;
  hasServicePlan: boolean;
  hasWorkspace: boolean;
  isBuilding: boolean;
  proposals: QuoteProposal[];
  onBuildPlan: (requirementId: string) => void;
}) {
  const ownerAcceptedProposal = proposals.some((proposal) => proposal.status === 'OWNER_ACCEPTED');

  return (
    <Surface>
      <SectionTitle title="Next Decision" />
      <Stack spacing={1.25}>
        {!hasServicePlan && <DotLabel label="Create the service plan" color={appleColors.amber} />}
        {hasServicePlan && !ownerAcceptedProposal && (
          <DotLabel label="Compare and accept a team proposal" color={appleColors.purple} />
        )}
        {hasServicePlan && hasWorkspace && (
          <DotLabel
            label="Review milestone evidence"
            color={blockedMilestoneCount ? appleColors.red : appleColors.green}
          />
        )}
        {buildTargetRequirementId && !hasServicePlan && (
          <Button
            variant="contained"
            startIcon={<SendOutlined />}
            onClick={() => onBuildPlan(buildTargetRequirementId)}
            disabled={isBuilding}
          >
            Create service plan
          </Button>
        )}
      </Stack>
    </Surface>
  );
}
