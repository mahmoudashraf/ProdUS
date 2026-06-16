'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import {
  OwnerWorkspaceJourneyNav,
  WorkspaceBreadcrumbs,
  type JourneyStepItem,
} from './OwnerWorkspaceJourneyNav';
import { PastelChip, appleColors } from './PlatformComponents';
import type {
  AttachmentScope,
  DisputeCase,
  PackageModule,
  ScannerRiskSummary,
  ScannerRiskThread,
  SupportRequest,
  Team,
  WorkspaceParticipant,
} from './types';
import WorkspaceCommandSubrouteActions, {
  type WorkspaceCommandSubrouteItem,
} from './WorkspaceCommandSubrouteActions';
import type {
  DisputeFormValues,
  DisputeStatusPayload,
  ParticipantFormValues,
  SupportRequestFormValues,
  SupportStatusPayload,
  WorkspaceCommandFormController,
} from './workspaceCommandTeamTypes';
import WorkspaceParticipantsPanel from './WorkspaceParticipantsPanel';
import WorkspaceRisksPanel from './WorkspaceRisksPanel';
import WorkspaceSelectedTeamsPanel from './WorkspaceSelectedTeamsPanel';
import WorkspaceSupportRequestsPanel from './WorkspaceSupportRequestsPanel';

export type WorkspaceCommandTeamView = 'participants' | 'support' | 'risks';

const teamViewLabel: Record<WorkspaceCommandTeamView, string> = {
  participants: 'People And Experts',
  support: 'Team Help',
  risks: 'Delivery Concerns',
};

interface IWorkspaceCommandTeamPanelsProps {
  view: WorkspaceCommandTeamView | null;
  canCoordinate: boolean;
  teams: Team[];
  participantList: WorkspaceParticipant[];
  supportList: SupportRequest[];
  disputeList: DisputeCase[];
  packageModules?: PackageModule[];
  riskSummary?: ScannerRiskSummary | undefined;
  missingEvidenceCount?: number;
  participantForm: WorkspaceCommandFormController<ParticipantFormValues>;
  supportForm: WorkspaceCommandFormController<SupportRequestFormValues>;
  disputeForm: WorkspaceCommandFormController<DisputeFormValues>;
  isAddingParticipant: boolean;
  isCreatingSupport: boolean;
  isUpdatingSupport: boolean;
  isCreatingDispute: boolean;
  isUpdatingDispute: boolean;
  supportStatusById: Record<string, SupportRequest['status']>;
  supportResolutionById: Record<string, string>;
  disputeStatusById: Record<string, DisputeCase['status']>;
  disputeResolutionById: Record<string, string>;
  onAddParticipant: () => void;
  onCreateSupport: () => void;
  onUpdateSupport: (id: string, payload: SupportStatusPayload) => void;
  onCreateDispute: () => void;
  onUpdateDispute: (id: string, payload: DisputeStatusPayload) => void;
  onSupportStatusChange: (id: string, status: SupportRequest['status']) => void;
  onSupportResolutionChange: (id: string, resolution: string) => void;
  onDisputeStatusChange: (id: string, status: DisputeCase['status']) => void;
  onDisputeResolutionChange: (id: string, resolution: string) => void;
  onOpenHub: () => void;
  onOpenFindings?: () => void;
  onOpenServices?: () => void;
  onViewChange: (view: WorkspaceCommandTeamView) => void;
  evidencePanel: (scopeType: AttachmentScope, scopeId: string) => ReactNode;
}

