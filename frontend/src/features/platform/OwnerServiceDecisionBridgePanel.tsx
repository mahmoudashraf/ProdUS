'use client';

import {
  AddShoppingCartOutlined,
  CheckCircleOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  appleColors,
} from './PlatformComponents';
import type { ServiceModule } from './types';

export interface OwnerServiceDecisionRisk {
  id: string;
  title: string;
  impact: string;
  proof: string;
  service?: string | undefined;
}

interface OwnerServiceDecisionBridgePanelProps {
  categoriesCount: number;
  blockerCount: number;
  improvementCount: number;
  cartServiceCount: number;
  mappedServiceCount: number;
  primaryServiceName: string;
  primaryService?: ServiceModule | undefined;
  primaryServiceInPlan: boolean;
  ownerRisks: OwnerServiceDecisionRisk[];
  isAddingService: boolean;
  onAddPrimaryService: (serviceModule: ServiceModule, categoryName?: string) => void;
}

export default function OwnerServiceDecisionBridgePanel({
  categoriesCount,
  blockerCount,
  improvementCount,
  cartServiceCount,
  mappedServiceCount,
  primaryServiceName,
  primaryService,
  primaryServiceInPlan,
  ownerRisks,
  isAddingService,
  onAddPrimaryService,
}: OwnerServiceDecisionBridgePanelProps) {
  const topRisk = ownerRisks[0];
  const decisionLabel = blockerCount
    ? `Not ready - ${blockerCount} blocker${blockerCount === 1 ? '' : 's'} need a fix path`
    : improvementCount
      ? `Launchable with ${improvementCount} improvement${improvementCount === 1 ? '' : 's'} to schedule`
      : 'Clear enough to keep moving';
  const primaryActionLabel = primaryServiceInPlan ? 'Already in start plan' : 'Add to start plan';

  return (
    <>
      <SectionTitle
        title="Recommended Work Path"
        action={<PastelChip label={`${categoriesCount} service families`} accent={appleColors.purple} />}
      />

      <Box
        sx={{
          mb: 1.5,
          p: { xs: 1.5, md: 2 },
          borderRadius: 1,
          border: '1px solid',
          borderColor: blockerCount ? '#fecdd3' : '#bbf7d0',
          bgcolor: blockerCount ? '#fff7f8' : '#f6fff9',
        }}
      >
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ lg: 'center' }}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 1,
                bgcolor: blockerCount ? '#ffe9ec' : '#e7f8ee',
                color: blockerCount ? appleColors.red : appleColors.green,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldOutlined />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4">{decisionLabel}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                Start with {primaryServiceName}. {topRisk ? `It connects the top risk, "${topRisk.title}", to owner-visible delivery proof.` : 'It keeps the service plan tied to the launch verdict instead of browsing a catalog.'}
              </Typography>
              {topRisk && (
                <Box sx={{ mt: 1, p: 1.25, borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: appleColors.line }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 800 }}>
                    Top blocker to service
                  </Typography>
                  <Typography sx={{ mt: 0.35, fontWeight: 950, lineHeight: 1.35 }}>
                    {topRisk.title} {'->'} {topRisk.service || primaryServiceName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55, lineHeight: 1.5 }}>
                    {topRisk.impact}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    Proof: {topRisk.proof}
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
          <Stack spacing={1} sx={{ minWidth: { lg: 226 } }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <PastelChip label={`${cartServiceCount} in plan`} accent={appleColors.purple} />
              <PastelChip label={`${mappedServiceCount} from proof`} accent={appleColors.cyan} bg="#e4f9fd" />
              <PastelChip
                label={blockerCount ? `${blockerCount} blockers` : 'No blockers'}
                accent={blockerCount ? appleColors.red : appleColors.green}
                bg={blockerCount ? '#fff1f2' : '#e7f8ee'}
              />
            </Stack>
            {primaryService && (
              <Button
                variant={primaryServiceInPlan ? 'outlined' : 'contained'}
                startIcon={primaryServiceInPlan ? <CheckCircleOutlined /> : <AddShoppingCartOutlined />}
                disabled={primaryServiceInPlan || isAddingService}
                onClick={() => onAddPrimaryService(primaryService, primaryService.category?.name)}
                sx={{ minHeight: 42 }}
              >
                {primaryActionLabel}
              </Button>
            )}
          </Stack>
        </Stack>

        {ownerRisks.length > 1 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }, gap: 1, mt: 1.5 }}>
            {ownerRisks.slice(1, 3).map((risk) => (
              <Box key={risk.id} sx={{ p: 1.25, borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: appleColors.line }}>
                <PastelChip label="Schedule next" accent={appleColors.amber} bg="#fff4dc" />
                <Typography sx={{ mt: 0.85, fontWeight: 900, lineHeight: 1.35 }}>{risk.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>{risk.impact}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8 }}>
                  Proof: {risk.proof}
                </Typography>
                {risk.service && (
                  <Box sx={{ mt: 0.9 }}>
                    <PastelChip label={risk.service} accent={appleColors.purple} />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}
