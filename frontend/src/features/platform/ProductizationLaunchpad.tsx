'use client';

import NextLink from 'next/link';
import {
  AddOutlined,
  ArrowForwardOutlined,
  AutoAwesomeOutlined,
  FactCheckOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  ShoppingCartOutlined,
  WorkspacesOutlined,
} from '@mui/icons-material';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
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
  StatusChip,
  Surface,
  appleColors,
  categoryPalette,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import { PackageInstance, ProductProfile, ProductizationCart, ProjectWorkspace, RequirementIntake } from './types';

const packageHealth = (item?: PackageInstance) => {
  if (!item) return 54;
  if (item.status === 'DELIVERED') return 96;
  if (item.status === 'ACTIVE_DELIVERY') return 86;
  if (item.status === 'MILESTONE_REVIEW') return 76;
  if (item.status === 'SCOPE_NEGOTIATION') return 68;
  return 58;
};

const statusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('CRITICAL') || status.includes('OVERDUE')) return appleColors.red;
  if (status.includes('RISK') || status.includes('WAIT') || status.includes('REVIEW') || status.includes('DUE')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER')) return appleColors.green;
  return appleColors.purple;
};

const steps = [
  {
    title: 'Define product',
    detail: 'Create a focused product profile with goals, stack, evidence, and risks.',
    href: '/products/new',
    icon: Inventory2Outlined,
    accent: appleColors.purple,
  },
  {
    title: 'Select lifecycle services',
    detail: 'Add validation, security, cloud, database, launch, or support services to the draft cart.',
    href: '/services',
    icon: ShoppingCartOutlined,
    accent: appleColors.cyan,
  },
  {
    title: 'Match delivery talent',
    detail: 'Shortlist verified teams and solo experts before committing to a workspace.',
    href: '/teams',
    icon: GroupsOutlined,
    accent: appleColors.green,
  },
  {
    title: 'Start workspace',
    detail: 'Convert the draft cart into milestones, participants, and delivery evidence.',
    href: '/owner/project-cart#project-cart',
    icon: WorkspacesOutlined,
    accent: appleColors.amber,
  },
];

