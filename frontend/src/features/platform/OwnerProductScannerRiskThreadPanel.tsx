'use client';

import AddCircleOutlineOutlined from '@mui/icons-material/AddCircleOutlineOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { ProjectWorkspace, ScannerRiskState, ScannerRiskSummary, ScannerRiskThread } from './types';

interface OwnerProductScannerRiskThreadPanelProps {
  riskSummary?: ScannerRiskSummary | undefined;
  selectedWorkspace?: ProjectWorkspace | undefined;
  isLoading?: boolean;
  isAssigning?: boolean;
  onAssignRisk: (riskId: string) => void;
}

const currentStates: ScannerRiskState[] = ['NEW', 'STILL_OPEN', 'RETURNED', 'READY_TO_CHECK', 'NEEDS_PROOF', 'INCOMPLETE_CHECK'];

export default function OwnerProductScannerRiskThreadPanel({
  riskSummary,
  selectedWorkspace,
  isLoading,
  isAssigning,
  onAssignRisk,
}: OwnerProductScannerRiskThreadPanelProps) {
  const risks = riskSummary?.groups.flatMap((group) => group.risks) || [];
  const currentRisks = risks.filter((risk) => currentStates.includes(risk.currentState));
  const selectedWorkspaceRisks = currentRisks.filter((risk) => risk.workspaceId === selectedWorkspace?.id);
  const unplacedRisks = currentRisks.filter((risk) => !risk.workspaceId);
  const visibleRisks = [
    ...unplacedRisks,
    ...currentRisks.filter((risk) => risk.workspaceId && risk.workspaceId !== selectedWorkspace?.id),
    ...selectedWorkspaceRisks,
  ].slice(0, 8);

  return (
    <Surface sx={{ mb: 1.5, background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 58%, #f7fff7 100%)' }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'flex-start' }}>
          <Box>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <PastelChip label="Product scanner risks" accent={appleColors.blue} bg="#eaf3ff" />
              <PastelChip label={`${currentRisks.length} current`} accent={currentRisks.length ? appleColors.amber : appleColors.green} bg={currentRisks.length ? '#fff4dc' : '#e7f8ee'} />
              {unplacedRisks.length > 0 && <PastelChip label={`${unplacedRisks.length} not in workspace`} accent={appleColors.red} bg="#fff1f2" />}
            </Stack>
            <Typography variant="h3" sx={{ mt: 0.85 }}>
              Send product risks into workspace work
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.45, maxWidth: 800, lineHeight: 1.6 }}>
              Product Scanners keep the evidence history. Add the risks you want to fix into the selected workspace so they can connect to services, people, milestones, proof, and Check fixes.
            </Typography>
          </Box>
          {selectedWorkspace && (
            <Box sx={{ p: 1, border: '1px solid #d7e5f5', borderRadius: 1, bgcolor: '#fff', minWidth: { xs: '100%', md: 260 } }}>
              <Typography variant="caption" color="text.secondary">Selected workspace</Typography>
              <Typography variant="subtitle1" sx={{ mt: 0.25, lineHeight: 1.3 }}>
                {selectedWorkspace.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                {selectedWorkspaceRisks.length} current risk{selectedWorkspaceRisks.length === 1 ? '' : 's'} already here
              </Typography>
            </Box>
          )}
        </Stack>

        {isLoading ? (
          <Typography color="text.secondary">Loading product scanner risks...</Typography>
        ) : visibleRisks.length ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
            {visibleRisks.map((risk) => (
              <ProductRiskCard
                key={risk.id}
                risk={risk}
                selectedWorkspace={selectedWorkspace}
                disabled={isAssigning || !selectedWorkspace || risk.workspaceId === selectedWorkspace.id}
                isAssigning={isAssigning}
                onAssignRisk={onAssignRisk}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ border: '1px dashed', borderColor: '#c9d8ea', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
            <Typography variant="subtitle1">No current product scanner risks.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, lineHeight: 1.55 }}>
              Run scanners when you want a fresh launch-risk picture. Fixed and accepted items stay in history without crowding this workspace path.
            </Typography>
          </Box>
        )}
      </Stack>
    </Surface>
  );
}

function ProductRiskCard({
  disabled,
  isAssigning,
  onAssignRisk,
  risk,
  selectedWorkspace,
}: {
  disabled: boolean;
  isAssigning?: boolean | undefined;
  onAssignRisk: (riskId: string) => void;
  risk: ScannerRiskThread;
  selectedWorkspace?: ProjectWorkspace | undefined;
}) {
  const inSelectedWorkspace = risk.workspaceId === selectedWorkspace?.id;
  const assignedElsewhere = Boolean(risk.workspaceId && !inSelectedWorkspace);
  const accent = risk.currentState === 'RETURNED'
    ? appleColors.red
    : risk.currentState === 'READY_TO_CHECK'
      ? appleColors.blue
      : risk.currentState === 'NEEDS_PROOF'
        ? appleColors.purple
        : appleColors.amber;
  const Icon = risk.currentState === 'RETURNED'
    ? WarningAmberOutlined
    : inSelectedWorkspace
      ? CheckCircleOutlineOutlined
      : ShieldOutlined;

  return (
    <Box sx={{ p: 1.2, border: '1px solid', borderColor: `${accent}30`, borderRadius: 1, bgcolor: '#fff', minHeight: 198 }}>
      <Stack spacing={1.05} sx={{ height: '100%' }}>
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ width: 38, height: 38, borderRadius: 1, bgcolor: `${accent}12`, color: accent, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
            <Icon fontSize="small" />
          </Box>
          <Stack direction="row" spacing={0.6} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
            <PastelChip label={labelForState(risk.currentState)} accent={accent} bg={`${accent}12`} />
            <PastelChip label={risk.severity} accent={severityAccent(risk.severity)} bg={`${severityAccent(risk.severity)}12`} />
          </Stack>
        </Stack>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ lineHeight: 1.3 }}>
            {risk.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.5 }}>
            {risk.businessRisk || risk.description}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
          {risk.sourceTool && <PastelChip label={risk.sourceTool} accent={appleColors.cyan} bg="#e4f9fd" />}
          {risk.recommendedModule?.name && <PastelChip label={risk.recommendedModule.name} accent={appleColors.purple} bg="#f0e9ff" />}
          {risk.affectedComponent && <PastelChip label={risk.affectedComponent} accent={appleColors.muted} bg="#f4f7fb" />}
        </Stack>
        <Button
          variant={inSelectedWorkspace ? 'outlined' : 'contained'}
          size="small"
          startIcon={inSelectedWorkspace ? <CheckCircleOutlineOutlined /> : <AddCircleOutlineOutlined />}
          endIcon={!inSelectedWorkspace && selectedWorkspace ? <ArrowForwardOutlined /> : undefined}
          disabled={disabled}
          onClick={() => onAssignRisk(risk.id)}
          sx={{ alignSelf: 'flex-start', minHeight: 36 }}
        >
          {inSelectedWorkspace
            ? 'In this workspace'
            : assignedElsewhere
              ? 'Move to selected workspace'
              : selectedWorkspace
                ? isAssigning ? 'Adding...' : 'Add to workspace'
                : 'Open a workspace first'}
        </Button>
      </Stack>
    </Box>
  );
}

function labelForState(state: ScannerRiskState) {
  return state
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function severityAccent(severity: ScannerRiskThread['severity']) {
  if (severity === 'CRITICAL' || severity === 'HIGH') return appleColors.red;
  if (severity === 'MEDIUM') return appleColors.amber;
  if (severity === 'LOW') return appleColors.blue;
  return appleColors.muted;
}
