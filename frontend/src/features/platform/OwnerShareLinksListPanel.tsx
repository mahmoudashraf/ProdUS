'use client';

import NextLink from 'next/link';
import {
  ContentCopyOutlined,
  LockOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { ProductShareLink } from './types';

interface OwnerShareLinksListPanelProps {
  activeCount: number;
  copiedToken: string;
  isRevoking: boolean;
  links: ProductShareLink[];
  shareBaseUrl: string;
  onCopy: (token: string, absoluteHref: string) => void;
  onRevoke: (linkId: string) => void;
}

export default function OwnerShareLinksListPanel({
  activeCount,
  copiedToken,
  isRevoking,
  links,
  shareBaseUrl,
  onCopy,
  onRevoke,
}: OwnerShareLinksListPanelProps) {
  return (
    <Surface>
      <SectionTitle title="Manage Share Links" action={<PastelChip label={`${activeCount} active`} accent={activeCount ? appleColors.green : appleColors.purple} bg={activeCount ? '#e7f8ee' : '#f1efff'} />} />
      {links.length ? (
        <Stack spacing={1.25}>
          {links.map((link) => {
            const href = `/share/product/${link.token}`;
            const absoluteHref = shareBaseUrl ? `${shareBaseUrl}${href}` : href;
            const canPreview = link.active && link.audience !== 'INTERNAL_ONLY';
            return (
              <Box key={link.id} sx={{ p: 1.35, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: link.active ? '#fff' : '#f8fafc' }}>
                <Stack spacing={1}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}>{link.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                        {absoluteHref}
                      </Typography>
                    </Box>
                    <StatusChip label={link.active ? 'ACTIVE' : 'REVOKED'} />
                  </Stack>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <PastelChip label={formatLabel(link.audience)} accent={link.audience === 'INTERNAL_ONLY' ? appleColors.amber : appleColors.purple} />
                    {link.visibleSections.map((section) => (
                      <PastelChip key={section} label={formatLabel(section)} accent={appleColors.cyan} bg="#e4f9fd" />
                    ))}
                    <PastelChip label={`${link.accessCount} views`} accent={appleColors.purple} />
                    {link.expiresAt && <PastelChip label="Expires" accent={appleColors.amber} bg="#fff4dc" />}
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    {canPreview ? (
                      <Button component={NextLink} href={href} variant="outlined" startIcon={<VisibilityOutlined />} sx={{ minHeight: 38 }}>
                        Preview
                      </Button>
                    ) : (
                      <Button variant="outlined" disabled startIcon={<LockOutlined />} sx={{ minHeight: 38 }}>
                        Private link
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopyOutlined />}
                      onClick={() => onCopy(link.token, absoluteHref)}
                      sx={{ minHeight: 38 }}
                    >
                      {copiedToken === link.token ? 'Copied' : 'Copy link'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      disabled={!link.active || isRevoking}
                      onClick={() => onRevoke(link.id)}
                      sx={{ minHeight: 38 }}
                    >
                      Revoke
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <EmptyState label="No share links yet. Create a public summary link when you want to show this product externally without exposing private proof." />
      )}
    </Surface>
  );
}
