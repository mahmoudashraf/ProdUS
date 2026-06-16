'use client';

import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import { Avatar, Box, Button, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

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

const activeRiskStates: ScannerRiskState[] = [
  'NEW',
  'STILL_OPEN',
  'RETURNED',
  'READY_TO_CHECK',
  'NEEDS_PROOF',
  'INCOMPLETE_CHECK',
];

interface IWorkspaceOverviewFocusPanelProps {
  workspace: ProjectWorkspace;
  packageModules: PackageModule[];
  participantList: WorkspaceParticipant[];
  riskSummary?: ScannerRiskSummary | undefined;
  supportList: SupportRequest[];
  missingEvidenceCount: number;
  onOpenFindings: () => void;
  onOpenHandoff: () => void;
  onOpenServices: () => void;
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
  onOpenServices,
  onOpenTeam,
}: IWorkspaceOverviewFocusPanelProps) {
  const risks = riskSummary?.groups.flatMap(group => group.risks) || [];
  const activeRisks = risks.filter(risk => activeRiskStates.includes(risk.currentState));
  const fixedRisks = risks.filter(risk => risk.currentState === 'FIXED_BY_LATEST_SCAN');
  const recentRisks = [...activeRisks, ...fixedRisks]
    .sort((a, b) => timestamp(b.updatedAt || b.createdAt) - timestamp(a.updatedAt || a.createdAt))
    .slice(0, 3);
  const visibleModules = [...packageModules]
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .slice(0, 4);
  const requiredModuleCount = packageModules.filter(module => module.required).length;
  const activeParticipants = participantList.filter(participant => participant.active);
  const supportTeams = uniqueSupportTeams(supportList);
  const hasPeople = activeParticipants.length > 0 || supportTeams.length > 0;
  const answer = answerForWorkspace({
    activeRiskCount: activeRisks.length,
    missingEvidenceCount,
    packageModuleCount: packageModules.length,
    peopleAssigned: hasPeople,
  });
  const needsAttention = [
    activeRisks.length
      ? `${activeRisks.length} finding${activeRisks.length === 1 ? '' : 's'} need fix verification.`
      : '',
    missingEvidenceCount
      ? `${missingEvidenceCount} proof item${missingEvidenceCount === 1 ? '' : 's'} still need evidence or a check.`
      : '',
    packageModules.length ? '' : 'No service scope is selected yet.',
    hasPeople ? '' : 'No person, team, or expert owns the work yet.',
  ].filter(Boolean);

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 58%, #f6fffb 100%)' }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ lg: 'flex-start' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <PastelChip label="Workspace answer" accent={answer.accent} bg={answer.bg} />
            <Typography variant="h3" sx={{ mt: 0.9, fontSize: { xs: 24, md: 30 }, maxWidth: 760 }}>
              {answer.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65, maxWidth: 820 }}>
              {answer.detail}
            </Typography>
          </Box>
          <Stack
            direction={{ xs: 'column', sm: 'row', lg: 'column' }}
            spacing={1}
            sx={{ width: { xs: '100%', lg: 230 }, flex: '0 0 auto' }}
          >
            <Button
              variant="contained"
              onClick={
                answer.primaryAction === 'team'
                  ? onOpenTeam
                  : answer.primaryAction === 'handoff'
                    ? onOpenHandoff
                    : answer.primaryAction === 'services'
                      ? onOpenServices
                      : onOpenFindings
              }
              sx={{ minHeight: 42 }}
            >
              {answer.button}
            </Button>
            <Button variant="outlined" onClick={onOpenTeam} sx={{ minHeight: 42 }}>
              People
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            border: '1px solid',
            borderColor: needsAttention.length ? '#ffdba8' : '#bfe9d2',
            borderRadius: 1.25,
            bgcolor: needsAttention.length ? '#fffaf1' : '#f4fff8',
            p: 1.25,
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
            <PastelChip
              label={needsAttention.length ? 'Needs attention' : 'No urgent gaps'}
              accent={needsAttention.length ? appleColors.amber : appleColors.green}
              bg={needsAttention.length ? '#fff4dc' : '#e7f8ee'}
            />
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
              {needsAttention.length
                ? needsAttention.join(' ')
                : 'Workspace scope, people, and current risk state are organized enough for the next handoff decision.'}
            </Typography>
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.15fr 1fr 1fr' },
            gap: 1.35,
            alignItems: 'start',
          }}
        >
          <AnswerBlock
            icon={<WarningAmberOutlined fontSize="small" />}
            title="Findings"
            eyebrow="What needs attention"
            accent={
              activeRisks.length
                ? appleColors.red
                : fixedRisks.length
                  ? appleColors.green
                  : appleColors.blue
            }
            actionLabel="Fix and verify"
            onAction={onOpenFindings}
            summary={
              activeRisks.length
                ? `${activeRisks.length} active risk${activeRisks.length === 1 ? '' : 's'} to work through.`
                : fixedRisks.length
                  ? `${fixedRisks.length} risk${fixedRisks.length === 1 ? '' : 's'} recently fixed.`
                  : 'No assigned scanner risks yet.'
            }
            chips={[
              `${activeRisks.length} current`,
              fixedRisks.length ? `${fixedRisks.length} fixed` : '',
            ].filter(Boolean)}
          >
            {recentRisks.length ? (
              <Stack spacing={0.8}>
                {recentRisks.map(risk => (
                  <FindingLine key={risk.id} risk={risk} />
                ))}
              </Stack>
            ) : (
              <EmptyCopy text="No scanner findings have been assigned to this workspace yet." />
            )}
          </AnswerBlock>

          <AnswerBlock
            icon={<LocalOfferOutlined fontSize="small" />}
            title="Work scope"
            eyebrow="Scope in this workspace"
            accent={packageModules.length ? appleColors.purple : appleColors.amber}
            actionLabel="Work scope"
            onAction={onOpenServices}
            summary={
              packageModules.length
                ? `${packageModules.length} selected service${packageModules.length === 1 ? '' : 's'} define the current work.`
                : 'No services are attached yet.'
            }
            chips={[
              packageModules.length ? `${packageModules.length} selected` : 'No service list',
              requiredModuleCount ? `${requiredModuleCount} required` : '',
            ].filter(Boolean)}
          >
            {visibleModules.length ? (
              <Stack spacing={0.8}>
                {visibleModules.map(module => (
                  <ServiceLine key={module.id} module={module} />
                ))}
                {packageModules.length > visibleModules.length && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 750 }}>
                    +{packageModules.length - visibleModules.length} more in this workspace
                  </Typography>
                )}
              </Stack>
            ) : (
              <EmptyCopy
                text={workspace.packageInstance?.name || 'Service scope is not attached yet.'}
              />
            )}
          </AnswerBlock>

          <AnswerBlock
            icon={<GroupsOutlined fontSize="small" />}
            title="People"
            eyebrow="Team and experts"
            accent={hasPeople ? appleColors.cyan : appleColors.amber}
            actionLabel="People"
            onAction={onOpenTeam}
            summary={
              hasPeople
                ? `${activeParticipants.length + supportTeams.length} person or team assignment${activeParticipants.length + supportTeams.length === 1 ? '' : 's'} visible.`
                : 'No team, expert, or participant is assigned yet.'
            }
            chips={[
              `${activeParticipants.length} participants`,
              supportTeams.length
                ? `${supportTeams.length} team${supportTeams.length === 1 ? '' : 's'}`
                : '',
            ].filter(Boolean)}
          >
            {hasPeople ? (
              <Stack spacing={0.8}>
                {activeParticipants.slice(0, 3).map(participant => (
                  <PersonLine
                    key={participant.id}
                    label={participant.user.email}
                    role={formatLabel(participant.role)}
                    accent={appleColors.cyan}
                  />
                ))}
                {supportTeams.slice(0, 2).map(team => (
                  <PersonLine
                    key={team.id}
                    label={team.name}
                    role="Support team"
                    accent={appleColors.green}
                  />
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
  eyebrow,
  icon,
  onAction,
  summary,
  title,
}: {
  actionLabel?: string;
  accent: string;
  children: ReactNode;
  chips: string[];
  eyebrow: string;
  icon: ReactNode;
  onAction?: () => void;
  summary: string;
  title: string;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: `${accent}24`,
        borderRadius: 1.25,
        bgcolor: 'rgba(255, 255, 255, 0.92)',
        p: { xs: 1.4, md: 1.55 },
        height: { xs: 'auto', lg: 430 },
        boxShadow: '0 18px 42px rgba(15, 23, 42, 0.055)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 4,
          bgcolor: accent,
          opacity: 0.84,
        }}
      />
      <Stack spacing={1.25} sx={{ pl: 0.25, height: '100%' }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1.2,
              bgcolor: `${accent}12`,
              color: accent,
              display: 'grid',
              placeItems: 'center',
              flex: '0 0 auto',
            }}
          >
            {icon}
          </Box>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
            {chips.map(chip => (
              <PastelChip key={chip} label={chip} accent={accent} bg={`${accent}12`} />
            ))}
          </Stack>
        </Stack>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: accent,
              display: 'block',
              fontWeight: 850,
              letterSpacing: 0,
              textTransform: 'none',
            }}
          >
            {eyebrow}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1.15 }}>
            {title}
          </Typography>
        </Box>

        <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.55 }}>
          {summary}
        </Typography>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: { xs: 'visible', lg: 'auto' },
            pr: { xs: 0, lg: 0.35 },
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: `${accent}35`,
              borderRadius: 999,
            },
          }}
        >
          {children}
        </Box>

        {actionLabel && onAction && (
          <Button
            variant="outlined"
            onClick={onAction}
            sx={{
              alignSelf: 'flex-start',
              borderColor: `${accent}42`,
              color: accent,
              mt: 'auto',
              '&:hover': {
                borderColor: accent,
                bgcolor: `${accent}10`,
              },
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
}

function FindingLine({ risk }: { risk: ScannerRiskThread }) {
  const fixed = risk.currentState === 'FIXED_BY_LATEST_SCAN';
  const accent = fixed
    ? appleColors.green
    : risk.severity === 'CRITICAL' || risk.severity === 'HIGH'
      ? appleColors.red
      : appleColors.amber;
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: appleColors.line,
        bgcolor: `${accent}08`,
        borderRadius: 1,
        px: 1,
        py: 0.85,
      }}
    >
      <Stack direction="row" spacing={0.85} alignItems="flex-start" justifyContent="space-between">
        <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.35, minWidth: 0 }}>
          {risk.title}
        </Typography>
        <PastelChip
          label={fixed ? 'Fixed' : formatLabel(risk.currentState)}
          accent={accent}
          bg={`${accent}12`}
        />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
        {[risk.sourceTool, risk.recommendedModule?.name, risk.affectedComponent]
          .filter(Boolean)
          .join(' · ') || risk.severity}
      </Typography>
    </Box>
  );
}

