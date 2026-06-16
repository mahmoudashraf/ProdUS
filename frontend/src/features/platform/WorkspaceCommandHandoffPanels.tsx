'use client';

import { Box, Button, Stack, Typography } from '@mui/material';

import {
  OwnerWorkspaceJourneyNav,
  WorkspaceBreadcrumbs,
  type JourneyStepItem,
} from './OwnerWorkspaceJourneyNav';
import { PastelChip, appleColors, formatLabel } from './PlatformComponents';
import type {
  HandoffDocument,
  IntegrationConnection,
  Milestone,
  PackageModule,
  ProductHealthReview,
  ProjectWorkspace,
  ScannerRiskSummary,
} from './types';
import WorkspaceCommandSubrouteActions, {
  type WorkspaceCommandSubrouteItem,
} from './WorkspaceCommandSubrouteActions';
import WorkspaceHandoffAssistantPanel from './WorkspaceHandoffAssistantPanel';
import WorkspaceHandoffReviewPanel from './WorkspaceHandoffReviewPanel';
import WorkspaceIntegrationSignalsPanel from './WorkspaceIntegrationSignalsPanel';

export type WorkspaceCommandHandoffView = 'review' | 'signals' | 'assistant';

const handoffViewLabel: Record<WorkspaceCommandHandoffView, string> = {
  review: 'Owner Handoff',
  signals: 'Signals',
  assistant: 'Ask AI',
};

interface IWorkspaceCommandHandoffPanelsProps {
  view: WorkspaceCommandHandoffView | null;
  workspace: ProjectWorkspace;
  productId: string;
  selectedMilestone: Milestone | undefined;
  completedCheckpointCount: number;
  milestoneCount: number;
  supportCount: number;
  riskCount: number;
  missingEvidenceCount: number;
  participantCount?: number;
  packageModules?: PackageModule[] | undefined;
  riskSummary?: ScannerRiskSummary | undefined;
  serviceCount?: number;
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
  onOpenFixAndVerify?: () => void;
  onOpenHub: () => void;
  onOpenPeople?: () => void;
  onViewChange: (view: WorkspaceCommandHandoffView) => void;
}

