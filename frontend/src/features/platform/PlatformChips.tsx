'use client';

import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import type { ChipProps } from '@mui/material';
import { appleColors, formatLabel } from './platformTheme';

const chipAccent = (label: string, color: ChipProps['color'] = 'default') => {
  if (color === 'success') return appleColors.green;
  if (color === 'error') return appleColors.red;
  if (color === 'warning') return appleColors.amber;
  if (color === 'primary') return appleColors.purple;

  const value = label.toUpperCase();
  if (
    value.includes('REJECT') ||
    value.includes('FAILED') ||
    value.includes('BLOCK') ||
    value.includes('CRITICAL')
  )
    return appleColors.red;
  if (
    value.includes('SUBMITTED') ||
    value.includes('REVIEW') ||
    value.includes('PENDING') ||
    value.includes('AWAITING')
  )
    return appleColors.amber;
  if (
    value.includes('ACCEPT') ||
    value.includes('ACTIVE') ||
    value.includes('SIGNED') ||
    value.includes('PAID') ||
    value.includes('COMPLETE')
  )
    return appleColors.green;
  if (value.includes('RECOMMENDED') || value.includes('READY')) return appleColors.purple;
  return appleColors.muted;
};

export const StatusChip = ({
  label,
  color = 'default',
}: {
  label: string;
  color?: ChipProps['color'];
}) => {
  const accent = chipAccent(label, color);

  return (
    <Chip
      size="small"
      label={formatLabel(label)}
      sx={{
        height: 28,
        borderRadius: 1,
        bgcolor: `${accent}12`,
        color: accent,
        border: `1px solid ${accent}24`,
        fontWeight: 800,
        letterSpacing: 0,
        maxWidth: '100%',
        '& .MuiChip-label': {
          px: 1.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      }}
    />
  );
};

export const RecordDivider = () => <Divider sx={{ my: 1.5 }} />;

export const PastelChip = ({
  label,
  accent = appleColors.purple,
  bg,
}: {
  label: string;
  accent?: string;
  bg?: string;
}) => (
  <Chip
    size="small"
    label={label}
    sx={{
      height: 26,
      borderRadius: 1,
      bgcolor: bg || `${accent}14`,
      color: accent,
      fontWeight: 700,
      border: `1px solid ${accent}1f`,
      '& .MuiChip-label': { px: 1 },
    }}
  />
);

export const DotLabel = ({
  label,
  color = appleColors.green,
}: {
  label: string;
  color?: string;
}) => (
  <Stack direction="row" spacing={0.75} alignItems="center">
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: color,
        boxShadow: `0 0 0 4px ${color}18`,
      }}
    />
    <Typography variant="body2" sx={{ color, fontWeight: 700 }}>
      {label}
    </Typography>
  </Stack>
);
