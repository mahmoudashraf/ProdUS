'use client';

import type { ReactNode } from 'react';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PastelChip, Surface, appleColors, formatLabel } from './PlatformComponents';
import type {
  PackageModule,
  ProjectWorkspace,
  ScannerRiskState,
  ScannerRiskSummary,
  ScannerRiskThread,
  SupportRequest,
  WorkspaceParticipant,
} from './types';

const activeRiskStates: ScannerRiskState[] = ['NEW', 'STILL_OPEN', 'RETURNED', 'READY_TO_CHECK', 'NEEDS_PROOF', 'INCOMPLETE_CHECK'];

interface WorkspaceOverviewFocusPanelProps {
  workspace: ProjectWorkspace;
  packageModules: PackageModule[];
  participantList: WorkspaceParticipant[];
  riskSummary?: ScannerRiskSummary | undefined;
  supportList: SupportRequest[];
  missingEvidenceCount: number;
  onOpenFindings: () => void;
  onOpenHandoff: () => void;
  onOpenTeam: () => void;
}

export default function WorkspaceOverviewFocusPanel({
  workspace,
  packageModules,
  participantList,
  riskSummary,
  supportList,
  missingEvidenceCount,
  onOpenFindings,
  onOpenHandoff,
  onOpenTeam,
}: WorkspaceOverviewFocusPanelProps) {
  const risks = riskSummary?.groups.flatMap((group) => group.risks) || [];
  const activeRisks = risks.filter((risk) => activeRiskStates.includes(risk.currentState));
  const fixedRisks = risks.filter((risk) => risk.currentState === 'FIXED_BY_LATEST_SCAN');
  const recentRisks = [...activeRisks, ...fixedRisks]
    .sort((a, b) => timestamp(b.updatedAt || b.createdAt) - timestamp(a.updatedAt || a.createdAt))
    .slice(0, 3);
  const visibleModules = [...packageModules]
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .slice(0, 4);
  const requiredModuleCount = packageModules.filter((module) => module.required).length;
  const activeParticipants = participantList.filter((participant) => participant.active);
  const supportTeams = uniqueSupportTeams(supportList);
  const hasPeople = activeParticipants.length > 0 || supportTeams.length > 0;
  const answer = answerForWorkspace({
    activeRiskCount: activeRisks.length,
    missingEvidenceCount,
    packageModuleCount: packageModules.length,
    peopleAssigned: hasPeople,
  });

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fffb 100%)' }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ lg: 'flex-start' }}>
          <Box sx={{ minWidth: 0 }}>
            <PastelChip label="Workspace answer" accent={answer.accent} bg={answer.bg} />
            <Typography variant="h3" sx={{ mt: 0.9, fontSize: { xs: 24, md: 30 }, maxWidth: 760 }}>
              {answer.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65, maxWidth: 820 }}>
              {answer.detail}
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} spacing={1} sx={{ width: { xs: '100%', lg: 230 }, flex: '0 0 auto' }}>
            <Button variant="contained" onClick={answer.primaryAction === 'team' ? onOpenTeam : answer.primaryAction === 'handoff' ? onOpenHandoff : onOpenFindings} sx={{ minHeight: 42 }}>
              {answer.button}
            </Button>
            <Button variant="outlined" onClick={onOpenTeam} sx={{ minHeight: 42 }}>
              People and help
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr 1fr 1fr' }, gap: 1.25 }}>
          <AnswerBlock
            icon={<WarningAmberOutlined fontSize="small" />}
            title="Findings in this workspace"
            accent={activeRisks.length ? appleColors.red : fixedRisks.length ? appleColors.green : appleColors.blue}
            actionLabel="Open findings"
            onAction={onOpenFindings}
            chips={[
              `${activeRisks.length} current`,
              fixedRisks.length ? `${fixedRisks.length} fixed` : '',
            ].filter(Boolean)}
          >
            {recentRisks.length ? (
              <Stack spacing={0.8}>
                {recentRisks.map((risk) => <FindingLine key={risk.id} risk={risk} />)}
              </Stack>
            ) : (
              <EmptyCopy text="No scanner findings have been assigned to this workspace yet." />
            )}
          </AnswerBlock>

          <AnswerBlock
            icon={<LocalOfferOutlined fontSize="small" />}
            title="Services included"
            accent={packageModules.length ? appleColors.purple : appleColors.amber}
            chips={[
              packageModules.length ? `${packageModules.length} selected` : 'No service list',
              requiredModuleCount ? `${requiredModuleCount} required` : '',
            ].filter(Boolean)}
          >
            {visibleModules.length ? (
              <Stack spacing={0.8}>
                {visibleModules.map((module) => (
                  <Box key={module.id}>
                    <Typography variant="body2" sx={{ fontWeight: 850 }}>{module.serviceModule.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatLabel(module.status)}{module.required ? ' · required' : ''}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <EmptyCopy text={workspace.packageInstance?.name || 'Service scope is not attached yet.'} />
            )}
          </AnswerBlock>

          <AnswerBlock
            icon={<GroupsOutlined fontSize="small" />}
            title="People assigned"
            accent={hasPeople ? appleColors.cyan : appleColors.amber}
            actionLabel="Manage people"
            onAction={onOpenTeam}
            chips={[
              `${activeParticipants.length} participants`,
              supportTeams.length ? `${supportTeams.length} team${supportTeams.length === 1 ? '' : 's'}` : '',
            ].filter(Boolean)}
          >
            {hasPeople ? (
              <Stack spacing={0.8}>
                {activeParticipants.slice(0, 3).map((participant) => (
                  <Box key={participant.id}>
                    <Typography variant="body2" sx={{ fontWeight: 850, overflowWrap: 'anywhere' }}>{participant.user.email}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatLabel(participant.role)}</Typography>
                  </Box>
                ))}
                {supportTeams.slice(0, 2).map((team) => (
                  <Box key={team.id}>
                    <Typography variant="body2" sx={{ fontWeight: 850 }}>{team.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Support team</Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <EmptyCopy text="No team, expert, or participant is assigned yet." />
            )}
          </AnswerBlock>
        </Box>
      </Stack>
    </Surface>
  );
}

function AnswerBlock({
  actionLabel,
  accent,
  children,
  chips,
  icon,
  onAction,
  title,
}: {
  actionLabel?: string;
  accent: string;
  children: ReactNode;
  chips: string[];
  icon: ReactNode;
  onAction?: () => void;
  title: string;
}) {
  return (
    <Box sx={{ border: '1px solid', borderColor: `${accent}35`, borderRadius: 1, bgcolor: '#fff', p: 1.25, minHeight: 246 }}>
      <Stack spacing={1.1}>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: `${accent}12`, color: accent, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
            {icon}
          </Box>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
            {chips.map((chip) => <PastelChip key={chip} label={chip} accent={accent} bg={`${accent}12`} />)}
          </Stack>
        </Stack>
        <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>{title}</Typography>
        {children}
        {actionLabel && onAction && (
          <Button variant="text" onClick={onAction} sx={{ alignSelf: 'flex-start', px: 0 }}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
}

function FindingLine({ risk }: { risk: ScannerRiskThread }) {
  const fixed = risk.currentState === 'FIXED_BY_LATEST_SCAN';
  const accent = fixed ? appleColors.green : risk.severity === 'CRITICAL' || risk.severity === 'HIGH' ? appleColors.red : appleColors.amber;
  return (
    <Box sx={{ borderTop: '1px solid', borderColor: appleColors.line, pt: 0.8 }}>
      <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="space-between">
        <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.35 }}>{risk.title}</Typography>
        <PastelChip label={fixed ? 'Fixed' : formatLabel(risk.currentState)} accent={accent} bg={`${accent}12`} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
        {[risk.sourceTool, risk.recommendedModule?.name, risk.affectedComponent].filter(Boolean).join(' · ') || risk.severity}
      </Typography>
    </Box>
  );
}

function EmptyCopy({ text }: { text: string }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
      {text}
    </Typography>
  );
}

function timestamp(value?: string) {
  return value ? new Date(value).getTime() || 0 : 0;
}

function uniqueSupportTeams(supportList: SupportRequest[]) {
  const byId = new Map<string, SupportRequest['team']>();
  supportList.forEach((request) => {
    if (request.team?.id) byId.set(request.team.id, request.team);
  });
  return Array.from(byId.values());
}

function answerForWorkspace({
  activeRiskCount,
  missingEvidenceCount,
  packageModuleCount,
  peopleAssigned,
}: {
  activeRiskCount: number;
  missingEvidenceCount: number;
  packageModuleCount: number;
  peopleAssigned: boolean;
}) {
  if (activeRiskCount) {
    return {
      accent: appleColors.red,
      bg: '#fff1f1',
      button: 'Review findings',
      detail: `${activeRiskCount} scanner finding${activeRiskCount === 1 ? '' : 's'} are assigned to this workspace. Handle these before treating the workspace as launch-ready.`,
      primaryAction: 'findings' as const,
      title: 'Fix the assigned findings first.',
    };
  }
  if (missingEvidenceCount) {
    return {
      accent: appleColors.amber,
      bg: '#fff4dc',
      button: 'Review proof',
      detail: `${missingEvidenceCount} proof item${missingEvidenceCount === 1 ? '' : 's'} still need evidence. The next useful move is to attach or verify proof for the work already selected.`,
      primaryAction: 'findings' as const,
      title: 'Close the proof gaps before handoff.',
    };
  }
  if (!packageModuleCount) {
    return {
      accent: appleColors.amber,
      bg: '#fff4dc',
      button: 'Review services',
      detail: 'This workspace does not yet show a clear service scope. Confirm what work belongs here before assigning people or calling it delivery-ready.',
      primaryAction: 'findings' as const,
      title: 'Confirm the work scope.',
    };
  }
  if (!peopleAssigned) {
    return {
      accent: appleColors.amber,
      bg: '#fff4dc',
      button: 'Assign people',
      detail: 'The work scope is visible, but no team, expert, or participant is assigned yet. Add the people who will own the fixes and proof.',
      primaryAction: 'team' as const,
      title: 'Assign the people who will do the work.',
    };
  }
  return {
    accent: appleColors.green,
    bg: '#e7f8ee',
    button: 'Prepare handoff',
    detail: 'The workspace has findings, service scope, and people in one place. Keep proof current and prepare the next owner handoff when the work is ready.',
    primaryAction: 'handoff' as const,
    title: 'This workspace has a clear next path.',
  };
}
