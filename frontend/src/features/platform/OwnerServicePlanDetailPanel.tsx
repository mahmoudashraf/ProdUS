'use client';

import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  categoryPalette,
} from './PlatformComponents';
import StudioAssistantCard from './StudioAssistantCard';
import {
  ownerServicePackageScore,
  ownerServicePlanStatusAccent,
} from './ownerServicePlanPresentation';
import type {
  AssistantActionProps,
  OwnerServicePlanAssistantContext,
} from './ownerServicePlanTypes';
import type {
  PackageInstance,
  PackageModule,
  ProductProfile,
} from './types';

type OwnerServicePlanDetailPanelProps = {
  selectedProduct?: ProductProfile | undefined;
  selectedPackage?: PackageInstance | undefined;
  packageModules: PackageModule[];
  isPackageFetching: boolean;
  isTeamRecommendationsFetching: boolean;
  cartStartPromptFacts: string;
  packageAssistantContext: OwnerServicePlanAssistantContext;
  assistantActions: AssistantActionProps;
};

const moduleProofText = (module: PackageModule) =>
  module.acceptanceCriteria
  || module.serviceModule.acceptanceCriteria
  || module.deliverables
  || module.serviceModule.expectedDeliverables
  || 'Define the proof this service must produce before the owner accepts the work.';

export default function OwnerServicePlanDetailPanel({
  selectedProduct,
  selectedPackage,
  packageModules,
  isPackageFetching,
  isTeamRecommendationsFetching,
  cartStartPromptFacts,
  packageAssistantContext,
  assistantActions,
}: OwnerServicePlanDetailPanelProps) {
  const requiredCount = packageModules.filter(module => module.required).length;
  const acceptedCount = packageModules.filter(module => module.status === 'ACCEPTED').length;
  const proofGateCount = packageModules.filter(module => module.acceptanceCriteria || module.serviceModule.acceptanceCriteria).length;

  return (
    <Surface>
      <SectionTitle title="Service Plan" action={selectedPackage && <StatusChip label={selectedPackage.status} />} />
      {selectedPackage ? (
        <Stack spacing={2}>
          {(isPackageFetching || isTeamRecommendationsFetching) && <LinearProgress sx={{ borderRadius: 999 }} />}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h3">{selectedPackage.name}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
                {selectedPackage.summary}
              </Typography>
            </Box>
            <ProgressRing
              value={ownerServicePackageScore(selectedPackage, packageModules)}
              color={ownerServicePlanStatusAccent(selectedPackage.status)}
              label="confidence"
            />
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
            {[
              { label: 'Services in plan', value: String(packageModules.length), accent: appleColors.purple },
              { label: 'Required first', value: String(requiredCount), accent: appleColors.amber },
              { label: 'Proof gates', value: String(proofGateCount || packageModules.length), accent: appleColors.green },
            ].map(item => (
              <Box key={item.label} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${item.accent}32`, bgcolor: '#fff' }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography sx={{ mt: 0.35, fontWeight: 950, color: item.accent }}>{item.value}</Typography>
              </Box>
            ))}
          </Box>

          <StudioAssistantCard
            title="AI Package Recommendation"
            description="Validate this service plan against product goals, dependencies, delivery evidence, and team-readiness."
            prompt={`Evaluate the service plan "${selectedPackage.name}" for ${selectedProduct?.name || 'this product'}. Use these visible project start facts directly: ${cartStartPromptFacts} Explain whether the package sequence is appropriate, which dependencies or proof gates matter, what a team should prove, and what the owner should decide next. Keep the answer practical for an MVP or AI-built prototype owner.`}
            conversationId={`studio-package-${selectedPackage.id}`}
            context={packageAssistantContext}
            {...assistantActions}
            accent={appleColors.purple}
            cta="Review Package"
          />

          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 1 }}>
              <Typography sx={{ fontWeight: 950 }}>Delivery sequence</Typography>
              <PastelChip label={`${acceptedCount}/${packageModules.length || 0} accepted`} accent={appleColors.green} bg="#e7f8ee" />
            </Stack>
            <Stack spacing={1}>
              {packageModules.map((module, index) => {
                const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;

                return (
                  <Box
                    key={module.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '46px minmax(0, 1fr) auto' },
                      gap: { xs: 1, md: 1.25 },
                      alignItems: 'start',
                      p: 1.35,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: module.status === 'BLOCKED' ? '#fecdd3' : `${palette.accent}30`,
                      background: module.required ? palette.soft : '#fff',
                    }}
                  >
                    <Box sx={{ width: 38, height: 38, borderRadius: 1, bgcolor: palette.bg, color: palette.accent, display: 'grid', placeItems: 'center', fontWeight: 950 }}>
                      {index + 1}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
                        <Typography sx={{ fontWeight: 950, color: appleColors.ink }}>
                          {module.serviceModule.name}
                        </Typography>
                        {module.required && <PastelChip label="Required" accent={appleColors.amber} bg="#fff4dc" />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>
                        {module.serviceModule.ownerOutcome || module.rationale || module.serviceModule.description || 'Owner-visible service outcome.'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.65, lineHeight: 1.45 }}>
                        Proof: {moduleProofText(module)}
                      </Typography>
                    </Box>
                    <StatusChip label={module.status} />
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      ) : (
        <EmptyState label="No service plan exists for this product yet. Create one from a product brief or convert the cart into a project workspace." />
      )}
    </Surface>
  );
}
