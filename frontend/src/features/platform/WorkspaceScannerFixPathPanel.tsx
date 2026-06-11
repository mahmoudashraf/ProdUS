'use client';

import { AutoAwesomeOutlined, ShieldOutlined, SyncOutlined } from '@mui/icons-material';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  ProgressRing,
  Surface,
  appleColors,
} from './PlatformComponents';
import { WorkspaceScannerReadiness } from './types';

const severityAccent = (severity?: string) => {
  if (severity === 'CRITICAL' || severity === 'HIGH') return appleColors.red;
  if (severity === 'MEDIUM') return appleColors.amber;
  if (severity === 'LOW') return appleColors.cyan;
  return appleColors.green;
};

interface WorkspaceScannerFixPathPanelProps {
  readinessScore: number;
  readinessStatus: string;
  hasDiagnosis: boolean;
  blockerCount: number;
  mappedFindingCount: number;
  missingEvidenceCount: number;
  unmappedFindingCount: number;
  scannerEvidenceCount: number;
  milestoneRisks: WorkspaceScannerReadiness['milestoneRisks'];
  isRefreshing: boolean;
  isLoading: boolean;
  canRefresh: boolean;
  onRefresh: () => void;
}

export default function WorkspaceScannerFixPathPanel({
  readinessScore,
  readinessStatus,
  hasDiagnosis,
  blockerCount,
  mappedFindingCount,
  missingEvidenceCount,
  unmappedFindingCount,
  scannerEvidenceCount,
  milestoneRisks,
  isRefreshing,
  isLoading,
  canRefresh,
  onRefresh,
}: WorkspaceScannerFixPathPanelProps) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5fbff 46%, #fffaf2 100%)' }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems={{ lg: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="center">
          <ProgressRing
            value={readinessScore}
            size={110}
            color={blockerCount ? appleColors.red : hasDiagnosis ? appleColors.green : appleColors.cyan}
            label="ready"
          />
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <ShieldOutlined sx={{ color: blockerCount ? appleColors.red : appleColors.cyan }} />
              <Typography variant="h3" sx={{ fontSize: { xs: 22, md: 26 } }}>Workspace fix path</Typography>
              <PastelChip label={readinessStatus} accent={blockerCount ? appleColors.red : appleColors.green} bg={blockerCount ? '#fff1f1' : '#e7f8ee'} />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6, maxWidth: 760 }}>
              Scan risks become clear fixes, suggested services, and proof tasks. The result is stored; AI only explains it when you ask.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
              <PastelChip label={`${mappedFindingCount} linked to services`} accent={appleColors.green} bg="#e7f8ee" />
              <PastelChip label={`${blockerCount} priority fixes`} accent={blockerCount ? appleColors.red : appleColors.green} bg={blockerCount ? '#fff1f1' : '#e7f8ee'} />
              <PastelChip label={`${missingEvidenceCount} proof gaps`} accent={missingEvidenceCount ? appleColors.amber : appleColors.green} bg={missingEvidenceCount ? '#fff4dc' : '#e7f8ee'} />
              <PastelChip label={`${unmappedFindingCount} need review`} accent={unmappedFindingCount ? appleColors.amber : appleColors.cyan} bg={unmappedFindingCount ? '#fff4dc' : '#e4f9fd'} />
            </Stack>
          </Box>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} spacing={1} sx={{ flex: { lg: '0 0 230px' } }}>
          <Button
            variant="contained"
            startIcon={<SyncOutlined />}
            disabled={!canRefresh || isRefreshing}
            onClick={onRefresh}
            sx={{ minHeight: 42 }}
          >
            Refresh fix path
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            Refresh stores the latest scan-to-service map. Use the assistant below when you want the plain-English readout.
          </Typography>
        </Stack>
      </Stack>
      {(isLoading || isRefreshing) && <LinearProgress sx={{ mt: 1.5, borderRadius: 999 }} />}
      {milestoneRisks.length ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25, mt: 2 }}>
          {milestoneRisks.slice(0, 4).map((risk) => (
            <Box key={risk.milestoneId} sx={{ p: 1.35, border: '1px solid', borderColor: '#e1eaf6', borderRadius: 1, bgcolor: '#fff' }}>
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900 }} noWrap>{risk.milestoneTitle}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {risk.scannerFindingCount} scan risk{risk.scannerFindingCount === 1 ? '' : 's'} · {risk.missingEvidenceCount} proof gap{risk.missingEvidenceCount === 1 ? '' : 's'}
                  </Typography>
                </Box>
                <PastelChip label={risk.highestSeverity || 'Mapped'} accent={severityAccent(risk.highestSeverity)} bg={risk.highestSeverity === 'CRITICAL' || risk.highestSeverity === 'HIGH' ? '#fff1f1' : '#f1efff'} />
              </Stack>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {risk.mappedServices.length ? risk.mappedServices.slice(0, 4).map((service) => (
                  <PastelChip key={service} label={service} accent={appleColors.cyan} bg="#e4f9fd" />
                )) : <Typography variant="caption" color="text.secondary">Needs service mapping review</Typography>}
              </Stack>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ mt: 2, p: 1.5, border: '1px dashed', borderColor: '#cfe3f8', borderRadius: 1, bgcolor: '#fbfdff' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {scannerEvidenceCount
                ? 'Scan proof exists. Refresh the fix path to link milestone risks and proof tasks.'
                : 'Run scanners or attach scan proof to build a fix path for this workspace.'}
            </Typography>
            <AutoAwesomeOutlined sx={{ color: appleColors.purple }} />
          </Stack>
        </Box>
      )}
    </Surface>
  );
}