export default function WorkspaceCommandHandoffPanels({
  view,
  workspace,
  productId,
  selectedMilestone,
  completedCheckpointCount,
  milestoneCount,
  supportCount,
  riskCount,
  missingEvidenceCount,
  participantCount = 0,
  packageModules = [],
  riskSummary,
  serviceCount = 0,
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
  onOpenFixAndVerify,
  onOpenHub,
  onOpenPeople,
  onViewChange,
}: IWorkspaceCommandHandoffPanelsProps) {
  const handoffReadiness = buildHandoffReadiness({
    latestHandoff: !!latestHandoff,
    missingEvidenceCount,
    packageModules,
    participantCount,
    riskSummary,
    serviceCount,
    supportCount,
    workspaceProgress,
  });
  const items: JourneyStepItem<WorkspaceCommandHandoffView>[] = [
    {
      value: 'review',
      label: 'Owner Handoff',
      detail: 'Runbook, health review, and open handoff gaps.',
      accent: missingEvidenceCount ? appleColors.amber : appleColors.green,
      meta: (
        <PastelChip
          label={latestHandoff ? formatLabel(latestHandoff.status) : 'Not ready'}
          accent={latestHandoff ? appleColors.green : appleColors.amber}
          bg={latestHandoff ? '#e7f8ee' : '#fff4dc'}
        />
      ),
    },
    {
      value: 'signals',
      label: 'Signals',
      detail: 'Workspace-scoped integrations and readiness records.',
      accent: integrationList.length ? appleColors.blue : appleColors.purple,
      meta: (
        <PastelChip
          label={`${integrationList.length} connected`}
          accent={appleColors.blue}
          bg="#eaf3ff"
        />
      ),
    },
    {
      value: 'assistant',
      label: 'Ask AI',
      detail: 'Optional handoff questions after the owner review.',
      accent:
        supportCount || riskCount || missingEvidenceCount ? appleColors.amber : appleColors.purple,
      meta: <PastelChip label="Optional" accent={appleColors.purple} bg="#f1efff" />,
    },
  ];
  const subrouteItems: WorkspaceCommandSubrouteItem<WorkspaceCommandHandoffView>[] = items.map(
    item => ({
      value: item.value,
      label: item.label,
      accent: item.accent || appleColors.purple,
    })
  );

  return (
    <Stack spacing={2}>
      {view && (
        <WorkspaceBreadcrumbs
          items={[{ label: 'Handoff', onClick: onOpenHub }, { label: handoffViewLabel[view] }]}
          backLabel="Handoff hub"
          onBack={onOpenHub}
        />
      )}

      <HandoffReadinessGate
        readiness={handoffReadiness}
        onOpenFixAndVerify={onOpenFixAndVerify}
        onOpenPeople={onOpenPeople}
      />

      {view ? (
        <WorkspaceCommandSubrouteActions
          ariaLabel="Handoff internal pages"
          currentValue={view}
          items={subrouteItems}
          onChange={onViewChange}
        />
      ) : !handoffReadiness.ready && !latestHandoff ? (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: '#c9d8ea',
            borderRadius: 1,
            bgcolor: '#fbfdff',
            p: 1.25,
          }}
        >
          <Typography variant="subtitle1">Handoff stays quiet for now.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
            Use Fix and verify and People first. The handoff review tools become useful when fixes,
            proof, and ownership are ready enough for another person to continue safely.
          </Typography>
          <Button
            variant="text"
            onClick={() => onViewChange('review')}
            sx={{ mt: 0.75, minHeight: 34, alignSelf: 'flex-start' }}
          >
            Review handoff details anyway
          </Button>
        </Box>
      ) : (
        <OwnerWorkspaceJourneyNav
          label="Handoff command"
          value={null}
          items={items}
          onChange={onViewChange}
        />
      )}

      {view === 'review' && (
        <WorkspaceHandoffReviewPanel
          latestHandoff={latestHandoff}
          latestHealthReview={latestHealthReview}
          missingEvidenceCount={missingEvidenceCount}
          workspaceProgress={workspaceProgress}
          canCoordinate={canCoordinate}
          isPreparingHandoff={isPreparingHandoff}
          isPublishingHealthReview={isPublishingHealthReview}
          onPrepareHandoff={onPrepareHandoff}
          onPublishHealthReview={onPublishHealthReview}
        />
      )}

      {view === 'signals' && (
        <WorkspaceIntegrationSignalsPanel
          canCoordinate={canCoordinate}
          integrationList={integrationList}
          latestIntegration={latestIntegration}
          integrationProvider={integrationProvider}
          isCreatingIntegration={isCreatingIntegration}
          isRecordingSignal={isRecordingSignal}
          onIntegrationProviderChange={onIntegrationProviderChange}
          onCreateIntegration={onCreateIntegration}
          onRecordIntegrationSignal={onRecordIntegrationSignal}
        />
      )}

      {view === 'assistant' && (
        <WorkspaceHandoffAssistantPanel
          workspace={workspace}
          productId={productId}
          selectedMilestone={selectedMilestone}
          completedCheckpointCount={completedCheckpointCount}
          milestoneCount={milestoneCount}
          supportCount={supportCount}
          riskCount={riskCount}
          missingEvidenceCount={missingEvidenceCount}
          integrationCount={integrationList.length}
          hasHandoff={!!latestHandoff}
        />
      )}
    </Stack>
  );
}

type HandoffReadiness = {
  ready: boolean;
  statusLabel: string;
  headline: string;
  detail: string;
  gates: Array<{
    label: string;
    ready: boolean;
    detail: string;
  }>;
};

