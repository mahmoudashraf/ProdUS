'use client';

import { Avatar, Box, Stack, Typography } from '@mui/material';
import { StatusChip, appleColors } from './PlatformComponents';

const initials = (value: string) => value.split(' ').filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'P';

export default function ProfileHeroPanel({
  title,
  subtitle,
  body,
  avatarUrl,
  coverUrl,
  status,
}: {
  title: string;
  subtitle?: string | undefined;
  body?: string | undefined;
  avatarUrl?: string | undefined;
  coverUrl?: string | undefined;
  status?: string | undefined;
}) {
  return (
    <Box>
      <Box
        sx={{
          height: 150,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          background: coverUrl
            ? `linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.25)), url(${coverUrl}) center/cover`
            : 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 45%, #ecfeff 100%)',
        }}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.75} alignItems={{ sm: 'flex-end' }} sx={{ mt: -4, px: 1 }}>
        <Avatar
          {...(avatarUrl ? { src: avatarUrl } : {})}
          sx={{
            width: 88,
            height: 88,
            border: '4px solid #fff',
            bgcolor: appleColors.purple,
            color: '#fff',
            fontWeight: 900,
            boxShadow: '0 18px 45px rgba(15,23,42,0.14)',
          }}
        >
          {initials(title)}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1, pb: 0.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h3" sx={{ mb: 0 }}>{title}</Typography>
            {status && <StatusChip label={status} color="success" />}
          </Stack>
          {subtitle && <Typography color="text.secondary" sx={{ fontWeight: 800 }}>{subtitle}</Typography>}
          {body && <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>{body}</Typography>}
        </Box>
      </Stack>
    </Box>
  );
}
