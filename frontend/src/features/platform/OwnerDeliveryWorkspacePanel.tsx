'use client';

import NextLink from 'next/link';
import { OpenInNewOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import StudioAssistantCard, { type StudioAssistantContext } from './StudioAssistantCard';
import {
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { Milestone, ProjectWorkspace } from './types';

interface AssistantActionHandlers {
  onConfirmAction?: (action: Record<string, unknown>) => Promise<void> | void;
  actionDisabledReason?: (action: Record<string, unknown>) => string;
}

export default function OwnerDeliveryWorkspacePanel({
  assistantActions,
  assistantContext,
  blockedMilestoneCount,
  milestones,
  selectedMilestone,
  workspace,
}: {
  assistantActions: AssistantActionHandlers;
  assistantContext: StudioAssistantContext;
  blockedMilestoneCount: number;
  milestones: Milestone[];
  selectedMilestone?: Milestone | undefined;
  workspace?: ProjectWorkspace | undefined;
}) {
  return (
    <Surface>
      <SectionTitle title="Delivery Workspace" action={workspace && <StatusChip label={workspace.status} />} />
      {workspace ? (
        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 900 }}>{workspace.name}</Typography>
          {milestones.slice(0, 5).map((milestone) => (
            <Stack
              key={milestone.id}
              direction="row"
              spacing={1}
              justifyContent="space-between"
              sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {milestone.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {milestone.dueDate || 'No date'}
                </Typography>
              </Box>
              <StatusChip label={milestone.status} />
            </Stack>
          ))}
          <StudioAssistantCard
            title="AI Milestone Evidence"
            description="Check what the current milestone needs before owner approval or team handoff."
            prompt={`Do not call tools for this answer. Review milestone and evidence readiness for ${selectedMilestone?.title || workspace.name}. Visible workspace "${workspace.name}" is ${workspace.status}. Current milestone details: title "${selectedMilestone?.title || 'workspace summary'}", status "${selectedMilestone?.status || workspace.status}", due date "${selectedMilestone?.dueDate || 'not recorded'}", description "${selectedMilestone?.description || 'not recorded'}". Explain missing acceptance evidence, scanner proof, owner review risks, and the next safe decision. Do not approve the milestone automatically.`}
            conversationId={`studio-milestone-${workspace.id}-${selectedMilestone?.id || 'summary'}`}
            context={assistantContext}
            {...assistantActions}
            accent={blockedMilestoneCount ? appleColors.red : appleColors.green}
            compact
            cta="Check Evidence"
          />
          <Button
            component={NextLink}
            href="/workspaces"
            variant="outlined"
            endIcon={<OpenInNewOutlined />}
            sx={{ minHeight: 42 }}
          >
            Manage workspace
          </Button>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          A workspace appears after service plan handoff.
        </Typography>
      )}
    </Surface>
  );
}