function buildHandoffReadiness({
  latestHandoff,
  missingEvidenceCount,
  packageModules,
  participantCount,
  riskSummary,
  serviceCount,
  supportCount,
  workspaceProgress,
}: {
  latestHandoff: boolean;
  missingEvidenceCount: number;
  packageModules: PackageModule[];
  participantCount: number;
  riskSummary?: ScannerRiskSummary | undefined;
  serviceCount: number;
  supportCount: number;
  workspaceProgress: number;
}): HandoffReadiness {
  const risks = riskSummary?.groups.flatMap(group => group.risks) || [];
  const unresolvedFindings = risks.filter(risk =>
    ['NEW', 'STILL_OPEN', 'RETURNED', 'READY_TO_CHECK', 'NEEDS_PROOF', 'INCOMPLETE_CHECK'].includes(
      risk.currentState
    )
  );
  const verifiedFindings = risks.filter(risk => risk.currentState === 'FIXED_BY_LATEST_SCAN');
  const acceptedRisks = risks.filter(risk => risk.currentState === 'ACCEPTED_RISK');
  const serviceOwnerById = new Map(
    packageModules
      .filter(module => module.owner?.id)
      .map(module => [module.serviceModule.id, module.owner?.id])
  );
  const unownedServices = packageModules.filter(module => !module.owner?.id);
  const unownedFindings = unresolvedFindings.filter(
    risk => !risk.owner?.id && !serviceOwnerById.get(risk.recommendedModule?.id || '')
  );
  const hasMeaningfulProgress =
    latestHandoff ||
    verifiedFindings.length > 0 ||
    acceptedRisks.length > 0 ||
    workspaceProgress >= 50;
  const gates = [
    {
      label: 'Fixes resolved',
      ready: unresolvedFindings.length === 0,
      detail: unresolvedFindings.length
        ? `${unresolvedFindings.length} selected finding${unresolvedFindings.length === 1 ? '' : 's'} still need fix, proof, check, or decision.`
        : 'No unresolved selected finding is blocking handoff.',
    },
    {
      label: 'Proof current',
      ready: missingEvidenceCount === 0 && !risks.some(risk => risk.currentState === 'NEEDS_PROOF'),
      detail: missingEvidenceCount
        ? `${missingEvidenceCount} proof gap${missingEvidenceCount === 1 ? '' : 's'} still need evidence.`
        : 'Required proof is not currently blocking handoff.',
    },
    {
      label: 'Ownership clear',
      ready:
        serviceCount > 0 &&
        participantCount > 0 &&
        unownedServices.length === 0 &&
        unownedFindings.length === 0,
      detail:
        serviceCount && participantCount && !unownedServices.length && !unownedFindings.length
          ? `${participantCount} person${participantCount === 1 ? '' : 's'} attached; service and finding owners are named.`
          : unownedServices.length || unownedFindings.length
            ? `${unownedServices.length} service lane${unownedServices.length === 1 ? '' : 's'} and ${unownedFindings.length} finding${unownedFindings.length === 1 ? '' : 's'} still need named owners.`
            : 'Attach people and assign named service owners before handoff.',
    },
    {
      label: 'Support scope ready',
      ready: supportCount === 0,
      detail: supportCount
        ? `${supportCount} support ask${supportCount === 1 ? '' : 's'} should be resolved or documented.`
        : 'No open support ask is blocking continuity.',
    },
    {
      label: 'Enough progress',
      ready: hasMeaningfulProgress,
      detail: hasMeaningfulProgress
        ? 'There is enough verified or reviewed progress to prepare continuity.'
        : 'Handoff should wait until fixes are verified, accepted, or meaningfully reviewed.',
    },
  ];
  const ready = gates.every(gate => gate.ready);
  return {
    ready,
    statusLabel: ready ? 'Handoff ready for owner review' : 'Handoff not ready yet',
    headline: ready
      ? 'Continuity is ready to review'
      : 'Fix and verify the selected findings first',
    detail: ready
      ? 'Runbook, support scope, access notes, proof gaps, and accepted risks can now be reviewed together.'
      : 'Handoff becomes useful after fixes, proof, ownership, and support scope are clear enough for another person to continue safely.',
    gates,
  };
}

function HandoffReadinessGate({
  onOpenFixAndVerify,
  onOpenPeople,
  readiness,
}: {
  onOpenFixAndVerify?: (() => void) | undefined;
  onOpenPeople?: (() => void) | undefined;
  readiness: HandoffReadiness;
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: readiness.ready ? '#b8e2c2' : '#f3d38b',
        borderRadius: 1,
        bgcolor: readiness.ready ? '#f3fbf5' : '#fffaf0',
        p: 1.35,
      }}
    >
      <Stack spacing={1.15}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ md: 'flex-start' }}
        >
          <Box>
            <PastelChip
              label={readiness.statusLabel}
              accent={readiness.ready ? appleColors.green : appleColors.amber}
              bg={readiness.ready ? '#e7f8ee' : '#fff4dc'}
            />
            <Typography variant="h3" sx={{ mt: 0.75 }}>
              {readiness.headline}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55, maxWidth: 820 }}>
              {readiness.detail}
            </Typography>
          </Box>
          {!readiness.ready && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75}>
              {onOpenFixAndVerify && (
                <Button variant="contained" onClick={onOpenFixAndVerify} sx={{ minHeight: 40 }}>
                  Fix and verify
                </Button>
              )}
              {onOpenPeople && (
                <Button variant="outlined" onClick={onOpenPeople} sx={{ minHeight: 40 }}>
                  Assign owners
                </Button>
              )}
            </Stack>
          )}
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(0, 1fr))' },
            gap: 0.75,
          }}
        >
          {readiness.gates.map(gate => (
            <Box
              key={gate.label}
              sx={{
                border: '1px solid',
                borderColor: gate.ready ? '#ccebd2' : '#f3d38b',
                borderRadius: 1,
                bgcolor: '#fff',
                p: 0.85,
                minHeight: 108,
              }}
            >
              <PastelChip
                label={gate.ready ? 'Ready' : 'Needs work'}
                accent={gate.ready ? appleColors.green : appleColors.amber}
                bg={gate.ready ? '#e7f8ee' : '#fff4dc'}
              />
              <Typography variant="subtitle2" sx={{ mt: 0.55, fontWeight: 950 }}>
                {gate.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.4 }}>
                {gate.detail}
              </Typography>
            </Box>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
