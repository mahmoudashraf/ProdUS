'use client';

import { AddOutlined, KeyboardBackspaceOutlined, WorkspacesOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { postJson } from './api';
import OwnerProductDeliveryWorkspace from './OwnerProductDeliveryWorkspace';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import {
  EmptyState,
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { ProductProfile, ProjectWorkspace } from './types';

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [workspaceName, setWorkspaceName] = useState('');
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const createWorkspace = useMutation({
    mutationFn: () =>
      postJson<
        ProjectWorkspace,
        { productProfileId: string; name: string; status: ProjectWorkspace['status'] }
      >('/workspaces', {
        productProfileId: selectedProduct?.id || '',
        name: workspaceName.trim(),
        status: 'ACTIVE_DELIVERY',
      }),
    onSuccess: async workspace => {
      setWorkspaceName('');
      setShowCreateWorkspace(false);
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      if (selectedProduct?.id) {
        router.push(`/products/${selectedProduct.id}?tab=workspaces&workspace=${workspace.id}`, {
          scroll: false,
        });
      }
    },
  });
  const canCreateWorkspace = !!workspaceName.trim() && !createWorkspace.isPending;

  if (workspaceTab !== 'workspaces' || !selectedProduct) return null;

  const selectedWorkspaceId = searchParams?.get('workspace') || '';
  const selectedWorkspace = selectedWorkspaceId
    ? workspaces.find(workspace => workspace.id === selectedWorkspaceId)
    : undefined;
  const listHref = `/products/${selectedProduct.id}?tab=workspaces`;
  const productHomeHref = `/products/${selectedProduct.id}`;
  const openCreateWorkspace = () => {
    setShowCreateWorkspace(true);
    window.requestAnimationFrame(() => {
      document
        .getElementById('create-product-workspace')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };
  const closeCreateWorkspace = () => {
    setShowCreateWorkspace(false);
    setWorkspaceName('');
    createWorkspace.reset();
  };

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
      <Button
        component={NextLink}
        href={productHomeHref}
        variant="text"
        startIcon={<KeyboardBackspaceOutlined />}
        sx={{ alignSelf: 'flex-start', minHeight: 40 }}
      >
        Back to Product Details
      </Button>

      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
        >
          <Stack spacing={1} sx={{ minWidth: 0, maxWidth: 820 }}>
            <PastelChip label="Workspace field" accent={appleColors.green} bg="#e7f8ee" />
            <Typography variant="h2">
              {workspaces.length === 1 ? 'Product workspace' : 'Product workspaces'}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
              This is where {selectedProduct.name} turns scanner risks, selected services, people,
              proof, and handoff into practical work. The product keeps the evidence history; the
              workspace is where the work moves.
            </Typography>
            <DeliveryPath />
          </Stack>
          <Button
            onClick={openCreateWorkspace}
            variant="contained"
            startIcon={<AddOutlined />}
            sx={{
              minHeight: 44,
              minWidth: { md: 164 },
              alignSelf: { xs: 'stretch', md: 'center' },
              whiteSpace: 'nowrap',
            }}
          >
            Create workspace
          </Button>
        </Stack>
      </Surface>

      {showCreateWorkspace && (
        <Surface
          id="create-product-workspace"
          sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #fff8f5 100%)' }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ md: 'center' }}
            justifyContent="space-between"
          >
            <Box sx={{ minWidth: 0, maxWidth: 680 }}>
              <PastelChip label="Start empty" accent={appleColors.amber} bg="#fff4dc" />
              <Typography variant="h4" sx={{ mt: 0.75 }}>
                Create a workspace for this product
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                Name the workspace now. Add services, team members, findings, and proof inside it as
                the work becomes clear.
              </Typography>
            </Box>
            <Box
              component="form"
              onSubmit={event => {
                event.preventDefault();
                if (canCreateWorkspace) createWorkspace.mutate();
              }}
              sx={{ width: { xs: '100%', md: 520 }, flex: '0 0 auto' }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  fullWidth
                  label="Workspace name"
                  value={workspaceName}
                  onChange={event => setWorkspaceName(event.target.value)}
                  placeholder={`${selectedProduct.name} launch fixes`}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!canCreateWorkspace}
                  sx={{ minHeight: 52, px: 2.2, whiteSpace: 'nowrap' }}
                >
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  disabled={createWorkspace.isPending}
                  onClick={closeCreateWorkspace}
                  sx={{ minHeight: 52, px: 2.2, whiteSpace: 'nowrap' }}
                >
                  Cancel
                </Button>
              </Stack>
              {createWorkspace.error && (
                <Alert severity="error" sx={{ mt: 1, borderRadius: 1 }}>
                  {createWorkspace.error instanceof Error
                    ? createWorkspace.error.message
                    : 'Workspace could not be created.'}
                </Alert>
              )}
            </Box>
          </Stack>
        </Surface>
      )}

      <Surface>
        <SectionTitle
          title={workspaces.length === 1 ? 'Active workspace' : 'Active workspaces'}
          action={
            <PastelChip
              label={isLoading ? 'Loading' : `${workspaces.length} found`}
              accent={workspaces.length ? appleColors.green : appleColors.muted}
              bg={workspaces.length ? '#e7f8ee' : '#f8fafc'}
            />
          }
        />
        {workspaces.length ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
              gap: 1.5,
            }}
          >
            {workspaces.map(workspace => (
              <WorkspaceCard
                key={workspace.id}
                productId={selectedProduct.id}
                workspace={workspace}
              />
            ))}
          </Box>
        ) : (
          <EmptyState label="No workspace has been started for this product yet. Create a plan when you are ready to turn services, fixes, and people into workspace work." />
        )}
      </Surface>
    </Stack>
  );
}

