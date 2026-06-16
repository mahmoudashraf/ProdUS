'use client';

import BuildCircleOutlined from '@mui/icons-material/BuildCircleOutlined';
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';
import SwapHorizOutlined from '@mui/icons-material/SwapHorizOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { getJson } from './api';
import { PastelChip, Surface, appleColors } from './PlatformComponents';
import type {
  CheckFixProgressRun,
  CheckFixesResponse,
  AttachmentScope,
  PackageModule,
  ScannerRiskState,
  ScannerRiskSummary,
  ScannerRiskThread,
  ServiceModule,
  ToolRun,
  WorkspaceParticipant,
  WorkspaceCheckProgress,
} from './types';

interface IOwnerWorkspaceFixesRiskThreadPanelProps {
  workspaceId?: string | undefined;
  riskSummary?: ScannerRiskSummary | undefined;
  catalogModules?: ServiceModule[] | undefined;
  packageModules?: PackageModule[] | undefined;
  isLoading?: boolean;
  isChecking?: boolean | undefined;
  changingServiceRiskId?: string | null | undefined;
  assigningFindingOwnerId?: string | null | undefined;
  removingRiskId?: string | null | undefined;
  participantList?: WorkspaceParticipant[] | undefined;
  lastCheck?: CheckFixesResponse | undefined;
  evidencePanel?: ((scopeType: AttachmentScope, scopeId: string) => ReactNode) | undefined;
  onCheckFixes: (riskIds: string[], mode?: CheckFixesResponse['mode']) => void;
  onAssignFindingOwner?: ((riskThreadId: string, ownerUserId: string) => void) | undefined;
  onChangeRiskService?:
    | ((riskId: string, serviceModuleId: string, note?: string) => void)
    | undefined;
  onRemoveRisk?: ((riskId: string) => void) | undefined;
}

const activeStates: ScannerRiskState[] = [
  'NEW',
  'STILL_OPEN',
  'RETURNED',
  'READY_TO_CHECK',
  'NEEDS_PROOF',
  'INCOMPLETE_CHECK',
];

type ToolRunLabel = Pick<ToolRun, 'scanRunId' | 'status' | 'toolKey' | 'toolName'>;

type ServiceFindingSectionModel = {
  key: string;
  title: string;
  detail: string;
  ownerLabel: string;
  risks: ScannerRiskThread[];
  accent: string;
  includedCount: number;
  openCount: number;
  proofCount: number;
  readyCount: number;
  verifiedCount: number;
};

