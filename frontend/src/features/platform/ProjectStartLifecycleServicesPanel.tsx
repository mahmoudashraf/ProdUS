'use client';

import NextLink from 'next/link';
import { ArrowForwardOutlined, DeleteOutlineOutlined } from '@mui/icons-material';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  EmptyState,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  categoryPalette,
} from './PlatformComponents';
import type { ProductizationCartServiceItem } from './types';

interface ProjectStartLifecycleServicesPanelProps {
  serviceItems: ProductizationCartServiceItem[];
  isRemovingService: boolean;
  onRemoveService: (itemId: string) => void;
}

export default function ProjectStartLifecycleServicesPanel({
  serviceItems,
  isRemovingService,
  onRemoveService,
}: ProjectStartLifecycleServicesPanelProps) {
  return (
    <Surface>
      <SectionTitle title="Lifecycle Services" action={<Button component={NextLink} href="/services" variant="text" endIcon={<ArrowForwardOutlined />}>Choose service</Button>} />
      {serviceItems.length ? (
        <Stack spacing={1.25}>
          {serviceItems.map((item, index) => {
            const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
            const serviceMeta = item.serviceModule.timelineRange || item.serviceModule.priceRange || 'Scoped during planning';

            return (
              <Box
                key={item.id}
                sx={{
                  minWidth: 0,
                  display: 'grid',
                  gridTemplateColumns: { xs: '42px minmax(0, 1fr) auto', md: '50px minmax(0, 1.4fr) minmax(220px, 0.8fr) auto' },
                  gap: 1.5,
                  alignItems: 'center',
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: '#fff',
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: palette.bg,
                    color: palette.accent,
                    fontWeight: 900,
                  }}
                >
                  {item.sequenceOrder}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900 }}>{item.serviceModule.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
                    {item.serviceModule.description || item.notes || 'Lifecycle service selected for this product.'}
                  </Typography>
                </Box>
                <Stack spacing={0.75} sx={{ display: { xs: 'none', md: 'flex' } }}>
                  <DotLabel label={item.serviceModule.category?.name || 'Lifecycle service'} color={palette.accent} />
                  <PastelChip label={serviceMeta} accent={palette.accent} bg={palette.bg} />
                </Stack>
                <IconButton
                  size="small"
                  aria-label={`Remove ${item.serviceModule.name}`}
                  onClick={() => onRemoveService(item.id)}
                  disabled={isRemovingService}
                  sx={{ width: 36, height: 36, borderRadius: 1, color: appleColors.red, bgcolor: '#fff7f8' }}
                >
                  <DeleteOutlineOutlined fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <EmptyState label="No services yet. Choose productization services such as validation, security, cloud, database, launch, or support." />
      )}
    </Surface>
  );
}
