'use client';

import { Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  Surface,
  formatLabel,
} from './PlatformComponents';
import { teamDeliveryStatusAccent } from './teamDeliveryUtils';
import type { SupportRequest } from './types';

export default function TeamDeliverySupportPanel({
  supportRequests,
  overdueSupportCount,
  isUpdating,
  onUpdateSupportRequest,
}: {
  supportRequests: SupportRequest[];
  overdueSupportCount: number;
  isUpdating: boolean;
  onUpdateSupportRequest: (requestId: string, status: SupportRequest['status'], resolution?: string) => void;
}) {
  return (
    <Surface sx={{ background: overdueSupportCount ? '#fff7f8' : '#f6fffb' }}>
      <SectionTitle title="Support Queue" />
      {supportRequests.length ? (
        <Stack spacing={1.25}>
          {supportRequests.slice(0, 8).map((request) => (
            <Stack key={request.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }} justifyContent="space-between">
              <Stack spacing={0.25}>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>{request.title}</Typography>
                <Typography variant="caption" color="text.secondary">{formatLabel(request.status)} - {formatLabel(request.slaStatus)}</Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                <PastelChip label={formatLabel(request.priority)} accent={teamDeliveryStatusAccent(request.priority)} />
                {request.status === 'OPEN' && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onUpdateSupportRequest(request.id, 'ACKNOWLEDGED')}
                    disabled={isUpdating}
                  >
                    Acknowledge
                  </Button>
                )}
                {request.status !== 'RESOLVED' && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onUpdateSupportRequest(request.id, 'RESOLVED', 'Resolved from delivery control after evidence review.')}
                    disabled={isUpdating}
                  >
                    Resolve
                  </Button>
                )}
              </Stack>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">No support requests assigned to this team.</Typography>
      )}
    </Surface>
  );
}