function EmptyCopy({ text }: { text: string }) {
  return (
    <Box
      sx={{
        border: '1px dashed',
        borderColor: appleColors.line,
        borderRadius: 1,
        bgcolor: 'rgba(248, 250, 252, 0.68)',
        px: 1,
        py: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
        {text}
      </Typography>
    </Box>
  );
}

function ServiceLine({ module }: { module: PackageModule }) {
  const accepted = module.status === 'ACCEPTED';
  const accent = accepted ? appleColors.green : appleColors.purple;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: appleColors.line,
        borderRadius: 1,
        px: 1,
        py: 0.85,
        bgcolor: '#fbfbff',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.35 }}>
            {module.serviceModule.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatLabel(module.status)}
            {module.required ? ' · required' : ''}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            bgcolor: accent,
            boxShadow: `0 0 0 4px ${accent}14`,
            mt: 0.55,
            flex: '0 0 auto',
          }}
        />
      </Stack>
    </Box>
  );
}

function PersonLine({ accent, label, role }: { accent: string; label: string; role: string }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{
        border: '1px solid',
        borderColor: appleColors.line,
        borderRadius: 1,
        bgcolor: '#fbfeff',
        px: 1,
        py: 0.8,
      }}
    >
      <Avatar
        sx={{
          width: 30,
          height: 30,
          bgcolor: `${accent}18`,
          color: accent,
          fontSize: 12,
          fontWeight: 950,
        }}
      >
        {initialsFor(label)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 900, lineHeight: 1.3, overflowWrap: 'anywhere' }}
        >
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {role}
        </Typography>
      </Box>
    </Stack>
  );
}

