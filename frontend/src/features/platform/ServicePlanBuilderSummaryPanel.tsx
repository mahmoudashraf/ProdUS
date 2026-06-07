'use client';

import {
  AutoAwesomeOutlined,
  PlaylistAddCheckOutlined,
  SendOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import PlatformAssistantCard from './PlatformAssistantCard';
import {
  DotLabel,
  EmptyState,
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import {
  type BuildPackagePayload,
  type ServicePlanFormController,
  formatMoney,
  servicePlanStatusAccent,
} from './servicePlanBuilderConfig';
import type {
  PackageInstance,
  PackageModule,
  ProjectWorkspace,
  QuoteProposal,
  RequirementIntake,
  TeamRecommendation,
} from './types';

export default function ServicePlanSummaryPanel({
  selectedPackage,
  modules,
  teamRecommendations,
  proposals,
  workspaceOptions,
  score,
  estimatedBudget,
  requirements,
  eligibleRequirements,
  selectedRequirement,
  buildForm,
  isBuildingPackage,
  onBuildPackage,
}: {
  selectedPackage: PackageInstance;
  modules: PackageModule[];
  teamRecommendations: TeamRecommendation[];
  proposals: QuoteProposal[];
  workspaceOptions: ProjectWorkspace[];
  score: number;
  estimatedBudget: number;
  requirements: RequirementIntake[];
  eligibleRequirements: RequirementIntake[];
  selectedRequirement?: RequirementIntake | undefined;
  buildForm: ServicePlanFormController<BuildPackagePayload>;
  isBuildingPackage: boolean;
  onBuildPackage: () => void;
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 340px' }, gap: 2.5 }}>
      <Stack spacing={2.5}>
        <Surface>
          <SectionTitle title="Owner Decision" action={<PlaylistAddCheckOutlined sx={{ color: servicePlanStatusAccent(selectedPackage.status) }} />} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '120px minmax(0, 1fr)' }, gap: 2, alignItems: 'center' }}>
            <ProgressRing value={score || 58} size={104} color={servicePlanStatusAccent(selectedPackage.status)} label="confidence" />
            <Stack spacing={1.25}>
              <Typography variant="h3">Use this plan when the service sequence matches the launch blockers.</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {modules.length
                  ? `${modules.length} lifecycle services are sequenced before workspace handoff. Review team match next if the owner agrees with the scope.`
                  : 'No services are attached yet. Generate a plan from a product brief or choose services from the Start Plan first.'}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <PastelChip label={`${modules.length} services`} accent={appleColors.blue} bg="#eaf3ff" />
                <PastelChip label={`${teamRecommendations.length} team matches`} accent={appleColors.cyan} bg="#e4f9fd" />
                <PastelChip label={formatMoney(estimatedBudget, 'USD')} accent={appleColors.green} bg="#e7f8ee" />
              </Stack>
            </Stack>
          </Box>
        </Surface>

        <PlatformAssistantCard
          title="AI Service Plan Advisor"
          description="Ask about the service sequence, budget or timeline risk, team proof, and what should happen before workspace handoff."
          prompt={`Review service plan "${selectedPackage.name}" for product ${selectedPackage.productProfile?.name || 'not recorded'}. Package status is ${selectedPackage.status}. Included services: ${modules.map((module) => `${module.serviceModule.name} (${module.status})`).join('; ') || 'none'}. Matched teams: ${teamRecommendations.slice(0, 4).map((recommendation) => `${recommendation.team.name} ${Math.round(recommendation.score * 100)}%`).join('; ') || 'none'}. Proposals: ${proposals.slice(0, 4).map((proposal) => `${proposal.team.name} ${proposal.status}`).join('; ') || 'none'}. Explain whether the package sequence is coherent, what dependencies or evidence gates matter, what owner should ask teams, and what should happen before workspace creation. Do not invent services outside the catalog.`}
          conversationId={`packages-service-plan-${selectedPackage.id}`}
          context={{
            pageType: 'owner-package-builder',
            productId: selectedPackage.productProfile?.id,
            packageId: selectedPackage.id,
            workspaceId: workspaceOptions[0]?.id,
          }}
          accent={servicePlanStatusAccent(selectedPackage.status)}
          cta="Advise Plan"
        />
      </Stack>

      <Stack spacing={2.5}>
        <ServicePlanCreateFromBriefPanel
          requirements={requirements}
          eligibleRequirements={eligibleRequirements}
          selectedRequirement={selectedRequirement}
          form={buildForm}
          isBuildingPackage={isBuildingPackage}
          onBuildPackage={onBuildPackage}
        />
        <ServicePlanWarningsPanel
          modules={modules}
          teamRecommendations={teamRecommendations}
          workspaceOptions={workspaceOptions}
        />
      </Stack>
    </Box>
  );
}

