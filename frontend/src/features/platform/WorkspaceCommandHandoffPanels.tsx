'use client';

import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import PlatformAssistantCard from './PlatformAssistantCard';
import {
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  HandoffDocument,
  IntegrationConnection,
  Milestone,
  ProductHealthReview,
  ProjectWorkspace,
} from './types';

const integrationProviderOptions: IntegrationConnection['providerType'][] = [
  'GITHUB',
  'CI_CD',
  'DEPENDENCY_SCAN',
  'SECRETS_SCAN',
  'DEPLOYMENT',
  'MONITORING',
  'DATABASE',
  'ISSUE_TRACKER',
  'SUPPORT_TOOL',
  'OTHER',
];

interface WorkspaceCommandHandoffPanelsProps {
  workspace: ProjectWorkspace;
  productId: string;
  selectedMilestone: Milestone | undefined;
  completedCheckpointCount: number;
  milestoneCount: number;
  supportCount: number;
  riskCount: number;
  missingEvidenceCount: number;
  workspaceProgress: number;
  canCoordinate: boolean;
  latestHandoff: HandoffDocument | undefined;
  latestHealthReview: ProductHealthReview | undefined;
  integrationList: IntegrationConnection[];
  latestIntegration: IntegrationConnection | undefined;
  integrationProvider: IntegrationConnection['providerType'];
  isPreparingHandoff: boolean;
  isPublishingHealthReview: boolean;
  isCreatingIntegration: boolean;
  isRecordingSignal: boolean;
  onIntegrationProviderChange: (provider: IntegrationConnection['providerType']) => void;
  onPrepareHandoff: () => void;
  onPublishHealthReview: () => void;
  onCreateIntegration: (provider: IntegrationConnection['providerType']) => void;
  onRecordIntegrationSignal: (connectionId: string) => void;
}

