'use client';

import { useMemo, useState } from 'react';
import {
  AddTaskOutlined,
  AutoAwesomeOutlined,
  DeleteOutlineOutlined,
  ExpandMoreOutlined,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DotLabel,
  PastelChip,
  SectionTitle,
  appleColors,
  categoryPalette,
} from './PlatformComponents';
import type {
  ProductProfile,
  ProductizationCartServiceItem,
  ServiceCategory,
  ServiceModule,
} from './types';

const VISIBLE_SERVICE_FAMILY_LIMIT = 4;

interface OwnerServiceCatalogFamiliesPanelProps {
  product?: ProductProfile | undefined;
  categories: ServiceCategory[];
  catalogModules: ServiceModule[];
  recommendedServiceIds: ReadonlySet<string>;
  cartServiceItems: ProductizationCartServiceItem[];
  cartServiceIds: ReadonlySet<string>;
  mappedServiceNames: string[];
  isAddingService: boolean;
  isRemovingService: boolean;
  onAddService: (serviceModule: ServiceModule, categoryName?: string) => void;
  onRemoveService: (cartItemId: string) => void;
}

export default function OwnerServiceCatalogFamiliesPanel({
  product,
  categories,
  catalogModules,
  recommendedServiceIds,
  cartServiceItems,
  cartServiceIds,
  mappedServiceNames,
  isAddingService,
  isRemovingService,
  onAddService,
  onRemoveService,
}: OwnerServiceCatalogFamiliesPanelProps) {
  const [showAllFamilies, setShowAllFamilies] = useState(false);
  const categoryCards = useMemo(() => categories
    .map((category, index) => {
      const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
      const categoryModules = catalogModules.filter((module) => module.category?.id === category.id);
      const selected = categoryModules.some((module) => recommendedServiceIds.has(module.id) || cartServiceIds.has(module.id) || mappedServiceNames.includes(module.name));
      return {
        category,
        categoryModules,
        originalIndex: index,
        palette,
        selected,
      };
    })
    .sort((first, second) => {
      if (first.selected !== second.selected) return first.selected ? -1 : 1;
      return first.originalIndex - second.originalIndex;
    }), [cartServiceIds, catalogModules, categories, mappedServiceNames, recommendedServiceIds]);
  const visibleCategoryCards = showAllFamilies
    ? categoryCards
    : categoryCards.slice(0, VISIBLE_SERVICE_FAMILY_LIMIT);
  const hiddenFamilyCount = Math.max(0, categoryCards.length - visibleCategoryCards.length);

  return (
    <Box>
      <SectionTitle
        title="Browse Service Families"
        action={(
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap justifyContent="flex-end">
            <PastelChip label="Optional catalog depth" accent={appleColors.muted} />
            <PastelChip label={`${categoryCards.length} families`} accent={appleColors.cyan} bg="#e4f9fd" />
          </Stack>
        )}
      />
      {categories.length ? (
        <Stack spacing={1}>
          {visibleCategoryCards.map(({ category, categoryModules, originalIndex, palette, selected }) => {
            return (
              <Accordion
                key={category.id}
                disableGutters
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: selected ? `${palette.accent}55` : appleColors.line,
                  borderRadius: 1,
                  bgcolor: selected ? palette.soft : '#fff',
                  '&:before': { display: 'none' },
                  '&.Mui-expanded': { my: 0 },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreOutlined />}
                  sx={{
                    minHeight: 68,
                    '& .MuiAccordionSummary-content': { my: 1.1, minWidth: 0 },
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '34px minmax(0, 1fr)', sm: '34px minmax(0, 1fr) auto' },
                      gap: 1.25,
                      alignItems: 'center',
                      minWidth: 0,
                      width: '100%',
                    }}
                  >
                    <Box sx={{ width: 34, height: 34, borderRadius: 1, bgcolor: palette.bg, color: palette.accent, display: 'grid', placeItems: 'center', fontWeight: 900, flexShrink: 0 }}>
                      {originalIndex + 1}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 950, color: appleColors.ink }}>{category.name}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {category.description || 'Specialist service category.'}
                      </Typography>
                    </Box>
                    <Box sx={{ gridColumn: { xs: '2', sm: 'auto' }, justifySelf: { xs: 'start', sm: 'end' }, minWidth: 0 }}>
                      <PastelChip label={`${categoryModules.length} services`} accent={selected ? palette.accent : appleColors.muted} />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, px: 1.25, pb: 1.25 }}>
                  <Stack spacing={0.75}>
                    {categoryModules.map((module) => {
                      const cartItem = cartServiceItems.find((item) => item.serviceModule.id === module.id);
                      const inPlan = !!cartItem;
                      const recommended = recommendedServiceIds.has(module.id) || mappedServiceNames.includes(module.name);

                      return (
                        <Box
                          key={module.id}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) 38px',
                            alignItems: 'center',
                            gap: 0.75,
                            minHeight: 46,
                            px: 1,
                            py: 0.8,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: inPlan || recommended ? `${palette.accent}4d` : '#e5edf7',
                            bgcolor: inPlan ? palette.bg : '#fff',
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={0.6} alignItems="center" sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: appleColors.ink }} noWrap>
                                {module.name}
                              </Typography>
                              {recommended && <AutoAwesomeOutlined sx={{ color: palette.accent, fontSize: 15, flexShrink: 0 }} />}
                            </Stack>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {module.timelineRange || module.priceRange || module.ownerOutcome || 'Lifecycle module'}
                            </Typography>
                          </Box>
                          <Tooltip title={inPlan ? 'Remove from start plan' : 'Add to start plan'}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={!product || isAddingService || isRemovingService}
                                onClick={() => {
                                  if (cartItem) {
                                    onRemoveService(cartItem.id);
                                  } else {
                                    onAddService(module, category.name);
                                  }
                                }}
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 1,
                                  color: inPlan ? appleColors.red : palette.accent,
                                  bgcolor: inPlan ? '#fff7f8' : palette.bg,
                                  border: '1px solid',
                                  borderColor: inPlan ? '#fecdd3' : `${palette.accent}24`,
                                }}
                              >
                                {inPlan ? <DeleteOutlineOutlined fontSize="small" /> : <AddTaskOutlined fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      );
                    })}
                    <DotLabel label={selected ? 'Part of the fix path' : 'Available if scope expands'} color={selected ? palette.accent : appleColors.muted} />
                  </Stack>
                </AccordionDetails>
              </Accordion>
            );
          })}
          {hiddenFamilyCount > 0 || showAllFamilies ? (
            <Button
              variant="outlined"
              onClick={() => setShowAllFamilies((current) => !current)}
              sx={{ minHeight: 42, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
            >
              {showAllFamilies ? 'Show fewer service families' : `Show ${hiddenFamilyCount} more service families`}
            </Button>
          ) : null}
        </Stack>
      ) : (
        <Box sx={{ mt: 1.5, p: 1.5, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">Service catalog data is not available yet.</Typography>
        </Box>
      )}
    </Box>
  );
}