function ServicePlanCreateFromBriefPanel({
  requirements,
  eligibleRequirements,
  selectedRequirement,
  form,
  isBuildingPackage,
  onBuildPackage,
}: {
  requirements: RequirementIntake[];
  eligibleRequirements: RequirementIntake[];
  selectedRequirement?: RequirementIntake | undefined;
  form: ServicePlanFormController<BuildPackagePayload>;
  isBuildingPackage: boolean;
  onBuildPackage: () => void;
}) {
  return (
    <Surface>
      <SectionTitle title="Create From Brief" action={<AutoAwesomeOutlined sx={{ color: appleColors.blue }} />} />
      {eligibleRequirements.length ? (
        <Box component="form" onSubmit={form.handleSubmit(onBuildPackage)}>
          <Stack spacing={1.5}>
            <TextField
              select
              fullWidth
              label="Submitted product brief"
              value={form.values.requirementId}
              onChange={(event) => form.setValue('requirementId', event.target.value)}
            >
              {eligibleRequirements.map((requirement) => (
                <MenuItem key={requirement.id} value={requirement.id}>
                  {requirement.productProfile?.name || 'Product'} - {requirement.requestedServiceModule?.name || 'Diagnosis'}
                </MenuItem>
              ))}
            </TextField>
            {selectedRequirement && (
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
                <Typography sx={{ fontWeight: 900 }}>{selectedRequirement.businessGoal}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  <StatusChip label={selectedRequirement.status} />
                  <PastelChip label={selectedRequirement.requestedServiceModule?.name || 'General diagnosis'} accent={appleColors.blue} bg="#eaf3ff" />
                </Stack>
              </Box>
            )}
            <Button type="submit" variant="contained" startIcon={<SendOutlined />} disabled={!form.values.requirementId || isBuildingPackage} sx={{ minHeight: 44 }}>
              Create service plan
            </Button>
          </Stack>
        </Box>
      ) : (
        <EmptyState label={requirements.length ? 'No submitted product briefs are ready for service-plan generation.' : 'Create or submit a product brief before generating a service plan.'} />
      )}
    </Surface>
  );
}

function ServicePlanWarningsPanel({
  modules,
  teamRecommendations,
  workspaceOptions,
}: {
  modules: PackageModule[];
  teamRecommendations: TeamRecommendation[];
  workspaceOptions: ProjectWorkspace[];
}) {
  const hasBlockedService = modules.some((module) => module.status === 'BLOCKED');
  return (
    <Surface sx={{ background: '#fffaf1' }}>
      <SectionTitle title="Needs Attention" action={<WarningAmberOutlined sx={{ color: appleColors.amber }} />} />
      <Stack spacing={1.25}>
        {hasBlockedService ? (
          <DotLabel label="A service in the sequence is blocked" color={appleColors.red} />
        ) : (
          <DotLabel label="No blocked services in the sequence" color={appleColors.green} />
        )}
        {!teamRecommendations.length && <DotLabel label="No verified team matches yet" color={appleColors.amber} />}
        {!workspaceOptions.length && <DotLabel label="Open a workspace before contract handoff" color={appleColors.amber} />}
        {teamRecommendations.length > 0 && workspaceOptions.length > 0 && !hasBlockedService && (
          <DotLabel label="Plan has team and workspace handoff path" color={appleColors.green} />
        )}
      </Stack>
    </Surface>
  );
}
