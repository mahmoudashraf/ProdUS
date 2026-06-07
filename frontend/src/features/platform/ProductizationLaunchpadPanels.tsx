'use client';

import NextLink from 'next/link';
import {
  ArrowForwardOutlined,
  AutoAwesomeOutlined,
  FactCheckOutlined,
  Inventory2Outlined,
  PlaylistAddCheckOutlined,
  WorkspacesOutlined,
} from '@mui/icons-material';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import {
  DotLabel,
  EmptyState,
  MetricTile,
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import type { PackageInstance, ProductProfile, ProjectWorkspace } from './types';

export type LaunchpadDetailView = 'products' | 'workspaces';
type LaunchpadJourneyValue = 'plan' | LaunchpadDetailView;

export const packageHealth = (item?: PackageInstance) => {
  if (!item) return 54;
  if (item.status === 'DELIVERED') return 96;
  if (item.status === 'ACTIVE_DELIVERY') return 86;
  if (item.status === 'MILESTONE_REVIEW') return 76;
  if (item.status === 'SCOPE_NEGOTIATION') return 68;
  return 58;
};

export const statusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('CRITICAL') || status.includes('OVERDUE')) return appleColors.red;
  if (status.includes('RISK') || status.includes('WAIT') || status.includes('REVIEW') || status.includes('DUE')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER')) return appleColors.green;
  return appleColors.purple;
};

export function LaunchpadHeroPanel({
  nextProduct,
  currentDraftTitle,
  draftServices,
  draftTalent,
  cartStatus,
}: {
  nextProduct?: ProductProfile | undefined;
  currentDraftTitle: string;
  draftServices: number;
  draftTalent: number;
  cartStatus?: string | undefined;
}) {
  return (
    <Surface sx={{ p: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
      <Box sx={{ p: { xs: 2.5, md: 3 }, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' }, gap: 3, alignItems: 'center' }}>
        <Stack spacing={2}>
          <PastelChip label="Owner workflow" accent={appleColors.purple} />
          <Box>
            <Typography variant="h1" sx={{ fontSize: { xs: 34, md: 48 }, letterSpacing: 0, mb: 1 }}>
              Turn a product idea into a delivery workspace.
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 680, fontSize: 17, lineHeight: 1.7 }}>
              Keep the owner journey simple: product profile, service start plan, talent shortlist, then a workspace with milestones and evidence.
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
            <SectionTitle title="Current start plan" action={<PlaylistAddCheckOutlined sx={{ color: appleColors.purple }} />} />
            <Stack direction="row" spacing={2} alignItems="center">
              <ProgressRing value={clampScore((draftServices * 18) + (draftTalent * 14) + (nextProduct ? 28 : 0))} size={92} color={appleColors.purple} label="ready" />
              <Box>
                <Typography variant="h4">{currentDraftTitle}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {nextProduct ? `Prepared for ${nextProduct.name}` : 'Create or select a product to make this start plan actionable.'}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <PastelChip label={`${draftServices} services`} accent={appleColors.purple} />
              <PastelChip label={`${draftTalent} teams / experts`} accent={appleColors.cyan} bg="#e4f9fd" />
              <PastelChip label={formatLabel(cartStatus || 'DRAFT')} accent={statusAccent(cartStatus)} />
            </Stack>
            <Button component={NextLink} href="/owner/project-cart" variant="outlined" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 42 }}>
              Review and start workspace
            </Button>
          </Stack>
        </Surface>
      </Box>
    </Surface>
  );
}

