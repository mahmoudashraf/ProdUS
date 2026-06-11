'use client';

import NextLink from 'next/link';
import { useState } from 'react';
import { ArrowForwardOutlined, DeleteOutlineOutlined, SearchOutlined } from '@mui/icons-material';
import { Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
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
  productId?: string | undefined;
  isRemovingService: boolean;
  onRemoveService: (itemId: string) => void;
}

export default function ProjectStartLifecycleServicesPanel({
  serviceItems,
  productId,
  isRemovingService,
  onRemoveService,
}: ProjectStartLifecycleServicesPanelProps) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const matchingServices = normalizedQuery
    ? serviceItems.filter((item) =>
        [
          item.serviceModule.name,
          item.serviceModule.description,
          item.serviceModule.category?.name,
          item.notes,
        ].some((value) => (value || '').toLowerCase().includes(normalizedQuery))
      )
    : serviceItems;
  const visibleLimit = normalizedQuery ? 12 : 8;
  const visibleServices = matchingServices.slice(0, visibleLimit);
  const hiddenCount = Math.max(0, matchingServices.length - visibleServices.length);
  const catalogHref = productId ? `/catalog?productId=${encodeURIComponent(productId)}` : '/catalog';

  return (
    <Surface>
      <SectionTitle title="Selected services" action={<Button component={NextLink} href={catalogHref} variant="text" endIcon={<ArrowForwardOutlined />}>Choose service</Button>} />
      {serviceItems.length ? (
        <Stack spacing={1.25}>
          <TextField
            size="small"
            fullWidth
            label="Search selected services"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          {visibleServices.map((item, index) => {
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
                  <DotLabel label={item.serviceModule.category?.name || 'Selected service'} color={palette.accent} />
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
          {visibleServices.length ? (
            <Box sx={{ p: 1.25, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                {hiddenCount
                  ? `Showing ${visibleServices.length} ${normalizedQuery ? 'matching' : 'highest-priority'} services. ${hiddenCount} more ${normalizedQuery ? 'matches are hidden; refine the search to narrow them' : 'services are available through search'}.`
                  : normalizedQuery
                    ? `Showing all ${visibleServices.length} matching services.`
                    : 'Showing the highest-priority selected services first.'}
              </Typography>
            </Box>
          ) : (
            <EmptyState label="No selected services match that search." />
          )}
        </Stack>
      ) : (
        <EmptyState label="No services yet. Choose services such as validation, security, cloud, database, launch, or support." />
      )}
    </Surface>
  );
}