export default function WorkspaceCommandTeamPanels({
  view,
  canCoordinate,
  teams,
  participantList,
  supportList,
  disputeList,
  packageModules = [],
  riskSummary,
  missingEvidenceCount = 0,
  participantForm,
  supportForm,
  disputeForm,
  isAddingParticipant,
  isCreatingSupport,
  isUpdatingSupport,
  isCreatingDispute,
  isUpdatingDispute,
  supportStatusById,
  supportResolutionById,
  disputeStatusById,
  disputeResolutionById,
  onAddParticipant,
  onCreateSupport,
  onUpdateSupport,
  onCreateDispute,
  onUpdateDispute,
  onSupportStatusChange,
  onSupportResolutionChange,
  onDisputeStatusChange,
  onDisputeResolutionChange,
  onOpenHub,
  onOpenFindings,
  onOpenServices,
  onViewChange,
  evidencePanel,
}: IWorkspaceCommandTeamPanelsProps) {
  const items: JourneyStepItem<WorkspaceCommandTeamView>[] = [
    {
      value: 'participants',
      label: 'People and experts',
      detail: 'Invite the owner, team lead, specialist, advisor, or reviewer.',
      accent: appleColors.cyan,
      meta: (
        <PastelChip
          label={`${participantList.length} added`}
          accent={appleColors.cyan}
          bg="#e4f9fd"
        />
      ),
    },
    {
      value: 'support',
      label: 'Team help',
      detail: 'Ask a team or expert group to help with this workspace.',
      accent: supportList.length ? appleColors.amber : appleColors.green,
      meta: (
        <PastelChip
          label={`${supportList.length} asks`}
          accent={supportList.length ? appleColors.amber : appleColors.green}
          bg={supportList.length ? '#fff4dc' : '#e7f8ee'}
        />
      ),
    },
    {
      value: 'risks',
      label: 'Delivery concerns',
      detail: 'Track non-scanner concerns that could slow the work.',
      accent: disputeList.length ? appleColors.red : appleColors.green,
      meta: (
        <PastelChip
          label={`${disputeList.length} open`}
          accent={disputeList.length ? appleColors.red : appleColors.green}
          bg={disputeList.length ? '#fff1f1' : '#e7f8ee'}
        />
      ),
    },
  ];
  const subrouteItems: WorkspaceCommandSubrouteItem<WorkspaceCommandTeamView>[] = items.map(
    item => ({
      value: item.value,
      label: item.label,
      accent: item.accent || appleColors.purple,
    })
  );

  return (
    <Stack spacing={2}>
      {view && (
        <WorkspaceBreadcrumbs
          items={[
            { label: 'People And Teams', onClick: onOpenHub },
            { label: teamViewLabel[view] },
          ]}
          backLabel="People home"
          onBack={onOpenHub}
        />
      )}

      {view ? (
        <WorkspaceCommandSubrouteActions
          ariaLabel="People and team internal pages"
          currentValue={view}
          items={subrouteItems}
          onChange={onViewChange}
        />
      ) : (
        <Stack spacing={2}>
          <WorkspaceOwnershipMap
            canCoordinate={canCoordinate}
            packageModules={packageModules}
            participantList={participantList}
            riskSummary={riskSummary}
            supportList={supportList}
            missingEvidenceCount={missingEvidenceCount}
            onAddPerson={() => onViewChange('participants')}
            onAskHelp={() => onViewChange('support')}
            onOpenFindings={onOpenFindings}
            onOpenServices={onOpenServices}
          />
          <WorkspaceSelectedTeamsPanel
            supportList={supportList}
            onChooseTeam={() => onViewChange('support')}
          />
          <OwnerWorkspaceJourneyNav
            label="People and teams"
            value={null}
            items={items}
            onChange={onViewChange}
          />
        </Stack>
      )}

      {view === 'participants' && (
        <WorkspaceParticipantsPanel
          canCoordinate={canCoordinate}
          participantList={participantList}
          participantForm={participantForm}
          isAddingParticipant={isAddingParticipant}
          onAddParticipant={onAddParticipant}
        />
      )}

      {view === 'support' && (
        <WorkspaceSupportRequestsPanel
          canCoordinate={canCoordinate}
          teams={teams}
          supportList={supportList}
          supportForm={supportForm}
          isCreatingSupport={isCreatingSupport}
          isUpdatingSupport={isUpdatingSupport}
          supportStatusById={supportStatusById}
          supportResolutionById={supportResolutionById}
          onCreateSupport={onCreateSupport}
          onUpdateSupport={onUpdateSupport}
          onSupportStatusChange={onSupportStatusChange}
          onSupportResolutionChange={onSupportResolutionChange}
        />
      )}

      {view === 'risks' && (
        <WorkspaceRisksPanel
          canCoordinate={canCoordinate}
          teams={teams}
          disputeList={disputeList}
          disputeForm={disputeForm}
          isCreatingDispute={isCreatingDispute}
          isUpdatingDispute={isUpdatingDispute}
          disputeStatusById={disputeStatusById}
          disputeResolutionById={disputeResolutionById}
          onCreateDispute={onCreateDispute}
          onUpdateDispute={onUpdateDispute}
          onDisputeStatusChange={onDisputeStatusChange}
          onDisputeResolutionChange={onDisputeResolutionChange}
          evidencePanel={evidencePanel}
        />
      )}
    </Stack>
  );
}

