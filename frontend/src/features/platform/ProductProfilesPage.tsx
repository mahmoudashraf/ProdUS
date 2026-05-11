'use client';

import {
  AddOutlined,
  FavoriteBorderOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import { getJson, postJson } from './api';
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
  Surface,
  TextInput,
  appleColors,
  categoryPalette,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import { PackageInstance, ProductProfile } from './types';

const stages: ProductProfile['businessStage'][] = ['IDEA', 'PROTOTYPE', 'VALIDATED', 'LIVE', 'SCALING'];

interface ProductProfilePayload {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  productUrl: string;
  repositoryUrl: string;
  riskProfile: string;
}

const initialProfileValues: ProductProfilePayload = {
  name: '',
  summary: '',
  businessStage: 'PROTOTYPE',
  techStack: '',
  productUrl: '',
  repositoryUrl: '',
  riskProfile: '',
};

const productScore = (profile: ProductProfile, packages: PackageInstance[]) => {
  const packageInstance = packages.find((item) => item.productProfile?.id === profile.id);
  if (!packageInstance) return profile.businessStage === 'LIVE' ? 74 : 58;
  if (packageInstance.status === 'DELIVERED') return 96;
  if (packageInstance.status === 'ACTIVE_DELIVERY') return 88;
  if (packageInstance.status === 'MILESTONE_REVIEW') return 72;
  if (packageInstance.status === 'SCOPE_NEGOTIATION') return 65;
  return 52;
};

const statusForScore = (score: number) => {
  if (score >= 80) return { label: 'On Track', color: appleColors.green };
  if (score >= 65) return { label: 'At Risk', color: appleColors.amber };
  return { label: 'Needs Attention', color: appleColors.red };
};

export default function ProductProfilesPage() {
  const queryClient = useQueryClient();
  const profiles = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const form = useAdvancedForm<ProductProfilePayload>({
    initialValues: initialProfileValues,
    validationRules: {
      name: [{ type: 'required', message: 'Product name is required' }],
    },
  });

  const createProfile = useMutation({
    mutationFn: () => postJson<ProductProfile, ProductProfilePayload>('/products', form.values),
    onSuccess: async () => {
      form.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const submit = form.handleSubmit(() => {
    createProfile.mutate();
  });
  const productList = profiles.data || [];
  const packageList = packages.data || [];
  const healthyCount = productList.filter((profile) => productScore(profile, packageList) >= 80).length;
  const attentionCount = productList.filter((profile) => productScore(profile, packageList) < 65).length;
  const inDeliveryCount = packageList.filter((item) => item.status === 'ACTIVE_DELIVERY' || item.status === 'MILESTONE_REVIEW').length;

  return (
    <>
      <PageHeader
        title="My Products"
        description="Monitor portfolio health, delivery progress, and recommended productization actions."
      />
      <QueryState isLoading={profiles.isLoading || packages.isLoading} error={profiles.error || packages.error || createProfile.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 330px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <MetricTile label="Total products" value={productList.length} detail="Across active workspaces" accent={appleColors.purple} icon={<Inventory2Outlined />} sparkline />
            <MetricTile label="Healthy products" value={healthyCount} detail={`${productList.length ? Math.round((healthyCount / productList.length) * 100) : 0}% of portfolio`} accent={appleColors.green} icon={<FavoriteBorderOutlined />} sparkline />
            <MetricTile label="Needs attention" value={attentionCount} detail="Require action" accent={appleColors.amber} icon={<WarningAmberOutlined />} sparkline />
            <MetricTile label="In delivery" value={inDeliveryCount} detail="Actively delivering" accent={appleColors.blue} icon={<LocalShippingOutlined />} sparkline />
          </Box>

          <Surface>
            <SectionTitle title="Products" action={<PastelChip label={`${productList.length} records`} accent={appleColors.purple} />} />
            {productList.length ? (
              <Stack spacing={0}>
                {productList.map((profile, index) => {
                  const score = clampScore(productScore(profile, packageList));
                  const tone = statusForScore(score);
                  const packageInstance = packageList.find((item) => item.productProfile?.id === profile.id);
                  const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;

                  return (
                    <Box
                      key={profile.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '1.6fr 120px 130px 1.3fr 1fr' },
                        gap: 2,
                        alignItems: 'center',
                        py: 2,
                        borderTop: index === 0 ? 0 : '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 1,
                            bgcolor: palette.bg,
                            color: palette.accent,
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 900,
                          }}
                        >
                          {profile.name.charAt(0)}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 800 }}>{profile.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {profile.summary || 'No summary yet.'}
                          </Typography>
                        </Box>
                      </Stack>
                      <PastelChip label={formatLabel(profile.businessStage)} accent={palette.accent} bg={palette.bg} />
                      <ProgressRing value={score} color={tone.color} size={68} />
                      <Box>
                        <DotLabel label={tone.label} color={tone.color} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {profile.riskProfile || 'No risk profile recorded.'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800 }}>{packageInstance?.name || 'No package yet'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {packageInstance ? formatLabel(packageInstance.status) : 'Create a requirement intake'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <EmptyState label="Create a product profile to start requirement intake." />
            )}
          </Surface>
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="Add Product" action={<AddOutlined sx={{ color: appleColors.purple }} />} />
            <Box component="form" onSubmit={submit}>
              <Stack spacing={2}>
                <TextInput label="Product name" value={form.values.name} onChange={(name) => form.setValue('name', name)} />
                <TextInput label="Summary" value={form.values.summary} onChange={(summary) => form.setValue('summary', summary)} multiline />
                <TextField
                  select
                  fullWidth
                  label="Business stage"
                  value={form.values.businessStage}
                  onChange={(event) => form.setValue('businessStage', event.target.value as ProductProfile['businessStage'])}
                >
                  {stages.map((stage) => (
                    <MenuItem key={stage} value={stage}>
                      {formatLabel(stage)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextInput label="Tech stack" value={form.values.techStack} onChange={(techStack) => form.setValue('techStack', techStack)} />
                <TextInput label="Product URL" value={form.values.productUrl} onChange={(productUrl) => form.setValue('productUrl', productUrl)} />
                <TextInput label="Repository URL" value={form.values.repositoryUrl} onChange={(repositoryUrl) => form.setValue('repositoryUrl', repositoryUrl)} />
                <TextInput label="Known risks" value={form.values.riskProfile} onChange={(riskProfile) => form.setValue('riskProfile', riskProfile)} multiline />
                <SaveButton disabled={!form.values.name || createProfile.isPending} label="Create profile" />
              </Stack>
            </Box>
          </Surface>
          <Surface>
            <SectionTitle title="AI Portfolio Summary" />
            <Stack direction="row" spacing={2} alignItems="center">
              <ProgressRing
                value={productList.length ? Math.round((healthyCount / productList.length) * 100) : 68}
                color={appleColors.purple}
                size={92}
              />
              <Box>
                <Typography variant="h4">Good portfolio health</Typography>
                <Typography color="success.main" sx={{ fontWeight: 800 }}>
                  +6 pts vs last 7 days
                </Typography>
              </Box>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
              Resolve at-risk areas before milestone review and keep package evidence attached to each delivery.
            </Typography>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
