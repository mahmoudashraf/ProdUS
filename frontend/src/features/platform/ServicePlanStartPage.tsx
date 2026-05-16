'use client';

import NextLink from 'next/link';
import { useState } from 'react';
import {
  ArrowForwardOutlined,
  AutoAwesomeOutlined,
  DescriptionOutlined,
  Inventory2Outlined,
  SendOutlined,
  ShoppingCartOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, postJson } from './api';
import {
  EmptyState,
  PageHeader,
  PastelChip,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import { PackageInstance, ProductizationCart, RequirementIntake } from './types';

export default function ServicePlanStartPage() {
  const queryClient = useQueryClient();
  const [requirementId, setRequirementId] = useState('');
  const [createdPlan, setCreatedPlan] = useState<PackageInstance | null>(null);

  const requirements = useQuery({ queryKey: ['requirements'], queryFn: () => getJson<RequirementIntake[]>('/requirements') });
  const cart = useQuery({ queryKey: ['productization-cart'], queryFn: () => getJson<ProductizationCart>('/productization-cart/current') });
  const createPlan = useMutation({
    mutationFn: () => postJson<PackageInstance, Record<string, never>>(`/packages/from-requirement/${requirementId}`, {}),
    onSuccess: async (plan) => {
      setCreatedPlan(plan);
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      await queryClient.invalidateQueries({ queryKey: ['requirements'] });
    },
  });

  const requirementList = requirements.data || [];
  const eligibleRequirements = requirementList.filter((item) => item.status === 'SUBMITTED' || item.status === 'PACKAGE_RECOMMENDED');
  const selectedRequirement = eligibleRequirements.find((item) => item.id === requirementId);
  const draftServices = cart.data?.serviceItems.length || 0;
  const draftTalent = cart.data?.talentItems.length || 0;

  return (
    <>
      <PageHeader
        title="Create Service Plan"
        description="Choose a clear starting point: convert the draft cart into a workspace, or generate a service plan from a submitted product brief."
        action={
          <Button component={NextLink} href="/dashboard" variant="outlined" sx={{ minHeight: 42 }}>
            Back to command center
          </Button>
        }
      />
      <QueryState isLoading={requirements.isLoading || cart.isLoading} error={requirements.error || cart.error || createPlan.error} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
          <Stack spacing={2}>
            <SectionTitle title="Use Draft Cart" action={<ShoppingCartOutlined sx={{ color: appleColors.purple }} />} />
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              Best when the owner has already selected lifecycle services, teams, or solo experts. Starting the workspace creates the service plan, milestones, participants, and shortlist records together.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <PastelChip label={cart.data?.productProfile?.name || 'No product selected'} accent={appleColors.purple} />
              <PastelChip label={`${draftServices} services`} accent={appleColors.cyan} bg="#e4f9fd" />
              <PastelChip label={`${draftTalent} teams / experts`} accent={appleColors.green} bg="#e7f8ee" />
            </Stack>
            <Button component={NextLink} href="/owner/project-cart" variant="contained" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 44 }}>
              Review draft cart
            </Button>
          </Stack>
        </Surface>

        <Surface>
          <Stack spacing={2}>
            <SectionTitle title="Use Product Brief" action={<DescriptionOutlined sx={{ color: appleColors.blue }} />} />
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              Best when the owner has a specific business goal or requested service. The backend generates a service plan from that structured brief.
            </Typography>
            {eligibleRequirements.length ? (
              <>
                <TextField select fullWidth label="Submitted product brief" value={requirementId} onChange={(event) => setRequirementId(event.target.value)}>
                  {eligibleRequirements.map((requirement) => (
                    <MenuItem key={requirement.id} value={requirement.id}>
                      {requirement.productProfile?.name || 'Product'} - {requirement.requestedServiceModule?.name || 'Diagnosis'}
                    </MenuItem>
                  ))}
                </TextField>
                {selectedRequirement && (
                  <Surface sx={{ boxShadow: 'none', background: '#fbfdff' }}>
                    <Stack spacing={1}>
                      <Typography sx={{ fontWeight: 900 }}>{selectedRequirement.businessGoal}</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <StatusChip label={selectedRequirement.status} />
                        <PastelChip label={selectedRequirement.requestedServiceModule?.name || 'General diagnosis'} accent={appleColors.blue} bg="#eaf3ff" />
                      </Stack>
                    </Stack>
                  </Surface>
                )}
                <Button
                  variant="contained"
                  startIcon={<SendOutlined />}
                  disabled={!requirementId || createPlan.isPending}
                  onClick={() => createPlan.mutate()}
                  sx={{ minHeight: 44 }}
                >
                  {createPlan.isPending ? 'Creating...' : 'Create service plan'}
                </Button>
              </>
            ) : (
              <EmptyState label="No submitted product briefs are ready for service-plan generation." />
            )}
            {createdPlan && (
              <Alert severity="success" sx={{ borderRadius: 1 }}>
                Created {createdPlan.name}. Open Service Plans to review modules and matching teams.
              </Alert>
            )}
          </Stack>
        </Surface>
      </Box>

      <Surface sx={{ mt: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Inventory2Outlined sx={{ color: appleColors.purple }} />
            <Box>
              <Typography variant="h4">No product context yet?</Typography>
              <Typography color="text.secondary">Create a product first, then select services or submit a product brief.</Typography>
            </Box>
          </Stack>
          <Button component={NextLink} href="/products/new" variant="outlined" startIcon={<AutoAwesomeOutlined />} sx={{ minHeight: 42 }}>
            Create product
          </Button>
        </Stack>
      </Surface>
    </>
  );
}