export default function WorkspaceCommandHandoffPanels({
  workspace,
  productId,
  selectedMilestone,
  completedCheckpointCount,
  milestoneCount,
  supportCount,
  riskCount,
  missingEvidenceCount,
  workspaceProgress,
  canCoordinate,
  latestHandoff,
  latestHealthReview,
  integrationList,
  latestIntegration,
  integrationProvider,
  isPreparingHandoff,
  isPublishingHealthReview,
  isCreatingIntegration,
  isRecordingSignal,
  onIntegrationProviderChange,
  onPrepareHandoff,
  onPublishHealthReview,
  onCreateIntegration,
  onRecordIntegrationSignal,
}: WorkspaceCommandHandoffPanelsProps) {
  return (
    <>
      <PlatformAssistantCard
        title="AI Handoff Readiness"
        description="Identify support handoff gaps across runbooks, access, monitoring, unresolved risks, and evidence quality."
        prompt={`Do not call tools for this answer. Use only the facts in this prompt and the supplied safe summaries. Assess support handoff readiness for delivery "${workspace.name}". Delivery status is ${workspace.status}. Product is ${workspace.packageInstance?.productProfile?.name || 'not recorded'}. Completed checkpoints: ${completedCheckpointCount}/${milestoneCount}. Open support requests: ${supportCount}. Open risks: ${riskCount}. Missing required evidence: ${missingEvidenceCount}. Integration records: ${integrationList.length}. Handoff documents: ${latestHandoff ? 1 : 0}. Explain missing runbooks, access, monitoring, known issue, and ownership evidence. Recommend safe owner/team questions and next actions. Do not claim handoff is complete unless the evidence supports human review.`}
        conversationId={`workspace-handoff-${workspace.id}`}
        context={{
          pageType: 'active-workspace',
          productId,
          packageId: workspace.packageInstance?.id,
          workspaceId: workspace.id,
          milestoneId: selectedMilestone?.id,
        }}
        accent={supportCount || riskCount || missingEvidenceCount ? appleColors.amber : appleColors.green}
        cta="Check Handoff"
      />

      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f6fffb)' }}>
        <SectionTitle title="Handoff And Health" action={<PastelChip label={latestHealthReview ? `${latestHealthReview.healthScore}/100` : 'No review'} accent={latestHealthReview ? appleColors.green : appleColors.purple} bg={latestHealthReview ? '#e7f8ee' : '#f1efff'} />} />
        <Stack spacing={1.25}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>{latestHandoff?.title || 'Owner handoff'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {latestHandoff ? formatLabel(latestHandoff.status) : 'Prepare runbook, access, known issues, and support scope.'}
                </Typography>
              </Box>
              {latestHandoff && <StatusChip label={latestHandoff.status} color={latestHandoff.status === 'ACCEPTED' ? 'success' : 'default'} />}
            </Stack>
            {latestHandoff?.runbook && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.5 }}>
                {latestHandoff.runbook}
              </Typography>
            )}
          </Box>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ProgressRing value={latestHealthReview?.healthScore || Math.max(55, workspaceProgress || 70)} size={64} color={latestHealthReview ? appleColors.green : appleColors.amber} label="health" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>{latestHealthReview?.summary || 'No health review published yet.'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {missingEvidenceCount ? `${missingEvidenceCount} required evidence items missing` : 'Evidence requirements are current'}
                </Typography>
              </Box>
            </Stack>
          </Box>
          {canCoordinate && (
            <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} spacing={1}>
              <Button variant="outlined" onClick={onPrepareHandoff} disabled={isPreparingHandoff} sx={{ minHeight: 40 }}>
                Prepare handoff
              </Button>
              <Button variant="outlined" onClick={onPublishHealthReview} disabled={isPublishingHealthReview} sx={{ minHeight: 40 }}>
                Publish health review
              </Button>
            </Stack>
          )}
        </Stack>
      </Surface>

      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8fbff)' }}>
        <SectionTitle title="Integration Signals" action={<PastelChip label={`${integrationList.length} connected`} accent={appleColors.blue} bg="#eaf3ff" />} />
        <Stack spacing={1.25}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            Register workspace-scoped integrations and record readiness signals. These records are AI-ready context but no AI execution happens here.
          </Typography>
          {canCoordinate && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1 }}>
              <TextField select size="small" label="Provider" value={integrationProvider} onChange={(event) => onIntegrationProviderChange(event.target.value as IntegrationConnection['providerType'])}>
                {integrationProviderOptions.map((provider) => <MenuItem key={provider} value={provider}>{formatLabel(provider)}</MenuItem>)}
              </TextField>
              <Button variant="outlined" onClick={() => onCreateIntegration(integrationProvider)} disabled={isCreatingIntegration}>
                Add
              </Button>
            </Box>
          )}
          <Stack spacing={1}>
            {integrationList.length ? integrationList.map((connection) => (
              <Box key={connection.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
                <Stack direction="row" spacing={1} justifyContent="space-between">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{connection.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatLabel(connection.providerType)} · {formatLabel(connection.status)}</Typography>
                  </Box>
                  <StatusChip label={connection.status} color={connection.status === 'ACTIVE' ? 'success' : connection.status === 'NEEDS_ATTENTION' ? 'warning' : 'default'} />
                </Stack>
                {connection.signals.slice(0, 2).map((signal) => (
                  <Typography key={signal.id} variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    {formatLabel(signal.status)} · {signal.summary || signal.signalType}
                  </Typography>
                ))}
              </Box>
            )) : <Typography variant="body2" color="text.secondary">No integration connections are registered yet.</Typography>}
          </Stack>
          {latestIntegration && canCoordinate && (
            <Button variant="outlined" onClick={() => onRecordIntegrationSignal(latestIntegration.id)} disabled={isRecordingSignal} sx={{ minHeight: 40 }}>
              Record signal
            </Button>
          )}
        </Stack>
      </Surface>
    </>
  );
}
