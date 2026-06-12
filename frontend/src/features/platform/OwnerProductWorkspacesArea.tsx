'use client';

import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowForwardOutlined,
  KeyboardBackspaceOutlined,
  WorkspacesOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import WorkspaceCommandPage from './WorkspaceCommandPage';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import type { ProductProfile, ProjectWorkspace } from './types';
import type { WorkspaceTab } from './ownerWorkspaceModel';

export default function OwnerProductWorkspacesArea({
  isLoading,
  selectedProduct,
  workspaceTab,
  workspaces,
}: {
  isLoading?: boolean | undefined;
  selectedProduct?: ProductProfile | undefined;
  workspaceTab: WorkspaceTab;
  workspaces: ProjectWorkspace[];
}) {
  const searchParams = useSearchParams();

  if (workspaceTab !== 'workspaces' || !selectedProduct) return null;

  const selectedWorkspaceId = searchParams?.get('workspace') || '';
  const selectedWorkspace = selectedWorkspaceId
    ? workspaces.find((workspace) => workspace.id === selectedWorkspaceId)
    : undefined;
  const listHref = `/products/${selectedProduct.id}?tab=workspaces`;

  if (selectedWorkspaceId) {
    return (
      <ProductWorkspaceDetail
        listHref={listHref}
        product={selectedProduct}
        workspace={selectedWorkspace}
      />
    );
  }

  return (
    <Stack spacing={2.5}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
          <Stack spacing={1} sx={{ minWidth: 0, maxWidth: 820 }}>
            <PastelChip label="Delivery after Planning" accent={appleColors.green} bg="#e7f8ee" />
            <Typography variant="h2">Product Workspaces</Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
              These are the delivery workspaces created from approved Work Plans for {selectedProduct.name}. Product findings, AI opportunities, and services stay attached to the product; delivery milestones live here once work starts.
            </Typography>
          </Stack>
          <Button
            component={NextLink}
            href={PROJECT_START_PLAN_HREF}
            variant="contained"
            endIcon={<ArrowForwardOutlined />}
            sx={{ minHeight: 44, alignSelf: { xs: 'stretch', md: 'center' } }}
          >
            Open Work Plan
          </Button>
        </Stack>
      </Surface>

      <Surface>
        <SectionTitle
          title="Assigned workspaces"
          action={<PastelChip label={isLoading ? 'Loading' : `${workspaces.length} found`} accent={workspaces.length ? appleColors.green : appleColors.muted} bg={workspaces.length ? '#e7f8ee' : '#f8fafc'} />}
        />
        {workspaces.length ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} productId={selectedProduct.id} workspace={workspace} />
            ))}
          </Box>
        ) : (
          <EmptyState label="No delivery workspace has been started for this product yet. Approve Planning when the product is ready for delivery work, then the workspace will appear here." />
        )}
      </Surface>
    </Stack>
  );
}

function WorkspaceCard({ productId, workspace }: { productId: string; workspace: ProjectWorkspace }) {
  const planName = workspace.packageInstance?.name || 'Approved Work Plan';
  const productStage = workspace.packageInstance?.productProfile?.businessStage;
  const workspaceHref = `/products/${productId}?tab=workspaces&workspace=${workspace.id}`;

  return (
    <Box
      component={NextLink}
      href={workspaceHref}
      sx={{
        display: 'block',
        p: 1.5,
        border: '1px solid',
        borderColor: appleColors.line,
        borderRadius: 1,
        bgcolor: '#fbfdff',
        color: 'inherit',
        minWidth: 0,
        textDecoration: 'none',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        '&:hover': {
          borderColor: '#93c5fd',
          boxShadow: '0 16px 36px rgba(37, 99, 235, 0.1)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}>{workspace.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55, overflowWrap: 'anywhere' }}>
              {planName}
            </Typography>
          </Box>
          <WorkspacesOutlined sx={{ color: appleColors.green, flexShrink: 0 }} />
        </Stack>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <StatusChip label={workspace.status} />
          {productStage && <PastelChip label={formatLabel(productStage)} accent={appleColors.purple} bg="#f1efff" />}
        </Stack>
        <Button
          component="span"
          variant="outlined"
          endIcon={<ArrowForwardOutlined />}
          sx={{ minHeight: 40, alignSelf: 'flex-start' }}
        >
          Open inside product
        </Button>
      </Stack>
    </Box>
  );
}

function ProductWorkspaceDetail({
  listHref,
  product,
  workspace,
}: {
  listHref: string;
  product: ProductProfile;
  workspace?: ProjectWorkspace | undefined;
}) {
  if (!workspace) {
    return (
      <Stack spacing={2.5}>
        <Button
          component={NextLink}
          href={listHref}
          variant="text"
          startIcon={<KeyboardBackspaceOutlined />}
          sx={{ alignSelf: 'flex-start', minHeight: 40 }}
        >
          Back to product workspaces
        </Button>
        <Surface>
          <EmptyState label="This workspace is not assigned to this product anymore. Go back to the product workspace list to choose the current delivery workspace." />
        </Surface>
      </Stack>
    );
  }

  const productStage = workspace.packageInstance?.productProfile?.businessStage || product.businessStage;

  return (
    <Stack spacing={2.5}>
      <Button
        component={NextLink}
        href={listHref}
        variant="text"
        startIcon={<KeyboardBackspaceOutlined />}
        sx={{ alignSelf: 'flex-start', minHeight: 40 }}
      >
        Back to product workspaces
      </Button>

      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }} justifyContent="space-between">
            <Stack spacing={1} sx={{ minWidth: 0, maxWidth: 820 }}>
              <PastelChip label="Inside product flow" accent={appleColors.green} bg="#e7f8ee" />
              <Typography variant="h2" sx={{ overflowWrap: 'anywhere' }}>
                Workspace delivery
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
                {workspace.name} stays inside {product.name}. Use this space for milestones, fixes, proof, people, and handoff without changing product context.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ md: 'flex-end' }}>
              <StatusChip label={workspace.status} />
              <PastelChip label={formatLabel(productStage)} accent={appleColors.purple} bg="#f1efff" />
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              component={NextLink}
              href={PROJECT_START_PLAN_HREF}
              variant="outlined"
              endIcon={<ArrowForwardOutlined />}
              sx={{ minHeight: 44, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
            >
              Review Work Plan
            </Button>
          </Stack>
        </Stack>
      </Surface>

      <WorkspaceCommandPage
        embedded
        productId={product.id}
        selectedWorkspaceId={workspace.id}
      />
    </Stack>
  );
}
