'use client';

import NextLink from 'next/link';
import {
  ArrowForwardOutlined,
  WorkspacesOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
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
  if (workspaceTab !== 'workspaces' || !selectedProduct) return null;

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
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </Box>
        ) : (
          <EmptyState label="No delivery workspace has been started for this product yet. Approve Planning when the product is ready for delivery work, then the workspace will appear here." />
        )}
      </Surface>
    </Stack>
  );
}

function WorkspaceCard({ workspace }: { workspace: ProjectWorkspace }) {
  const planName = workspace.packageInstance?.name || 'Approved Work Plan';
  const productStage = workspace.packageInstance?.productProfile?.businessStage;
  const workspaceHref = `/workspaces?workspace=${workspace.id}`;

  return (
    <Box
      sx={{
        p: 1.5,
        border: '1px solid',
        borderColor: appleColors.line,
        borderRadius: 1,
        bgcolor: '#fbfdff',
        minWidth: 0,
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
          component={NextLink}
          href={workspaceHref}
          variant="outlined"
          endIcon={<ArrowForwardOutlined />}
          sx={{ minHeight: 40, alignSelf: 'flex-start' }}
        >
          Open workspace
        </Button>
      </Stack>
    </Box>
  );
}
