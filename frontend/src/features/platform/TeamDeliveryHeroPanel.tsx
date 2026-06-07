'use client';

import {
  AssignmentTurnedInOutlined,
  CheckCircleOutlineOutlined,
  EngineeringOutlined,
  StarOutlineOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import {
  MetricTile,
  PastelChip,
  ProgressRing,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { QuoteProposal, SupportRequest, Team } from './types';

export default function TeamDeliveryHeroPanel({
  selectedTeam,
  fallbackRole,
  score,
  teamProposals,
  activeWorkspaceCount,
  blockedWorkspaceCount,
  teamSupport,
  overdueSupportCount,
  averageRating,
}: {
  selectedTeam?: Team | undefined;
  fallbackRole?: string | undefined;
  score: number;
  teamProposals: QuoteProposal[];
  activeWorkspaceCount: number;
  blockedWorkspaceCount: number;
  teamSupport: SupportRequest[];
  overdueSupportCount: number;
  averageRating: string;
}) {
  return (
    <Stack spacing={2.5}>
      <Surface>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems={{ lg: 'center' }} justifyContent="space-between">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <Box sx={{ width: 64, height: 64, borderRadius: 1, bgcolor: '#e4f9fd', color: appleColors.cyan, display: 'grid', placeItems: 'center' }}>
              <EngineeringOutlined />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h2">{selectedTeam?.name || `${formatLabel(fallbackRole)} Workspace`}</Typography>
                {selectedTeam && <PastelChip label={formatLabel(selectedTeam.verificationStatus)} accent={appleColors.green} />}
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 760, lineHeight: 1.7 }}>
                {selectedTeam?.capabilitiesSummary || 'Track scoped opportunities, evidence, milestones, and owner commitments from one team-side surface.'}
              </Typography>
            </Box>
          </Stack>
          <ProgressRing value={score || 72} size={104} color={appleColors.cyan} label="profile" />
        </Stack>
      </Surface>

      <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: { md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <MetricTile label="Open proposals" value={teamProposals.filter((proposal) => proposal.status === 'SUBMITTED').length} detail={`${teamProposals.length} total proposals`} accent={appleColors.purple} icon={<AssignmentTurnedInOutlined />} />
        <MetricTile label="Active deliveries" value={activeWorkspaceCount} detail={`${blockedWorkspaceCount} blocked`} accent={blockedWorkspaceCount ? appleColors.red : appleColors.green} icon={<CheckCircleOutlineOutlined />} />
        <MetricTile label="Support risk" value={overdueSupportCount} detail={`${teamSupport.length} support requests`} accent={overdueSupportCount ? appleColors.red : appleColors.amber} icon={<WarningAmberOutlined />} />
        <MetricTile label="Reputation" value={averageRating} detail="Verified events" accent={appleColors.cyan} icon={<StarOutlineOutlined />} />
      </Box>
    </Stack>
  );
}