export default function OwnerWorkspaceFixesRiskThreadPanel({
  catalogModules = [],
  packageModules = [],
  workspaceId,
  riskSummary,
  isLoading,
  isChecking,
  changingServiceRiskId,
  assigningFindingOwnerId,
  removingRiskId,
  participantList = [],
  lastCheck,
  evidencePanel,
  onCheckFixes,
  onAssignFindingOwner,
  onChangeRiskService,
  onRemoveRisk,
}: IOwnerWorkspaceFixesRiskThreadPanelProps) {
  const [previewRiskIds, setPreviewRiskIds] = useState<string[] | null>(null);
  const checkProgress = useQuery({
    queryKey: ['workspace-check-progress', workspaceId],
    enabled: !!workspaceId,
    queryFn: () =>
      getJson<WorkspaceCheckProgress>(`/workspaces/${workspaceId}/scanner/check-progress`),
    refetchInterval: query => {
      const data = query.state.data as WorkspaceCheckProgress | undefined;
      return data?.activeCount ? 3500 : false;
    },
  });

  useEffect(() => {
    if (!workspaceId || !lastCheck?.queuedRuns.length) return;
    void checkProgress.refetch();
  }, [checkProgress.refetch, lastCheck?.queuedRuns.length, workspaceId]);

  const risks = useMemo(
    () => riskSummary?.groups.flatMap(group => group.risks) || [],
    [riskSummary?.groups]
  );
  const activeRisks = risks.filter(risk => activeStates.includes(risk.currentState));
  const readyRisks = risks.filter(risk => risk.currentState === 'READY_TO_CHECK');
  const fixedCount = risks.filter(risk => risk.currentState === 'FIXED_BY_LATEST_SCAN').length;
  const returnedCount = risks.filter(risk => risk.currentState === 'RETURNED').length;
  const decisionCount = risks.filter(risk =>
    ['ACCEPTED_RISK', 'FALSE_POSITIVE'].includes(risk.currentState)
  ).length;
  const readyCount = readyRisks.length;
  const canCheck = activeRisks.length > 0 && !isChecking;
  const checkTargetRisks = readyRisks.length ? readyRisks : activeRisks;
  const previewRisks = useMemo(() => {
    if (!previewRiskIds?.length) return [];
    const selected = new Set(previewRiskIds);
    return risks.filter(risk => selected.has(risk.id));
  }, [previewRiskIds, risks]);
  const topRisk = activeRisks[0] || risks[0];
  const serviceSections = useMemo(
    () => buildServiceFindingSections(risks, packageModules),
    [packageModules, risks]
  );
  const ownerOptions = useMemo(
    () =>
      participantList
        .filter(participant => participant.active)
        .map(participant => participant.user)
        .filter((user, index, users) => users.findIndex(item => item.id === user.id) === index),
    [participantList]
  );
  const nextStep = readyCount
    ? 'Check ready fixes'
    : activeRisks.length
      ? 'Fix with the assigned service or team, then check again'
      : risks.length
        ? 'Keep proof current'
        : 'Assign product scanner risks when they become workspace work';
  const openCheckPreview = (riskIds?: string[]) => {
    const targetIds = riskIds?.length ? riskIds : checkTargetRisks.map(risk => risk.id);
    setPreviewRiskIds(targetIds);
  };
  const closeCheckPreview = () => setPreviewRiskIds(null);

  return (
    <Surface
      sx={{ mb: 1.5, background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 55%, #fffaf0 100%)' }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.25}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
        >
          <Box>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <PastelChip label="Service-owned findings" accent={appleColors.blue} bg="#eaf3ff" />
              <PastelChip
                label={`${risks.length} assigned`}
                accent={risks.length ? appleColors.purple : appleColors.muted}
                bg={risks.length ? '#f3edff' : '#f8fafc'}
              />
              <PastelChip
                label={`${activeRisks.length} current work`}
                accent={activeRisks.length ? appleColors.amber : appleColors.green}
                bg={activeRisks.length ? '#fff4dc' : '#e7f8ee'}
              />
              {fixedCount > 0 && (
                <PastelChip label={`${fixedCount} fixed`} accent={appleColors.green} bg="#e7f8ee" />
              )}
              {returnedCount > 0 && (
                <PastelChip
                  label={`${returnedCount} returned`}
                  accent={appleColors.red}
                  bg="#ffe9e4"
                />
              )}
            </Stack>
            <Typography variant="h3" sx={{ mt: 0.85 }}>
              Service-owned findings and checks
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.45, maxWidth: 780, lineHeight: 1.6 }}>
              Product scan risks stay grouped under the service that owns the fix. Each finding
              shows source proof, owner gap, proof/check state, and the next verification action.
            </Typography>
          </Box>
          <Stack
            direction={{ xs: 'column', sm: 'row', md: 'column' }}
            spacing={1}
            sx={{ width: { xs: '100%', md: 240 }, flex: '0 0 auto' }}
          >
            <Button
              variant="contained"
              startIcon={<PlayArrowOutlined />}
              disabled={!canCheck}
              onClick={() => openCheckPreview()}
              sx={{ minHeight: 44 }}
            >
              {isChecking ? 'Checking...' : readyCount ? 'Review ready fixes' : 'Review check plan'}
            </Button>
          </Stack>
        </Stack>

        {previewRisks.length > 0 && (
          <VerificationPreview
            activeRisks={activeRisks}
            isChecking={isChecking}
            selectedRisks={previewRisks}
            onClose={closeCheckPreview}
            onRunFullSuite={() =>
              onCheckFixes(
                activeRisks.map(risk => risk.id),
                'FULL_SUITE'
              )
            }
            onRunTargeted={() =>
              onCheckFixes(
                previewRisks.map(risk => risk.id),
                'RELEVANT_TO_FIXES'
              )
            }
          />
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          <AnswerTile
            label="What matters"
            value={
              activeRisks.length
                ? `${activeRisks.length} current`
                : risks.length
                  ? 'No current fixes'
                  : 'Nothing assigned'
            }
            detail={
              topRisk
                ? topRisk.businessRisk || topRisk.description || topRisk.title
                : 'This workspace has no scanner risk assigned yet.'
            }
            accent={activeRisks.length ? appleColors.amber : appleColors.green}
          />
          <AnswerTile
            label="What changed"
            value={`${fixedCount} fixed`}
            detail={
              returnedCount
                ? `${returnedCount} returned after a check.`
                : decisionCount
                  ? `${decisionCount} accepted or false-positive decision${decisionCount === 1 ? '' : 's'} kept in history.`
                  : 'Latest assigned findings are grouped below.'
            }
            accent={
              fixedCount ? appleColors.green : returnedCount ? appleColors.red : appleColors.blue
            }
          />
          <AnswerTile
            label="What to do next"
            value={
              readyCount
                ? `${readyCount} ready`
                : activeRisks.length
                  ? 'Fix then check'
                  : 'Review proof'
            }
            detail={nextStep}
            accent={
              readyCount
                ? appleColors.blue
                : activeRisks.length
                  ? appleColors.amber
                  : appleColors.green
            }
          />
        </Box>

        <CheckProgressPanel
          isFetching={checkProgress.isFetching}
          lastCheck={lastCheck}
          progress={checkProgress.data}
        />

        {isLoading ? (
          <Typography color="text.secondary">Loading assigned findings...</Typography>
        ) : serviceSections.length ? (
          <Stack spacing={1.25}>
            {serviceSections.map(section => (
              <ServiceFindingSection
                key={section.key}
                accent={section.accent}
                detail={section.detail}
                includedCount={section.includedCount}
                openCount={section.openCount}
                ownerLabel={section.ownerLabel}
                proofCount={section.proofCount}
                readyCount={section.readyCount}
                risks={section.risks}
                verifiedCount={section.verifiedCount}
                catalogModules={catalogModules}
                assigningFindingOwnerId={assigningFindingOwnerId}
                changingServiceRiskId={changingServiceRiskId}
                evidencePanel={evidencePanel}
                removingRiskId={removingRiskId}
                ownerOptions={ownerOptions}
                packageModules={packageModules}
                title={section.title}
                onAssignFindingOwner={onAssignFindingOwner}
                onChangeRiskService={onChangeRiskService}
                onReviewCheck={openCheckPreview}
                onRemoveRisk={onRemoveRisk}
              />
            ))}
          </Stack>
        ) : (
          <Box
            sx={{
              border: '1px dashed',
              borderColor: '#c9d8ea',
              borderRadius: 1,
              p: 1.25,
              bgcolor: '#fff',
            }}
          >
            <Typography variant="subtitle1">No assigned findings yet.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, lineHeight: 1.55 }}>
              Add product scanner risks to this workspace when they become real work for services,
              people, proof, and Check fixes.
            </Typography>
          </Box>
        )}
      </Stack>
    </Surface>
  );
}

