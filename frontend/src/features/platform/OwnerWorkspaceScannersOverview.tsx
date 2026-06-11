'use client';

import type { ReactNode } from 'react';
import {
  FactCheckOutlined,
  FolderCopyOutlined,
  PlayArrowOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  MetricTile,
  PastelChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import { shortDateTime } from './ownerProductizationWorkspaceConfig';
import type { ProductScannerSummary, ScannerToolCoverage } from './types';

interface ScannerCounts {
  critical?: number;
  high?: number;
  open?: number;
  total?: number;
}

interface OwnerWorkspaceScannersOverviewProps {
  scannerCounts?: ScannerCounts | undefined;
  scannerReadiness: number;
  latestCoveredTools: number;
  totalTools: number;
  latestMappedToolFindings: number;
  scannerToolCoverage: ScannerToolCoverage[];
  scannerSummary?: ProductScannerSummary | undefined;
  storedProofCount: number;
  isFetching?: boolean | undefined;
  onOpenRisks: () => void;
  onOpenProofLibrary: () => void;
  onOpenScannerTools: () => void;
}

export default function OwnerWorkspaceScannersOverview({
  scannerCounts,
  scannerReadiness,
  latestCoveredTools,
  totalTools,
  latestMappedToolFindings,
  scannerToolCoverage,
  scannerSummary,
  storedProofCount,
  isFetching,
  onOpenRisks,
  onOpenProofLibrary,
  onOpenScannerTools,
}: OwnerWorkspaceScannersOverviewProps) {
  const latestCompletedRun = scannerSummary?.recentRuns.find((run) => run.status === 'COMPLETED');
  const latestRun = latestCompletedRun || scannerSummary?.recentRuns[0];
  const openFindings = scannerCounts?.open || 0;
  const priorityFindings = (scannerCounts?.critical || 0) + (scannerCounts?.high || 0);
  const completedSuite = totalTools > 0 && latestCoveredTools === totalTools;
  const latestLabel = latestRun?.completedAt || latestRun?.startedAt
    ? shortDateTime(latestRun.completedAt || latestRun.startedAt)
    : isFetching
      ? 'Loading latest scan'
      : 'No scan recorded';
  const failedTools = scannerToolCoverage.filter((tool) => tool.latestStatus === 'FAILED').length;
  const activeTools = scannerToolCoverage.filter((tool) => tool.latestStatus === 'RUNNING' || tool.latestStatus === 'QUEUED').length;

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 55%, #f6fffb 100%)' }}>
      <Stack spacing={2}>
        <Box>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <PastelChip label="Scan overview" accent={appleColors.blue} bg="#eaf3ff" />
            <PastelChip
              label={completedSuite ? 'Full suite complete' : `${latestCoveredTools}/${totalTools} checks ready`}
              accent={completedSuite ? appleColors.green : appleColors.amber}
              bg={completedSuite ? '#e7f8ee' : '#fff4dc'}
            />
          </Stack>
          <Typography variant="h3" sx={{ mt: 1 }}>
            Latest scan result
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 820, lineHeight: 1.65 }}>
            Start here to see whether the product was checked, what the scans found, and where to go next.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25 }}>
          <MetricTile
            label="Scan readiness"
            value={`${scannerReadiness}%`}
            detail={`Last scan ${latestLabel}`}
            accent={scannerReadiness >= 80 ? appleColors.green : scannerReadiness >= 60 ? appleColors.amber : appleColors.red}
            icon={<ShieldOutlined />}
          />
          <MetricTile
            label="Scanner coverage"
            value={`${latestCoveredTools}/${totalTools}`}
            detail={failedTools ? `${failedTools} failed` : activeTools ? `${activeTools} running` : 'Checks completed or ready'}
            accent={failedTools ? appleColors.red : completedSuite ? appleColors.green : appleColors.amber}
            icon={<FactCheckOutlined />}
          />
          <MetricTile
            label="Open risks"
            value={openFindings}
            detail={priorityFindings ? `${priorityFindings} critical/high` : 'No critical/high visible'}
            accent={priorityFindings ? appleColors.red : openFindings ? appleColors.amber : appleColors.green}
            icon={<FactCheckOutlined />}
          />
          <MetricTile
            label="Proof linked"
            value={latestMappedToolFindings}
            detail={`${storedProofCount} saved proof item${storedProofCount === 1 ? '' : 's'}`}
            accent={latestMappedToolFindings ? appleColors.purple : appleColors.muted}
            icon={<FolderCopyOutlined />}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.25 }}>
          <ScannerJourneyCard
            eyebrow="Decision"
            title="Risks to fix"
            detail="Review blockers, improvements, handled risks, and the scan source behind each one."
            actionLabel="Review risks"
            accent={priorityFindings ? appleColors.red : openFindings ? appleColors.amber : appleColors.green}
            countLabel={openFindings ? `${openFindings} open` : 'No open risks'}
            icon={<ShieldOutlined />}
            onOpen={onOpenRisks}
          />
          <ScannerJourneyCard
            eyebrow="Run"
            title="Run scanners"
            detail="Connect sources, run checks, review coverage, rerun failed checks, and turn risks into a fix path."
            actionLabel="Run or review"
            accent={completedSuite ? appleColors.green : appleColors.blue}
            countLabel={`${latestCoveredTools}/${totalTools} checks`}
            icon={<PlayArrowOutlined />}
            onOpen={onOpenScannerTools}
          />
          <ScannerJourneyCard
            eyebrow="Proof"
            title="Proof library"
            detail="Open saved proof, connected sources, exports, and the product source readout in one place."
            actionLabel="Open proof"
            accent={storedProofCount ? appleColors.cyan : appleColors.muted}
            countLabel={`${storedProofCount} proof`}
            icon={<FolderCopyOutlined />}
            onOpen={onOpenProofLibrary}
          />
        </Box>
      </Stack>
    </Surface>
  );
}

function ScannerJourneyCard({
  actionLabel,
  accent,
  countLabel,
  detail,
  eyebrow,
  icon,
  onOpen,
  title,
}: {
  actionLabel: string;
  accent: string;
  countLabel: string;
  detail: string;
  eyebrow: string;
  icon: ReactNode;
  onOpen: () => void;
  title: string;
}) {
  return (
    <Box
      sx={{
        p: 1.35,
        borderRadius: 1,
        border: '1px solid',
        borderColor: `${accent}34`,
        bgcolor: '#fff',
        minHeight: 210,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 1.2,
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: `${accent}12`, color: accent, display: 'grid', placeItems: 'center' }}>
            {icon}
          </Box>
          <PastelChip label={countLabel} accent={accent} bg={`${accent}12`} />
        </Stack>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {eyebrow}
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.25 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.65, lineHeight: 1.55 }}>
            {detail}
          </Typography>
        </Box>
      </Stack>
      <Button variant="outlined" onClick={onOpen} sx={{ minHeight: 40, alignSelf: 'flex-start' }}>
        {actionLabel}
      </Button>
    </Box>
  );
}
