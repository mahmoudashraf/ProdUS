'use client';

import { Box, Button } from '@mui/material';
import { PastelChip, Surface } from './PlatformComponents';

export interface WorkspaceCommandSubrouteItem<TValue extends string> {
  value: TValue;
  label: string;
  accent: string;
}

export default function WorkspaceCommandSubrouteActions<TValue extends string>({
  ariaLabel,
  currentValue,
  items,
  onChange,
}: {
  ariaLabel: string;
  currentValue: TValue;
  items: WorkspaceCommandSubrouteItem<TValue>[];
  onChange: (value: TValue) => void;
}) {
  const currentItem = items.find((item) => item.value === currentValue) || items[0];

  return (
    <Surface sx={{ p: { xs: 1.25, md: 1.5 }, boxShadow: 'none' }}>
      <Box
        aria-label={ariaLabel}
        component="nav"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'auto minmax(0, 1fr)' },
          gap: 0.75,
          alignItems: 'center',
        }}
      >
        <PastelChip
          label={`Current: ${currentItem?.label || 'Current view'}`}
          accent={currentItem?.accent || '#625cff'}
          bg={`${currentItem?.accent || '#625cff'}14`}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.max(1, items.length - 1)}, minmax(0, 1fr))` }, gap: 0.75 }}>
          {items.filter((item) => item.value !== currentValue).map((item) => (
            <Button key={item.value} variant="outlined" size="small" onClick={() => onChange(item.value)} sx={{ minHeight: 38 }}>
              {item.label}
            </Button>
          ))}
        </Box>
      </Box>
    </Surface>
  );
}
