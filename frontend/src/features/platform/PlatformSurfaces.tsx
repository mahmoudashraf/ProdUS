'use client';

import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { ButtonProps, SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { appleColors, errorMessageFromUnknown } from './platformTheme';

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
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h2" sx={{ mb: 0.75 }}>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: { xs: 'calc(100vw - 32px)', md: 780 },
            width: { xs: '100%', md: 'auto' },
            lineHeight: 1.65,
            whiteSpace: 'normal',
            overflowWrap: 'normal',
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
    {action}
  </Stack>
);

export const Surface = ({ children, sx, id }: { children: ReactNode; sx?: SxProps<Theme>; id?: string }) => (
  <Paper
    id={id}
    variant="outlined"
    sx={[
      {
        p: { xs: 2, md: 2.5 },
        boxSizing: 'border-box',
        minWidth: 0,
        maxWidth: '100%',
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

export const QueryState = ({ isLoading, error }: { isLoading: boolean; error: unknown }) => (
  <>
    {isLoading && <LinearProgress sx={{ mb: 2, borderRadius: 999 }} />}
    {error && (
      <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
        {errorMessageFromUnknown(error)}
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
    onChange={event => onChange(event.target.value)}
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
    sx={[{ minHeight: 44 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    {...props}
  >
    {label}
  </Button>
);

export const SectionTitle = ({ title, action }: { title: string; action?: ReactNode }) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    spacing={2}
    flexWrap="wrap"
    useFlexGap
    sx={{ mb: 2, minWidth: 0 }}
  >
    <Typography variant="h4" sx={{ color: appleColors.ink, minWidth: 0, overflowWrap: 'anywhere' }}>
      {title}
    </Typography>
    {action && (
      <Box sx={{ minWidth: 0, maxWidth: '100%', display: 'flex', flexWrap: 'wrap' }}>
        {action}
      </Box>
    )}
  </Stack>
);
