'use client';

import {
  AssignmentTurnedInOutlined,
  FactCheckOutlined,
  GroupsOutlined,
  ListAltOutlined,
  LocalOfferOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import {
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type {
  Milestone,
  PackageModule,
  ProjectWorkspace,
  ScannerRiskSummary,
  SupportRequest,
  WorkspaceParticipant,
} from './types';

interface IWorkspaceCommandPlanPanelProps {
  milestoneList: Milestone[];
  packageModules: PackageModule[];
  participantList: WorkspaceParticipant[];
  riskSummary?: ScannerRiskSummary | undefined;
  supportList: SupportRequest[];
  workspace: ProjectWorkspace;
  onOpenFindings: () => void;
  onOpenMilestones: () => void;
  onOpenServices: () => void;
  onOpenTeam: () => void;
}

export default function WorkspaceCommandPlanPanel({
  milestoneList,
  packageModules,
  participantList,
  riskSummary,
  supportList,
  workspace,
  onOpenFindings,
  onOpenMilestones,
  onOpenServices,
  onOpenTeam,
}: IWorkspaceCommandPlanPanelProps) {
  const risks = riskSummary?.groups.flatMap(group => group.risks) || [];
  const currentRisks = risks.filter(
    risk => !['FIXED_BY_LATEST_SCAN', 'ACCEPTED_RISK', 'FALSE_POSITIVE'].includes(risk.currentState)
  );
  const openSupport = supportList.filter(
    request => !['RESOLVED', 'CANCELLED'].includes(request.status)
  );
  const firstMilestone = milestoneList[0];
  const planReady =
    packageModules.length > 0 && (participantList.length > 0 || openSupport.length > 0);

  return (
    <Stack spacing={2}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <PastelChip label="Plan work" accent={appleColors.purple} bg="#f3edff" />
              <PastelChip
                label={planReady ? 'Ready to coordinate' : 'Needs a next choice'}
                accent={planReady ? appleColors.green : appleColors.amber}
                bg={planReady ? '#e7f8ee' : '#fff4dc'}
              />
              <StatusChip label={workspace.status} />
            </Stack>
            <Typography variant="h3" sx={{ mt: 1 }}>
              What this workspace is doing now
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.6, maxWidth: 820 }}>
              Keep the plan small and practical: selected services, selected findings, people, and
              the next workspace steps. Use this page to decide what to add before work moves
              forward.
            </Typography>
          </Box>
          <Stack spacing={1} sx={{ minWidth: { lg: 230 } }}>
            <Button
              variant="contained"
              onClick={packageModules.length ? onOpenFindings : onOpenServices}
              sx={{ minHeight: 42 }}
            >
              {packageModules.length ? 'Review selected fixes' : 'Add first service'}
            </Button>
            <Button variant="outlined" onClick={onOpenMilestones} sx={{ minHeight: 40 }}>
              Open milestones
            </Button>
          </Stack>
        </Stack>
      </Surface>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.25,
        }}
      >
        <PlanAnswerCard
          accent={packageModules.length ? appleColors.purple : appleColors.amber}
          icon={<LocalOfferOutlined />}
          title="Services selected"
          value={`${packageModules.length} service${packageModules.length === 1 ? '' : 's'}`}
          detail={
            packageModules.length
              ? packageModules
                  .slice(0, 3)
                  .map(module => module.serviceModule.name)
                  .join(' · ')
              : 'No services selected yet.'
          }
          actionLabel={packageModules.length ? 'Manage services' : 'Browse services'}
          onAction={onOpenServices}
        />
        <PlanAnswerCard
          accent={currentRisks.length ? appleColors.amber : appleColors.green}
          icon={<FactCheckOutlined />}
          title="Findings driving the work"
          value={`${currentRisks.length} current finding${currentRisks.length === 1 ? '' : 's'}`}
          detail={
            currentRisks[0]?.businessRisk ||
            currentRisks[0]?.description ||
            currentRisks[0]?.title ||
            'No active scanner finding is assigned to this workspace.'
          }
          actionLabel="Open findings"
          onAction={onOpenFindings}
        />
        <PlanAnswerCard
          accent={
            participantList.length || openSupport.length ? appleColors.cyan : appleColors.amber
          }
          icon={<GroupsOutlined />}
          title="People attached"
          value={`${participantList.length} people · ${openSupport.length} team ask${openSupport.length === 1 ? '' : 's'}`}
          detail={
            participantList[0]?.user.email ||
            openSupport[0]?.team?.name ||
            'No person or team is attached yet.'
          }
          actionLabel="Manage people"
          onAction={onOpenTeam}
        />
        <PlanAnswerCard
          accent={milestoneList.length ? appleColors.green : appleColors.amber}
          icon={<AssignmentTurnedInOutlined />}
          title="Next steps"
          value={`${milestoneList.length} milestone${milestoneList.length === 1 ? '' : 's'}`}
          detail={
            firstMilestone
              ? `${firstMilestone.title} · ${formatLabel(firstMilestone.status)}`
              : 'No milestone exists yet. Add one when the next work step is clear.'
          }
          actionLabel="Open milestones"
          onAction={onOpenMilestones}
        />
      </Box>

      <Surface>
        <SectionTitle
          title="Plan snapshot"
          action={
            <PastelChip
              label={
                currentRisks.length ? `${currentRisks.length} fixes to plan` : 'No active fixes'
              }
              accent={currentRisks.length ? appleColors.amber : appleColors.green}
              bg={currentRisks.length ? '#fff4dc' : '#e7f8ee'}
            />
          }
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
            gap: 1,
            mt: 1.25,
          }}
        >
          <PlanList
            emptyLabel="No selected service yet."
            items={packageModules.slice(0, 4).map(module => ({
              title: module.serviceModule.name,
              detail:
                module.rationale ||
                module.serviceModule.ownerOutcome ||
                module.serviceModule.category?.name ||
                'Workspace service',
              accent: module.required ? appleColors.green : appleColors.blue,
            }))}
            title="Selected services"
          />
          <PlanList
            emptyLabel="No assigned finding yet."
            items={currentRisks.slice(0, 4).map(risk => ({
              title: risk.title,
              detail: risk.recommendedModule?.name || risk.sourceTool || 'Needs service owner',
              accent:
                risk.severity === 'HIGH' || risk.severity === 'CRITICAL'
                  ? appleColors.red
                  : appleColors.amber,
            }))}
            title="Findings"
          />
          <PlanList
            emptyLabel="No milestone yet."
            items={milestoneList.slice(0, 4).map(milestone => ({
              title: milestone.title,
              detail: `${formatLabel(milestone.status)}${milestone.dueDate ? ` · due ${milestone.dueDate}` : ''}`,
              accent: milestone.status === 'BLOCKED' ? appleColors.red : appleColors.green,
            }))}
            title="Milestones"
          />
        </Box>
      </Surface>
    </Stack>
  );
}