function initialsFor(value: string) {
  const clean = value.includes('@') ? value.split('@')[0] || value : value;
  const parts = clean
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(' ')
    .filter(Boolean);
  if (!parts.length) return 'P';
  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

function timestamp(value?: string) {
  return value ? new Date(value).getTime() || 0 : 0;
}

function uniqueSupportTeams(supportList: SupportRequest[]) {
  const byId = new Map<string, SupportRequest['team']>();
  supportList.forEach(request => {
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
      button: 'Fix and verify',
      detail: `${activeRiskCount} scanner finding${activeRiskCount === 1 ? '' : 's'} are assigned to this workspace. Handle these before treating the workspace as launch-ready.`,
      primaryAction: 'findings' as const,
      title: 'Fix the assigned findings first.',
    };
  }
  if (missingEvidenceCount) {
    return {
      accent: appleColors.amber,
      bg: '#fff4dc',
      button: 'Fix and verify',
      detail: `${missingEvidenceCount} proof item${missingEvidenceCount === 1 ? '' : 's'} still need evidence. The next useful move is to attach or verify proof for the work already selected.`,
      primaryAction: 'findings' as const,
      title: 'Close the proof gaps before handoff.',
    };
  }
  if (!packageModuleCount) {
    return {
      accent: appleColors.amber,
      bg: '#fff4dc',
      button: 'Choose work scope',
      detail:
        'This workspace does not yet show a clear service scope. Confirm what work belongs here before assigning people or calling it delivery-ready.',
      primaryAction: 'services' as const,
      title: 'Confirm the work scope.',
    };
  }
  if (!peopleAssigned) {
    return {
      accent: appleColors.amber,
      bg: '#fff4dc',
      button: 'Assign people',
      detail:
        'The work scope is visible, but no team, expert, or participant is assigned yet. Add the people who will own the fixes and proof.',
      primaryAction: 'team' as const,
      title: 'Assign the people who will do the work.',
    };
  }
  return {
    accent: appleColors.green,
    bg: '#e7f8ee',
    button: 'Prepare handoff',
    detail:
      'The workspace has findings, service scope, and people in one place. Keep proof current and prepare the next owner handoff when the work is ready.',
    primaryAction: 'handoff' as const,
    title: 'This workspace has a clear next path.',
  };
}
