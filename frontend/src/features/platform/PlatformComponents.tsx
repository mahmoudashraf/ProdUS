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
import type { ChipProps } from '@mui/material';
import { ReactNode } from 'react';

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
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      )}
    </Box>
    {action}
  </Stack>
);

export const Surface = ({ children }: { children: ReactNode }) => (
  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
    {children}
  </Paper>
);

export const EmptyState = ({ label }: { label: string }) => (
  <Surface>
    <Typography color="text.secondary">{label}</Typography>
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
    {isLoading && <LinearProgress sx={{ mb: 2 }} />}
    {error && (
      <Alert severity="error" sx={{ mb: 2 }}>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) => (
  <TextField
    fullWidth
    label={label}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    {...(multiline ? { multiline: true, minRows: 3 } : {})}
  />
);

export const SaveButton = ({ disabled, label = 'Save' }: { disabled?: boolean; label?: string }) => (
  <Button type="submit" variant="contained" disabled={!!disabled}>
    {label}
  </Button>
);

export const StatusChip = ({ label, color = 'default' }: { label: string; color?: ChipProps['color'] }) => (
  <Chip size="small" color={color} label={label.replaceAll('_', ' ').toLowerCase()} />
);

export const RecordDivider = () => <Divider sx={{ my: 1.5 }} />;