function buildServiceFindingSections(
  risks: ScannerRiskThread[],
  packageModules: PackageModule[]
): ServiceFindingSectionModel[] {
  const workspaceServiceIds = new Set(packageModules.map(module => module.serviceModule.id));
  const risksByServiceId = new Map<string, ScannerRiskThread[]>();
  const unassignedRisks: ScannerRiskThread[] = [];
  const outsideWorkspaceRisks: ScannerRiskThread[] = [];

  risks.forEach(risk => {
    const serviceId = risk.recommendedModule?.id;
    if (!serviceId) {
      unassignedRisks.push(risk);
      return;
    }
    if (!workspaceServiceIds.has(serviceId)) {
      outsideWorkspaceRisks.push(risk);
      return;
    }
    const current = risksByServiceId.get(serviceId) || [];
    current.push(risk);
    risksByServiceId.set(serviceId, current);
  });

  const sections = [...packageModules]
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .map((module, index) => {
      const serviceRisks = risksByServiceId.get(module.serviceModule.id) || [];
      return serviceSectionModel({
        key: module.serviceModule.id,
        title: module.serviceModule.name,
        detail:
          module.serviceModule.ownerOutcome ||
          module.rationale ||
          'This service owns the fixes grouped below.',
        ownerLabel: module.owner?.email || 'Needs named owner',
        risks: serviceRisks,
        accent: categoryPaletteAccent(index),
      });
    });

  if (unassignedRisks.length) {
    sections.push(
      serviceSectionModel({
        key: 'needs-service',
        title: 'Needs service choice',
        detail: 'These findings are in the workspace but do not have a service owner yet.',
        ownerLabel: 'Needs service',
        risks: unassignedRisks,
        accent: appleColors.amber,
      })
    );
  }

  if (outsideWorkspaceRisks.length) {
    sections.push(
      serviceSectionModel({
        key: 'outside-workspace-service',
        title: 'Outside current service scope',
        detail:
          'These findings point to a service that is not currently selected. Add the service or change ownership.',
        ownerLabel: 'Needs scope decision',
        risks: outsideWorkspaceRisks,
        accent: appleColors.red,
      })
    );
  }

  if (!sections.length && risks.length) {
    sections.push(
      serviceSectionModel({
        key: 'workspace-findings',
        title: 'Workspace findings',
        detail: 'Choose services so these risks become owned productionization work.',
        ownerLabel: 'Needs service',
        risks,
        accent: appleColors.amber,
      })
    );
  }

  return sections;
}

function serviceSectionModel({
  accent,
  detail,
  key,
  ownerLabel,
  risks,
  title,
}: {
  accent: string;
  detail: string;
  key: string;
  ownerLabel: string;
  risks: ScannerRiskThread[];
  title: string;
}): ServiceFindingSectionModel {
  const verifiedCount = risks.filter(risk => risk.currentState === 'FIXED_BY_LATEST_SCAN').length;
  const readyCount = risks.filter(risk => risk.currentState === 'READY_TO_CHECK').length;
  const proofCount = risks.filter(risk => risk.currentState === 'NEEDS_PROOF').length;
  const openCount = risks.filter(risk =>
    ['NEW', 'STILL_OPEN', 'RETURNED', 'INCOMPLETE_CHECK'].includes(risk.currentState)
  ).length;
  return {
    key,
    title,
    detail,
    ownerLabel,
    risks,
    accent,
    includedCount: risks.length,
    openCount,
    proofCount,
    readyCount,
    verifiedCount,
  };
}

function categoryPaletteAccent(index: number) {
  const accents = [
    appleColors.blue,
    appleColors.purple,
    appleColors.cyan,
    appleColors.green,
    appleColors.amber,
  ];
  return accents[index % accents.length] || appleColors.blue;
}

