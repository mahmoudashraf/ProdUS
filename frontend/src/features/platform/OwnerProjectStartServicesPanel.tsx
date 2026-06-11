'use client';

import NextLink from 'next/link';
import { AutoAwesomeOutlined, PlaylistAddCheckOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { appleColors } from './PlatformComponents';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import type { ProductizationStartGap, ServiceModule } from './types';

interface OwnerProjectStartServicesPanelProps {
  serviceItems: Array<{
    id: string;
    serviceModule: ServiceModule;
  }>;
  productId?: string | undefined;
  blockingGaps: ProductizationStartGap[];
  isAddingService: boolean;
  isRemovingService: boolean;
  onAddGapService: (serviceModule: ServiceModule, notes: string) => void;
  onRemoveService: (itemId: string) => void;
}

export default function OwnerProjectStartServicesPanel({
  serviceItems,
  productId,
  blockingGaps,
  isAddingService,
  isRemovingService,
  onAddGapService,
  onRemoveService,
}: OwnerProjectStartServicesPanelProps) {
  const visibleServiceItems = serviceItems.slice(0, 4);
  const remainingServiceCount = Math.max(0, serviceItems.length - visibleServiceItems.length);
  const catalogHref = productId ? `/catalog?productId=${encodeURIComponent(productId)}` : '/catalog';

  return (
    <>
      {serviceItems.length ? (
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
              Selected services
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              {serviceItems.length} total
            </Typography>
          </Stack>
          {visibleServiceItems.map((item) => (
            <Stack
              key={item.id}
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="center"
              sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                  {item.serviceModule.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.serviceModule.category?.name || 'Lifecycle service'}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={() => onRemoveService(item.id)}
                disabled={isRemovingService}
                sx={{ minHeight: 32, minWidth: 72 }}
              >
                Remove
              </Button>
            </Stack>
          ))}
          {remainingServiceCount > 0 && (
            <Box sx={{ p: 1, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#f8fafc' }}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {remainingServiceCount} more services are included in the approved scope.
              </Typography>
              <Button component={NextLink} href={PROJECT_START_PLAN_HREF} size="small" variant="text" sx={{ mt: 0.5, minHeight: 32, px: 0 }}>
                Open Planning
              </Button>
            </Box>
          )}
        </Stack>
      ) : (
        <Box sx={{ p: 1.25, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Choose the service that resolves the launch decision before starting the workspace.
          </Typography>
        </Box>
      )}

      {blockingGaps.length > 0 && (
        <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: '#fff7ed', border: '1px solid', borderColor: '#fed7aa' }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeOutlined sx={{ color: appleColors.amber }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  Before this becomes a workspace
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Required scope gaps for the first delivery handoff.
                </Typography>
              </Box>
            </Stack>
            {blockingGaps.map((gap) => (
              <Box
                key={`${gap.type}-${gap.serviceModule?.id || gap.title}`}
                sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1, alignItems: 'center' }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    {gap.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {gap.description || 'Required before starting.'}
                  </Typography>
                </Box>
                {gap.serviceModule ? (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<PlaylistAddCheckOutlined />}
                    disabled={isAddingService}
                    onClick={() => onAddGapService(gap.serviceModule!, `Chosen from Planning. ${gap.description || ''}`.trim())}
                    sx={{ minHeight: 36 }}
                  >
                    Choose
                  </Button>
                ) : (
                  <Button component={NextLink} href={gap.type === 'PRODUCT' ? '/products/new' : catalogHref} size="small" variant="outlined" sx={{ minHeight: 36 }}>
                    Open
                  </Button>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </>
  );
}
