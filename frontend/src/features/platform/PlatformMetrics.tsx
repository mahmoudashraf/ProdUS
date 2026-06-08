'use client';

import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Surface } from './PlatformSurfaces';
import { appleColors, clampScore } from './platformTheme';

export const ProgressRing = ({
  value,
  size = 76,
  color = appleColors.purple,
  label,
}: {
  value: number;
  size?: number;
  color?: string;
  label?: string;
}) => {
  const safeValue = clampScore(value);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: `conic-gradient(${color} ${safeValue * 3.6}deg, #edf1f7 0deg)`,
        position: 'relative',
        flex: '0 0 auto',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 7,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: 'inset 0 0 0 1px rgba(15, 23, 42, 0.04)',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <Typography
          sx={{
            fontWeight: 800,
            color: appleColors.ink,
            fontSize: size > 82 ? 26 : 18,
            lineHeight: 1,
          }}
        >
          {safeValue}%
        </Typography>
        {label && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', fontSize: 10 }}
          >
            {label}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export const MiniSparkline = ({
  color = appleColors.purple,
  points = [14, 20, 18, 30, 42, 35, 28, 34, 44, 31, 39],
}: {
  color?: string;
  points?: number[];
}) => {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const width = 132;
  const height = 42;
  const path = points
    .map((point, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * width;
      const y = height - ((point - min) / Math.max(1, max - min)) * (height - 8) - 4;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${width} ${height}`}
      sx={{ width: 132, height, display: 'block' }}
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
};

export const MetricTile = ({
  label,
  value,
  detail,
  icon,
  accent = appleColors.purple,
  sparkline,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: ReactNode;
  accent?: string;
  sparkline?: boolean;
}) => (
  <Surface sx={{ overflow: 'hidden', position: 'relative' }}>
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        {icon && (
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 1,
              bgcolor: `${accent}14`,
              color: accent,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {icon}
          </Box>
        )}
        <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: 30, lineHeight: 1, fontWeight: 800, color: appleColors.ink }}>
        {value}
      </Typography>
      {detail && (
        <Typography variant="body2" color="text.secondary">
          {detail}
        </Typography>
      )}
      {sparkline && <MiniSparkline color={accent} />}
    </Stack>
  </Surface>
);
