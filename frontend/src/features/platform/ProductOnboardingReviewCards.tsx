'use client';

import { Box, Stack, Typography } from '@mui/material';
import { DotLabel } from './PlatformComponents';

const cleanText = (value?: string | null) => value?.trim() ?? '';

export function AiAttributeCard({
  label,
  value,
  source,
  accent,
  wide = false,
}: {
  label: string;
  value?: string | null | undefined;
  source: string;
  accent: string;
  wide?: boolean | undefined;
}) {
  const hasValue = cleanText(value).length > 0;

  return (
    <Box
      sx={{
        minWidth: 0,
        gridColumn: wide ? { xs: 'auto', md: 'span 2' } : 'auto',
        p: 1.2,
        borderRadius: 1,
        border: `1px solid ${hasValue ? `${accent}30` : '#e4e9f3'}`,
        bgcolor: hasValue ? `${accent}08` : '#f8fafc',
      }}
    >
      <Stack spacing={0.7}>
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
            {label}
          </Typography>
          <DotLabel
            label={hasValue ? source : 'Needs input'}
            color={hasValue ? accent : '#94a3b8'}
          />
        </Stack>
        <Typography
          variant={wide ? 'body1' : 'body2'}
          sx={{
            fontWeight: wide ? 700 : 800,
            color: hasValue ? 'text.primary' : 'text.secondary',
            lineHeight: 1.5,
            overflowWrap: 'anywhere',
            whiteSpace: wide ? 'pre-wrap' : 'normal',
          }}
        >
          {hasValue ? value : 'Not provided yet'}
        </Typography>
      </Stack>
    </Box>
  );
}

export function AiReviewList({
  title,
  items,
  empty,
  accent,
}: {
  title: string;
  items: string[];
  empty: string;
  accent: string;
}) {
  return (
    <Box
      sx={{
        p: 1.2,
        borderRadius: 1,
        border: `1px solid ${accent}24`,
        bgcolor: `${accent}08`,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 900 }}>
        {title}
      </Typography>
      <Stack spacing={0.5} sx={{ mt: 0.75 }}>
        {items.length > 0 ? (
          items.slice(0, 4).map(item => <DotLabel key={item} label={item} color={accent} />)
        ) : (
          <Typography variant="caption" color="text.secondary">
            {empty}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
