'use client';

import { Box, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { SupportRequest } from './types';

const supportPriorityAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('REJECT') || status.includes('URGENT')) {
    return appleColors.red;
  }
  if (
    status.includes('REVIEW')
    || status.includes('NEGOTIATION')
    || status.includes('AWAITING')
    || status.includes('SUBMITTED')
  ) {
    return appleColors.amber;
  }
  if (
    status.includes('ACTIVE')
    || status.includes('ACCEPT')
    || status.includes('DELIVER')
    || status.includes('SIGNED')
    || status.includes('ON_TRACK')
  ) {
    return appleColors.green;
  }
  return appleColors.purple;
};

export default function OwnerSupportRiskPanel({
  supportRequests,
}: {
  supportRequests: SupportRequest[];
}) {
  return (
    <Surface
      sx={{
        background: supportRequests.some((request) => request.slaStatus === 'OVERDUE')
          ? '#fff7f8'
          : '#f6fffb',
      }}
    >
      <SectionTitle title="Support and Risk" />
      {supportRequests.length ? (
        <Stack spacing={1.25}>
          {supportRequests.slice(0, 4).map((request) => (
            <Stack
              key={request.id}
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {request.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatLabel(request.status)} · {formatLabel(request.slaStatus)}
                </Typography>
              </Box>
              <PastelChip
                label={formatLabel(request.priority)}
                accent={supportPriorityAccent(request.priority)}
              />
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No support requests are attached to this product.
        </Typography>
      )}
    </Surface>
  );
}