function CheckProgressPanel({
  isFetching,
  lastCheck,
  progress,
}: {
  isFetching: boolean;
  lastCheck?: CheckFixesResponse | undefined;
  progress?: WorkspaceCheckProgress | undefined;
}) {
  const runs = progress?.runs || [];
  const latestRun = runs[0];
  const hasQueuedFeedback = !!lastCheck;
  const shouldShow = hasQueuedFeedback || runs.length > 0;
  if (!shouldShow) return null;

  const activeRuns = runs.filter(run => run.status === 'QUEUED' || run.status === 'RUNNING');
  const headline = activeRuns.length
    ? 'Checking fixes now'
    : latestRun
      ? latestRun.status === 'COMPLETED'
        ? 'Latest check finished'
        : 'Latest check needs attention'
      : 'Check queued';
  const detail = activeRuns.length
    ? `${activeRuns.length} scanner run${activeRuns.length === 1 ? '' : 's'} active. ProdUS is comparing the new result against the previous proof.`
    : latestRun
      ? latestRun.status === 'COMPLETED'
        ? 'The latest scanner check completed. Updated finding state appears after scanner proof is normalized.'
        : latestRun.failureSummary || 'One or more scanner tools did not complete cleanly.'
      : 'ProdUS accepted the request. Progress appears here as soon as the scanner run is stored.';

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: activeRuns.length ? '#bfdbfe' : '#dbe7f5',
        borderRadius: 1,
        bgcolor: activeRuns.length ? '#f5f9ff' : '#fff',
        p: 1.15,
      }}
    >
      <Stack spacing={1}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
        >
          <Box>
            <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
              <PastelChip
                label="Check progress"
                accent={activeRuns.length ? appleColors.blue : appleColors.green}
                bg={activeRuns.length ? '#eaf3ff' : '#e7f8ee'}
              />
              {progress && (
                <PastelChip
                  label={`${progress.activeCount} active`}
                  accent={progress.activeCount ? appleColors.blue : appleColors.muted}
                  bg={progress.activeCount ? '#eaf3ff' : '#f8fafc'}
                />
              )}
              {isFetching && (
                <PastelChip label="Updating" accent={appleColors.purple} bg="#f3edff" />
              )}
            </Stack>
            <Typography variant="h4" sx={{ mt: 0.55 }}>
              {headline}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
              {detail}
            </Typography>
          </Box>
          {latestRun && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: `${statusAccent(latestRun.status)}33`,
                borderRadius: 1,
                bgcolor: `${statusAccent(latestRun.status)}0d`,
                p: 0.85,
                minWidth: { xs: '100%', md: 220 },
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                Latest scanner run
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 0.2 }}>
                {formatDepth(latestRun.depth)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatRunStatus(latestRun.status)} · {formatMode(latestRun.mode)}
              </Typography>
            </Box>
          )}
        </Stack>

        {lastCheck && (
          <Alert severity={lastCheck.skippedTargets.length ? 'warning' : 'success'}>
            {lastCheck.preview.summary}{' '}
            {lastCheck.preview.tools.length ? `Tools: ${lastCheck.preview.tools.join(', ')}.` : ''}
            {lastCheck.skippedTargets.length
              ? ` ${lastCheck.skippedTargets.length} target${lastCheck.skippedTargets.length === 1 ? '' : 's'} need attention before they can run.`
              : ''}
          </Alert>
        )}

        {lastCheck?.skippedTargets.length ? (
          <Stack spacing={0.65}>
            {lastCheck.skippedTargets.map(target => (
              <Box
                key={`${target.depth}-${target.toolKeys.join('-')}-${target.reason}`}
                sx={{
                  border: '1px solid',
                  borderColor: '#fde68a',
                  borderRadius: 1,
                  bgcolor: '#fffbeb',
                  p: 0.85,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 850 }}>
                  {formatDepth(target.depth)} cannot run yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {target.reason}
                </Typography>
              </Box>
            ))}
          </Stack>
        ) : null}

        {runs.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
              gap: 0.85,
            }}
          >
            {runs.slice(0, 4).map(run => (
              <CheckProgressRunCard key={run.runId} run={run} />
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  );
}

function CheckProgressRunCard({ run }: { run: CheckFixProgressRun }) {
  const accent = statusAccent(run.status);
  const finishedTools = run.completedTools + run.failedTools + run.canceledTools + run.skippedTools;
  const selectedCount = run.riskThreadIds.length || run.findingIds.length;
  const shownTools: ToolRunLabel[] = run.toolRuns.length
    ? run.toolRuns
    : toolRunsFromKeys(run.toolKeys, run.runId);

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: `${accent}30`,
        borderRadius: 1,
        bgcolor: '#fff',
        p: 1,
      }}
    >
      <Stack spacing={0.8}>
        <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ lineHeight: 1.25 }}>
              {formatDepth(run.depth)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
              {formatMode(run.mode)} · {selectedCount} selected finding
              {selectedCount === 1 ? '' : 's'}
            </Typography>
          </Box>
          <PastelChip label={formatRunStatus(run.status)} accent={accent} bg={`${accent}12`} />
        </Stack>
        <Box
          sx={{
            height: 8,
            borderRadius: 999,
            bgcolor: '#eef2f7',
            overflow: 'hidden',
          }}
          aria-label={`${finishedTools} of ${run.totalTools} scanner tools finished`}
        >
          <Box
            sx={{
              width: `${run.totalTools ? Math.min(100, Math.round((finishedTools / run.totalTools) * 100)) : 0}%`,
              height: '100%',
              bgcolor: accent,
              transition: 'width 180ms ease',
            }}
          />
        </Box>
        <Stack direction="row" spacing={0.55} flexWrap="wrap" useFlexGap>
          <PastelChip
            label={`${finishedTools}/${run.totalTools || run.toolRuns.length} tools finished`}
            accent={accent}
            bg={`${accent}12`}
          />
          {run.comparisonBaseRunId && (
            <PastelChip
              label={`Compared to ${compactId(run.comparisonBaseRunId)}`}
              accent={appleColors.muted}
              bg="#f8fafc"
            />
          )}
          {run.failedTools > 0 && (
            <PastelChip label={`${run.failedTools} failed`} accent={appleColors.red} bg="#ffe9e4" />
          )}
        </Stack>
        <Stack direction="row" spacing={0.45} flexWrap="wrap" useFlexGap>
          {shownTools.map(tool => (
            <PastelChip
              key={`${tool.scanRunId || run.runId}-${tool.toolKey || tool.toolName}`}
              label={`${tool.toolName || tool.toolKey || 'Scanner'} · ${formatToolStatus(tool.status)}`}
              accent={toolStatusAccent(tool.status)}
              bg={`${toolStatusAccent(tool.status)}12`}
            />
          ))}
        </Stack>
        {(run.failureSummary || run.limitations.length > 0) && (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {run.failureSummary || run.limitations.join(' ')}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

function VerificationPreview({
  activeRisks,
  isChecking,
  onClose,
  onRunFullSuite,
  onRunTargeted,
  selectedRisks,
}: {
  activeRisks: ScannerRiskThread[];
  isChecking?: boolean | undefined;
  onClose: () => void;
  onRunFullSuite: () => void;
  onRunTargeted: () => void;
  selectedRisks: ScannerRiskThread[];
}) {
  const toolLabels = uniqueValues(selectedRisks.map(risk => risk.sourceTool || 'Proof needed'));
  const targetsNeedingProof = selectedRisks.filter(
    risk => !risk.sourceTool && !risk.currentFindingId
  );
  const scannerBackedRisks = selectedRisks.filter(
    risk => risk.sourceTool || risk.currentFindingId || risk.lastSeenScanRunId
  );
  const baselineCount = uniqueValues(
    selectedRisks
      .map(risk => risk.lastSeenScanRunId || risk.firstSeenScanRunId)
      .filter(Boolean) as string[]
  ).length;
  const baselineLabels = uniqueValues(
    selectedRisks
      .map(risk => risk.lastSeenScanRunId || risk.firstSeenScanRunId)
      .filter(Boolean) as string[]
  )
    .slice(0, 3)
    .map(compactId);
  const affectedAreas = uniqueValues(
    selectedRisks
      .map(risk => risk.affectedComponent || risk.sourceRuleId || risk.readinessArea)
      .filter(Boolean) as string[]
  ).slice(0, 4);
  const serviceLabels = uniqueValues(
    selectedRisks
      .map(risk => risk.recommendedModule?.name || risk.scannerSuggestedModule?.name)
      .filter(Boolean) as string[]
  ).slice(0, 4);
  const canRunTargeted = scannerBackedRisks.length > 0 && !isChecking;
  const canRunFullSuite = activeRisks.length > 0 && !isChecking;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: '#cfe0f4',
        borderRadius: 1,
        bgcolor: '#fff',
        p: 1.25,
      }}
    >
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1.25}
        alignItems={{ lg: 'flex-start' }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1">Review before checking</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
            ProdUS will verify {selectedRisks.length} selected finding
            {selectedRisks.length === 1 ? '' : 's'} using the smallest scanner set it can infer from
            the original source. Use the full suite only when you want a wider product check.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 0.75,
              mt: 1,
            }}
          >
            <FactLine
              label="Selected findings"
              value={`${selectedRisks.length} selected · ${scannerBackedRisks.length} scanner-backed`}
            />
            <FactLine
              label="Baseline"
              value={
                baselineLabels.length
                  ? baselineLabels.join(', ')
                  : 'No comparable scan baseline yet'
              }
            />
            <FactLine
              label="Scope"
              value={affectedAreas.length ? affectedAreas.join(' · ') : 'Workspace selected fixes'}
            />
            <FactLine
              label="Services"
              value={serviceLabels.length ? serviceLabels.join(' · ') : 'No service linked yet'}
            />
            <FactLine
              label="Proof limits"
              value={
                targetsNeedingProof.length
                  ? `${targetsNeedingProof.length} finding${targetsNeedingProof.length === 1 ? '' : 's'} need proof or a scanner source`
                  : 'No proof-only blocker in this check'
              }
            />
            <FactLine
              label="Full suite"
              value={`${activeRisks.length} current workspace finding${activeRisks.length === 1 ? '' : 's'}`}
            />
          </Box>
        </Box>
        <Stack spacing={0.85} sx={{ minWidth: { xs: 0, lg: 260 }, flex: '0 0 auto' }}>
          <Stack direction="row" spacing={0.65} flexWrap="wrap" useFlexGap>
            {(toolLabels.length ? toolLabels : ['No scanner source yet']).slice(0, 4).map(tool => (
              <PastelChip key={tool} label={tool} accent={appleColors.blue} bg="#eaf3ff" />
            ))}
            {baselineCount > 0 && (
              <PastelChip
                label={`${baselineCount} baseline${baselineCount === 1 ? '' : 's'}`}
                accent={appleColors.purple}
                bg="#f3edff"
              />
            )}
            {targetsNeedingProof.length > 0 && (
              <PastelChip
                label={`${targetsNeedingProof.length} need proof`}
                accent={appleColors.amber}
                bg="#fff4dc"
              />
            )}
            {isChecking && <PastelChip label="Queued" accent={appleColors.green} bg="#e7f8ee" />}
          </Stack>
          <Button
            variant="contained"
            startIcon={<PlayArrowOutlined />}
            disabled={!canRunTargeted}
            onClick={onRunTargeted}
            sx={{ minHeight: 42 }}
          >
            {isChecking ? 'Checking...' : 'Check fixes'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FactCheckOutlined />}
            disabled={!canRunFullSuite}
            onClick={onRunFullSuite}
            sx={{ minHeight: 40 }}
          >
            Run full scanner suite instead
          </Button>
          <Button variant="text" onClick={onClose} sx={{ minHeight: 34 }}>
            Close preview
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

