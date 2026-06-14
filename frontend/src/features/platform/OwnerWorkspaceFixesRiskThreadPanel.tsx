'use client';

import BuildCircleOutlined from '@mui/icons-material/BuildCircleOutlined';
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import { PastelChip, Surface, appleColors } from './PlatformComponents';
import type {
  CheckFixesResponse,
  ScannerRiskState,
  ScannerRiskSummary,
  ScannerRiskThread,
} from './types';

interface IOwnerWorkspaceFixesRiskThreadPanelProps {
  riskSummary?: ScannerRiskSummary | undefined;
  isLoading?: boolean;
  isChecking?: boolean | undefined;
  removingRiskId?: string | null | undefined;
  lastCheck?: CheckFixesResponse | undefined;
  onCheckFixes: (riskIds: string[], mode?: CheckFixesResponse['mode']) => void;
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

export default function OwnerWorkspaceFixesRiskThreadPanel({
  riskSummary,
  isLoading,
  isChecking,
  removingRiskId,
  lastCheck,
  onCheckFixes,
  onRemoveRisk,
}: IOwnerWorkspaceFixesRiskThreadPanelProps) {
  const risks = riskSummary?.groups.flatMap(group => group.risks) || [];
  const activeRisks = risks.filter(risk => activeStates.includes(risk.currentState));
  const readyRisks = risks.filter(risk => risk.currentState === 'READY_TO_CHECK');
  const openRisks = risks.filter(risk =>
    ['NEW', 'STILL_OPEN', 'RETURNED', 'INCOMPLETE_CHECK'].includes(risk.currentState)
  );
  const proofRisks = risks.filter(risk => risk.currentState === 'NEEDS_PROOF');
  const fixedCount = risks.filter(risk => risk.currentState === 'FIXED_BY_LATEST_SCAN').length;
  const returnedCount = risks.filter(risk => risk.currentState === 'RETURNED').length;
  const decisionCount = risks.filter(risk =>
    ['ACCEPTED_RISK', 'FALSE_POSITIVE'].includes(risk.currentState)
  ).length;
  const readyCount = readyRisks.length;
  const canCheck = activeRisks.length > 0 && !isChecking;
  const checkTargetRisks = readyRisks.length ? readyRisks : activeRisks;
  const topRisk = activeRisks[0] || risks[0];
  const groupedSections = [
    {
      key: 'ready',
      title: 'Ready to check',
      detail: 'Work or proof is ready; verify it with the smallest relevant scanner set.',
      risks: readyRisks,
      accent: appleColors.blue,
    },
    {
      key: 'open',
      title: 'Still needs work',
      detail: 'Assigned risks that still need a service, fix, owner decision, or proof.',
      risks: openRisks,
      accent: openRisks.length ? appleColors.amber : appleColors.green,
    },
    {
      key: 'proof',
      title: 'Needs proof',
      detail:
        'These cannot be trusted as fixed until someone attaches evidence or chooses the right check.',
      risks: proofRisks,
      accent: proofRisks.length ? appleColors.purple : appleColors.green,
    },
    {
      key: 'fixed',
      title: 'Verified or decided',
      detail:
        'Fixed, accepted, or false-positive items stay visible without crowding current work.',
      risks: risks.filter(risk =>
        ['FIXED_BY_LATEST_SCAN', 'ACCEPTED_RISK', 'FALSE_POSITIVE'].includes(risk.currentState)
      ),
      accent: appleColors.green,
    },
  ].filter(section => section.risks.length > 0);
  const nextStep = readyCount
    ? 'Check ready fixes'
    : activeRisks.length
      ? 'Fix with the assigned service or team, then check again'
      : risks.length
        ? 'Keep proof current'
        : 'Assign product scanner risks when they become workspace work';

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
              <PastelChip label="Assigned findings" accent={appleColors.blue} bg="#eaf3ff" />
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
              Findings assigned to this workspace
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.45, maxWidth: 780, lineHeight: 1.6 }}>
              These are product scan risks that became workspace work. This view should answer what
              matters, what changed, what service/proof is connected, and what to check next.
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
              onClick={() =>
                onCheckFixes(
                  checkTargetRisks.map(risk => risk.id),
                  'RELEVANT_TO_FIXES'
                )
              }
              sx={{ minHeight: 44 }}
            >
              {isChecking ? 'Checking...' : readyCount ? 'Check ready fixes' : 'Check if fixed'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FactCheckOutlined />}
              disabled={!canCheck}
              onClick={() =>
                onCheckFixes(
                  activeRisks.map(risk => risk.id),
                  'FULL_SUITE'
                )
              }
              sx={{ minHeight: 42 }}
            >
              Run full suite
            </Button>
          </Stack>
        </Stack>

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

        {risks.length > 0 && (
          <VerificationPreview
            activeRisks={activeRisks}
            checkTargetRisks={checkTargetRisks}
            isChecking={isChecking}
          />
        )}

        {lastCheck && (
          <Alert severity={lastCheck.queuedRuns.length ? 'success' : 'warning'}>
            {lastCheck.preview.summary}{' '}
            {lastCheck.preview.tools.length ? `Tools: ${lastCheck.preview.tools.join(', ')}.` : ''}
            {lastCheck.skippedTargets.length
              ? ` ${lastCheck.skippedTargets.length} target${lastCheck.skippedTargets.length === 1 ? '' : 's'} need attention.`
              : ''}
          </Alert>
        )}

        {isLoading ? (
          <Typography color="text.secondary">Loading assigned findings...</Typography>
        ) : groupedSections.length ? (
          <Stack spacing={1.25}>
            {groupedSections.map(section => (
              <FindingStateSection
                key={section.key}
                accent={section.accent}
                detail={section.detail}
                risks={section.risks}
                removingRiskId={removingRiskId}
                title={section.title}
                onCheckFixes={onCheckFixes}
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

function VerificationPreview({
  activeRisks,
  checkTargetRisks,
  isChecking,
}: {
  activeRisks: ScannerRiskThread[];
  checkTargetRisks: ScannerRiskThread[];
  isChecking?: boolean | undefined;
}) {
  const toolLabels = uniqueValues(checkTargetRisks.map(risk => risk.sourceTool || 'Proof needed'));
  const targetsNeedingProof = checkTargetRisks.filter(
    risk => !risk.sourceTool && !risk.currentFindingId
  );
  const baselineCount = uniqueValues(
    checkTargetRisks
      .map(risk => risk.lastSeenScanRunId || risk.firstSeenScanRunId)
      .filter(Boolean) as string[]
  ).length;

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
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.25}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1">Check preview</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
            Targeted check will verify {checkTargetRisks.length || activeRisks.length} assigned
            finding{(checkTargetRisks.length || activeRisks.length) === 1 ? '' : 's'} using the
            smallest scanner set ProdUS can infer from the original source.
          </Typography>
        </Box>
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
      </Stack>
    </Box>
  );
}

function FindingStateSection({
  accent,
  detail,
  risks,
  removingRiskId,
  title,
  onCheckFixes,
  onRemoveRisk,
}: {
  accent: string;
  detail: string;
  risks: ScannerRiskThread[];
  removingRiskId?: string | null | undefined;
  title: string;
  onCheckFixes: (riskIds: string[], mode?: CheckFixesResponse['mode']) => void;
  onRemoveRisk?: ((riskId: string) => void) | undefined;
}) {
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
          <Typography variant="h4" sx={{ color: accent }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, lineHeight: 1.5 }}>
            {detail}
          </Typography>
        </Box>
        <PastelChip
          label={`${risks.length} finding${risks.length === 1 ? '' : 's'}`}
          accent={accent}
          bg={`${accent}12`}
        />
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
        {risks.map(risk => (
          <RiskThreadCard
            key={risk.id}
            risk={risk}
            isRemoving={removingRiskId === risk.id}
            onCheckFixes={onCheckFixes}
            onRemoveRisk={onRemoveRisk}
          />
        ))}
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
  risk,
  isRemoving,
  onCheckFixes,
  onRemoveRisk,
}: {
  risk: ScannerRiskThread;
  isRemoving?: boolean | undefined;
  onCheckFixes: (riskIds: string[], mode?: CheckFixesResponse['mode']) => void;
  onRemoveRisk?: ((riskId: string) => void) | undefined;
}) {
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
            value={risk.recommendedModule?.name || 'No service linked yet'}
          />
          <FactLine
            label="Proof needed"
            value={risk.evidenceRequired || proofNeedForState(risk.currentState)}
          />
          <FactLine
            label="Latest baseline"
            value={risk.lastSeenScanRunId ? compactId(risk.lastSeenScanRunId) : 'No baseline yet'}
          />
        </Box>
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} sx={{ mt: 'auto' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlayArrowOutlined />}
            disabled={!canCheckSingle}
            onClick={() => onCheckFixes([risk.id], 'RELEVANT_TO_FIXES')}
            sx={{ minHeight: 36 }}
          >
            Check this
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
