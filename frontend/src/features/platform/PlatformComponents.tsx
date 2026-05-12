'use client';

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { ButtonProps, ChipProps, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';

export const appleColors = {
  ink: '#101828',
  muted: '#64748b',
  line: '#dbe4f0',
  panel: '#ffffff',
  wash: '#f7faff',
  purple: '#625cff',
  blue: '#1877f2',
  cyan: '#0ea5c6',
  green: '#13a66b',
  amber: '#f59e0b',
  red: '#ef4444',
};

export const categoryPalette = [
  { accent: '#625cff', bg: '#f1efff', soft: '#f8f7ff' },
  { accent: '#1877f2', bg: '#eaf3ff', soft: '#f7fbff' },
  { accent: '#f59e0b', bg: '#fff4dc', soft: '#fffaf1' },
  { accent: '#0ea5c6', bg: '#e4f9fd', soft: '#f5fdff' },
  { accent: '#06a4b7', bg: '#dcf7fa', soft: '#f4fdfe' },
  { accent: '#ef4444', bg: '#ffe9ec', soft: '#fff7f8' },
  { accent: '#16a34a', bg: '#e7f8ee', soft: '#f6fff9' },
  { accent: '#7c3aed', bg: '#f1e9ff', soft: '#fbf8ff' },
];

const labelAcronyms = new Set(['AI', 'API', 'CI/CD', 'JWT', 'MCP', 'QA', 'RBAC', 'S3', 'SLA', 'SSO', 'UAT', 'URL']);

export const formatLabel = (value?: string | null) => {
  if (!value) return 'Not Set';

  return value
    .replaceAll('_', ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (labelAcronyms.has(upper)) return upper;
      return word.toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
    })
    .join(' ');
};

export const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

export const PageHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <Stack
    direction={{ xs: 'column', md: 'row' }}
    spacing={2}
    alignItems={{ xs: 'stretch', md: 'center' }}
    justifyContent="space-between"
    sx={{ mb: 3 }}
  >
    <Box>
      <Typography variant="h2" sx={{ mb: 0.75 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 780, lineHeight: 1.65 }}>
          {description}
        </Typography>
      )}
    </Box>
    {action}
  </Stack>
);

export const Surface = ({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) => (
  <Paper
    variant="outlined"
    sx={[
      {
        p: { xs: 2, md: 2.5 },
        borderRadius: 1,
        borderColor: appleColors.line,
        background: appleColors.panel,
        boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)',
      },
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}
  >
    {children}
  </Paper>
);

export const EmptyState = ({ label }: { label: string }) => (
  <Surface sx={{ borderStyle: 'dashed', background: 'rgba(248, 250, 252, 0.72)' }}>
    <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
      {label}
    </Typography>
  </Surface>
);

export const QueryState = ({
  isLoading,
  error,
}: {
  isLoading: boolean;
  error: unknown;
}) => (
  <>
    {isLoading && <LinearProgress sx={{ mb: 2, borderRadius: 999 }} />}
    {error && (
      <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
        Failed to load platform data.
      </Alert>
    )}
  </>
);

export const TextInput = ({
  label,
  value,
  onChange,
  multiline,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  disabled?: boolean;
}) => (
  <TextField
    fullWidth
    label={label}
    value={value}
    disabled={!!disabled}
    onChange={(event) => onChange(event.target.value)}
    {...(multiline ? { multiline: true, minRows: 3 } : {})}
  />
);

export const SaveButton = ({
  disabled,
  label = 'Save',
  sx,
  type = 'submit',
  variant = 'contained',
  ...props
}: ButtonProps & { label?: string }) => (
  <Button
    type={type}
    variant={variant}
    disabled={!!disabled}
    sx={[
      { minHeight: 44 },
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}
    {...props}
  >
    {label}
  </Button>
);

const chipAccent = (label: string, color: ChipProps['color'] = 'default') => {
  if (color === 'success') return appleColors.green;
  if (color === 'error') return appleColors.red;
  if (color === 'warning') return appleColors.amber;
  if (color === 'primary') return appleColors.purple;

  const value = label.toUpperCase();
  if (value.includes('REJECT') || value.includes('FAILED') || value.includes('BLOCK') || value.includes('CRITICAL')) return appleColors.red;
  if (value.includes('SUBMITTED') || value.includes('REVIEW') || value.includes('PENDING') || value.includes('AWAITING')) return appleColors.amber;
  if (value.includes('ACCEPT') || value.includes('ACTIVE') || value.includes('SIGNED') || value.includes('PAID') || value.includes('COMPLETE')) return appleColors.green;
  if (value.includes('RECOMMENDED') || value.includes('READY')) return appleColors.purple;
  return appleColors.muted;
};

export const StatusChip = ({ label, color = 'default' }: { label: string; color?: ChipProps['color'] }) => {
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
    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 0 4px ${color}18` }} />
    <Typography variant="body2" sx={{ color, fontWeight: 700 }}>
      {label}
    </Typography>
  </Stack>
);

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
        <Typography sx={{ fontWeight: 800, color: appleColors.ink, fontSize: size > 82 ? 26 : 18, lineHeight: 1 }}>
          {safeValue}%
        </Typography>
        {label && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: 10 }}>
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
    <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: 132, height, display: 'block' }}>
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
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
      <Typography sx={{ fontSize: 30, lineHeight: 1, fontWeight: 800, color: appleColors.ink }}>{value}</Typography>
      {detail && (
        <Typography variant="body2" color="text.secondary">
          {detail}
        </Typography>
      )}
      {sparkline && <MiniSparkline color={accent} />}
    </Stack>
  </Surface>
);

export const SectionTitle = ({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
    <Typography variant="h4" sx={{ color: appleColors.ink }}>
      {title}
    </Typography>
    {action}
  </Stack>
);
