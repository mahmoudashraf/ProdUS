'use client';

import { DeleteOutlineOutlined } from '@mui/icons-material';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { appleColors, formatLabel } from './PlatformComponents';
import type { ProductizationCart } from './types';

interface OwnerProjectStartTalentPanelProps {
  talentItems: ProductizationCart['talentItems'];
  isRemovingTalent: boolean;
  onRemoveTalent: (itemId: string) => void;
}

export default function OwnerProjectStartTalentPanel({
  talentItems,
  isRemovingTalent,
  onRemoveTalent,
}: OwnerProjectStartTalentPanelProps) {
  if (!talentItems.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Choose a matched team or solo expert after the service path is clear.
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
        Delivery support
      </Typography>
      {talentItems.map((item) => (
        <Stack key={item.id} direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
              {item.team?.name || item.expertProfile?.displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatLabel(item.itemType)}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => onRemoveTalent(item.id)}
            disabled={isRemovingTalent}
            sx={{ width: 34, height: 34, borderRadius: 1, color: appleColors.red, bgcolor: '#fff7f8' }}
          >
            <DeleteOutlineOutlined fontSize="small" />
          </IconButton>
        </Stack>
      ))}
    </Stack>
  );
}
