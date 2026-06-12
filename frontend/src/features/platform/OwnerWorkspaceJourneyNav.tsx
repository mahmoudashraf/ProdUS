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
  maxColumns = 3,
  onChange,
}: {
  label: string;
  value?: T | null;
  items: JourneyStepItem<T>[];
  maxColumns?: number;
  onChange: (value: T) => void;
}) {
  const mediumColumns = Math.min(items.length, Math.min(maxColumns, 3));
  const largeColumns = Math.min(items.length, maxColumns);

  return (
    <Box
      aria-label={label}
      component="nav"
      sx={{
        minWidth: 0,
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: `repeat(${mediumColumns}, minmax(0, 1fr))`,
          lg: `repeat(${largeColumns}, minmax(0, 1fr))`,
        },
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
              minWidth: 0,
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
  backLabel?: string;
  onBack?: () => void;
}) {
  const previousActionItem = items
    .slice(0, Math.max(items.length - 1, 0))
    .reverse()
    .find((item): item is WorkspaceBreadcrumbItem & { onClick: () => void } => Boolean(item.onClick));
  const resolvedBackAction = onBack || previousActionItem?.onClick;
  const rawBackLabel = backLabel || previousActionItem?.label;
  const resolvedBackLabel = rawBackLabel
    ? /^back\b/i.test(rawBackLabel.trim())
      ? rawBackLabel
      : `Back to ${rawBackLabel}`
    : undefined;

  return (
    <Box
      component="nav"
      aria-label="Workspace breadcrumb"
      sx={{
        minWidth: 0,
        p: { xs: 1, sm: 1.15 },
        border: '1px solid',
        borderColor: '#cbdcf1',
        borderRadius: 1,
        background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)',
        boxShadow: '0 10px 28px rgba(16, 24, 40, 0.05)',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        sx={{ minWidth: 0 }}
      >
        {resolvedBackLabel && resolvedBackAction && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<KeyboardBackspaceOutlined />}
            onClick={resolvedBackAction}
            sx={{
              minHeight: 38,
              alignSelf: { xs: 'stretch', md: 'center' },
              justifyContent: 'flex-start',
              borderColor: '#b9d5fb',
              bgcolor: '#fff',
              color: appleColors.blue,
              fontWeight: 950,
              boxShadow: '0 8px 20px rgba(24, 119, 242, 0.08)',
              '&:hover': {
                bgcolor: '#eef6ff',
                borderColor: appleColors.blue,
              },
            }}
          >
            {resolvedBackLabel}
          </Button>
        )}

        <Stack
          component="ol"
          direction="row"
          spacing={0.6}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{
            minWidth: 0,
            flex: 1,
            m: 0,
            p: 0,
            listStyle: 'none',
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
          }}
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <Stack
                key={`${item.label}-${index}`}
                component="li"
                direction="row"
                spacing={0.6}
                alignItems="center"
                sx={{ minWidth: 0 }}
              >
                {item.onClick && !isLast ? (
                  <Button
                    variant="text"
                    size="small"
                    onClick={item.onClick}
                    sx={{
                      minHeight: 30,
                      minWidth: 0,
                      maxWidth: '100%',
                      px: 0.65,
                      color: appleColors.blue,
                      fontWeight: 900,
                      whiteSpace: 'normal',
                      textAlign: 'left',
                      textDecoration: 'none',
                      '&:hover': {
                        bgcolor: '#eef6ff',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ) : (
                  <Typography
                    variant="caption"
                    aria-current={isLast ? 'page' : undefined}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      minHeight: isLast ? 30 : 'auto',
                      px: isLast ? 1 : 0,
                      border: isLast ? '1px solid #d8d6ff' : 'none',
                      borderRadius: isLast ? 1 : 0,
                      bgcolor: isLast ? '#f1efff' : 'transparent',
                      color: isLast ? appleColors.ink : appleColors.muted,
                      fontWeight: isLast ? 950 : 850,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {item.label}
                  </Typography>
                )}
                {!isLast && (
                  <ChevronRightOutlined sx={{ color: appleColors.muted, fontSize: 18, flexShrink: 0 }} />
                )}
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
}
