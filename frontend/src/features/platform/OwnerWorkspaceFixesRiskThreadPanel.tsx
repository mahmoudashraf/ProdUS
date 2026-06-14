'use client';

import BuildCircleOutlined from '@mui/icons-material/BuildCircleOutlined';
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
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
  isChecking?: boolean;
  lastCheck?: CheckFixesResponse | undefined;
  onCheckFixes: (riskIds: string[]) => void;
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
  lastCheck,
  onCheckFixes,
}: IOwnerWorkspaceFixesRiskThreadPanelProps) {
  const risks = riskSummary?.groups.flatMap(group => group.risks) || [];
  const activeRisks = risks.filter(risk => activeStates.includes(risk.currentState));
  const fixedCount = risks.filter(risk => risk.currentState === 'FIXED_BY_LATEST_SCAN').length;
  const returnedCount = risks.filter(risk => risk.currentState === 'RETURNED').length;
  const readyCount = risks.filter(risk => risk.currentState === 'READY_TO_CHECK').length;
  const canCheck = activeRisks.length > 0 && !isChecking;
  const topRisk = activeRisks[0] || risks[0];
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
              <PastelChip label="Workspace fixes" accent={appleColors.blue} bg="#eaf3ff" />
              <PastelChip
                label={`${activeRisks.length} current`}
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
              Fixes selected for this workspace
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.45, maxWidth: 780, lineHeight: 1.6 }}>
              These are product scan risks that have become workspace work. Check fixes reruns the
              smallest relevant scanner set for these risks.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PlayArrowOutlined />}
            disabled={!canCheck}
            onClick={() => onCheckFixes(activeRisks.map(risk => risk.id))}
            sx={{ minHeight: 44, alignSelf: { xs: 'stretch', md: 'flex-start' } }}
          >
            {isChecking ? 'Checking fixes...' : readyCount ? 'Check ready fixes' : 'Check if fixed'}
          </Button>
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
          <Typography color="text.secondary">Loading workspace fixes...</Typography>
        ) : risks.length ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
              gap: 1,
            }}
          >
            {risks.slice(0, 8).map(risk => (
              <RiskThreadCard key={risk.id} risk={risk} />
            ))}
          </Box>
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
            <Typography variant="subtitle1">
              No scan risks selected for this workspace yet.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, lineHeight: 1.55 }}>
              Add product scanner risks to this workspace when they should become work for services,
              people, milestones, and proof.
            </Typography>
          </Box>
        )}
      </Stack>
    </Surface>
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

function RiskThreadCard({ risk }: { risk: ScannerRiskThread }) {
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

  return (
    <Box
      sx={{
        p: 1.2,
        border: '1px solid',
        borderColor: `${accent}2e`,
        borderRadius: 1,
        bgcolor: '#fff',
        minHeight: 178,
      }}
    >
      <Stack spacing={1}>
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
        </Stack>
      </Stack>
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
