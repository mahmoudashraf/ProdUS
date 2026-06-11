'use client';

import type { ReactNode } from 'react';
import {
  ArrowForwardOutlined,
  CheckCircleOutlineOutlined,
  FilePresentOutlined,
  RocketLaunchOutlined,
  ShieldOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  MetricTile,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  clampScore,
} from './PlatformComponents';
import type { OwnerLaunchStatus } from './ownerWorkspaceModel';

export interface VerdictRisk {
  id: string;
  title: string;
  impact: string;
  evidence: string;
}

export function OwnerReadinessVerdictReveal({
  productName,
  launchStatus,
  risks,
  completedChecks,
  totalChecks,
  onSeePlan,
  onViewProof,
}: {
  productName: string;
  launchStatus: OwnerLaunchStatus;
  risks: VerdictRisk[];
  completedChecks: number;
  totalChecks: number;
  onSeePlan: () => void;
  onViewProof: () => void;
}) {
  const hasBlockers = launchStatus.blockerCount > 0 || launchStatus.label === 'Not ready';
  const lead = hasBlockers
    ? 'Not ready to launch - yet'
    : launchStatus.label === 'Ready to review'
      ? 'Ready for human launch review'
      : launchStatus.headline;
  const reason = hasBlockers
    ? `${launchStatus.blockerCount} thing${launchStatus.blockerCount === 1 ? '' : 's'} must be fixed before you share this with customers. Everything else can wait.`
    : launchStatus.reason;

  return (
    <Surface sx={{ p: { xs: 2.4, md: 3 }, background: 'linear-gradient(135deg, #ffffff 0%, #fbfdff 100%)', borderColor: `${launchStatus.accent}30` }}>
      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        <Stack spacing={2}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
            Your readiness check is complete
          </Typography>
          <Stack direction="row" spacing={1.3} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: launchStatus.accent, flexShrink: 0 }} />
            <Typography variant="h2">{lead}</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ fontSize: 17, lineHeight: 1.65 }}>
            {reason}
          </Typography>

          <Box sx={{ p: 1.4, borderRadius: 1, border: '1px solid #e7eaf3', bgcolor: '#fff' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ sm: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Readiness</Typography>
                <Typography variant="h3">{launchStatus.score}%</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, lineHeight: 1.55 }}>
                This is the starting line for {productName}. Completed checks show coverage; readiness reflects unresolved blockers and proof.
              </Typography>
            </Stack>
            <Box sx={{ height: 7, bgcolor: '#eef2f7', borderRadius: 999, overflow: 'hidden', mt: 1.25 }}>
              <Box sx={{ width: `${clampScore(launchStatus.score)}%`, height: '100%', bgcolor: launchStatus.accent }} />
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
              What is blocking launch
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {risks.length ? risks.slice(0, 2).map((risk) => (
                <Box key={risk.id} sx={{ p: 1.35, borderRadius: 1, border: '1px solid #e7eaf3', bgcolor: '#fff' }}>
                  <Typography variant="body2" sx={{ fontWeight: 950 }}>
                    {risk.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.5 }}>
                    {risk.impact}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.7 }}>
                    Proof: {risk.evidence}
                  </Typography>
                </Box>
              )) : (
                <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  No launch blockers are visible from the latest stored proof.
                </Typography>
              )}
            </Stack>
          </Box>

          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            None of this is unusual for a prototype. Here is the path to fixing it.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems={{ sm: 'center' }}>
            <Button variant="contained" endIcon={<ArrowForwardOutlined />} onClick={onSeePlan} sx={{ minHeight: 44 }}>
              See your plan
            </Button>
            <Button variant="outlined" startIcon={<ShieldOutlined />} onClick={onViewProof} sx={{ minHeight: 44 }}>
              Go to scanners
            </Button>
            <Typography variant="caption" color="text.secondary">
              {completedChecks} of {totalChecks} checks complete - repo and live app proof
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Surface>
  );
}

export function OwnerLaunchReadyCelebration({
  readinessScore,
  blockerCount,
  improvementCount,
  completedChecks,
  totalChecks,
  onGenerateReport,
  isGenerating,
}: {
  readinessScore: number;
  blockerCount: number;
  improvementCount: number;
  completedChecks: number;
  totalChecks: number;
  onGenerateReport: () => void;
  isGenerating: boolean;
}) {
  if (blockerCount > 0 || readinessScore < 82) return null;

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fff9 100%)', borderColor: `${appleColors.green}30` }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <CheckCircleOutlineOutlined sx={{ color: appleColors.green, fontSize: 34 }} />
          <Box>
            <Typography variant="h2">Ready for human launch review</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
              Every launch blocker visible to ProdUS is cleared and the required proof is in place for the selected launch decision.
            </Typography>
          </Box>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
          <MetricTile label="Readiness" value={`${readinessScore}%`} detail="Current launch signal" accent={appleColors.green} icon={<TrendingUpOutlined />} />
          <MetricTile label="Blockers" value={blockerCount} detail="Must-fix items open" accent={appleColors.green} icon={<RocketLaunchOutlined />} />
          <MetricTile label="Proof checks" value={`${completedChecks}/${totalChecks}`} detail="Completed checks" accent={appleColors.green} icon={<ShieldOutlined />} />
        </Box>
        {improvementCount > 0 && (
          <Typography variant="body2" color="text.secondary">
            {improvementCount} improvement{improvementCount === 1 ? '' : 's'} can stay in the follow-up plan after the launch decision.
          </Typography>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
          <Button variant="contained" startIcon={<FilePresentOutlined />} disabled={isGenerating} onClick={onGenerateReport} sx={{ minHeight: 44 }}>
            {isGenerating ? 'Generating report...' : 'Generate readiness report'}
          </Button>
          <Button variant="outlined" sx={{ minHeight: 44 }}>
            Share with your team
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

export function OwnerControlPanel({
  status,
  primaryAction,
  lastScanLabel,
  evidenceLabel,
  onPrimaryAction,
  secondary,
}: {
  status: OwnerLaunchStatus;
  primaryAction: string;
  lastScanLabel: string;
  evidenceLabel: string;
  onPrimaryAction: () => void;
  secondary?: ReactNode;
}) {
  return (
    <Surface>
      <SectionTitle title="Owner controls" action={<PastelChip label={status.label} accent={status.accent} bg={`${status.accent}12`} />} />
      <Stack spacing={1.25}>
        <Typography variant="h4">{status.headline}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
          {status.reason}
        </Typography>
        <Button variant="contained" onClick={onPrimaryAction} endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 42 }}>
          {primaryAction}
        </Button>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#fbfdff' }}>
            <Typography variant="caption" color="text.secondary">Last check</Typography>
            <Typography variant="body2" sx={{ fontWeight: 850 }}>{lastScanLabel}</Typography>
          </Box>
          <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#fbfdff' }}>
            <Typography variant="caption" color="text.secondary">Proof</Typography>
            <Typography variant="body2" sx={{ fontWeight: 850 }}>{evidenceLabel}</Typography>
          </Box>
        </Box>
        {secondary}
      </Stack>
    </Surface>
  );
}
