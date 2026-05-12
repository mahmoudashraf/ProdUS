'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AddOutlined,
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
  CompareArrowsOutlined,
  FactCheckOutlined,
  Inventory2Outlined,
  RocketLaunchOutlined,
  SendOutlined,
} from '@mui/icons-material';
import { Box, Button, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import { getJson, postJson, putJson } from './api';
import {
  DotLabel,
  EmptyState,
  MetricTile,
  PageHeader,
  PastelChip,
  ProgressRing,
  QueryState,
  SaveButton,
  SectionTitle,
  StatusChip,
  Surface,
  TextInput,
  appleColors,
  categoryPalette,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import {
  AIRecommendation,
  Milestone,
  PackageInstance,
  PackageModule,
  ProductProfile,
  ProjectWorkspace,
  QuoteProposal,
  RequirementIntake,
  ServiceCategory,
  ServiceModule,
  SupportRequest,
  TeamRecommendation,
  TeamShortlist,
} from './types';

interface ProductProfilePayload {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  productUrl: string;
  repositoryUrl: string;
  riskProfile: string;
}

interface RequirementPayload {
  productProfileId: string;
  requestedServiceModuleId: string | null;
  businessGoal: string;
  currentProblems: string;
  constraints: string;
  riskSignals: string;
  requirementBrief: string;
  status: RequirementIntake['status'];
}

interface ShortlistPayload {
  packageInstanceId: string;
  teamId: string;
  status: TeamShortlist['status'];
  notes: string;
}

const productInitialValues: ProductProfilePayload = {
  name: '',
  summary: '',
  businessStage: 'PROTOTYPE',
  techStack: '',
  productUrl: '',
  repositoryUrl: '',
  riskProfile: '',
};

const requirementInitialValues: RequirementPayload = {
  productProfileId: '',
  requestedServiceModuleId: null,
  businessGoal: '',
  currentProblems: '',
  constraints: '',
  riskSignals: '',
  requirementBrief: '',
  status: 'SUBMITTED',
};

const stageOptions: ProductProfile['businessStage'][] = ['IDEA', 'PROTOTYPE', 'VALIDATED', 'LIVE', 'SCALING'];

const formatMoney = (amountCents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format((amountCents || 0) / 100);

const statusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('REJECT') || status.includes('URGENT')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING') || status.includes('SUBMITTED')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER') || status.includes('SIGNED') || status.includes('ON_TRACK')) return appleColors.green;
  return appleColors.purple;
};

const packageScore = (packageInstance?: PackageInstance, modules?: PackageModule[]) => {
  if (!packageInstance) return 54;
  const moduleScore = modules?.length
    ? modules.reduce((total, module) => {
        if (module.status === 'ACCEPTED') return total + 100;
        if (module.status === 'REVIEW') return total + 78;
        if (module.status === 'IN_PROGRESS') return total + 64;
        if (module.status === 'BLOCKED') return total + 28;
        return total + 48;
      }, 0) / modules.length
    : 68;
  const statusBonus = packageInstance.status === 'ACTIVE_DELIVERY' ? 8 : packageInstance.status === 'DELIVERED' ? 16 : 0;
  return clampScore(moduleScore + statusBonus);
};

const compactIntakeFieldSx = {
  '& .MuiOutlinedInput-root': {
    minHeight: 44,
    borderRadius: 1,
    bgcolor: '#fbfdff',
    transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
    '& fieldset': {
      borderColor: '#dbe4f0',
    },
    '&:hover fieldset': {
      borderColor: '#b9c8dc',
    },
    '&.Mui-focused': {
      bgcolor: '#fff',
      boxShadow: '0 0 0 4px rgba(98, 92, 255, 0.1)',
      '& fieldset': {
        borderColor: appleColors.purple,
        borderWidth: 1,
      },
    },
  },
  '& .MuiInputLabel-root': {
    color: appleColors.muted,
  },
};

