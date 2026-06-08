'use client';

import {
  CheckCircleOutlineOutlined,
  ErrorOutlineOutlined,
  RuleOutlined,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { appleColors } from './PlatformComponents';

export type ValidationState = 'ready' | 'attention' | 'blocked';

const validationMeta: Record<
  ValidationState,
  { label: string; color: string; background: string }
> = {
  ready: { label: 'Ready', color: appleColors.green, background: '#f0fdf6' },
  attention: { label: 'Review', color: appleColors.amber, background: '#fff8eb' },
  blocked: { label: 'Needed', color: appleColors.red, background: '#fff3f4' },
};

export function ValidationRow({
  title,
  detail,
  state,
}: {
  title: string;
  detail: string;
  state: ValidationState;
}) {
  const meta = validationMeta[state];
  const Icon =
    state === 'ready'
      ? CheckCircleOutlineOutlined
      : state === 'attention'
        ? ErrorOutlineOutlined
        : RuleOutlined;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        gap: 1,
        alignItems: 'start',
        p: 1,
        borderRadius: 1,
        border: `1px solid ${meta.color}24`,
        bgcolor: meta.background,
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1,
          display: 'grid',
          placeItems: 'center',
          color: meta.color,
          bgcolor: '#fff',
          border: `1px solid ${meta.color}20`,
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 900 }}>
          {title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', lineHeight: 1.45 }}
        >
          {detail}
        </Typography>
      </Box>
      <Typography
        variant="caption"
        sx={{
          px: 0.85,
          py: 0.35,
          borderRadius: 1,
          color: meta.color,
          bgcolor: '#fff',
          border: `1px solid ${meta.color}24`,
          fontWeight: 900,
          whiteSpace: 'nowrap',
        }}
      >
        {meta.label}
      </Typography>
    </Box>
  );
}
