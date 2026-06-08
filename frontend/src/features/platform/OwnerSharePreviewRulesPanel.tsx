'use client';

import NextLink from 'next/link';
import {
  LockOutlined,
  PublicOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Typography } from '@mui/material';
import {
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';

export default function OwnerSharePreviewRulesPanel({ publicPreviewHref }: { publicPreviewHref: string }) {
  return (
    <Surface sx={{ background: '#fff' }}>
      <SectionTitle title="Public Preview Rules" action={<LockOutlined sx={{ color: appleColors.amber }} />} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
        {[
          ['Anonymous first view', 'Product summary, selected public sections, and owner note only.'],
          ['Private proof stays locked', 'Findings and evidence artifacts are never included by default.'],
          ['Owner controls scope', 'Every link has its own section list and can be revoked.'],
        ].map(([titleText, detail]) => (
          <Box key={titleText} sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
            <Typography sx={{ fontWeight: 950 }}>{titleText}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
              {detail}
            </Typography>
          </Box>
        ))}
      </Box>
      {publicPreviewHref ? (
        <Button component={NextLink} href={publicPreviewHref} variant="contained" startIcon={<PublicOutlined />} sx={{ minHeight: 44, mt: 2 }}>
          Open latest public preview
        </Button>
      ) : (
        <Alert severity="warning" sx={{ borderRadius: 1, mt: 2 }}>
          Create a share link first to preview the external page.
        </Alert>
      )}
    </Surface>
  );
}
