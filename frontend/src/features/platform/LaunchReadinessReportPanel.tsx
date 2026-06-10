'use client';

import {
  ArticleOutlined,
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
  ErrorOutlineOutlined,
  FactCheckOutlined,
  RocketLaunchOutlined,
} from '@mui/icons-material';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  MetricTile,
  PastelChip,
  ProgressRing,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { LaunchReadinessReport } from './types';

const scoreColor = (score: number) => {
  if (score >= 80) return appleColors.green;
  if (score >= 60) return appleColors.amber;
  return appleColors.red;
};

function ReportList({ title, items, accent, empty }: { title: string; items: string[]; accent: string; empty: string }) {
  return (
    <Box sx={{ p: 1.25, border: '1px solid', borderColor: '#e2eaf6', borderRadius: 1, bgcolor: '#fff', minHeight: 146 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>{title}</Typography>
      {items.length ? (
        <Stack spacing={0.85} sx={{ mt: 1 }}>
          {items.slice(0, 5).map((item) => (
            <Stack key={item} direction="row" spacing={0.85} alignItems="flex-start">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: accent, mt: 0.8, flex: '0 0 auto' }} />
              <Typography variant="body2" sx={{ lineHeight: 1.45, fontWeight: 760 }}>{item}</Typography>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.55 }}>{empty}</Typography>
      )}
    </Box>
  );
}

export default function LaunchReadinessReportPanel({
  report,
  isLoading = false,
  isGenerating = false,
  onGenerate,
  title = 'Launch Readiness Report',
  subtitle = 'Generate a practical report for a pilot, paid beta, customer demo, or public launch decision.',
}: {
  report?: LaunchReadinessReport | null;
  isLoading?: boolean;
  isGenerating?: boolean;
  onGenerate: () => void;
  title?: string;
  subtitle?: string;
}) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fcff 50%, #fffaf3 100%)' }}>
      <SectionTitle
        title={title}
        action={
          <Button
            variant={report ? 'outlined' : 'contained'}
            startIcon={<ArticleOutlined />}
            disabled={isGenerating}
            onClick={onGenerate}
            sx={{ minHeight: 40, whiteSpace: 'nowrap' }}
          >
            {isGenerating ? 'Generating...' : report ? 'Regenerate' : 'Generate Report'}
          </Button>
        }
      />
      <Typography color="text.secondary" sx={{ lineHeight: 1.6, mb: 1.5, maxWidth: 860 }}>
        {subtitle}
      </Typography>
      {(isLoading || isGenerating) && <LinearProgress sx={{ mb: 1.5, borderRadius: 999 }} />}

      {report ? (
        <Stack spacing={1.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '130px 1fr' }, gap: 1.5, alignItems: 'center' }}>
            <Box sx={{ display: 'grid', placeItems: 'center' }}>
              <ProgressRing value={report.shipConfidenceScore} size={104} color={scoreColor(report.shipConfidenceScore)} label="ship" />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <PastelChip label={report.statusLabel} accent={scoreColor(report.shipConfidenceScore)} bg={`${scoreColor(report.shipConfidenceScore)}12`} />
                <PastelChip label={`v${report.reportVersion}`} accent={appleColors.purple} />
                <PastelChip label={report.workspaceName ? 'Workspace report' : 'Product report'} accent={appleColors.cyan} bg="#e4f9fd" />
              </Stack>
              <Typography sx={{ mt: 1, fontWeight: 950, fontSize: { xs: 18, md: 21 } }}>{report.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
                {report.summary}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>
            <MetricTile label="Ready signals" value={report.readyItems.length} detail="Supported by current context" accent={appleColors.green} icon={<CheckCircleOutlineOutlined />} />
            <MetricTile label="Risk items" value={report.riskItems.length} detail="Review before widening usage" accent={report.riskItems.length ? appleColors.red : appleColors.green} icon={<ErrorOutlineOutlined />} />
            <MetricTile label="Selected services" value={report.selectedServices.length} detail="Delivery work in scope" accent={appleColors.purple} icon={<RocketLaunchOutlined />} />
            <MetricTile label="Proof gaps" value={report.proofMissing.length} detail="Evidence still needed" accent={report.proofMissing.length ? appleColors.amber : appleColors.green} icon={<FactCheckOutlined />} />
          </Box>

          <Box sx={{ p: 1.35, borderRadius: 1, border: '1px solid', borderColor: '#dbeafe', bgcolor: '#fbfdff' }}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <AutoAwesomeOutlined sx={{ color: appleColors.purple, mt: 0.25 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Next owner decision</Typography>
                <Typography sx={{ mt: 0.35, fontWeight: 900, lineHeight: 1.55 }}>
                  {report.nextOwnerDecision || 'Decide the next practical product move from the latest diagnosis.'}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
            <ReportList title="What looks supported" items={report.readyItems} accent={appleColors.green} empty="No supported launch signal has been captured yet." />
            <ReportList title="What still looks risky" items={report.riskItems} accent={appleColors.red} empty="No active risk items are visible in the latest report." />
            <ReportList title="Proof collected" items={report.proofCollected} accent={appleColors.blue} empty="Run scanners or attach proof to make this report stronger." />
            <ReportList title="Proof still needed" items={report.proofMissing} accent={appleColors.amber} empty="No missing proof is currently visible." />
          </Box>

          {report.selectedServices.length > 0 && (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {report.selectedServices.slice(0, 10).map((service) => (
                <PastelChip key={service} label={service} accent={appleColors.cyan} bg="#e4f9fd" />
              ))}
            </Stack>
          )}
        </Stack>
      ) : (
        <EmptyState label="No report generated yet. Generate one after product analysis, scanner mapping, or workspace evidence changes." />
      )}
    </Surface>
  );
}
