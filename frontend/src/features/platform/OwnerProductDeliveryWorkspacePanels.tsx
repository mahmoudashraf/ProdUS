'use client';

import NextLink from 'next/link';
import {
  AssignmentTurnedInOutlined,
  FactCheckOutlined,
  GroupsOutlined,
  HandshakeOutlined,
} from '@mui/icons-material';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  PastelChip,
  ProgressRing,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import type { WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import type { AcceptanceCriterion, Deliverable, Milestone, ProductProfile, ProjectWorkspace } from './types';
import { workspaceAccent } from './workspaceCommandTeamTypes';

export function DeliveryHero({
  activeWorkspace,
  completedMilestones,
  deliverableCount,
  listHref,
  milestoneCount,
  missingEvidenceCount,
  participantCount,
  product,
  proofFileCount,
  readinessBlockers,
  roughEdgeCount,
  workspaceCount,
  workspaceProgress,
  onNextAction,
}: {
  activeWorkspace: ProjectWorkspace;
  completedMilestones: number;
  deliverableCount: number;
  listHref: string;
  milestoneCount: number;
  missingEvidenceCount: number;
  participantCount: number;
  product: ProductProfile;
  proofFileCount: number;
  readinessBlockers: number;
  roughEdgeCount: number;
  workspaceCount: number;
  workspaceProgress: number;
  onNextAction: () => void;
}) {
  const accent = workspaceAccent(activeWorkspace.status);

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5fbf8 100%)' }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems={{ lg: 'center' }} justifyContent="space-between">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ minWidth: 0 }}>
          <ProgressRing value={workspaceProgress} size={104} color={accent} label="done" />
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <PastelChip label="Delivery for this product" accent={appleColors.green} bg="#e7f8ee" />
              <StatusChip label={activeWorkspace.status} />
            </Stack>
            <Typography variant="h2" sx={{ mt: 1, fontSize: { xs: 28, md: 34 }, overflowWrap: 'anywhere' }}>
              {activeWorkspace.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65, maxWidth: 780 }}>
              {activeWorkspace.packageInstance?.name || 'Approved Work Plan'} for {product.name}. This is where the product delivery work becomes checkpoints, proof, people, and handoff.
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={1} sx={{ minWidth: { lg: 240 } }}>
          <Button variant="contained" onClick={onNextAction} sx={{ minHeight: 44 }}>
            Next delivery action
          </Button>
          <Button component={NextLink} href={PROJECT_START_PLAN_HREF} variant="outlined" sx={{ minHeight: 44 }}>
            Review Planning
          </Button>
          {workspaceCount > 1 && (
            <Button component={NextLink} href={listHref} variant="text" sx={{ minHeight: 40 }}>
              Switch workspace
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
        <DotLabel label={`${completedMilestones}/${milestoneCount || 0} checkpoints done`} color={accent} />
        <DotLabel label={`${deliverableCount} fixes`} color={appleColors.green} />
        <DotLabel label={`${proofFileCount} proof files`} color={appleColors.blue} />
        <DotLabel label={`${participantCount} people`} color={appleColors.cyan} />
        <DotLabel label={`${readinessBlockers + missingEvidenceCount + roughEdgeCount} items need attention`} color={readinessBlockers + missingEvidenceCount + roughEdgeCount ? appleColors.amber : appleColors.green} />
      </Stack>
    </Surface>
  );
}

