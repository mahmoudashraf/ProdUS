'use client';

import { Box, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { AiAssistedProductAnalysisResponse } from './types';

const documentUsageMeta = (status?: string, accessMethod?: string) => {
  const normalizedStatus = (status ?? '').toUpperCase();
  const normalizedMethod = (accessMethod ?? '').toUpperCase();
  if (normalizedStatus === 'USED' && normalizedMethod === 'TEMPORARY_URL') {
    return { label: 'Opened by AI', color: appleColors.green };
  }
  if (normalizedStatus === 'USED') {
    return { label: 'Used', color: appleColors.green };
  }
  return { label: 'Not used', color: appleColors.red };
};

export function AiDocumentUsageList({
  usage,
}: {
  usage: NonNullable<AiAssistedProductAnalysisResponse['analysis']['documentUsage']>;
}) {
  return (
    <Box
      sx={{
        p: 1.2,
        borderRadius: 1,
        border: '1px solid #dfe7f5',
        background: 'linear-gradient(145deg, #fff, #f8fbff)',
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Typography variant="caption" sx={{ fontWeight: 900 }}>
            File use proof
          </Typography>
          <DotLabel label={`${usage.length} reported`} color={appleColors.purple} />
        </Stack>
        <Stack spacing={0.75}>
          {usage.map((item, index) => {
            const meta = documentUsageMeta(item.status, item.accessMethod);
            const evidence = item.evidence ?? [];
            return (
              <Box
                key={`${item.documentId || item.fileName}-${index}`}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  border: `1px solid ${meta.color}24`,
                  bgcolor: `${meta.color}08`,
                }}
              >
                <Stack spacing={0.7}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={0.75}
                    justifyContent="space-between"
                    alignItems={{ sm: 'center' }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                        {item.fileName || 'Shared document'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatLabel(item.accessMethod || 'none')}
                      </Typography>
                    </Box>
                    <DotLabel label={meta.label} color={meta.color} />
                  </Stack>
                  {evidence.length > 0 ? (
                    <Stack spacing={0.4}>
                      {evidence.slice(0, 3).map(fact => (
                        <DotLabel key={fact} label={fact} color={meta.color} />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {item.reason || 'LoomAI did not return owner-safe file proof.'}
                    </Typography>
                  )}
                  {item.reason && evidence.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {item.reason}
                    </Typography>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
}