function ServiceFindingSection({
  accent,
  detail,
  includedCount,
  openCount,
  ownerLabel,
  proofCount,
  readyCount,
  risks,
  verifiedCount,
  catalogModules,
  changingServiceRiskId,
  assigningFindingOwnerId,
  evidencePanel,
  removingRiskId,
  ownerOptions,
  packageModules,
  title,
  onAssignFindingOwner,
  onChangeRiskService,
  onReviewCheck,
  onRemoveRisk,
}: {
  accent: string;
  detail: string;
  includedCount: number;
  openCount: number;
  ownerLabel: string;
  proofCount: number;
  readyCount: number;
  risks: ScannerRiskThread[];
  verifiedCount: number;
  catalogModules: ServiceModule[];
  assigningFindingOwnerId?: string | null | undefined;
  changingServiceRiskId?: string | null | undefined;
  evidencePanel?: ((scopeType: AttachmentScope, scopeId: string) => ReactNode) | undefined;
  removingRiskId?: string | null | undefined;
  ownerOptions: Array<{ id: string; email: string }>;
  packageModules: PackageModule[];
  title: string;
  onAssignFindingOwner?: ((riskThreadId: string, ownerUserId: string) => void) | undefined;
  onChangeRiskService?:
    | ((riskId: string, serviceModuleId: string, note?: string) => void)
    | undefined;
  onReviewCheck: (riskIds?: string[]) => void;
  onRemoveRisk?: ((riskId: string) => void) | undefined;
}) {
  const actionableRiskIds = risks
    .filter(risk => activeStates.includes(risk.currentState))
    .map(risk => risk.id);
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: `${accent}2b`,
        borderRadius: 1,
        bgcolor: '#fff',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        sx={{
          p: 1.15,
          bgcolor: `${accent}08`,
          borderBottom: '1px solid',
          borderColor: `${accent}1f`,
        }}
      >
        <Box>
          <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap sx={{ mb: 0.55 }}>
            <PastelChip label="Service group" accent={accent} bg={`${accent}12`} />
            <PastelChip
              label={ownerLabel}
              accent={ownerLabel.includes('Needs') ? appleColors.amber : appleColors.green}
              bg={ownerLabel.includes('Needs') ? '#fff4dc' : '#e7f8ee'}
            />
          </Stack>
          <Typography variant="h4" sx={{ color: accent }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, lineHeight: 1.5 }}>
            {detail}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: 'row', sm: 'column' }}
          spacing={0.55}
          alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
          flexWrap="wrap"
          useFlexGap
        >
          <PastelChip label={`${includedCount} included`} accent={accent} bg={`${accent}12`} />
          <PastelChip label={`${verifiedCount} verified`} accent={appleColors.green} bg="#e7f8ee" />
          <PastelChip label={`${readyCount} ready`} accent={appleColors.blue} bg="#eaf3ff" />
          <PastelChip
            label={`${openCount + proofCount} need work/proof`}
            accent={openCount + proofCount ? appleColors.amber : appleColors.green}
            bg={openCount + proofCount ? '#fff4dc' : '#e7f8ee'}
          />
          {actionableRiskIds.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlayArrowOutlined />}
              onClick={() => onReviewCheck(actionableRiskIds)}
              sx={{ minHeight: 34 }}
            >
              Review service checks
            </Button>
          )}
        </Stack>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
          gap: 1,
          maxHeight: { xs: 'none', xl: 620 },
          overflowY: { xs: 'visible', xl: 'auto' },
          p: 1,
        }}
      >
        {risks.length ? (
          risks.map(risk => (
            <RiskThreadCard
              key={risk.id}
              risk={risk}
              catalogModules={catalogModules}
              isChangingService={changingServiceRiskId === risk.id}
              isAssigningOwner={assigningFindingOwnerId === risk.id}
              isRemoving={removingRiskId === risk.id}
              evidencePanel={evidencePanel}
              ownerOptions={ownerOptions}
              packageModules={packageModules}
              onAssignFindingOwner={onAssignFindingOwner}
              onChangeRiskService={onChangeRiskService}
              onReviewCheck={onReviewCheck}
              onRemoveRisk={onRemoveRisk}
            />
          ))
        ) : (
          <Box
            sx={{
              border: '1px dashed',
              borderColor: '#c9d8ea',
              borderRadius: 1,
              bgcolor: '#fff',
              p: 1.15,
            }}
          >
            <Typography variant="subtitle1">No findings included for this service yet.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.5 }}>
              Add or re-add findings through Work scope when scanner risks should become work for
              this service.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function AnswerTile({
  accent,
  detail,
  label,
  value,
}: {
  accent: string;
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: `${accent}26`,
        borderRadius: 1,
        bgcolor: `${accent}08`,
        p: 1,
        minHeight: 116,
      }}
    >
      <Typography variant="caption" sx={{ color: accent, fontWeight: 900, letterSpacing: 0 }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.35, fontWeight: 950 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.5 }}>
        {detail}
      </Typography>
    </Box>
  );
}