export function DeliveryJourneyCards({
  currentView,
  handoffReady,
  integrationCount,
  milestoneCount,
  missingEvidenceCount,
  participantCount,
  readinessBlockers,
  roughEdgeCount,
  supportCount,
  onChange,
}: {
  currentView: WorkspaceCommandView;
  handoffReady: boolean;
  integrationCount: number;
  milestoneCount: number;
  missingEvidenceCount: number;
  participantCount: number;
  readinessBlockers: number;
  roughEdgeCount: number;
  supportCount: number;
  onChange: (view: WorkspaceCommandView) => void;
}) {
  const items = [
    {
      value: 'overview' as const,
      title: 'Overview',
      detail: 'Current delivery status and the safest next move.',
      meta: `${milestoneCount} checkpoints`,
      accent: appleColors.green,
      icon: <AssignmentTurnedInOutlined />,
    },
    {
      value: 'proof' as const,
      title: 'Fixes & proof',
      detail: 'Priority fixes, steps, proof files, and acceptance checks.',
      meta: `${readinessBlockers + missingEvidenceCount} gaps`,
      accent: readinessBlockers ? appleColors.red : missingEvidenceCount ? appleColors.amber : appleColors.blue,
      icon: <FactCheckOutlined />,
    },
    {
      value: 'team' as const,
      title: 'Team & support',
      detail: 'People, support asks, and delivery risks.',
      meta: `${participantCount} people`,
      accent: roughEdgeCount || supportCount ? appleColors.amber : appleColors.cyan,
      icon: <GroupsOutlined />,
    },
    {
      value: 'handoff' as const,
      title: 'Handoff',
      detail: 'Runbook, health review, integration signals, and acceptance.',
      meta: handoffReady ? 'Ready' : `${integrationCount} signals`,
      accent: handoffReady ? appleColors.green : appleColors.purple,
      icon: <HandshakeOutlined />,
    },
  ];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25 }}>
      {items.map((item) => {
        const selected = currentView === item.value;
        return (
          <Box
            key={item.value}
            component="button"
            type="button"
            onClick={() => onChange(item.value)}
            sx={{
              appearance: 'none',
              border: '1px solid',
              borderColor: selected ? `${item.accent}85` : appleColors.line,
              borderRadius: 1.25,
              bgcolor: selected ? `${item.accent}10` : '#ffffff',
              boxShadow: selected ? `0 18px 34px ${item.accent}16` : '0 10px 24px rgba(15, 23, 42, 0.04)',
              color: 'inherit',
              cursor: 'pointer',
              display: 'block',
              minHeight: 156,
              minWidth: 0,
              p: 1.5,
              textAlign: 'left',
              transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
              '&:hover': {
                borderColor: `${item.accent}70`,
                boxShadow: `0 18px 34px ${item.accent}14`,
                transform: 'translateY(-1px)',
              },
              '&:focus-visible': {
                outline: `3px solid ${item.accent}35`,
                outlineOffset: 2,
              },
            }}
          >
            <Stack spacing={1.25} sx={{ minWidth: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Box sx={{ color: item.accent, display: 'flex' }}>{item.icon}</Box>
                <PastelChip label={item.meta} accent={item.accent} bg={`${item.accent}12`} />
              </Stack>
              <Typography sx={{ fontWeight: 950 }}>{item.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                {item.detail}
              </Typography>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}

export function DeliveryOverview({
  activeWorkspace,
  completedMilestones,
  deliverableList,
  milestoneCount,
  missingEvidenceCount,
  readinessBlockers,
  scannerEvidenceCount,
  selectedMilestone,
  selectedMilestoneCriteria,
  workspaceProgress,
  onPrepareHandoff,
  onReviewProof,
}: {
  activeWorkspace: ProjectWorkspace;
  completedMilestones: number;
  deliverableList: Deliverable[];
  milestoneCount: number;
  missingEvidenceCount: number;
  readinessBlockers: number;
  scannerEvidenceCount: number;
  selectedMilestone?: Milestone | undefined;
  selectedMilestoneCriteria: AcceptanceCriterion[];
  workspaceProgress: number;
  onPrepareHandoff: () => void;
  onReviewProof: () => void;
}) {
  const statusCopy = readinessBlockers
    ? `${readinessBlockers} priority fix${readinessBlockers === 1 ? '' : 'es'} should be handled before handoff.`
    : missingEvidenceCount
      ? `${missingEvidenceCount} proof gap${missingEvidenceCount === 1 ? '' : 's'} still need evidence.`
      : 'Delivery is on track for the next owner decision.';

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fffb 100%)' }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} justifyContent="space-between" alignItems={{ lg: 'center' }}>
        <Box sx={{ minWidth: 0 }}>
          <PastelChip label="Delivery overview" accent={appleColors.green} bg="#e7f8ee" />
          <Typography variant="h3" sx={{ mt: 1, fontSize: { xs: 23, md: 28 } }}>
            {statusCopy}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.85, lineHeight: 1.65, maxWidth: 760 }}>
            {selectedMilestone
              ? `Current checkpoint: ${selectedMilestone.title}. ${selectedMilestoneCriteria.length} acceptance check${selectedMilestoneCriteria.length === 1 ? '' : 's'} are tied to this checkpoint.`
              : `${activeWorkspace.name} has ${milestoneCount} delivery checkpoint${milestoneCount === 1 ? '' : 's'} recorded.`}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
            <PastelChip label={`${workspaceProgress}% complete`} accent={appleColors.green} bg="#e7f8ee" />
            <PastelChip label={`${completedMilestones}/${milestoneCount || 0} checkpoints done`} accent={appleColors.purple} bg="#f1efff" />
            <PastelChip label={`${deliverableList.length} fixes`} accent={appleColors.cyan} bg="#e4f9fd" />
            <PastelChip label={`${scannerEvidenceCount} scan proof`} accent={appleColors.blue} bg="#eaf3ff" />
          </Stack>
        </Box>
        <Stack spacing={1} sx={{ minWidth: { lg: 230 } }}>
          <Button variant="contained" onClick={onReviewProof} sx={{ minHeight: 42 }}>
            Review fixes & proof
          </Button>
          <Button variant="outlined" onClick={onPrepareHandoff} sx={{ minHeight: 42 }}>
            Prepare handoff
          </Button>
        </Stack>
      </Stack>
      {(milestoneCount > 0 || deliverableList.length > 0 || missingEvidenceCount > 0) && (
        <LinearProgress
          variant="determinate"
          value={Math.min(100, Math.max(0, workspaceProgress))}
          sx={{ mt: 2.25, height: 8, borderRadius: 99, bgcolor: '#e5eef7' }}
        />
      )}
    </Surface>
  );
}