function PlanAnswerCard({
  accent,
  actionLabel,
  detail,
  icon,
  onAction,
  title,
  value,
}: {
  accent: string;
  actionLabel: string;
  detail: string;
  icon: ReactNode;
  onAction: () => void;
  title: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: `${accent}30`,
        borderRadius: 1,
        bgcolor: '#fff',
        p: 1.35,
        minHeight: 188,
      }}
    >
      <Stack spacing={1} sx={{ height: '100%' }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1,
              bgcolor: `${accent}12`,
              color: accent,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <PastelChip label={title} accent={accent} bg={`${accent}12`} />
        </Stack>
        <Typography variant="h4">{value}</Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.5, overflowWrap: 'anywhere' }}>
          {detail}
        </Typography>
        <Button
          variant="outlined"
          onClick={onAction}
          sx={{ mt: 'auto', alignSelf: 'flex-start', minHeight: 38 }}
        >
          {actionLabel}
        </Button>
      </Stack>
    </Box>
  );
}

function PlanList({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string;
  items: { title: string; detail: string; accent: string }[];
  title: string;
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: appleColors.line,
        borderRadius: 1,
        bgcolor: '#fff',
        p: 1,
        minHeight: 220,
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <ListAltOutlined sx={{ color: appleColors.purple }} />
          <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
        </Stack>
        {items.length ? (
          items.map(item => (
            <Box
              key={`${item.title}-${item.detail}`}
              sx={{ borderTop: '1px solid', borderColor: appleColors.line, pt: 0.85 }}
            >
              <Stack direction="row" spacing={0.8} alignItems="flex-start">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: item.accent,
                    flex: '0 0 auto',
                    mt: 0.7,
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 900, overflowWrap: 'anywhere' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    {item.detail}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))
        ) : (
          <EmptyState label={emptyLabel} />
        )}
      </Stack>
    </Box>
  );
}
