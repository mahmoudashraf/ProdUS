'use client';

import NextLink from 'next/link';
import { Alert, Box, Button, LinearProgress, Link, Stack, Typography } from '@mui/material';
import PlatformAssistantCard from './PlatformAssistantCard';
import {
  DotLabel,
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { formatEvidenceFileSize, teamDeliveryStatusAccent } from './teamDeliveryUtils';
import type { EvidenceAttachment, Milestone, ProjectWorkspace, Team } from './types';

export default function TeamDeliveryProofPanel({
  activeWorkspaces,
  selectedWorkspace,
  selectedTeam,
  milestones,
  attachments,
  teamSupportCount,
  blockedWorkspaceCount,
  attachmentOpenError,
  onSelectWorkspace,
  onOpenAttachment,
}: {
  activeWorkspaces: ProjectWorkspace[];
  selectedWorkspace?: ProjectWorkspace | undefined;
  selectedTeam?: Team | undefined;
  milestones: Milestone[];
  attachments: EvidenceAttachment[];
  teamSupportCount: number;
  blockedWorkspaceCount: number;
  attachmentOpenError: string;
  onSelectWorkspace: (workspaceId: string) => void;
  onOpenAttachment: (attachment: EvidenceAttachment) => void;
}) {
  const selectedWorkspaceProduct = selectedWorkspace?.packageInstance?.productProfile;
  const selectedWorkspacePackage = selectedWorkspace?.packageInstance;

  return (
    <Stack spacing={2.5}>
      <Surface>
        <SectionTitle title="Active Deliveries" action={<PastelChip label={`${activeWorkspaces.length} workspaces`} accent={appleColors.green} />} />
        {activeWorkspaces.length ? (
          <Stack spacing={0}>
            {activeWorkspaces.slice(0, 5).map((workspace, index) => (
              <Box key={workspace.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr 160px auto' }, gap: 1.5, py: 1.75, alignItems: 'center', borderTop: index === 0 ? 0 : '1px solid', borderColor: 'divider' }}>
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>{workspace.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{workspace.packageInstance?.productProfile?.name || workspace.packageInstance?.name}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={workspace.status === 'BLOCKED' ? 42 : workspace.status === 'MILESTONE_REVIEW' ? 78 : 64}
                  sx={{ height: 8, borderRadius: 999, bgcolor: '#edf1f7', '& .MuiLinearProgress-bar': { bgcolor: teamDeliveryStatusAccent(workspace.status), borderRadius: 999 } }}
                />
                <DotLabel label={formatLabel(workspace.status)} color={teamDeliveryStatusAccent(workspace.status)} />
                <Button
                  size="small"
                  variant={selectedWorkspace?.id === workspace.id ? 'contained' : 'outlined'}
                  onClick={() => onSelectWorkspace(workspace.id)}
                >
                  Review evidence
                </Button>
              </Box>
            ))}
          </Stack>
        ) : (
          <EmptyState label="No active delivery workspace is assigned to this user yet." />
        )}
      </Surface>

      <PlatformAssistantCard
        title="AI Delivery Evidence Coach"
        description="Explain blocked work, missing proof, scanner-sensitive checkpoints, and what the team should update next."
        prompt={`Do not call tools for this answer. Use only the facts in this prompt and the supplied safe summaries. Create a team-facing delivery proof note for ${selectedWorkspace?.name || 'the selected delivery'}. Delivery status is ${selectedWorkspace?.status || 'not selected'}, product is ${selectedWorkspaceProduct?.name || 'not available'}, visible stage count is ${milestones.length}, blocked or submitted stages count is ${milestones.filter((milestone) => ['BLOCKED', 'SUBMITTED', 'IN_REVIEW'].includes(milestone.status)).length}, attachments count is ${attachments.length}, support risk count is ${teamSupportCount}. Focus on missing proof, blocked deliverables, owner-facing proof to add, and safe next team actions. Do not approve production readiness.`}
        conversationId={`team-delivery-evidence-${selectedWorkspace?.id || selectedTeam?.id || 'none'}`}
        context={{
          pageType: 'active-workspace',
          productId: selectedWorkspaceProduct?.id,
          packageId: selectedWorkspacePackage?.id,
          workspaceId: selectedWorkspace?.id,
        }}
        disabled={!selectedWorkspace}
        accent={blockedWorkspaceCount ? appleColors.amber : appleColors.cyan}
        cta="Coach Delivery"
      />

      <Surface>
        <SectionTitle
          title="Delivery Evidence"
          action={
            selectedWorkspace ? (
              <PastelChip
                label={selectedWorkspace.name}
                accent={teamDeliveryStatusAccent(selectedWorkspace.status)}
              />
            ) : null
          }
        />
        {selectedWorkspace ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {selectedWorkspace.packageInstance?.productProfile?.name || selectedWorkspace.packageInstance?.name || 'Selected workspace'}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                <StatusChip label={selectedWorkspace.status} />
                <PastelChip label={`${attachments.length} attachments`} accent={appleColors.cyan} bg="#e4f9fd" />
                <PastelChip label={`${milestones.length} milestones`} accent={appleColors.purple} bg="#f1efff" />
              </Stack>
            </Box>
            {attachmentOpenError && (
              <Alert severity="error" sx={{ borderRadius: 1 }}>
                {attachmentOpenError}
              </Alert>
            )}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 900, mb: 1 }}>
                Workspace attachments
              </Typography>
              {attachments.length ? (
                <Stack spacing={0.75}>
                  {attachments.slice(0, 5).map((attachment) => (
                    <Box key={attachment.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, px: 1.25, py: 1 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} justifyContent="space-between">
                        <Box>
                          <Link
                            component="button"
                            type="button"
                            underline="hover"
                            variant="body2"
                            onClick={() => onOpenAttachment(attachment)}
                            sx={{ cursor: 'pointer', textAlign: 'left', fontWeight: 800 }}
                          >
                            {attachment.label || attachment.fileName}
                          </Link>
                          {attachment.label && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {attachment.fileName}
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatEvidenceFileSize(attachment.sizeBytes)}
                          {attachment.uploadedBy?.email ? ` - ${attachment.uploadedBy.email}` : ''}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No file attachments yet. Milestone evidence and deliverable status are shown below.
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 900, mb: 1 }}>
                Milestone evidence
              </Typography>
              {milestones.length ? (
                <Stack spacing={1.25}>
                  {milestones.slice(0, 6).map((milestone) => (
                    <Stack key={milestone.id} direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{milestone.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{milestone.dueDate || 'No due date'}</Typography>
                      </Box>
                      <StatusChip label={milestone.status} />
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">Milestones appear when a delivery workspace is selected.</Typography>
              )}
            </Box>
            <Button component={NextLink} href="/workspaces" variant="outlined" sx={{ minHeight: 42, alignSelf: 'flex-start' }}>
              Open full workspace
            </Button>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select an active delivery to review its evidence trail.
          </Typography>
        )}
      </Surface>
    </Stack>
  );
}
