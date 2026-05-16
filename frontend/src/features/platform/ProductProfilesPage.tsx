'use client';

import NextLink from 'next/link';
import {
  AddOutlined,
  ArrowForwardOutlined,
  FavoriteBorderOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getJson } from './api';
import {
  DotLabel,
  EmptyState,
  MetricTile,
  PageHeader,
  PastelChip,
  ProgressRing,
  QueryState,
  SectionTitle,
  Surface,
  appleColors,
  categoryPalette,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import { PackageInstance, ProductProfile } from './types';

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
  const profiles = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
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
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={NextLink} href="/products/new" variant="contained" startIcon={<AddOutlined />} sx={{ minHeight: 42, minWidth: 140 }}>
              New product
            </Button>
            <Button component={NextLink} href="/owner/project-cart" variant="outlined" sx={{ minHeight: 42, minWidth: 160 }}>
              Review draft cart
            </Button>
          </Stack>
        }
      />
      <QueryState isLoading={profiles.isLoading || packages.isLoading} error={profiles.error || packages.error} />
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
                        gridTemplateColumns: { xs: '1fr', lg: '1.6fr 120px 130px 1.3fr 1fr auto' },
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
                        <Typography sx={{ fontWeight: 800 }}>{packageInstance?.name || 'No service plan yet'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {packageInstance ? formatLabel(packageInstance.status) : 'Create a product brief'}
                        </Typography>
                      </Box>
                      <Button component={NextLink} href={`/products/${profile.id}`} variant="outlined" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 38 }}>
                        Open
                      </Button>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <EmptyState label="Create a product profile to start productization." />
            )}
          </Surface>
        </Stack>

        <Stack spacing={2.5}>
          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
            <SectionTitle title="Next Product Action" action={<AddOutlined sx={{ color: appleColors.purple }} />} />
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              Product setup now lives in one guided flow. Create the product, add context, then continue into its product-centered workspace.
            </Typography>
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <Button component={NextLink} href="/products/new" variant="contained" startIcon={<AddOutlined />} sx={{ minHeight: 44 }}>
                Create product
              </Button>
              <Button component={NextLink} href="/owner/project-cart" variant="outlined" sx={{ minHeight: 42 }}>
                Review draft cart
              </Button>
            </Stack>
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
              Resolve at-risk areas before milestone review and keep service plan evidence attached to each delivery.
            </Typography>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
