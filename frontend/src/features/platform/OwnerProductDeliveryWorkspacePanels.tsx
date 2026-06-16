'use client';

import {
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
  assignedFindingCount,
  listHref,
  milestoneCount,
  missingEvidenceCount,
  participantCount,
  product,
  readinessBlockers,
  roughEdgeCount,
  serviceCount,
  workspaceCount,
  workspaceProgress,
  onNextAction,
  onWorkScope,
}: {
  activeWorkspace: ProjectWorkspace;
  completedMilestones: number;
  assignedFindingCount: number;
  listHref: string;
  milestoneCount: number;
  missingEvidenceCount: number;
  participantCount: number;
  product: ProductProfile;
  readinessBlockers: number;
  roughEdgeCount: number;
  serviceCount: number;
  workspaceCount: number;
  workspaceProgress: number;
  onNextAction: () => void;
  onWorkScope: () => void;
}) {
  const accent = workspaceAccent(activeWorkspace.status);
  const attentionCount = readinessBlockers + missingEvidenceCount + roughEdgeCount;
  const nextActionLabel = nextActionForWorkspace({
    assignedFindingCount,
    missingEvidenceCount,
    participantCount,
    roughEdgeCount,
    serviceCount,
  });
  const phaseLabel = phaseForWorkspace({
    assignedFindingCount,
    missingEvidenceCount,
    participantCount,
    serviceCount,
  });

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
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
          <ProgressRing value={workspaceProgress} size={104} color={accent} label="verified" />
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <PastelChip label="Workspace operating room" accent={appleColors.green} bg="#e7f8ee" />
              <PastelChip label={phaseLabel} accent={attentionCount ? appleColors.amber : appleColors.green} bg={attentionCount ? '#fff4dc' : '#e7f8ee'} />
              <StatusChip label={activeWorkspace.status} />
            </Stack>
            <Typography
              variant="h2"
              sx={{ mt: 1, fontSize: { xs: 28, md: 34 }, overflowWrap: 'anywhere' }}
            >
              {activeWorkspace.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65, maxWidth: 780 }}>
              {summaryForWorkspace({
                activeWorkspace,
                assignedFindingCount,
                missingEvidenceCount,
                participantCount,
                productName: product.name,
                serviceCount,
              })}
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={1} sx={{ minWidth: { lg: 240 } }}>
          <Button variant="contained" onClick={onNextAction} sx={{ minHeight: 44 }}>
            {nextActionLabel}
          </Button>
          <Button variant="outlined" onClick={onWorkScope} sx={{ minHeight: 44 }}>
            Adjust work scope
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
          label={`${assignedFindingCount} finding${assignedFindingCount === 1 ? '' : 's'} in scope`}
          color={accent}
        />
        <DotLabel label={`${serviceCount} service${serviceCount === 1 ? '' : 's'}`} color={appleColors.purple} />
        <DotLabel label={`${participantCount} people`} color={appleColors.cyan} />
        <DotLabel
          label={`${completedMilestones}/${milestoneCount || 0} ready checks`}
          color={completedMilestones ? appleColors.green : appleColors.muted}
        />
        <DotLabel
          label={`${attentionCount} item${attentionCount === 1 ? '' : 's'} need attention`}
          color={
            attentionCount ? appleColors.amber : appleColors.green
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
      value: 'services' as const,
      title: 'Work scope',
      detail: 'Services, included findings, and lightweight checklists for this workspace.',
      meta: `${serviceCount} service${serviceCount === 1 ? '' : 's'}`,
      accent: serviceCount ? appleColors.purple : appleColors.amber,
      icon: <LocalOfferOutlined />,
    },
    {
      value: 'proof' as const,
      title: 'Fix and verify',
      detail: 'Service-owned findings, proof state, and targeted Check fixes.',
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
      title: 'People',
      detail: 'Owners, participants, team help, and unowned work.',
      meta: `${participantCount} people`,
      accent: roughEdgeCount || supportCount ? appleColors.amber : appleColors.cyan,
      icon: <GroupsOutlined />,
    },
    {
      value: 'chat' as const,
      title: 'Discussion / decisions',
      detail: 'Workspace-attached decisions with finding and service mentions.',
      meta: 'Workspace log',
      accent: appleColors.cyan,
      icon: <ChatBubbleOutlineOutlined />,
    },
    {
      value: 'handoff' as const,
      title: 'Handoff',
      detail: 'Final continuity notes once fixes, proof, and ownership are clear.',
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
          xl: 'repeat(5, minmax(0, 1fr))',
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
              minHeight: 142,
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

function phaseForWorkspace({
  assignedFindingCount,
  missingEvidenceCount,
  participantCount,
  serviceCount,
}: {
  assignedFindingCount: number;
  missingEvidenceCount: number;
  participantCount: number;
  serviceCount: number;
}) {
  if (!serviceCount) return 'Scope planning';
  if (assignedFindingCount) return 'Fix and verify';
  if (missingEvidenceCount) return 'Proof needed';
  if (!participantCount) return 'Needs owner';
  return 'Handoff prep';
}

function nextActionForWorkspace({
  assignedFindingCount,
  missingEvidenceCount,
  participantCount,
  roughEdgeCount,
  serviceCount,
}: {
  assignedFindingCount: number;
  missingEvidenceCount: number;
  participantCount: number;
  roughEdgeCount: number;
  serviceCount: number;
}) {
  if (!serviceCount) return 'Choose work scope';
  if (assignedFindingCount || missingEvidenceCount) return 'Fix and verify';
  if (!participantCount || roughEdgeCount) return 'Assign people';
  return 'Prepare handoff';
}

function summaryForWorkspace({
  activeWorkspace,
  assignedFindingCount,
  missingEvidenceCount,
  participantCount,
  productName,
  serviceCount,
}: {
  activeWorkspace: ProjectWorkspace;
  assignedFindingCount: number;
  missingEvidenceCount: number;
  participantCount: number;
  productName: string;
  serviceCount: number;
}) {
  const planName = activeWorkspace.packageInstance?.name || 'Workspace plan';
  if (!serviceCount) {
    return `${planName} for ${productName}. Start by choosing the services this workspace owns, then bring findings under those services.`;
  }
  if (assignedFindingCount) {
    return `${planName} for ${productName}. ${assignedFindingCount} finding${assignedFindingCount === 1 ? '' : 's'} are in scope across ${serviceCount} service${serviceCount === 1 ? '' : 's'}; verify the fixes before handoff.`;
  }
  if (missingEvidenceCount) {
    return `${planName} for ${productName}. The work scope is selected, but ${missingEvidenceCount} proof item${missingEvidenceCount === 1 ? '' : 's'} still need evidence or a check.`;
  }
  if (!participantCount) {
    return `${planName} for ${productName}. The work scope is selected; assign people or team help before work moves forward.`;
  }
  return `${planName} for ${productName}. Scope, people, and proof are organized enough to prepare the next handoff decision.`;
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
