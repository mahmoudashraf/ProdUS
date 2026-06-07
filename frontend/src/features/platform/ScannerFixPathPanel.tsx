'use client';

import {
  AddShoppingCartOutlined,
  AutoAwesomeOutlined,
  RefreshOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { severityAccent } from './ownerFindingPresentation';
import type { ProductDiagnosis, ProductFinding, ServiceModule } from './types';

interface ScannerFixPathPanelProps {
  diagnosis?: ProductDiagnosis | undefined;
  mappedFindings: ProductFinding[];
  mappedServiceNames: string[];
  serviceModules: ServiceModule[];
  cartServiceIds: ReadonlySet<string>;
  hasCompletedScannerRun: boolean;
  isRefreshing: boolean;
  isAddingService: boolean;
  onRefreshMap: () => void;
  onAddService: (serviceModule: ServiceModule, categoryName?: string) => void;
}

export default function ScannerFixPathPanel({
  diagnosis,
  mappedFindings,
  mappedServiceNames,
  serviceModules,
  cartServiceIds,
  hasCompletedScannerRun,
  isRefreshing,
  isAddingService,
  onRefreshMap,
  onAddService,
}: ScannerFixPathPanelProps) {
  return (
    <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, border: '1px solid', borderColor: '#dbeafe', background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ lg: 'center' }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 44, height: 44, borderRadius: 1, bgcolor: '#eaf3ff', color: appleColors.blue, display: 'grid', placeItems: 'center' }}>
            <AutoAwesomeOutlined />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 950 }}>Owner fix path from scanner proof</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Converts raw findings into the services, owner decisions, and proof needed before launch.
            </Typography>
          </Box>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          {diagnosis ? (
            <>
              <PastelChip
                label={`${diagnosis.topBlockerCount || 0} priority fixes`}
                accent={(diagnosis.topBlockerCount || 0) ? appleColors.red : appleColors.green}
                bg={(diagnosis.topBlockerCount || 0) ? '#fff1f2' : '#e7f8ee'}
              />
              <PastelChip label={`${mappedServiceNames.length} services mapped`} accent={appleColors.purple} />
              <PastelChip
                label={`${diagnosis.unmappedFindingCount || 0} unmapped`}
                accent={(diagnosis.unmappedFindingCount || 0) ? appleColors.amber : appleColors.green}
                bg={(diagnosis.unmappedFindingCount || 0) ? '#fff4dc' : '#e7f8ee'}
              />
            </>
          ) : hasCompletedScannerRun ? (
            <PastelChip label="Awaiting refresh" accent={appleColors.amber} bg="#fff4dc" />
          ) : (
            <PastelChip label="Runs after scanner" accent={appleColors.muted} />
          )}
          <Button
            variant={diagnosis ? 'outlined' : 'contained'}
            startIcon={<RefreshOutlined />}
            disabled={!hasCompletedScannerRun || isRefreshing}
            onClick={onRefreshMap}
            sx={{ minHeight: 40, px: 2, whiteSpace: 'nowrap' }}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Map'}
          </Button>
        </Stack>
      </Stack>

      {diagnosis ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 1, mt: 1.5 }}>
          {mappedFindings.slice(0, 6).map((finding) => {
            const recommendedModule = serviceModules.find((module) => module.id === finding.recommendedModuleId);
            const inCart = !!recommendedModule && cartServiceIds.has(recommendedModule.id);
            return (
              <Box key={finding.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${severityAccent(finding.severity)}30`, bgcolor: '#fff' }}>
                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      <PastelChip label={formatLabel(finding.severity)} accent={severityAccent(finding.severity)} bg={`${severityAccent(finding.severity)}12`} />
                      {finding.readinessArea && <PastelChip label={finding.readinessArea} accent={appleColors.cyan} bg="#e4f9fd" />}
                    </Stack>
                    <Typography sx={{ mt: 0.9, fontWeight: 950 }}>{finding.title}</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: appleColors.muted }}>
                    {typeof finding.mappingConfidence === 'number' ? `${Math.round(finding.mappingConfidence * 100)}%` : 'Mapped'}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
                  {finding.businessRisk || finding.description}
                </Typography>
                <Box sx={{ mt: 1, p: 1, borderRadius: 1, bgcolor: '#fbfdff', border: '1px solid', borderColor: appleColors.line }}>
                  <Typography variant="caption" color="text.secondary">Proof needed</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.5 }}>
                    {finding.evidenceRequired || 'Owner review note and scanner rerun evidence.'}
                  </Typography>
                </Box>
                {recommendedModule ? (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mt: 1 }}>
                    <PastelChip label={recommendedModule.name} accent={appleColors.purple} />
                    <Button
                      size="small"
                      variant={inCart ? 'outlined' : 'contained'}
                      disabled={inCart || isAddingService}
                      startIcon={<AddShoppingCartOutlined />}
                      onClick={() => onAddService(recommendedModule, 'Fix path from scanner findings')}
                      sx={{ minHeight: 34, minWidth: 128 }}
                    >
                      {inCart ? 'In Plan' : 'Add Service'}
                    </Button>
                  </Stack>
                ) : (
                  <Alert severity="warning" sx={{ mt: 1, borderRadius: 1 }}>
                    Needs a quick review before this scanner signal can be mapped to a ProdUS service.
                  </Alert>
                )}
              </Box>
            );
          })}
        </Box>
      ) : (
        <Alert severity="info" sx={{ mt: 1.5, borderRadius: 1 }}>
          {hasCompletedScannerRun
            ? 'Older scanner evidence exists without a stored readiness map. Use Refresh Map once to backfill it.'
            : 'Run a scanner first. ProdUS will store the readiness service map automatically when the scan completes.'}
        </Alert>
      )}
    </Box>
  );
}