function WorkspaceCard({
  productId,
  workspace,
}: {
  productId: string;
  workspace: ProjectWorkspace;
}) {
  const planName = workspace.packageInstance?.name || 'Workspace plan';
  const planSummary = workspace.packageInstance?.summary;
  const showPlanName = planName && planName.trim() !== workspace.name.trim();
  const planStatus = workspace.packageInstance?.status;
  const productStage = workspace.packageInstance?.productProfile?.businessStage;
  const workspaceHref = `/products/${productId}?tab=workspaces&workspace=${workspace.id}`;
  const progress = workspaceProgressFromStatus(workspace.status);
  const accent = workspaceStatusAccent(workspace.status);

  return (
    <Box
      component={NextLink}
      href={workspaceHref}
      sx={{
        display: 'block',
        p: 1.6,
        border: '1px solid',
        borderColor: `${accent}36`,
        borderRadius: 1,
        bgcolor: '#fff',
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
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1,
                bgcolor: `${accent}12`,
                color: accent,
                display: 'grid',
                flexShrink: 0,
                placeItems: 'center',
              }}
            >
              <WorkspacesOutlined />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}>
                {workspace.name}
              </Typography>
              {showPlanName && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.35, lineHeight: 1.55, overflowWrap: 'anywhere' }}
                >
                  {planName}
                </Typography>
              )}
            </Box>
          </Stack>
          <ProgressRing value={progress} size={58} color={accent} label="done" />
        </Stack>

        {planSummary && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              lineHeight: 1.55,
              overflow: 'hidden',
              overflowWrap: 'anywhere',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
            }}
          >
            {planSummary}
          </Typography>
        )}

        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <StatusChip label={workspace.status} />
          {planStatus && (
            <PastelChip
              label={`Plan ${formatLabel(planStatus)}`}
              accent={appleColors.green}
              bg="#e7f8ee"
            />
          )}
          {productStage && (
            <PastelChip
              label={formatLabel(productStage)}
              accent={appleColors.purple}
              bg="#f1efff"
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

function DeliveryPath() {
  const steps = [
    { label: 'Plan work', color: appleColors.purple },
    { label: 'Workspace', color: appleColors.green },
    { label: 'Fixes and proof', color: appleColors.blue },
    { label: 'Handoff', color: appleColors.cyan },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
        gap: 0.75,
        mt: 1,
      }}
    >
      {steps.map((step, index) => (
        <Box
          key={step.label}
          sx={{
            border: '1px solid',
            borderColor: `${step.color}2e`,
            borderRadius: 1,
            bgcolor: `${step.color}0d`,
            minWidth: 0,
            px: 1,
            py: 0.8,
          }}
        >
          <Typography variant="caption" sx={{ color: step.color, fontWeight: 900 }}>
            {index + 1}. {step.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function workspaceProgressFromStatus(status: ProjectWorkspace['status']) {
  if (status === 'CLOSED' || status === 'DELIVERED') return 100;
  if (status === 'SUPPORT_HANDOFF') return 88;
  if (status === 'MILESTONE_REVIEW') return 72;
  if (status === 'ACTIVE_DELIVERY') return 56;
  if (status === 'SCOPE_NEGOTIATION') return 36;
  if (status === 'AWAITING_TEAM_PROPOSAL') return 18;
  if (status === 'BLOCKED') return 42;
  return 8;
}

function workspaceStatusAccent(status: ProjectWorkspace['status']) {
  if (status === 'BLOCKED') return appleColors.red;
  if (
    status === 'AWAITING_TEAM_PROPOSAL' ||
    status === 'SCOPE_NEGOTIATION' ||
    status === 'MILESTONE_REVIEW'
  )
    return appleColors.amber;
  if (status === 'DELIVERED' || status === 'SUPPORT_HANDOFF' || status === 'CLOSED')
    return appleColors.green;
  if (status === 'ACTIVE_DELIVERY') return appleColors.blue;
  return appleColors.purple;
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
          Back to workspace list
        </Button>
        <Surface>
          <EmptyState label="This workspace is not assigned to this product anymore. Go back to the workspace list to choose the current product workspace." />
        </Surface>
      </Stack>
    );
  }
  return (
    <Stack spacing={2.5}>
      <Button
        component={NextLink}
        href={listHref}
        variant="text"
        startIcon={<KeyboardBackspaceOutlined />}
        sx={{ alignSelf: 'flex-start', minHeight: 40 }}
      >
        Back to workspace list
      </Button>

      <OwnerProductDeliveryWorkspace listHref={listHref} product={product} workspace={workspace} />
    </Stack>
  );
}