function WorkspaceOwnershipMap({
  canCoordinate,
  missingEvidenceCount,
  onAddPerson,
  onAskHelp,
  onOpenFindings,
  onOpenServices,
  packageModules,
  participantList,
  riskSummary,
  supportList,
}: {
  canCoordinate: boolean;
  missingEvidenceCount: number;
  onAddPerson: () => void;
  onAskHelp: () => void;
  onOpenFindings?: (() => void) | undefined;
  onOpenServices?: (() => void) | undefined;
  packageModules: PackageModule[];
  participantList: WorkspaceParticipant[];
  riskSummary?: ScannerRiskSummary | undefined;
  supportList: SupportRequest[];
}) {
  const risks = riskSummary?.groups.flatMap(group => group.risks) || [];
  const activeParticipants = participantList.filter(participant => participant.active);
  const risksWithoutService = risks.filter(risk => !risk.recommendedModule?.id);
  const proofRisks = risks.filter(risk => risk.currentState === 'NEEDS_PROOF');
  const activeSupportAsks = supportList.filter(request =>
    ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_ON_OWNER'].includes(request.status)
  );
  const serviceOwnerCount = packageModules.filter(module => !!module.owner?.id).length;
  const findingOwnerCount = risks.filter(risk => !!risk.owner?.id).length;
  const missingOwnerCount =
    packageModules.filter(module => !module.owner?.id).length +
    risks.filter(risk => !risk.owner?.id && !risk.recommendedModule?.id).length;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: '#dbe7f5',
        borderRadius: 1,
        bgcolor: '#fff',
        p: 1.35,
      }}
    >
      <Stack spacing={1.25}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems={{ md: 'flex-start' }}
          justifyContent="space-between"
        >
          <Box>
            <Stack direction="row" spacing={0.65} flexWrap="wrap" useFlexGap>
              <PastelChip label="Ownership map" accent={appleColors.cyan} bg="#e4f9fd" />
              <PastelChip
                label={`${missingOwnerCount} missing owners`}
                accent={missingOwnerCount ? appleColors.amber : appleColors.green}
                bg={missingOwnerCount ? '#fff4dc' : '#e7f8ee'}
              />
            </Stack>
            <Typography variant="h3" sx={{ mt: 0.75 }}>
              People, owners, and help
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.4, lineHeight: 1.55, maxWidth: 780 }}>
              This page should answer who is involved, which service/finding needs an owner, and
              where team help is still open.
            </Typography>
          </Box>
          {canCoordinate && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75}>
              <Button variant="contained" onClick={onAddPerson} sx={{ minHeight: 40 }}>
                Add person
              </Button>
              <Button variant="outlined" onClick={onAskHelp} sx={{ minHeight: 40 }}>
                Ask help
              </Button>
            </Stack>
          )}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
            gap: 0.85,
          }}
        >
          <OwnershipFact
            label="Service owners"
            value={`${packageModules.length} service${packageModules.length === 1 ? '' : 's'}`}
            detail={
              serviceOwnerCount
                ? `${serviceOwnerCount} have named owners.`
                : packageModules.length
                  ? 'Named owners still need to be assigned.'
                  : 'Add work scope first.'
            }
          />
          <OwnershipFact
            label="Finding owners"
            value={`${risks.length} finding${risks.length === 1 ? '' : 's'}`}
            detail={
              findingOwnerCount
                ? `${findingOwnerCount} have explicit finding owners.`
                : risksWithoutService.length
                  ? `${risksWithoutService.length} need a service choice.`
                  : 'Findings inherit ownership from their service.'
            }
          />
          <OwnershipFact
            label="People involved"
            value={`${activeParticipants.length} active`}
            detail={
              activeParticipants.length
                ? 'Ready to assign named owners.'
                : 'No active owner/helper yet.'
            }
          />
          <OwnershipFact
            label="Support asks"
            value={`${activeSupportAsks.length} open`}
            detail={
              missingEvidenceCount || proofRisks.length
                ? `${missingEvidenceCount || proofRisks.length} proof/help gaps visible.`
                : 'No proof help gap detected.'
            }
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
            gap: 0.85,
          }}
        >
          {packageModules.length ? (
            packageModules
              .slice()
              .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
              .map(module => {
                const serviceRisks = risksForService(risks, module.serviceModule.id);
                const readyCount = serviceRisks.filter(
                  risk => risk.currentState === 'READY_TO_CHECK'
                ).length;
                const verifiedCount = serviceRisks.filter(
                  risk => risk.currentState === 'FIXED_BY_LATEST_SCAN'
                ).length;
                return (
                  <Box
                    key={module.id}
                    sx={{
                      border: '1px solid',
                      borderColor: '#e2e8f0',
                      borderRadius: 1,
                      bgcolor: '#fbfdff',
                      p: 1,
                    }}
                  >
                    <Stack spacing={0.8}>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}
                          >
                            {module.serviceModule.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Owner: {module.owner?.email || 'Needs named owner'}
                          </Typography>
                        </Box>
                        <PastelChip
                          label={`${serviceRisks.length} finding${serviceRisks.length === 1 ? '' : 's'}`}
                          accent={serviceRisks.length ? appleColors.amber : appleColors.muted}
                          bg={serviceRisks.length ? '#fff4dc' : '#f8fafc'}
                        />
                      </Stack>
                      <Stack direction="row" spacing={0.55} flexWrap="wrap" useFlexGap>
                        <PastelChip
                          label={`${verifiedCount} verified`}
                          accent={appleColors.green}
                          bg="#e7f8ee"
                        />
                        <PastelChip
                          label={`${readyCount} ready to check`}
                          accent={appleColors.blue}
                          bg="#eaf3ff"
                        />
                        <PastelChip
                          label={
                            activeParticipants.length ? 'People available' : 'No people attached'
                          }
                          accent={activeParticipants.length ? appleColors.cyan : appleColors.amber}
                          bg={activeParticipants.length ? '#e4f9fd' : '#fff4dc'}
                        />
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.65}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={onAddPerson}
                          sx={{ minHeight: 34 }}
                        >
                          Assign owner
                        </Button>
                        {onOpenFindings && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={onOpenFindings}
                            sx={{ minHeight: 34 }}
                          >
                            Manage findings
                          </Button>
                        )}
                        {onOpenServices && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={onOpenServices}
                            sx={{ minHeight: 34 }}
                          >
                            Adjust scope
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                );
              })
          ) : (
            <Box
              sx={{
                border: '1px dashed',
                borderColor: '#c9d8ea',
                borderRadius: 1,
                bgcolor: '#fbfdff',
                p: 1.15,
              }}
            >
              <Typography variant="subtitle1">No service owners yet.</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                Add Work scope before assigning owners.
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

function OwnershipFact({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: '#e2e8f0',
        borderRadius: 1,
        bgcolor: '#f8fafc',
        p: 0.9,
        minHeight: 98,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.3 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.4 }}>
        {detail}
      </Typography>
    </Box>
  );
}

function risksForService(risks: ScannerRiskThread[], serviceModuleId: string) {
  return risks.filter(risk => risk.recommendedModule?.id === serviceModuleId);
}
