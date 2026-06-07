'use client';

import NextLink from 'next/link';
import { ArrowForwardOutlined, DeleteOutlineOutlined } from '@mui/icons-material';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { ProductizationCartTalentItem } from './types';

interface ProjectStartTalentPanelProps {
  talentItems: ProductizationCartTalentItem[];
  isRemovingTalent: boolean;
  onRemoveTalent: (itemId: string) => void;
}

export default function ProjectStartTalentPanel({
  talentItems,
  isRemovingTalent,
  onRemoveTalent,
}: ProjectStartTalentPanelProps) {
  return (
    <Surface>
      <SectionTitle title="Teams And Experts" action={<Button component={NextLink} href="/teams" variant="text" endIcon={<ArrowForwardOutlined />}>Add talent</Button>} />
      {talentItems.length ? (
        <Stack spacing={1.25}>
          {talentItems.map((item) => {
            const title = item.team?.name || item.expertProfile?.displayName || 'Selected delivery partner';
            const subtitle = item.team?.headline || item.expertProfile?.headline || item.notes || 'Selected delivery partner.';
            const accent = item.itemType === 'TEAM' ? appleColors.cyan : appleColors.green;
            const background = item.itemType === 'TEAM' ? '#e4f9fd' : '#e7f8ee';

            return (
              <Box
                key={item.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr auto', md: 'minmax(0, 1.4fr) minmax(220px, 0.8fr) auto' },
                  gap: 1.5,
                  alignItems: 'center',
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: '#fff',
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
                    {subtitle}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ display: { xs: 'none', md: 'flex' } }}>
                  <PastelChip label={formatLabel(item.itemType)} accent={accent} bg={background} />
                  {item.team?.verificationStatus && <StatusChip label={item.team.verificationStatus} />}
                  {item.expertProfile?.availability && <StatusChip label={item.expertProfile.availability} />}
                </Stack>
                <IconButton
                  size="small"
                  aria-label={`Remove ${title}`}
                  onClick={() => onRemoveTalent(item.id)}
                  disabled={isRemovingTalent}
                  sx={{ width: 36, height: 36, borderRadius: 1, color: appleColors.red, bgcolor: '#fff7f8' }}
                >
                  <DeleteOutlineOutlined fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <EmptyState label="No delivery talent yet. Add verified teams or solo experts now, or start with services and match talent later." />
      )}
    </Surface>
  );
}
