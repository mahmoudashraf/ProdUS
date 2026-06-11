'use client';

import {
  CloudUploadOutlined,
  FactCheckOutlined,
  PlayArrowOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Stack, Tooltip, Typography } from '@mui/material';
import {
  MetricTile,
  PastelChip,
  SectionTitle,
  appleColors,
} from './PlatformComponents';

interface ScannerProofRunwayProps {
  scannerReadiness: number;
  criticalCount: number;
  highCount: number;
  openFindingCount: number;
  sourceCount: number;
  evidenceCount: number;
  latestCoveredTools: number;
  totalTools: number;
  normalizedFindingCount: number;
  activeScanRun?: boolean;
  fullSuiteBlockedReason?: string;
  isStartingFullSuite?: boolean;
  isExporting?: boolean;
  onConnectSource?: () => void;
  onRunFullSuite: () => void;
  onReviewBlockers: () => void;
  onExportProof: () => void;
}

export default function ScannerProofRunway({
  scannerReadiness,
  criticalCount,
  highCount,
  openFindingCount,
  sourceCount,
  evidenceCount,
  latestCoveredTools,
  totalTools,
  normalizedFindingCount,
  activeScanRun,
  fullSuiteBlockedReason,
  isStartingFullSuite,
  isExporting,
  onConnectSource,
  onRunFullSuite,
  onReviewBlockers,
  onExportProof,
}: ScannerProofRunwayProps) {
  const runComplete = totalTools > 0 && latestCoveredTools === totalTools;
  const hasPriorityFindings = criticalCount > 0 || highCount > 0 || openFindingCount > 0;
  const blockedReason = activeScanRun
    ? 'A scanner run is already queued or running.'
    : fullSuiteBlockedReason || '';

  const steps = [
    {
      label: 'Connect source',
      status: sourceCount ? 'Ready' : 'Needed',
      detail: sourceCount ? `${sourceCount} authorized source${sourceCount === 1 ? '' : 's'} attached.` : 'Connect the repository, live app URL, or scanner export first.',
      complete: sourceCount > 0,
      accent: sourceCount ? appleColors.green : appleColors.amber,
      action: onConnectSource ? (
        <Button size="small" variant="outlined" onClick={onConnectSource} sx={{ minHeight: 34 }}>
          Connect
        </Button>
      ) : (
        <Button component="a" href="#scanner-operations" size="small" variant="outlined" sx={{ minHeight: 34 }}>
          Connect
        </Button>
      ),
    },
    {
      label: 'Run full scan',
      status: runComplete ? 'Complete' : activeScanRun ? 'Running' : 'Ready',
      detail: `${latestCoveredTools}/${totalTools} scanner checks have a latest result.`,
      complete: runComplete,
      accent: runComplete ? appleColors.green : activeScanRun ? appleColors.purple : appleColors.blue,
      action: (
        <Tooltip title={blockedReason || 'Run the complete repository, container, and live app scan suite.'}>
          <span>
            <Button
              size="small"
              variant={runComplete ? 'outlined' : 'contained'}
              startIcon={<PlayArrowOutlined />}
              disabled={Boolean(blockedReason) || Boolean(isStartingFullSuite)}
              onClick={onRunFullSuite}
              sx={{ minHeight: 34, minWidth: 124 }}
            >
              {isStartingFullSuite ? 'Starting...' : runComplete ? 'Run again' : 'Run scans'}
            </Button>
          </span>
        </Tooltip>
      ),
    },
    {
      label: 'Review blockers',
      status: hasPriorityFindings ? 'Needs owner decision' : 'Clear',
      detail: hasPriorityFindings ? `${criticalCount} critical, ${highCount} high, ${openFindingCount} open.` : 'No priority blocker is visible in the latest scan proof.',
      complete: !hasPriorityFindings && runComplete,
      accent: hasPriorityFindings ? appleColors.red : appleColors.green,
      action: (
        <Button size="small" variant="outlined" onClick={onReviewBlockers} sx={{ minHeight: 34 }}>
          Review
        </Button>
      ),
    },
    {
      label: 'Export proof',
      status: evidenceCount ? 'Available' : 'Waiting',
      detail: evidenceCount ? `${evidenceCount} saved proof item${evidenceCount === 1 ? '' : 's'} can support the owner report.` : 'Proof export becomes useful after proof is attached.',
      complete: evidenceCount > 0,
      accent: evidenceCount ? appleColors.cyan : appleColors.muted,
      action: (
        <Button
          size="small"
          variant="outlined"
          startIcon={<CloudUploadOutlined />}
          disabled={Boolean(isExporting)}
          onClick={onExportProof}
          sx={{ minHeight: 34 }}
        >
          Export
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <SectionTitle
        title="Scanner guide and fix path"
        action={
          <PastelChip
            label={`${normalizedFindingCount} scan risks`}
            accent={openFindingCount ? appleColors.amber : appleColors.green}
            bg={openFindingCount ? '#fff4dc' : '#e7f8ee'}
          />
        }
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '220px repeat(3, minmax(0, 1fr))' }, gap: 1.5, mb: 2 }}>
        <MetricTile
          label="Ship confidence"
          value={`${scannerReadiness}%`}
          detail="Scan-backed signal"
          accent={scannerReadiness >= 80 ? appleColors.green : scannerReadiness >= 60 ? appleColors.amber : appleColors.red}
          icon={<ShieldOutlined />}
        />
        <MetricTile
          label="Critical / High"
          value={`${criticalCount}/${highCount}`}
          detail="Require owner review"
          accent={criticalCount || highCount ? appleColors.red : appleColors.green}
          icon={<FactCheckOutlined />}
        />
        <MetricTile
          label="Open risks"
          value={openFindingCount}
          detail="New, open, or regressed"
          accent={openFindingCount ? appleColors.amber : appleColors.green}
          icon={<FactCheckOutlined />}
        />
        <MetricTile
          label="Scan sources"
          value={sourceCount}
          detail="Repo, live app, CI, or imports"
          accent={appleColors.cyan}
          icon={<CloudUploadOutlined />}
        />
      </Box>
      <Box sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: '#dbeafe', bgcolor: '#fbfdff', mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ md: 'center' }} sx={{ mb: 1.25 }}>
          <Box>
            <Typography sx={{ fontWeight: 950 }}>Scanner guide</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.6 }}>
              Follow this short path when a founder asks whether the product has enough proof for launch, beta, or investor review.
            </Typography>
          </Box>
          {blockedReason && (
            <Alert severity={activeScanRun ? 'info' : 'warning'} sx={{ borderRadius: 1, py: 0.5 }}>
              {blockedReason}
            </Alert>
          )}
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>
          {steps.map((step, index) => (
            <Box
              key={step.label}
              sx={{
                p: 1.2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: `${step.accent}36`,
                bgcolor: step.complete ? '#fbfffd' : '#fff',
                minHeight: 164,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Stack spacing={0.75}>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: `${step.accent}14`, color: step.accent, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 950 }}>
                    {step.complete ? 'OK' : index + 1}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 950 }}>
                    {step.label}
                  </Typography>
                </Stack>
                <PastelChip label={step.status} accent={step.accent} bg={`${step.accent}12`} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.45 }}>
                  {step.detail}
                </Typography>
              </Stack>
              {step.action}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
