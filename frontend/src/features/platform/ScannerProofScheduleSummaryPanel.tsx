'use client';

import { Box, Button, Stack, Typography } from '@mui/material';

import {
  PastelChip,
  SectionTitle,
  StatusChip,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { ScannerSchedule } from './types';

type ScannerProofScheduleSummaryPanelProps = {
  schedules: ScannerSchedule[];
  isUpdating: boolean;
  onToggleSchedule: (scheduleId: string, active: boolean) => void;
  formatDateTime: (value?: string) => string;
};

export default function ScannerProofScheduleSummaryPanel({
  schedules,
  isUpdating,
  onToggleSchedule,
  formatDateTime,
}: ScannerProofScheduleSummaryPanelProps) {
  if (!schedules.length) return null;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: appleColors.line,
        borderRadius: 1,
        p: 1.5,
        bgcolor: '#fff',
      }}
    >
      <SectionTitle
        title="Scheduled scan refresh"
        action={
          <PastelChip
            label={`${schedules.length} configured`}
            accent={appleColors.cyan}
            bg="#e4f9fd"
          />
        }
      />
      <Stack spacing={1}>
        {schedules.slice(0, 4).map(schedule => (
          <Box
            key={schedule.id}
            sx={{
              p: 1.25,
              borderRadius: 1,
              border: '1px solid',
              borderColor: '#e5edf7',
              bgcolor: schedule.active ? '#fbfffd' : '#f8fafc',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ sm: 'center' }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    {formatLabel(schedule.depth)}
                  </Typography>
                  <StatusChip
                    label={schedule.active ? 'ACTIVE' : 'PAUSED'}
                    color={schedule.active ? 'success' : 'default'}
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  Every {schedule.intervalDays} days / Next {formatDateTime(schedule.nextRunAt)} /{' '}
                  {schedule.toolKeys.join(', ') || 'default checks'}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                disabled={isUpdating}
                onClick={() => onToggleSchedule(schedule.id, !schedule.active)}
                sx={{ minHeight: 34, minWidth: 92 }}
              >
                {schedule.active ? 'Pause' : 'Resume'}
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
