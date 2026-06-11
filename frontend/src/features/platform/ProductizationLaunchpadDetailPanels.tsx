'use client';

import NextLink from 'next/link';
import { ArrowForwardOutlined } from '@mui/icons-material';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  EmptyState,
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { launchpadStatusAccent, packageHealth } from './productizationLaunchpadModel';
import type { PackageInstance, ProductProfile, ProjectWorkspace } from './types';

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
            const accent = launchpadStatusAccent(plan?.status);

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
        <EmptyState label="Create your first product profile to start planning." />
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
                {workspace.packageInstance?.productProfile?.name || workspace.packageInstance?.name || 'Product workspace'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <StatusChip label={workspace.status} />
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={workspace.status === 'ACTIVE_DELIVERY' ? 72 : workspace.status === 'MILESTONE_REVIEW' ? 82 : 48}
                    sx={{ height: 6, borderRadius: 999, bgcolor: '#eef2f7', '& .MuiLinearProgress-bar': { borderRadius: 999, bgcolor: launchpadStatusAccent(workspace.status) } }}
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
          Workspaces appear after the owner approves Planning into a delivery workspace.
        </Typography>
      )}
    </Surface>
  );
}
