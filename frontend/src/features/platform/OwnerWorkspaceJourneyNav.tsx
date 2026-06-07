'use client';

import { ReactNode } from 'react';
import { ChevronRightOutlined, KeyboardBackspaceOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { appleColors } from './PlatformComponents';

export interface JourneyStepItem<T extends string = string> {
  value: T;
  label: string;
  detail: string;
  accent?: string;
  meta?: ReactNode;
}

export function OwnerWorkspaceJourneyNav<T extends string>({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: T;
  items: JourneyStepItem<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <Box
      aria-label={label}
      component="nav"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: `repeat(${Math.min(items.length, 3)}, minmax(0, 1fr))` },
        gap: 1,
      }}
    >
      {items.map((item, index) => {
        const selected = value === item.value;
        const accent = item.accent || appleColors.purple;
        return (
          <Button
            key={item.value}
            aria-current={selected ? 'step' : undefined}
            data-testid={`owner-journey-step-${item.value}`}
            variant="outlined"
            onClick={() => onChange(item.value)}
            sx={{
              justifyContent: 'flex-start',
              alignItems: 'stretch',
              textAlign: 'left',
              whiteSpace: 'normal',
              minHeight: 84,
              borderRadius: 1,
              px: 1.25,
              py: 1.1,
              bgcolor: selected ? `${accent}10` : '#fff',
              borderColor: selected ? `${accent}70` : appleColors.line,
              color: appleColors.ink,
              boxShadow: selected ? `0 10px 26px ${accent}16` : 'none',
              '&:hover': {
                bgcolor: selected ? `${accent}14` : '#fbfdff',
                borderColor: `${accent}55`,
              },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ width: '100%', minWidth: 0 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  bgcolor: selected ? accent : '#f8fafc',
                  color: selected ? '#fff' : accent,
                  border: '1px solid',
                  borderColor: selected ? accent : `${accent}30`,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 950,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" sx={{ fontWeight: 950, lineHeight: 1.25 }}>
                    {item.label}
                  </Typography>
                  {item.meta}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35, lineHeight: 1.35 }}>
                  {item.detail}
                </Typography>
              </Box>
              <ChevronRightOutlined sx={{ color: selected ? accent : appleColors.muted, fontSize: 20, flexShrink: 0, mt: 0.35 }} />
            </Stack>
          </Button>
        );
      })}
    </Box>
  );
}

export interface WorkspaceBreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export function WorkspaceBreadcrumbs({
  items,
  backLabel,
  onBack,
}: {
  items: WorkspaceBreadcrumbItem[];
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <Box
      component="nav"
      aria-label="Workspace breadcrumb"
      sx={{
        p: 1,
        border: '1px solid',
        borderColor: appleColors.line,
        borderRadius: 1,
        bgcolor: '#fff',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <Stack key={`${item.label}-${index}`} direction="row" spacing={0.75} alignItems="center">
                {item.onClick && !isLast ? (
                  <Button
                    variant="text"
                    size="small"
                    onClick={item.onClick}
                    sx={{ minHeight: 28, px: 0.4, color: appleColors.muted, fontWeight: 850 }}
                  >
                    {item.label}
                  </Button>
                ) : (
                  <Typography variant="caption" sx={{ color: isLast ? appleColors.ink : appleColors.muted, fontWeight: isLast ? 950 : 850 }}>
                    {item.label}
                  </Typography>
                )}
                {!isLast && (
                  <Typography variant="caption" color="text.secondary">
                    &gt;
                  </Typography>
                )}
              </Stack>
            );
          })}
        </Stack>
        <Button
          variant="outlined"
          size="small"
          startIcon={<KeyboardBackspaceOutlined />}
          onClick={onBack}
          sx={{ minHeight: 34, alignSelf: { xs: 'flex-start', sm: 'center' } }}
        >
          {backLabel}
        </Button>
      </Stack>
    </Box>
  );
}
