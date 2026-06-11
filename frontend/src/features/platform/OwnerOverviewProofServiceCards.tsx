'use client';

import { AddTaskOutlined, OpenInNewOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { OwnerDecisionScannerCoverageGroup } from './ownerOverviewDecisionTypes';
import type { PackageInstance } from './types';

export function OwnerOverviewEvidenceChecksCard({
  latestCompletedTools,
  totalScanTools,
  scannerCoverageGroups,
}: {
  latestCompletedTools: number;
  totalScanTools: number;
  scannerCoverageGroups: OwnerDecisionScannerCoverageGroup[];
}) {
  return (
    <Surface>
      <SectionTitle
        title="Proof checks"
        action={<PastelChip label={`${latestCompletedTools}/${totalScanTools} completed`} accent={latestCompletedTools === totalScanTools ? appleColors.green : appleColors.amber} bg={latestCompletedTools === totalScanTools ? '#e7f8ee' : '#fff4dc'} />}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
        {scannerCoverageGroups.map((group) => (
          <Box key={group.key} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${group.accent}32`, bgcolor: '#fff' }}>
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 950 }}>{group.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {group.tools.length ? group.tools.map((tool) => tool.displayName).join(', ') : group.expectedLabels.join(', ')}
                </Typography>
              </Box>
              <PastelChip label={group.status} accent={group.accent} bg={`${group.accent}12`} />
            </Stack>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 850 }}>
              {group.normalizedCount ? `${group.normalizedCount} findings` : 'No findings'}
              {group.mappedFindingCount ? ` · ${group.mappedFindingCount} mapped` : ''}
            </Typography>
          </Box>
        ))}
      </Box>
    </Surface>
  );
}

export function OwnerOverviewTopServiceCard({
  selectedPackage,
  scannerMappedServices,
  onOpenServicesPlan,
  onOpenServicesRecommend,
}: {
  selectedPackage: PackageInstance | undefined;
  scannerMappedServices: string[];
  onOpenServicesPlan: () => void;
  onOpenServicesRecommend: () => void;
}) {
  return (
    <Surface>
      <SectionTitle title="Top Service Recommendation" action={<PastelChip label={selectedPackage ? 'Plan exists' : 'Next step'} accent={selectedPackage ? appleColors.green : appleColors.amber} bg={selectedPackage ? '#e7f8ee' : '#fff4dc'} />} />
      {selectedPackage ? (
        <Stack spacing={1}>
          <Typography variant="h4">{selectedPackage.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{selectedPackage.summary}</Typography>
          <Button variant="outlined" startIcon={<OpenInNewOutlined />} onClick={onOpenServicesPlan} sx={{ minHeight: 40, alignSelf: 'flex-start' }}>
            Review services
          </Button>
        </Stack>
      ) : scannerMappedServices.length ? (
        <Stack spacing={1}>
          <Typography variant="h4">{scannerMappedServices[0]}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            This service appears because scanner findings mapped to launch-readiness work.
          </Typography>
          <Button variant="contained" startIcon={<AddTaskOutlined />} onClick={onOpenServicesRecommend} sx={{ minHeight: 40, alignSelf: 'flex-start' }}>
            Choose services
          </Button>
        </Stack>
      ) : (
        <EmptyState label="Run or map scan proof to generate a service recommendation." />
      )}
    </Surface>
  );
}
