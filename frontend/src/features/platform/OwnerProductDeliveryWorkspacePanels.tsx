'use client';

import {
  AssignmentTurnedInOutlined,
  ChatBubbleOutlineOutlined,
  FactCheckOutlined,
  GroupsOutlined,
  HandshakeOutlined,
  LocalOfferOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import NextLink from 'next/link';

import {
  DotLabel,
  PastelChip,
  ProgressRing,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import type {
  PackageModule,
  ProductProfile,
  ProjectWorkspace,
  ScannerRiskSummary,
  SupportRequest,
  WorkspaceParticipant,
} from './types';
import type { WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import { workspaceAccent } from './workspaceCommandTeamTypes';
import WorkspaceOverviewFocusPanel from './WorkspaceOverviewFocusPanel';

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
  onPlanWork,
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
  onPlanWork: () => void;
}) {
  const accent = workspaceAccent(activeWorkspace.status);

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5fbf8 100%)' }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={2.5}
        alignItems={{ lg: 'center' }}
        justifyContent="space-between"
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
          sx={{ minWidth: 0 }}
        >
          <ProgressRing value={workspaceProgress} size={104} color={accent} label="done" />
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <PastelChip label="Product work room" accent={appleColors.green} bg="#e7f8ee" />
              <StatusChip label={activeWorkspace.status} />
            </Stack>
            <Typography
              variant="h2"
              sx={{ mt: 1, fontSize: { xs: 28, md: 34 }, overflowWrap: 'anywhere' }}
            >
              {activeWorkspace.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65, maxWidth: 780 }}>
              {activeWorkspace.packageInstance?.name || 'Workspace plan'} for {product.name}. This
              is where selected services, fixes, people, proof, and handoff become practical product
              work.
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={1} sx={{ minWidth: { lg: 240 } }}>
          <Button variant="contained" onClick={onNextAction} sx={{ minHeight: 44 }}>
            Next delivery action
          </Button>
          <Button variant="outlined" onClick={onPlanWork} sx={{ minHeight: 44 }}>
            Plan work
          </Button>
          {workspaceCount > 1 && (
            <Button component={NextLink} href={listHref} variant="text" sx={{ minHeight: 40 }}>
              Switch workspace
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
        <DotLabel
          label={`${completedMilestones}/${milestoneCount || 0} checkpoints done`}
          color={accent}
        />
        <DotLabel label={`${deliverableCount} fixes`} color={appleColors.green} />
        <DotLabel label={`${proofFileCount} proof files`} color={appleColors.blue} />
        <DotLabel label={`${participantCount} people`} color={appleColors.cyan} />
        <DotLabel
          label={`${readinessBlockers + missingEvidenceCount + roughEdgeCount} items need attention`}
          color={
            readinessBlockers + missingEvidenceCount + roughEdgeCount
              ? appleColors.amber
              : appleColors.green
          }
        />
      </Stack>
    </Surface>
  );
}

export function DeliveryJourneyCards({
  assignedFindingCount,
  currentView,
  handoffReady,
  integrationCount,
  milestoneCount,
  missingEvidenceCount,
  participantCount,
  readinessBlockers,
  roughEdgeCount,
  serviceCount,
  supportCount,
  onChange,
}: {
  assignedFindingCount: number;
  currentView: WorkspaceCommandView;
  handoffReady: boolean;
  integrationCount: number;
  milestoneCount: number;
  missingEvidenceCount: number;
  participantCount: number;
  readinessBlockers: number;
  roughEdgeCount: number;
  serviceCount: number;
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
      value: 'plan' as const,
      title: 'Plan work',
      detail: 'See services, findings, people, and steps together before changing scope.',
      meta: `${serviceCount} services`,
      accent: serviceCount || assignedFindingCount ? appleColors.purple : appleColors.amber,
      icon: <AssignmentTurnedInOutlined />,
    },
    {
      value: 'services' as const,
      title: 'Services',
      detail: 'Choose what work belongs in this workspace.',
      meta: `${serviceCount} selected`,
      accent: serviceCount ? appleColors.purple : appleColors.amber,
      icon: <LocalOfferOutlined />,
    },
    {
      value: 'proof' as const,
      title: 'Findings & proof',
      detail: 'Assigned scanner findings, fix steps, proof files, and acceptance checks.',
      meta: assignedFindingCount
        ? `${assignedFindingCount} finding${assignedFindingCount === 1 ? '' : 's'}`
        : `${readinessBlockers + missingEvidenceCount} gaps`,
      accent:
        assignedFindingCount || readinessBlockers
          ? appleColors.red
          : missingEvidenceCount
            ? appleColors.amber
            : appleColors.blue,
      icon: <FactCheckOutlined />,
    },
    {
      value: 'team' as const,
      title: 'People & help',
      detail: 'People, support asks, and delivery concerns.',
      meta: `${participantCount} people`,
      accent: roughEdgeCount || supportCount ? appleColors.amber : appleColors.cyan,
      icon: <GroupsOutlined />,
    },
    {
      value: 'chat' as const,
      title: 'Workspace chat',
      detail: 'Discuss decisions and mention the findings being fixed.',
      meta: 'Team updates',
      accent: appleColors.cyan,
      icon: <ChatBubbleOutlineOutlined />,
    },
    {
      value: 'milestones' as const,
      title: 'Steps',
      detail: 'Workspace steps, outputs, proof links, and acceptance progress.',
      meta: `${milestoneCount} steps`,
      accent: milestoneCount ? appleColors.green : appleColors.amber,
      icon: <AssignmentTurnedInOutlined />,
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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(2, minmax(0, 1fr))',
          xl: 'repeat(4, minmax(0, 1fr))',
        },
        gap: 1.25,
      }}
    >
      {items.map(item => {
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
              boxShadow: selected
                ? `0 18px 34px ${item.accent}16`
                : '0 10px 24px rgba(15, 23, 42, 0.04)',
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
  missingEvidenceCount,
  packageModules,
  participantList,
  riskSummary,
  supportList,
  onManageTeam,
  onManageServices,
  onPrepareHandoff,
  onReviewProof,
}: {
  activeWorkspace: ProjectWorkspace;
  missingEvidenceCount: number;
  packageModules: PackageModule[];
  participantList: WorkspaceParticipant[];
  riskSummary?: ScannerRiskSummary | undefined;
  supportList: SupportRequest[];
  onManageTeam: () => void;
  onManageServices: () => void;
  onPrepareHandoff: () => void;
  onReviewProof: () => void;
}) {
  return (
    <WorkspaceOverviewFocusPanel
      workspace={activeWorkspace}
      packageModules={packageModules}
      participantList={participantList}
      riskSummary={riskSummary}
      supportList={supportList}
      missingEvidenceCount={missingEvidenceCount}
      onOpenFindings={onReviewProof}
      onOpenHandoff={onPrepareHandoff}
      onOpenServices={onManageServices}
      onOpenTeam={onManageTeam}
    />
  );
}
