'use client';

import {
  AddTaskOutlined,
  AutoAwesomeOutlined,
  CheckCircleOutlined,
  DeleteOutlineOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import {
  DotLabel,
  PastelChip,
  SectionTitle,
  appleColors,
} from './PlatformComponents';
import type {
  ProductProfile,
  ProductizationCartServiceItem,
  ServiceModule,
} from './types';

interface OwnerServicePriorityListProps {
  product?: ProductProfile | undefined;
  services: ServiceModule[];
  recommendedServiceIds: ReadonlySet<string>;
  mappedServiceNames: string[];
  cartServiceItems: ProductizationCartServiceItem[];
  isAddingService: boolean;
  isRemovingService: boolean;
  onAddService: (serviceModule: ServiceModule, categoryName?: string) => void;
  onRemoveService: (cartItemId: string) => void;
}

const priorityReason = ({
  inPlan,
  mapped,
  recommended,
  service,
}: {
  inPlan: boolean;
  mapped: boolean;
  recommended: boolean;
  service: ServiceModule;
}) => {
  if (mapped) return 'Mapped from launch proof, scanner findings, or readiness gaps.';
  if (recommended) return 'Recommended for this product stage and start-plan scope.';
  if (inPlan) return 'Already selected for the plan the owner can approve.';
  return service.ownerOutcome || service.description || 'A lifecycle service that can become delivery work.';
};

export default function OwnerServicePriorityList({
  product,
  services,
  recommendedServiceIds,
  mappedServiceNames,
  cartServiceItems,
  isAddingService,
  isRemovingService,
  onAddService,
  onRemoveService,
}: OwnerServicePriorityListProps) {
  if (!services.length) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <SectionTitle
        title="Priority Services"
        action={<PastelChip label={`${services.length} focused`} accent={appleColors.cyan} bg="#e4f9fd" />}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
        {services.map((service) => {
          const cartItem = cartServiceItems.find((item) => item.serviceModule.id === service.id);
          const inPlan = Boolean(cartItem);
          const mapped = mappedServiceNames.includes(service.name);
          const recommended = recommendedServiceIds.has(service.id);
          const reason = priorityReason({ inPlan, mapped, recommended, service });

          return (
            <Box
              key={service.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 38px',
                gap: 1,
                p: 1.35,
                borderRadius: 1,
                border: '1px solid',
                borderColor: mapped ? '#bae6fd' : inPlan ? '#bbf7d0' : appleColors.line,
                bgcolor: mapped ? '#f5fdff' : inPlan ? '#f6fff9' : '#fff',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
                  <Typography sx={{ fontWeight: 950, color: appleColors.ink, lineHeight: 1.25 }}>
                    {service.name}
                  </Typography>
                  {mapped && <ShieldOutlined sx={{ color: appleColors.cyan, fontSize: 17 }} />}
                  {recommended && <AutoAwesomeOutlined sx={{ color: appleColors.purple, fontSize: 17 }} />}
                  {inPlan && <CheckCircleOutlined sx={{ color: appleColors.green, fontSize: 17 }} />}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55, lineHeight: 1.55 }}>
                  {reason}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.9 }}>
                  {mapped && <DotLabel label="Proof-linked" color={appleColors.cyan} />}
                  {recommended && <DotLabel label="Recommended" color={appleColors.purple} />}
                  {inPlan && <DotLabel label="In start plan" color={appleColors.green} />}
                  {!mapped && !recommended && !inPlan && <DotLabel label="Available" color={appleColors.muted} />}
                </Stack>
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
                        onAddService(service, service.category?.name);
                      }
                    }}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1,
                      color: inPlan ? appleColors.red : appleColors.cyan,
                      bgcolor: inPlan ? '#fff7f8' : '#e4f9fd',
                      border: '1px solid',
                      borderColor: inPlan ? '#fecdd3' : '#bae6fd',
                    }}
                  >
                    {inPlan ? <DeleteOutlineOutlined fontSize="small" /> : <AddTaskOutlined fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