export default function ProductizationLaunchpad() {
  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const requirements = useQuery({ queryKey: ['requirements'], queryFn: () => getJson<RequirementIntake[]>('/requirements') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const cart = useQuery({ queryKey: ['productization-cart'], queryFn: () => getJson<ProductizationCart>('/productization-cart/current') });

  const productList = products.data || [];
  const packageList = packages.data || [];
  const workspaceList = workspaces.data || [];
  const activeWorkspaces = workspaceList.filter((workspace) => workspace.status !== 'CLOSED' && workspace.status !== 'DELIVERED');
  const draftServices = cart.data?.serviceItems.length || 0;
  const draftTalent = cart.data?.talentItems.length || 0;
  const averageHealth = packageList.length
    ? Math.round(packageList.reduce((total, item) => total + packageHealth(item), 0) / packageList.length)
    : productList.length
      ? 58
      : 0;
  const nextProduct = cart.data?.productProfile || productList[0];

  return (
    <>
      <PageHeader
        title="Productization Command Center"
        description="Start with one product, collect lifecycle services and verified talent in a draft cart, then convert that plan into a governed workspace."
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={NextLink} href="/products/new" variant="contained" startIcon={<AddOutlined />} sx={{ minHeight: 44, minWidth: 150 }}>
              New product
            </Button>
            <Button component={NextLink} href="/owner/project-cart#project-cart" variant="outlined" startIcon={<ShoppingCartOutlined />} sx={{ minHeight: 44, minWidth: 168 }}>
              Review draft cart
            </Button>
          </Stack>
        }
      />
      <QueryState
        isLoading={[products, requirements, packages, workspaces, cart].some((query) => query.isLoading)}
        error={[products, requirements, packages, workspaces, cart].find((query) => query.error)?.error}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 340px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Surface sx={{ p: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
            <Box sx={{ p: { xs: 2.5, md: 3 }, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' }, gap: 3, alignItems: 'center' }}>
              <Stack spacing={2}>
                <PastelChip label="Owner workflow" accent={appleColors.purple} />
                <Box>
                  <Typography variant="h1" sx={{ fontSize: { xs: 34, md: 48 }, letterSpacing: 0, mb: 1 }}>
                    Turn a product idea into a delivery workspace.
                  </Typography>
                  <Typography color="text.secondary" sx={{ maxWidth: 680, fontSize: 17, lineHeight: 1.7 }}>
                    Keep the owner journey simple: product profile, service draft cart, talent shortlist, then a workspace with milestones and evidence.
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button component={NextLink} href={nextProduct ? `/products/${nextProduct.id}` : '/products/new'} variant="contained" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 46 }}>
                    {nextProduct ? `Continue ${nextProduct.name}` : 'Create first product'}
                  </Button>
                  <Button component={NextLink} href="/services" variant="outlined" sx={{ minHeight: 46 }}>
                    Explore services
                  </Button>
                </Stack>
              </Stack>

              <Surface sx={{ boxShadow: '0 18px 60px rgba(98, 92, 255, 0.12)' }}>
                <Stack spacing={2}>
                  <SectionTitle title="Current draft" action={<ShoppingCartOutlined sx={{ color: appleColors.purple }} />} />
                  <Stack direction="row" spacing={2} alignItems="center">
                    <ProgressRing value={clampScore((draftServices * 18) + (draftTalent * 14) + (nextProduct ? 28 : 0))} size={92} color={appleColors.purple} label="ready" />
                    <Box>
                      <Typography variant="h4">{cart.data?.title || 'Draft productization cart'}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        {nextProduct ? `Prepared for ${nextProduct.name}` : 'Create or select a product to make this draft actionable.'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <PastelChip label={`${draftServices} services`} accent={appleColors.purple} />
                    <PastelChip label={`${draftTalent} teams / experts`} accent={appleColors.cyan} bg="#e4f9fd" />
                    <PastelChip label={formatLabel(cart.data?.status || 'DRAFT')} accent={statusAccent(cart.data?.status)} />
                  </Stack>
                  <Button component={NextLink} href="/owner/project-cart#project-cart" variant="outlined" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 42 }}>
                    Review and start workspace
                  </Button>
                </Stack>
              </Surface>
            </Box>
          </Surface>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
            <MetricTile label="Products" value={productList.length} detail={`${requirements.data?.length || 0} product briefs`} accent={appleColors.purple} icon={<Inventory2Outlined />} sparkline />
            <MetricTile label="Draft cart" value={draftServices + draftTalent} detail={`${draftServices} services, ${draftTalent} talent`} accent={appleColors.cyan} icon={<ShoppingCartOutlined />} sparkline />
            <MetricTile label="Health" value={averageHealth ? `${averageHealth}/100` : 'New'} detail="Service plan confidence" accent={averageHealth >= 70 ? appleColors.green : appleColors.amber} icon={<FactCheckOutlined />} sparkline />
            <MetricTile label="Workspaces" value={activeWorkspaces.length} detail={`${workspaceList.length} total`} accent={appleColors.green} icon={<WorkspacesOutlined />} sparkline />
          </Box>

          <Surface>
            <SectionTitle title="Owner Journey" action={<PastelChip label="Focused routes" accent={appleColors.purple} />} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Button
                    key={step.title}
                    component={NextLink}
                    href={step.href}
                    variant="outlined"
                    sx={{
                      alignItems: 'stretch',
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      minHeight: 176,
                      p: 2,
                      borderRadius: 1,
                      borderColor: `${step.accent}40`,
                      background: `linear-gradient(145deg, #fff, ${categoryPalette[index % categoryPalette.length]?.soft || '#f8fafc'})`,
                      color: appleColors.ink,
                    }}
                  >
                    <Stack spacing={1.4} alignItems="flex-start">
                      <Box sx={{ width: 46, height: 46, borderRadius: 1, display: 'grid', placeItems: 'center', bgcolor: `${step.accent}14`, color: step.accent }}>
                        <Icon />
                      </Box>
                      <Box>
                        <Typography variant="h4">{step.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
                          {step.detail}
                        </Typography>
                      </Box>
                    </Stack>
                  </Button>
                );
              })}
            </Box>
          </Surface>

          <Surface>
            <SectionTitle title="Products In Motion" action={<Button component={NextLink} href="/products" variant="text" endIcon={<ArrowForwardOutlined />}>View all</Button>} />
            {productList.length ? (
              <Stack spacing={0}>
                {productList.slice(0, 5).map((product, index) => {
                  const plan = packageList.find((item) => item.productProfile?.id === product.id);
                  const health = packageHealth(plan);
                  const accent = statusAccent(plan?.status);

                  return (
                    <Box
                      key={product.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '72px 1fr', md: '82px 1.3fr 1fr auto' },
                        gap: 2,
                        alignItems: 'center',
                        py: 2,
                        borderTop: index === 0 ? 0 : '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <ProgressRing value={health} size={68} color={accent} />
                      <Box>
                        <Typography variant="h4">{product.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, lineHeight: 1.55 }}>
                          {product.summary || 'No product summary yet.'}
                        </Typography>
                      </Box>
                      <Stack spacing={0.75}>
                        <DotLabel label={formatLabel(product.businessStage)} color={appleColors.purple} />
                        <Typography variant="body2" color="text.secondary">{plan?.name || 'No service plan yet'}</Typography>
                      </Stack>
                      <Button component={NextLink} href={`/products/${product.id}`} variant="outlined" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 40 }}>
                        Open
                      </Button>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <EmptyState label="Create your first product profile to start productization." />
            )}
          </Surface>
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="AI Next Best Action" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
            <Typography variant="h4">
              {draftServices ? 'Review the draft cart' : productList.length ? 'Select lifecycle services' : 'Create a product profile'}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
              {draftServices
                ? 'Your draft already has services. Add matching delivery talent or start the workspace when the scope is clear.'
                : productList.length
                  ? 'Choose services that represent the work needed to move the selected product into production.'
                  : 'A product profile gives the platform enough context to recommend services, teams, and workspace milestones.'}
            </Typography>
            <Button
              component={NextLink}
              href={draftServices ? '/owner/project-cart#project-cart' : productList.length ? '/services' : '/products/new'}
              variant="contained"
              sx={{ mt: 2, minHeight: 44 }}
            >
              Continue
            </Button>
          </Surface>

          <Surface>
            <SectionTitle title="Active Workspaces" action={<PastelChip label={`${activeWorkspaces.length} active`} accent={appleColors.green} bg="#e7f8ee" />} />
            {activeWorkspaces.length ? (
              <Stack spacing={1.4}>
                {activeWorkspaces.slice(0, 4).map((workspace) => (
                  <Box key={workspace.id} sx={{ pb: 1.4, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography sx={{ fontWeight: 900 }}>{workspace.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                      {workspace.packageInstance?.productProfile?.name || workspace.packageInstance?.name || 'Productization workspace'}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <StatusChip label={workspace.status} />
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={workspace.status === 'ACTIVE_DELIVERY' ? 72 : workspace.status === 'MILESTONE_REVIEW' ? 82 : 48}
                          sx={{ height: 6, borderRadius: 999, bgcolor: '#eef2f7', '& .MuiLinearProgress-bar': { borderRadius: 999, bgcolor: statusAccent(workspace.status) } }}
                        />
                      </Box>
                    </Stack>
                  </Box>
                ))}
                <Button component={NextLink} href="/workspaces" variant="outlined" sx={{ minHeight: 42 }}>
                  Open workspaces
                </Button>
              </Stack>
            ) : (
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Workspaces appear after the owner converts a draft cart into a delivery project.
              </Typography>
            )}
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
