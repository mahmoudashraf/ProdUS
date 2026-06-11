'use client';

import { InfoOutlined, Inventory2Outlined, RefreshOutlined, ScienceOutlined, ShieldOutlined } from '@mui/icons-material';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  MetricTile,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { ProductScannerSummary, RepoSignal, RepoSignalSummary } from './types';

const repoSignalAccent = (signal?: Pick<RepoSignal, 'signalType' | 'evidenceKind'>) => {
  if (!signal) return appleColors.purple;
  if (signal.signalType === 'UNKNOWN') return appleColors.amber;
  if (signal.signalType === 'SECURITY' || signal.signalType === 'SCANNER_FINDING') return appleColors.red;
  if (signal.signalType === 'TESTING' || signal.signalType === 'CI_CD' || signal.signalType === 'DEPLOYMENT') return appleColors.cyan;
  if (signal.evidenceKind === 'AUTHORIZED_CONNECTOR' || signal.evidenceKind === 'SCANNER_RESULT') return appleColors.green;
  if (signal.signalType === 'FRAMEWORK' || signal.signalType === 'LANGUAGE' || signal.signalType === 'DATABASE') return appleColors.blue;
  return appleColors.purple;
};

const repoSourceStatusLabel = (status?: string) => {
  if (status === 'AUTHORIZED_SOURCE') return 'Repo connected';
  if (status === 'OWNER_PROVIDED_SOURCE') return 'Owner-provided repo';
  if (status === 'SOURCE_UNKNOWN') return 'Repo unknown';
  return 'Not refreshed';
};

const repoSignalConfidence = (confidence?: number) => `${Math.round((confidence || 0) * 100)}%`;

function RepoSignalRow({ signal }: { signal: RepoSignal }) {
  const accent = repoSignalAccent(signal);
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: `${accent}28`,
        bgcolor: '#fff',
        minWidth: 0,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <PastelChip label={formatLabel(signal.signalType)} accent={accent} bg={`${accent}12`} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
              {repoSignalConfidence(signal.confidence)}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.65, fontWeight: 900, overflowWrap: 'anywhere' }}>
            {signal.signalValue}
          </Typography>
          {signal.ownerSafeEvidence && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.45, display: 'block', lineHeight: 1.45 }}>
              {signal.ownerSafeEvidence}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

function RepoSignalColumn({
  title,
  empty,
  signals,
}: {
  title: string;
  empty: string;
  signals: RepoSignal[];
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 1 }}>
        {title}
      </Typography>
      {signals.length ? (
        <Stack spacing={0.9}>
          {signals.slice(0, 5).map((signal) => (
            <RepoSignalRow key={signal.id} signal={signal} />
          ))}
        </Stack>
      ) : (
        <Box sx={{ p: 1.25, borderRadius: 1, border: '1px dashed', borderColor: appleColors.line, bgcolor: '#fbfdff' }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {empty}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default function RepoReadoutPanel({
  summary,
  scannerSummary,
  isFetching,
  isRefreshing,
  onRefresh,
}: {
  summary: RepoSignalSummary | undefined;
  scannerSummary: ProductScannerSummary | undefined;
  isFetching: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const sourceSignal = summary?.signals.find((signal) => signal.signalType === 'REPOSITORY_SOURCE');
  const branchSignal = summary?.signals.find((signal) => signal.signalType === 'DEFAULT_BRANCH');
  const scannerStatus = summary?.signals.find((signal) => signal.signalType === 'SCANNER_STATUS');
  const unknownCount = summary?.unknowns.length || 0;
  const stackValues = Array.from(new Set((summary?.detectedStack || []).map((signal) => signal.signalValue))).slice(0, 6);
  const proofSignals = (summary?.scannerFacts || []).filter((signal) => signal.signalType !== 'REPOSITORY_SOURCE' && signal.signalType !== 'SOURCE_AUTHORIZATION');
  const topUnknowns = summary?.unknowns || [];
  const sourceStatus = repoSourceStatusLabel(summary?.sourceStatus);
  const accent = summary?.sourceStatus === 'AUTHORIZED_SOURCE'
    ? appleColors.green
    : summary?.sourceStatus === 'OWNER_PROVIDED_SOURCE'
      ? appleColors.blue
      : appleColors.amber;

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #fbfdff 50%, #f7fff9 100%)' }}>
      <SectionTitle
        title="Product source readout"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <PastelChip label={sourceStatus} accent={accent} bg={`${accent}12`} />
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshOutlined />}
              disabled={isRefreshing}
              onClick={onRefresh}
              sx={{ minHeight: 36 }}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
        ProdUS turns owner input, connected product sources, scanner runs, and saved risks into a compact fact sheet. This keeps launch decisions grounded before choosing services or sharing the workspace.
      </Typography>
      {(isFetching || isRefreshing) && <LinearProgress sx={{ borderRadius: 999, mb: 1.5 }} />}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25, mb: 1.5 }}>
        <MetricTile
          label="Repository"
          value={sourceSignal?.signalValue || 'Unknown'}
          detail={branchSignal?.signalValue ? `Branch ${branchSignal.signalValue}` : 'Attach repo or source'}
          accent={sourceSignal ? repoSignalAccent(sourceSignal) : appleColors.amber}
          icon={<Inventory2Outlined />}
        />
        <MetricTile
          label="Product stack"
          value={stackValues.length}
          detail={stackValues.length ? stackValues.join(', ') : 'Not detected yet'}
          accent={stackValues.length ? appleColors.blue : appleColors.amber}
          icon={<ScienceOutlined />}
        />
        <MetricTile
          label="Scan proof"
          value={scannerStatus?.signalValue || `${scannerSummary?.recentRuns.length || 0} runs`}
          detail={`${scannerSummary?.findings.length || 0} findings available`}
          accent={scannerStatus ? repoSignalAccent(scannerStatus) : appleColors.cyan}
          icon={<ShieldOutlined />}
        />
        <MetricTile
          label="Still unknown"
          value={unknownCount}
          detail={unknownCount ? 'Needs proof' : 'No gaps detected'}
          accent={unknownCount ? appleColors.amber : appleColors.green}
          icon={<InfoOutlined />}
        />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
        <RepoSignalColumn
          title="Product facts found"
          empty="Refresh after adding a repository URL or scanner source."
          signals={summary?.detectedStack || []}
        />
        <RepoSignalColumn
          title="Scan-backed facts"
          empty="Run a scanner or import CI proof to support this product."
          signals={proofSignals}
        />
        <RepoSignalColumn
          title="Still unknown"
          empty="No major unknowns from the latest readout."
          signals={topUnknowns}
        />
      </Box>
      {!!summary?.nextActions.length && (
        <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#dbeafe', bgcolor: '#fbfdff' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 0.75 }}>
            Next scan steps
          </Typography>
          <Stack spacing={0.65}>
            {summary.nextActions.slice(0, 4).map((action) => (
              <DotLabel key={action} label={action} color={appleColors.blue} />
            ))}
          </Stack>
        </Box>
      )}
    </Surface>
  );
}