export function LaunchpadMetricsStrip({
  productCount,
  requirementCount,
  draftServices,
  draftTalent,
  averageHealth,
  activeWorkspaceCount,
  workspaceCount,
}: {
  productCount: number;
  requirementCount: number;
  draftServices: number;
  draftTalent: number;
  averageHealth: number;
  activeWorkspaceCount: number;
  workspaceCount: number;
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
      <MetricTile label="Products" value={productCount} detail={`${requirementCount} product briefs`} accent={appleColors.purple} icon={<Inventory2Outlined />} sparkline />
      <MetricTile label="Start plan" value={draftServices + draftTalent} detail={`${draftServices} services, ${draftTalent} talent`} accent={appleColors.cyan} icon={<PlaylistAddCheckOutlined />} sparkline />
      <MetricTile label="Health" value={averageHealth ? `${averageHealth}/100` : 'New'} detail="Service plan confidence" accent={averageHealth >= 70 ? appleColors.green : appleColors.amber} icon={<FactCheckOutlined />} sparkline />
      <MetricTile label="Workspaces" value={activeWorkspaceCount} detail={`${workspaceCount} total`} accent={appleColors.green} icon={<WorkspacesOutlined />} sparkline />
    </Box>
  );
}

export function LaunchpadFocusPanel({
  draftServices,
  draftTalent,
  productCount,
  activeWorkspaceCount,
  value,
  onSelect,
}: {
  draftServices: number;
  draftTalent: number;
  productCount: number;
  activeWorkspaceCount: number;
  value: LaunchpadJourneyValue;
  onSelect: (value: LaunchpadJourneyValue) => void;
}) {
  const items: JourneyStepItem<LaunchpadJourneyValue>[] = [
    {
      value: 'plan',
      label: 'Review Start Plan',
      detail: 'Approve services and talent before opening a delivery workspace.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${draftServices + draftTalent} selected`} accent={appleColors.purple} bg="#f1efff" />,
    },
    {
      value: 'products',
      label: 'Products',
      detail: 'Open product profiles and continue the readiness path.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${productCount}`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
    {
      value: 'workspaces',
      label: 'Workspaces',
      detail: 'Review active delivery spaces only when you need operations.',
      accent: appleColors.green,
      meta: <PastelChip label={`${activeWorkspaceCount} active`} accent={appleColors.green} bg="#e7f8ee" />,
    },
  ];

  return (
    <Surface>
      <SectionTitle title="Choose Focus" action={<PastelChip label="One path at a time" accent={appleColors.purple} />} />
      <OwnerWorkspaceJourneyNav
        label="Productization command center focus"
        value={value}
        items={items}
        onChange={onSelect}
      />
    </Surface>
  );
}

export function LaunchpadDetailNavigation({
  currentLabel,
  onOpenHub,
}: {
  currentLabel: string;
  onOpenHub: () => void;
}) {
  return (
    <WorkspaceBreadcrumbs
      items={[
        { label: 'Command Center', onClick: onOpenHub },
        { label: currentLabel },
      ]}
      backLabel="Command center hub"
      onBack={onOpenHub}
    />
  );
}

export function LaunchpadAiNextActionPanel({
  draftServices,
  hasProducts,
}: {
  draftServices: number;
  hasProducts: boolean;
}) {
  const href = draftServices ? '/owner/project-cart' : hasProducts ? '/services' : '/products/new';
  return (
    <Surface>
      <SectionTitle title="AI Next Best Action" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
      <Typography variant="h4">
        {draftServices ? 'Review the start plan' : hasProducts ? 'Select lifecycle services' : 'Create a product profile'}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
        {draftServices
          ? 'Your start plan already has services. Add matching delivery talent or start the workspace when the scope is clear.'
          : hasProducts
            ? 'Choose services that represent the work needed to move the selected product into production.'
            : 'A product profile gives the platform enough context to recommend services, teams, and workspace milestones.'}
      </Typography>
      <Button component={NextLink} href={href} variant="contained" sx={{ mt: 2, minHeight: 44 }}>
        Continue
      </Button>
    </Surface>
  );
}

export function LaunchpadProductsPanel({
  productList,
  packageList,
}: {
  productList: ProductProfile[];
  packageList: PackageInstance[];
}) {
  return (
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
  );
}

export function LaunchpadActiveWorkspacesPanel({
  activeWorkspaces,
}: {
  activeWorkspaces: ProjectWorkspace[];
}) {
  return (
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
          Workspaces appear after the owner approves a start plan into a delivery project.
        </Typography>
      )}
    </Surface>
  );
}