function RiskThreadCard({
  catalogModules,
  evidencePanel,
  isAssigningOwner,
  isChangingService,
  risk,
  isRemoving,
  ownerOptions,
  packageModules,
  onAssignFindingOwner,
  onChangeRiskService,
  onReviewCheck,
  onRemoveRisk,
}: {
  catalogModules: ServiceModule[];
  evidencePanel?: ((scopeType: AttachmentScope, scopeId: string) => ReactNode) | undefined;
  isAssigningOwner?: boolean | undefined;
  isChangingService?: boolean | undefined;
  risk: ScannerRiskThread;
  isRemoving?: boolean | undefined;
  ownerOptions: Array<{ id: string; email: string }>;
  packageModules: PackageModule[];
  onAssignFindingOwner?: ((riskThreadId: string, ownerUserId: string) => void) | undefined;
  onChangeRiskService?:
    | ((riskId: string, serviceModuleId: string, note?: string) => void)
    | undefined;
  onReviewCheck: (riskIds?: string[]) => void;
  onRemoveRisk?: ((riskId: string) => void) | undefined;
}) {
  const [serviceEditorOpen, setServiceEditorOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(risk.recommendedModule?.id || '');
  const [serviceNote, setServiceNote] = useState('');
  const accent =
    risk.currentState === 'FIXED_BY_LATEST_SCAN'
      ? appleColors.green
      : risk.currentState === 'RETURNED'
        ? appleColors.red
        : risk.currentState === 'READY_TO_CHECK'
          ? appleColors.blue
          : appleColors.amber;
  const Icon =
    risk.currentState === 'FIXED_BY_LATEST_SCAN'
      ? CheckCircleOutlineOutlined
      : risk.currentState === 'RETURNED'
        ? WarningAmberOutlined
        : BuildCircleOutlined;
  const canCheckSingle = activeStates.includes(risk.currentState);
  const serviceOptions = useMemo(
    () =>
      serviceMappingOptions(risk, packageModules, catalogModules).filter(
        option => option.workspaceAssigned
      ),
    [catalogModules, packageModules, risk]
  );
  const scannerSuggestedDifferent =
    risk.scannerSuggestedModule?.id &&
    risk.recommendedModule?.id &&
    risk.scannerSuggestedModule.id !== risk.recommendedModule.id;
  const canChangeService = !!onChangeRiskService && !!selectedServiceId && !isChangingService;
  const servicePackageModule = packageModules.find(
    module => module.serviceModule.id === risk.recommendedModule?.id
  );
  const inheritedOwner = risk.owner || servicePackageModule?.owner;
  const ownerValue = risk.owner?.email
    ? risk.owner.email
    : servicePackageModule?.owner?.email
      ? `${servicePackageModule.owner.email} (service owner)`
      : risk.recommendedModule?.name
        ? 'Needs named owner'
        : 'Choose a service before assigning owner';

  return (
    <Box
      sx={{
        p: 1.2,
        border: '1px solid',
        borderColor: `${accent}2e`,
        borderRadius: 1,
        bgcolor: '#fff',
        minHeight: 286,
      }}
    >
      <Stack spacing={1} sx={{ height: '100%' }}>
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1,
              bgcolor: `${accent}12`,
              color: accent,
              display: 'grid',
              placeItems: 'center',
              flex: '0 0 auto',
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Stack direction="row" spacing={0.6} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
            <PastelChip
              label={labelForState(risk.currentState)}
              accent={accent}
              bg={`${accent}12`}
            />
            <PastelChip
              label={risk.severity}
              accent={severityAccent(risk.severity)}
              bg={`${severityAccent(risk.severity)}12`}
            />
          </Stack>
        </Stack>
        <Box>
          <Typography variant="subtitle1" sx={{ lineHeight: 1.3 }}>
            {risk.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.5 }}>
            {risk.businessRisk || risk.description}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 0.75,
          }}
        >
          <FactLine label="Source proof" value={sourceLine(risk)} />
          <FactLine
            label="Service"
            value={
              risk.recommendedModule?.name
                ? `${risk.recommendedModule.name}${risk.serviceMappingChangedByEmail ? ` · chosen by ${risk.serviceMappingChangedByEmail}` : ''}`
                : 'No service linked yet'
            }
          />
          <FactLine label="Owner" value={ownerValue} />
          {scannerSuggestedDifferent && (
            <FactLine label="Scanner suggested" value={risk.scannerSuggestedModule?.name || ''} />
          )}
          {risk.serviceMappingNote && (
            <FactLine label="Mapping note" value={risk.serviceMappingNote} />
          )}
          <FactLine
            label="Proof needed"
            value={risk.evidenceRequired || proofNeedForState(risk.currentState)}
          />
          <FactLine
            label="Latest baseline"
            value={risk.lastSeenScanRunId ? compactId(risk.lastSeenScanRunId) : 'No baseline yet'}
          />
        </Box>
        {onAssignFindingOwner && (
          <TextField
            select
            fullWidth
            size="small"
            label="Finding owner"
            value={inheritedOwner?.id || ''}
            disabled={!ownerOptions.length || !!isAssigningOwner}
            onChange={event => onAssignFindingOwner(risk.id, event.target.value)}
            helperText={
              risk.owner
                ? 'This finding has an explicit owner.'
                : servicePackageModule?.owner
                  ? 'Inherited from the service owner until changed here.'
                  : 'Choose who owns this fix.'
            }
          >
            <MenuItem value="" disabled>
              Needs named owner
            </MenuItem>
            {ownerOptions.map(owner => (
              <MenuItem key={owner.id} value={owner.id}>
                {owner.email}
              </MenuItem>
            ))}
          </TextField>
        )}
        <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
          {risk.sourceTool && (
            <PastelChip label={risk.sourceTool} accent={appleColors.cyan} bg="#e4f9fd" />
          )}
          {risk.recommendedModule?.name && (
            <PastelChip
              label={risk.recommendedModule.name}
              accent={appleColors.purple}
              bg="#f0e9ff"
            />
          )}
          {scannerSuggestedDifferent && (
            <PastelChip
              label={`Scanner suggested ${risk.scannerSuggestedModule?.name}`}
              accent={appleColors.amber}
              bg="#fff4dc"
            />
          )}
          {risk.affectedComponent && (
            <PastelChip label={risk.affectedComponent} accent={appleColors.muted} bg="#f4f7fb" />
          )}
          {risk.sourceRuleId && (
            <PastelChip label={risk.sourceRuleId} accent={appleColors.blue} bg="#eaf3ff" />
          )}
          {risk.currentFindingId && (
            <PastelChip
              label={`Finding ${compactId(risk.currentFindingId)}`}
              accent={appleColors.muted}
              bg="#f8fafc"
            />
          )}
        </Stack>
        {evidencePanel && (
          <Box
            sx={{
              border: '1px solid',
              borderColor: '#dbe7f5',
              borderRadius: 1,
              bgcolor: '#fbfdff',
              p: 1,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 900, color: appleColors.ink }}>
              Finding proof
            </Typography>
            {evidencePanel('FINDING', risk.id)}
          </Box>
        )}
        {serviceEditorOpen && (
          <Box
            sx={{
              border: '1px solid',
              borderColor: '#dbe7f5',
              borderRadius: 1,
              bgcolor: '#f8fbff',
              p: 1,
            }}
          >
            <Stack spacing={0.85}>
              <Typography variant="subtitle2">
                Choose the service that should own this fix
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                label="Service"
                value={selectedServiceId}
                onChange={event => setSelectedServiceId(event.target.value)}
                helperText="Only services already in this workspace can own workspace findings. Add the service first when the right one is missing."
              >
                {serviceOptions.map(option => (
                  <MenuItem key={option.service.id} value={option.service.id}>
                    {option.service.name}
                    {option.workspaceAssigned ? ' · in workspace' : ' · catalog'}
                    {option.scannerSuggested ? ' · scanner suggested' : ''}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                multiline
                minRows={2}
                size="small"
                label="Why this service?"
                value={serviceNote}
                onChange={event => setServiceNote(event.target.value)}
                placeholder="Optional: explain why this fix belongs to the selected service."
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75}>
                <Button
                  variant="contained"
                  size="small"
                  disabled={!canChangeService}
                  onClick={() => {
                    if (!selectedServiceId || !onChangeRiskService) return;
                    onChangeRiskService(risk.id, selectedServiceId, serviceNote.trim());
                    setServiceEditorOpen(false);
                  }}
                  sx={{ minHeight: 36 }}
                >
                  {isChangingService ? 'Saving...' : 'Save service'}
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setSelectedServiceId(risk.recommendedModule?.id || '');
                    setServiceNote('');
                    setServiceEditorOpen(false);
                  }}
                  sx={{ minHeight: 36 }}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} sx={{ mt: 'auto' }}>
          {onChangeRiskService && !serviceEditorOpen && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<SwapHorizOutlined />}
              disabled={!serviceOptions.length || !!isChangingService}
              onClick={() => {
                const recommendedServiceInWorkspace = serviceOptions.some(
                  option => option.service.id === risk.recommendedModule?.id
                );
                setSelectedServiceId(
                  recommendedServiceInWorkspace
                    ? risk.recommendedModule?.id || ''
                    : serviceOptions[0]?.service.id || ''
                );
                setServiceEditorOpen(open => !open);
              }}
              sx={{ minHeight: 36 }}
            >
              Change service
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlayArrowOutlined />}
            disabled={!canCheckSingle}
            onClick={() => onReviewCheck([risk.id])}
            sx={{ minHeight: 36 }}
          >
            Check fixes
          </Button>
          {onRemoveRisk && (
            <Button
              color="error"
              variant="text"
              size="small"
              startIcon={<DeleteOutline />}
              disabled={!!isRemoving}
              onClick={() => onRemoveRisk(risk.id)}
              sx={{ minHeight: 36 }}
            >
              {isRemoving ? 'Removing...' : 'Remove from workspace'}
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

function FactLine({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: '#e2e8f0',
        borderRadius: 1,
        bgcolor: '#f8fafc',
        p: 0.85,
        minWidth: 0,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, lineHeight: 1.4, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  );
}

function labelForState(state: ScannerRiskState) {
  return state
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function severityAccent(severity: ScannerRiskThread['severity']) {
  if (severity === 'CRITICAL' || severity === 'HIGH') return appleColors.red;
  if (severity === 'MEDIUM') return appleColors.amber;
  if (severity === 'LOW') return appleColors.blue;
  return appleColors.muted;
}

function sourceLine(risk: ScannerRiskThread) {
  const parts = [
    risk.sourceTool || 'No scanner source',
    risk.sourceRuleId,
    risk.affectedComponent,
  ].filter(Boolean);
  return parts.join(' · ');
}

function proofNeedForState(state: ScannerRiskState) {
  if (state === 'READY_TO_CHECK') return 'Run Check fixes against the selected source.';
  if (state === 'FIXED_BY_LATEST_SCAN') return 'Keep the clean scan result attached.';
  if (state === 'ACCEPTED_RISK') return 'Keep owner reason and review date visible.';
  if (state === 'FALSE_POSITIVE') return 'Keep the false-positive note visible.';
  if (state === 'NEEDS_PROOF') return 'Attach proof or choose the right scanner check.';
  return 'Fix, attach proof, then check again.';
}

function compactId(value: string) {
  return value.length > 8 ? value.slice(0, 8) : value;
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function formatDepth(
  depth: CheckFixProgressRun['depth'] | CheckFixesResponse['skippedTargets'][number]['depth']
) {
  const labels: Record<CheckFixProgressRun['depth'], string> = {
    CI_EVIDENCE: 'Uploaded proof',
    SAFE_STATIC: 'Code and repo scan',
    DEPENDENCY_CONTAINER: 'Dependencies and container',
    RUNTIME_BASELINE: 'Live app scan',
    DEEP_REVIEW: 'Deep review',
  };
  return labels[depth] || depth;
}

function formatMode(mode: CheckFixesResponse['mode']) {
  return mode === 'FULL_SUITE' ? 'Full scanner suite' : 'Targeted check';
}

function formatRunStatus(status: CheckFixProgressRun['status']) {
  if (status === 'QUEUED') return 'Waiting';
  if (status === 'RUNNING') return 'Running';
  if (status === 'COMPLETED') return 'Finished';
  if (status === 'FAILED') return 'Needs attention';
  return 'Canceled';
}

function statusAccent(status: CheckFixProgressRun['status']) {
  if (status === 'COMPLETED') return appleColors.green;
  if (status === 'FAILED' || status === 'CANCELED') return appleColors.red;
  if (status === 'RUNNING') return appleColors.blue;
  return appleColors.amber;
}

function formatToolStatus(status: ToolRun['status']) {
  if (status === 'QUEUED') return 'waiting';
  if (status === 'RUNNING') return 'running';
  if (status === 'COMPLETED') return 'done';
  if (status === 'FAILED') return 'failed';
  if (status === 'SKIPPED') return 'skipped';
  return 'canceled';
}

function toolStatusAccent(status: ToolRun['status']) {
  if (status === 'COMPLETED') return appleColors.green;
  if (status === 'FAILED' || status === 'CANCELED') return appleColors.red;
  if (status === 'RUNNING') return appleColors.blue;
  if (status === 'SKIPPED') return appleColors.muted;
  return appleColors.amber;
}

function toolRunsFromKeys(toolKeys: string[], runId: string): ToolRunLabel[] {
  return toolKeys.map(toolKey => ({
    scanRunId: runId,
    status: 'QUEUED',
    toolKey,
    toolName: toolKey,
  }));
}

function serviceMappingOptions(
  risk: ScannerRiskThread,
  packageModules: PackageModule[],
  catalogModules: ServiceModule[]
) {
  const workspaceServiceIds = new Set(
    packageModules.map(module => module.serviceModule?.id).filter(Boolean) as string[]
  );
  const options = new Map<
    string,
    { service: ServiceModule; workspaceAssigned: boolean; scannerSuggested: boolean }
  >();

  const add = (
    service: ServiceModule | undefined,
    workspaceAssigned = false,
    scannerSuggested = false
  ) => {
    if (!service?.id) return;
    const existing = options.get(service.id);
    options.set(service.id, {
      service,
      workspaceAssigned: Boolean(
        existing?.workspaceAssigned || workspaceAssigned || workspaceServiceIds.has(service.id)
      ),
      scannerSuggested: Boolean(existing?.scannerSuggested || scannerSuggested),
    });
  };

  packageModules.forEach(module => add(module.serviceModule, true, false));
  add(risk.recommendedModule, workspaceServiceIds.has(risk.recommendedModule?.id || ''), false);
  add(
    risk.scannerSuggestedModule,
    workspaceServiceIds.has(risk.scannerSuggestedModule?.id || ''),
    true
  );
  catalogModules.forEach(module => add(module, false, false));

  return [...options.values()].sort((a, b) => {
    if (a.workspaceAssigned !== b.workspaceAssigned) return a.workspaceAssigned ? -1 : 1;
    if (a.scannerSuggested !== b.scannerSuggested) return a.scannerSuggested ? -1 : 1;
    return a.service.name.localeCompare(b.service.name);
  });
}
