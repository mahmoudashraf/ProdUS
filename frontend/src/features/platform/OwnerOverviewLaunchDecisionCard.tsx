'use client';

import {
  AddTaskOutlined,
  BugReportOutlined,
  EventRepeatOutlined,
  FactCheckOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  MetricTile,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { OwnerLaunchStatus } from './ownerWorkspaceModel';

export default function OwnerOverviewLaunchDecisionCard({
  launchStatus,
  latestCompletedTools,
  totalScanTools,
  topRecommendedServiceName,
  onOpenServicesRecommend,
  onOpenFindingsEvidence,
  onOpenTimeline,
}: {
  launchStatus: OwnerLaunchStatus;
  latestCompletedTools: number;
  totalScanTools: number;
  topRecommendedServiceName: string;
  onOpenServicesRecommend: () => void;
  onOpenFindingsEvidence: () => void;
  onOpenTimeline: () => void;
}) {
  return (
    <Surface>
      <SectionTitle
        title="Launch Decision"
        action={<PastelChip label={launchStatus.confidence} accent={launchStatus.accent} bg={`${launchStatus.accent}12`} />}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' }, gap: 2, alignItems: 'start' }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h3" sx={{ color: launchStatus.accent }}>{launchStatus.headline}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              The canonical readiness score is shown once in the page header. These counts explain the verdict.
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.75, fontWeight: 700 }}>
            {launchStatus.reason}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
            <MetricTile label="Blockers" value={launchStatus.blockerCount} detail="Must fix before launch" accent={launchStatus.blockerCount ? appleColors.red : appleColors.green} icon={<BugReportOutlined />} />
            <MetricTile label="Improvements" value={launchStatus.improvementCount} detail="Can be scheduled" accent={launchStatus.improvementCount ? appleColors.amber : appleColors.green} icon={<FactCheckOutlined />} />
            <MetricTile label="Proof checks" value={`${latestCompletedTools}/${totalScanTools}`} detail="Completed scanner tools" accent={latestCompletedTools === totalScanTools ? appleColors.green : appleColors.amber} icon={<ShieldOutlined />} />
          </Box>
        </Stack>
        <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: '#fbfdff' }}>
          <Typography variant="caption" color="text.secondary">Primary next step</Typography>
          <Typography variant="h4" sx={{ mt: 0.5 }}>{launchStatus.blockerCount ? 'Fix launch blockers' : topRecommendedServiceName ? 'Confirm launch plan' : 'Add proof'}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
            {topRecommendedServiceName
              ? `${topRecommendedServiceName} should carry the highest-priority action so the service plan follows the verdict.`
              : 'Connect proof or run the full scanner suite so ProdUS can make a stronger launch call.'}
          </Typography>
          <Button
            variant="contained"
            startIcon={topRecommendedServiceName ? <AddTaskOutlined /> : <ShieldOutlined />}
            onClick={topRecommendedServiceName ? onOpenServicesRecommend : onOpenFindingsEvidence}
            sx={{ mt: 1.25, minHeight: 40 }}
          >
            {topRecommendedServiceName ? 'Review service path' : 'Open proof'}
          </Button>
          <Button
            variant="text"
            startIcon={<EventRepeatOutlined />}
            onClick={onOpenTimeline}
            sx={{ mt: 0.75, minHeight: 36, alignSelf: 'flex-start' }}
          >
            View product timeline
          </Button>
        </Box>
      </Box>
    </Surface>
  );
}