const intakeActionButtonSx = {
  width: { xs: '100%', md: 132 },
  minWidth: 132,
  height: 44,
  borderRadius: 1,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  fontWeight: 800,
  letterSpacing: 0,
  boxShadow: '0 10px 22px rgba(24, 119, 242, 0.18)',
  '&:hover': {
    boxShadow: '0 12px 26px rgba(24, 119, 242, 0.24)',
  },
  '&.Mui-disabled': {
    boxShadow: 'none',
  },
};

const productHealth = (product?: ProductProfile, packageInstance?: PackageInstance, modules?: PackageModule[]) => {
  if (!product) return 0;
  if (!packageInstance) return product.businessStage === 'LIVE' ? 66 : 58;
  return packageScore(packageInstance, modules);
};

export default function OwnerProductizationWorkspace() {
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const requirements = useQuery({ queryKey: ['requirements'], queryFn: () => getJson<RequirementIntake[]>('/requirements') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const categories = useQuery({ queryKey: ['catalog-categories'], queryFn: () => getJson<ServiceCategory[]>('/catalog/categories') });
  const catalogModules = useQuery({ queryKey: ['catalog-modules'], queryFn: () => getJson<ServiceModule[]>('/catalog/modules') });
  const proposals = useQuery({ queryKey: ['commerce-proposals'], queryFn: () => getJson<QuoteProposal[]>('/commerce/proposals') });
  const supportRequests = useQuery({ queryKey: ['commerce-support-requests'], queryFn: () => getJson<SupportRequest[]>('/commerce/support-requests') });
  const recommendations = useQuery({ queryKey: ['ai-recommendations'], queryFn: () => getJson<AIRecommendation[]>('/ai/recommendations') });

  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [pendingRequirementId, setPendingRequirementId] = useState('');

  const productForm = useAdvancedForm<ProductProfilePayload>({
    initialValues: productInitialValues,
    validationRules: {
      name: [{ type: 'required', message: 'Product name is required' }],
    },
  });
  const requirementForm = useAdvancedForm<RequirementPayload>({
    initialValues: requirementInitialValues,
    validationRules: {
      businessGoal: [{ type: 'required', message: 'Business goal is required' }],
    },
  });

  const productList = products.data || [];
  const packageList = packages.data || [];
  const selectedProduct = useMemo(
    () => productList.find((product) => product.id === selectedProductId) || productList[0],
    [productList, selectedProductId]
  );
  const selectedProductPackages = useMemo(
    () => packageList.filter((item) => item.productProfile?.id === selectedProduct?.id),
    [packageList, selectedProduct?.id]
  );
  const selectedPackage = useMemo(
    () => selectedProductPackages.find((item) => item.id === selectedPackageId) || selectedProductPackages[0],
    [selectedPackageId, selectedProductPackages]
  );
  const selectedProductRequirements = useMemo(
    () => (requirements.data || []).filter((requirement) => requirement.productProfile?.id === selectedProduct?.id),
    [requirements.data, selectedProduct?.id]
  );
  const selectedWorkspace = useMemo(
    () => (workspaces.data || []).find((workspace) => workspace.packageInstance?.id === selectedPackage?.id),
    [selectedPackage?.id, workspaces.data]
  );

  useEffect(() => {
    if (!selectedProductId && productList[0]) {
      setSelectedProductId(productList[0].id);
    }
  }, [productList, selectedProductId]);

  useEffect(() => {
    if (selectedPackage?.id && selectedPackage.id !== selectedPackageId) {
      setSelectedPackageId(selectedPackage.id);
    }
  }, [selectedPackage, selectedPackageId]);

  const packageModules = useQuery({
    queryKey: ['packages', selectedPackage?.id, 'modules'],
    enabled: !!selectedPackage?.id,
    queryFn: () => getJson<PackageModule[]>(`/packages/${selectedPackage?.id}/modules`),
  });
  const teamRecommendations = useQuery({
    queryKey: ['packages', selectedPackage?.id, 'team-recommendations'],
    enabled: !!selectedPackage?.id,
    queryFn: () => getJson<TeamRecommendation[]>(`/packages/${selectedPackage?.id}/team-recommendations`),
  });
  const milestones = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<Milestone[]>(`/workspaces/${selectedWorkspace?.id}/milestones`),
  });
  const shortlists = useQuery({
    queryKey: ['shortlists', selectedPackage?.id],
    enabled: !!selectedPackage?.id,
    queryFn: () => getJson<TeamShortlist[]>(`/shortlists?packageId=${selectedPackage?.id}`),
  });

  const createProduct = useMutation({
    mutationFn: () => postJson<ProductProfile, ProductProfilePayload>('/products', productForm.values),
    onSuccess: async (product) => {
      productForm.resetForm();
      setSelectedProductId(product.id);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
  const createRequirement = useMutation({
    mutationFn: () =>
      postJson<RequirementIntake, RequirementPayload>('/requirements', {
        ...requirementForm.values,
        productProfileId: selectedProduct?.id || '',
        businessGoal:
          requirementForm.values.businessGoal ||
          `Productize ${selectedProduct?.name || 'this product'} with verified services, evidence, and launch-ready milestones.`,
      }),
    onSuccess: async (requirement) => {
      requirementForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['requirements'] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
      if (!selectedPackage && requirement.id) {
        setPendingRequirementId(requirement.id);
      }
    },
  });
  const buildPackage = useMutation({
    mutationFn: (requirementId: string) => postJson<PackageInstance, Record<string, never>>(`/packages/from-requirement/${requirementId}`, {}),
    onSuccess: async (packageInstance) => {
      setSelectedPackageId(packageInstance.id);
      setPendingRequirementId('');
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      await queryClient.invalidateQueries({ queryKey: ['requirements'] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
  const acceptProposal = useMutation({
    mutationFn: (proposalId: string) =>
      putJson<QuoteProposal, { status: QuoteProposal['status'] }>(`/commerce/proposals/${proposalId}/status`, { status: 'OWNER_ACCEPTED' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['commerce-proposals'] });
    },
  });
  const upsertShortlist = useMutation({
    mutationFn: (payload: ShortlistPayload) => postJson<TeamShortlist, ShortlistPayload>('/shortlists', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['shortlists', selectedPackage?.id] });
    },
  });

  const productProposals = (proposals.data || []).filter((proposal) => proposal.packageInstance?.productProfile?.id === selectedProduct?.id);
  const activeShortlists = (shortlists.data || []).filter((shortlist) => shortlist.status !== 'ARCHIVED');
  const productSupport = (supportRequests.data || []).filter(
    (request) => request.workspace?.packageInstance?.productProfile?.id === selectedProduct?.id
  );
  const recommendedServices = packageModules.data?.length
    ? packageModules.data.map((module) => module.serviceModule)
    : selectedProductRequirements.map((requirement) => requirement.requestedServiceModule).filter(Boolean) as ServiceModule[];
  const health = productHealth(selectedProduct, selectedPackage, packageModules.data);
  const blockedMilestones = (milestones.data || []).filter((milestone) => milestone.status === 'BLOCKED').length;
  const submittedRequirement = selectedProductRequirements.find((requirement) => requirement.status === 'SUBMITTED' || requirement.status === 'PACKAGE_RECOMMENDED');
  const buildTargetRequirementId = pendingRequirementId || submittedRequirement?.id || '';

  const submitProduct = productForm.handleSubmit(() => createProduct.mutate());
  const submitRequirement = requirementForm.handleSubmit(() => {
    if (selectedProduct?.id) {
      requirementForm.setValue('productProfileId', selectedProduct.id);
      createRequirement.mutate();
    }
  });

  const loading = [products, requirements, packages, workspaces, categories, catalogModules, proposals, supportRequests, recommendations].some((query) => query.isLoading);
  const error = [products, requirements, packages, workspaces, categories, catalogModules, proposals, supportRequests, recommendations, packageModules, teamRecommendations, milestones, shortlists].find((query) => query.error)?.error
    || createProduct.error
    || createRequirement.error
    || buildPackage.error
    || acceptProposal.error
    || upsertShortlist.error;

  const recordShortlist = (teamId: string, status: TeamShortlist['status']) => {
    if (!selectedPackage?.id) return;
    upsertShortlist.mutate({
      packageInstanceId: selectedPackage.id,
      teamId,
      status,
      notes: status === 'COMPARED'
        ? 'Owner compared this team against package needs, evidence, and commercial readiness.'
        : 'Owner shortlisted this team for productization package review.',
    });
  };

  return (
    <>
      <PageHeader
        title="Productization Workspace"
        description="One product-centered command surface for lifecycle service selection, package creation, team comparison, proposal decisions, and delivery evidence."
        action={
          productList.length ? (
            <TextField
              select
              size="small"
              label="Product"
              value={selectedProduct?.id || ''}
              onChange={(event) => setSelectedProductId(event.target.value)}
              sx={{ minWidth: { xs: '100%', md: 300 } }}
            >
              {productList.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </TextField>
          ) : null
        }
      />
      <QueryState isLoading={loading} error={error} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 340px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          {selectedProduct ? (
            <Surface>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems={{ lg: 'center' }} justifyContent="space-between">
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: 1, bgcolor: '#f1efff', color: appleColors.purple, display: 'grid', placeItems: 'center' }}>
                    <Inventory2Outlined />
                  </Box>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="h2">{selectedProduct.name}</Typography>
                      <PastelChip label={formatLabel(selectedProduct.businessStage)} accent={appleColors.purple} />
                    </Stack>
                    <Typography color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.7, mt: 0.75 }}>
                      {selectedProduct.summary || 'Capture a concise product summary to drive service recommendations.'}
                    </Typography>
                  </Box>
                </Stack>
                <ProgressRing value={health} size={104} color={statusAccent(selectedPackage?.status)} label="health" />
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mt: 2.5 }}>
                <MetricTile label="Intakes" value={selectedProductRequirements.length} detail="Requirement records" accent={appleColors.purple} icon={<FactCheckOutlined />} />
                <MetricTile label="Package" value={selectedPackage ? formatLabel(selectedPackage.status) : 'Not built'} detail={selectedPackage?.name || 'Build from intake'} accent={statusAccent(selectedPackage?.status)} icon={<RocketLaunchOutlined />} />
                <MetricTile label="Shortlist" value={activeShortlists.length || teamRecommendations.data?.length || productProposals.length} detail="Verified team options" accent={appleColors.cyan} icon={<CompareArrowsOutlined />} />
                <MetricTile label="Blockers" value={blockedMilestones + productSupport.filter((request) => request.slaStatus === 'OVERDUE').length} detail="Milestones and support" accent={blockedMilestones ? appleColors.red : appleColors.green} icon={<CheckCircleOutlineOutlined />} />
              </Box>
            </Surface>
          ) : (
            <EmptyState label="Create a product profile to start the owner productization workflow." />
          )}

          <Surface>
            <SectionTitle title="Lifecycle Services" action={<PastelChip label={`${categories.data?.length || 0} service families`} accent={appleColors.purple} />} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              {(categories.data || []).map((category, index) => {
                const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                const categoryModules = (catalogModules.data || []).filter((module) => module.category?.id === category.id);
                const selected = recommendedServices.some((module) => module.category?.id === category.id);
                const firstModule = categoryModules[0];

                return (
                  <Box
                    key={category.id}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: selected ? `${palette.accent}66` : 'divider',
                      borderTop: `3px solid ${palette.accent}`,
                      background: selected ? `linear-gradient(180deg, ${palette.soft}, #fff)` : '#fff',
                      minHeight: 190,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Box sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: palette.bg, color: palette.accent, display: 'grid', placeItems: 'center', fontWeight: 900 }}>
                        {index + 1}
                      </Box>
                      <Typography variant="h4">{category.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {category.description || 'Specialist service category.'}
                      </Typography>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {categoryModules.slice(0, 3).map((module) => (
                          <PastelChip key={module.id} label={module.name} accent={palette.accent} bg={palette.bg} />
                        ))}
                      </Stack>
                    </Stack>
                    <Button
                      size="small"
                      variant={requirementForm.values.requestedServiceModuleId === firstModule?.id ? 'contained' : 'outlined'}
                      sx={{ mt: 2, alignSelf: 'flex-start' }}
                      disabled={!firstModule || !selectedProduct}
                      onClick={() => {
                        requirementForm.setValue('requestedServiceModuleId', firstModule?.id || null);
                        requirementForm.setValue('businessGoal', `Add ${category.name} to ${selectedProduct?.name || 'this product'} so it can move toward production readiness.`);
                      }}
                    >
                      {selected ? 'In plan' : 'Select'}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </Surface>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' }, gap: 2.5 }}>
            <Surface>
              <SectionTitle title="Add Product" action={<AddOutlined sx={{ color: appleColors.purple }} />} />
              <Box component="form" onSubmit={submitProduct}>
                <Stack spacing={1.5}>
                  <TextInput label="Name" value={productForm.values.name} onChange={(value) => productForm.setValue('name', value)} />
                  <TextInput label="Summary" value={productForm.values.summary} onChange={(value) => productForm.setValue('summary', value)} multiline />
                  <TextField select fullWidth label="Stage" value={productForm.values.businessStage} onChange={(event) => productForm.setValue('businessStage', event.target.value as ProductProfile['businessStage'])}>
                    {stageOptions.map((stage) => (
                      <MenuItem key={stage} value={stage}>{formatLabel(stage)}</MenuItem>
                    ))}
                  </TextField>
                  <TextInput label="Tech stack" value={productForm.values.techStack} onChange={(value) => productForm.setValue('techStack', value)} />
                  <TextInput label="Known risks" value={productForm.values.riskProfile} onChange={(value) => productForm.setValue('riskProfile', value)} multiline />
                  <SaveButton disabled={!productForm.values.name || createProduct.isPending} label="Create product" />
                </Stack>
              </Box>
            </Surface>

            <Surface>
              <SectionTitle title="Intake to Package" action={<PastelChip label={`${selectedProductRequirements.length} intakes`} accent={appleColors.blue} />} />
              <Box component="form" onSubmit={submitRequirement} sx={{ mb: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(210px, 1fr) minmax(240px, 1fr) 132px' }, gap: 1.25, alignItems: 'start' }}>
                  <TextField
                    select
                    size="small"
                    label="Requested service"
                    value={requirementForm.values.requestedServiceModuleId || ''}
                    onChange={(event) => requirementForm.setValue('requestedServiceModuleId', event.target.value || null)}
                    sx={compactIntakeFieldSx}
                  >
                    <MenuItem value="">General diagnosis</MenuItem>
                    {(catalogModules.data || []).map((module) => (
                      <MenuItem key={module.id} value={module.id}>{module.name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    label="Business goal"
                    value={requirementForm.values.businessGoal}
                    onChange={(event) => requirementForm.setValue('businessGoal', event.target.value)}
                    sx={compactIntakeFieldSx}
                  />
                  <Button
                    type="submit"
                    variant="outlined"
                    disabled={!selectedProduct || !requirementForm.values.businessGoal || createRequirement.isPending}
                    sx={{
                      ...intakeActionButtonSx,
                      borderColor: '#dbe4f0',
                      color: appleColors.purple,
                      bgcolor: '#fff',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: appleColors.purple,
                        bgcolor: '#f8f7ff',
                        boxShadow: '0 10px 22px rgba(98, 92, 255, 0.12)',
                      },
                    }}
                  >
                    Submit intake
                  </Button>
                </Box>
              </Box>
              <Stack spacing={1.25}>
                {selectedProductRequirements.length ? (
                  selectedProductRequirements.slice(0, 4).map((requirement) => (
                    <Box
                      key={requirement.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
                        gap: { xs: 1.25, md: 2 },
                        alignItems: 'center',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: '#e5edf7',
                        borderRadius: 1,
                        background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
                        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.045)',
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, color: appleColors.ink, lineHeight: 1.25 }}>{requirement.requestedServiceModule?.name || 'Product diagnosis'}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
                          {requirement.businessGoal}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} sx={{ minWidth: { md: 282 } }}>
                        <StatusChip label={requirement.status} />
                        <Button size="small" variant="contained" onClick={() => buildPackage.mutate(requirement.id)} disabled={buildPackage.isPending} sx={intakeActionButtonSx}>
                          Build Package
                        </Button>
                      </Stack>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">Select a lifecycle service and submit an intake to generate a governed package.</Typography>
                )}
              </Stack>
            </Surface>
          </Box>

          <Surface>
            <SectionTitle title="Package Plan" action={selectedPackage && <StatusChip label={selectedPackage.status} />} />
            {selectedPackage ? (
              <Stack spacing={2}>
                {(packageModules.isFetching || teamRecommendations.isFetching) && <LinearProgress sx={{ borderRadius: 999 }} />}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                  <Box>
                    <Typography variant="h3">{selectedPackage.name}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>{selectedPackage.summary}</Typography>
                  </Box>
                  <ProgressRing value={packageScore(selectedPackage, packageModules.data)} color={statusAccent(selectedPackage.status)} label="confidence" />
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${Math.max(1, packageModules.data?.length || 1)}, 1fr)` }, gap: 1.25 }}>
                  {(packageModules.data || []).map((module, index) => {
                    const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                    return (
                      <Box key={module.id} sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', background: palette.soft }}>
                        <PastelChip label={`Step ${index + 1}`} accent={palette.accent} bg={palette.bg} />
                        <Typography sx={{ mt: 1.25, fontWeight: 900 }}>{module.serviceModule.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>{module.acceptanceCriteria || module.serviceModule.acceptanceCriteria}</Typography>
                        <Box sx={{ mt: 1.25 }}><StatusChip label={module.status} /></Box>
                      </Box>
                    );
                  })}
                </Box>
              </Stack>
            ) : (
              <EmptyState label="No package exists for this product yet. Build one from a requirement intake." />
            )}
          </Surface>

          <Surface>
            <SectionTitle title="Team Shortlist and Compare" action={<PastelChip label={`${teamRecommendations.data?.length || 0} matches`} accent={appleColors.cyan} />} />
            {teamRecommendations.data?.length ? (
              <Stack spacing={1.5}>
                {teamRecommendations.data.slice(0, 4).map((recommendation, index) => {
                  const proposal = productProposals.find((item) => item.team.id === recommendation.team.id);
                  return (
                    <Box key={recommendation.team.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '82px 1.2fr 1.5fr auto' }, gap: 1.5, alignItems: 'center', py: 1.5, borderTop: index === 0 ? 0 : '1px solid', borderColor: 'divider' }}>
                      <ProgressRing value={Math.round(recommendation.score * 100)} size={72} color={appleColors.cyan} label="match" />
                      <Box>
                        <Typography variant="h4">{recommendation.team.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{recommendation.team.timezone || recommendation.team.typicalProjectSize}</Typography>
                        {proposal && <Typography variant="body2" color="text.secondary">{formatMoney(proposal.fixedPriceCents + proposal.platformFeeCents, proposal.currency)} · {proposal.timelineDays} days</Typography>}
                      </Box>
                      <Stack spacing={0.5}>
                        {recommendation.reasons.slice(0, 3).map((reason) => <DotLabel key={reason} label={reason} color={appleColors.green} />)}
                      </Stack>
                      <Stack spacing={1}>
                        <Button
                          variant={activeShortlists.some((item) => item.team.id === recommendation.team.id && item.status === 'COMPARED') ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => recordShortlist(recommendation.team.id, 'COMPARED')}
                          disabled={upsertShortlist.isPending}
                        >
                          Compare
                        </Button>
                        <Button
                          variant={activeShortlists.some((item) => item.team.id === recommendation.team.id) ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => recordShortlist(recommendation.team.id, 'ACTIVE')}
                          disabled={upsertShortlist.isPending}
                        >
                          Shortlist
                        </Button>
                        {proposal?.status === 'SUBMITTED' ? (
                          <Button variant="contained" size="small" onClick={() => acceptProposal.mutate(proposal.id)} disabled={acceptProposal.isPending}>
                            Accept
                          </Button>
                        ) : (
                          <StatusChip label={proposal?.status || recommendation.team.verificationStatus} color={proposal?.status === 'OWNER_ACCEPTED' ? 'success' : 'default'} />
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <EmptyState label={selectedPackage ? 'No team recommendations available yet.' : 'Build a package before comparing specialist teams.'} />
            )}
          </Surface>
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="AI Owner Brief" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
            <Stack direction="row" spacing={2} alignItems="center">
              <ProgressRing value={health || 68} size={92} color={appleColors.purple} label="/100" />
              <Box>
                <Typography variant="h4">Productization clarity</Typography>
                <Typography color="success.main" sx={{ fontWeight: 800 }}>Evidence-led next steps</Typography>
              </Box>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
              {recommendations.data?.[0]?.rationale || 'Use lifecycle services, package evidence, and verified teams to keep productization decisions concrete.'}
            </Typography>
          </Surface>

          <Surface>
            <SectionTitle title="Delivery Workspace" action={selectedWorkspace && <StatusChip label={selectedWorkspace.status} />} />
            {selectedWorkspace ? (
              <Stack spacing={1.5}>
                <Typography sx={{ fontWeight: 900 }}>{selectedWorkspace.name}</Typography>
                {(milestones.data || []).slice(0, 5).map((milestone) => (
                  <Stack key={milestone.id} direction="row" spacing={1} justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{milestone.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{milestone.dueDate || 'No date'}</Typography>
                    </Box>
                    <StatusChip label={milestone.status} />
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">A workspace appears after package handoff.</Typography>
            )}
          </Surface>

          <Surface sx={{ background: productSupport.some((request) => request.slaStatus === 'OVERDUE') ? '#fff7f8' : '#f6fffb' }}>
            <SectionTitle title="Support and Risk" />
            {productSupport.length ? (
              <Stack spacing={1.25}>
                {productSupport.slice(0, 4).map((request) => (
                  <Stack key={request.id} direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{request.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatLabel(request.status)} · {formatLabel(request.slaStatus)}</Typography>
                    </Box>
                    <PastelChip label={formatLabel(request.priority)} accent={statusAccent(request.priority)} />
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">No support requests are attached to this product.</Typography>
            )}
          </Surface>

          <Surface>
            <SectionTitle title="Next Decision" />
            <Stack spacing={1.25}>
              {!selectedPackage && <DotLabel label="Build the service package" color={appleColors.amber} />}
              {selectedPackage && !productProposals.some((proposal) => proposal.status === 'OWNER_ACCEPTED') && <DotLabel label="Compare and accept a team proposal" color={appleColors.purple} />}
              {selectedPackage && selectedWorkspace && <DotLabel label="Review milestone evidence" color={blockedMilestones ? appleColors.red : appleColors.green} />}
              {buildTargetRequirementId && !selectedPackage && (
                <Button variant="contained" startIcon={<SendOutlined />} onClick={() => buildPackage.mutate(buildTargetRequirementId)} disabled={buildPackage.isPending}>
                  Build package now
                </Button>
              )}
            </Stack>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
