'use client';

import {
  GroupsOutlined,
  Inventory2Outlined,
  ShoppingCartOutlined,
  WorkspacesOutlined,
} from '@mui/icons-material';
import { Alert, Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  EmptyState,
  MetricTile,
  PastelChip,
  ProgressRing,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { ProductProfile } from './types';

interface ProjectStartPlanOverviewProps {
  title?: string | undefined;
  product?: ProductProfile | undefined;
  productOptions: ProductProfile[];
  hasPlaceholderProduct: boolean;
  score: number;
  canStartWorkspace: boolean;
  blockers: number;
  serviceCount: number;
  talentCount: number;
  notice?: string;
  isUpdatingProduct: boolean;
  onNoticeClose: () => void;
  onSelectProduct: (productId: string) => void;
}

export default function ProjectStartPlanOverview({
  title,
  product,
  productOptions,
  hasPlaceholderProduct,
  score,
  canStartWorkspace,
  blockers,
  serviceCount,
  talentCount,
  notice,
  isUpdatingProduct,
  onNoticeClose,
  onSelectProduct,
}: ProjectStartPlanOverviewProps) {
  const statusLabel = canStartWorkspace ? 'Ready to start' : hasPlaceholderProduct ? 'Choose product' : blockers ? 'Blocked' : 'Needs scope';
  const statusAccent = canStartWorkspace ? appleColors.green : hasPlaceholderProduct || blockers ? appleColors.amber : appleColors.purple;

  return (
    <>
      <Surface sx={{ p: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
        <Box sx={{ p: { xs: 2.5, md: 3 }, minWidth: 0, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: '0.75fr 1.25fr' }, gap: 3, alignItems: 'center' }}>
          <Stack spacing={2} sx={{ minWidth: 0 }}>
            <PastelChip label={statusLabel} accent={statusAccent} bg={`${statusAccent}12`} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ minWidth: 0 }}>
              <ProgressRing value={score} size={108} color={canStartWorkspace ? appleColors.green : appleColors.purple} label="ready" />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h2" sx={{ overflowWrap: 'anywhere' }}>{hasPlaceholderProduct ? 'Choose a real product for this plan' : title || 'Productization start plan'}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
                  Build the launch plan here: scope the services, confirm the delivery team, then start the workspace when the plan is ready.
                </Typography>
              </Box>
            </Stack>
          </Stack>

          <Stack spacing={2} sx={{ minWidth: 0 }}>
            {notice && (
              <Alert severity="success" onClose={onNoticeClose} sx={{ borderRadius: 1 }}>
                {notice}
              </Alert>
            )}
            {hasPlaceholderProduct && (
              <Alert severity="warning" sx={{ borderRadius: 1 }}>
                This draft is attached to a temporary test product. Select a production product before starting a workspace.
              </Alert>
            )}
            <TextField
              select
              fullWidth
              label="Product this plan belongs to"
              value={hasPlaceholderProduct ? '' : product?.id || ''}
              onChange={(event) => onSelectProduct(event.target.value)}
              disabled={isUpdatingProduct}
              InputLabelProps={{ shrink: true }}
              SelectProps={{ displayEmpty: true }}
              sx={{
                '& .MuiSelect-select': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  pr: 5,
                },
              }}
            >
              <MenuItem value="" disabled>
                Choose product
              </MenuItem>
              {productOptions.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
            {product && !hasPlaceholderProduct ? (
              <Surface sx={{ boxShadow: 'none', background: '#fff' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
                  <Box sx={{ width: 46, height: 46, borderRadius: 1, display: 'grid', placeItems: 'center', bgcolor: '#f1efff', color: appleColors.purple }}>
                    <Inventory2Outlined />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h4" sx={{ overflowWrap: 'anywhere' }}>{product.name}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                      {product.summary || 'No product summary yet.'}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <PastelChip label={formatLabel(product.businessStage)} accent={appleColors.purple} />
                      {product.techStack && <PastelChip label={product.techStack} accent={appleColors.cyan} bg="#e4f9fd" />}
                    </Stack>
                  </Box>
                </Stack>
              </Surface>
            ) : (
              <EmptyState label="Select or create a production product before this draft can become a workspace." />
            )}
          </Stack>
        </Box>
      </Surface>

      <Box sx={{ minWidth: 0, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        <MetricTile label="Selected services" value={serviceCount} detail="Become service plan modules" accent={appleColors.purple} icon={<ShoppingCartOutlined />} sparkline />
        <MetricTile label="Teams / experts" value={talentCount} detail="Become shortlist and participants" accent={appleColors.cyan} icon={<GroupsOutlined />} sparkline />
        <MetricTile
          label="Workspace status"
          value={canStartWorkspace ? 'Ready' : 'Needs scope'}
          detail={canStartWorkspace ? 'Product and services selected' : 'Product plus one service required'}
          accent={canStartWorkspace ? appleColors.green : appleColors.amber}
          icon={<WorkspacesOutlined />}
          sparkline
        />
      </Box>
    </>
  );
}
