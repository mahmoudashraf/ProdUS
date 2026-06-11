'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import { PastelChip, SectionTitle, Surface, appleColors } from './PlatformComponents';

interface OwnerActionGroup {
  label: string;
  accent: string;
  items: {
    title: string;
    detail: string;
    action: string;
    proof?: string;
    service?: string;
  }[];
}

interface OwnerActionPlanPanelProps {
  ownerActionGroups: OwnerActionGroup[];
  onOpenServicesRecommend: () => void;
}

export default function OwnerActionPlanPanel({
  ownerActionGroups,
  onOpenServicesRecommend,
}: OwnerActionPlanPanelProps) {
  return (
    <Surface>
      <SectionTitle title="Action Plan" action={<PastelChip label="Do now / week / monitor" accent={appleColors.purple} />} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
        {ownerActionGroups.map((group) => (
          <Box key={group.label} sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: `${group.accent}35`, bgcolor: '#fff', minHeight: 220 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: group.accent }} />
              <Typography variant="h4">{group.label}</Typography>
            </Stack>
            <Stack spacing={1.25}>
              {group.items.length ? group.items.map((item) => (
                <Box key={`${group.label}-${item.title}`} sx={{ borderTop: '1px solid', borderColor: appleColors.line, pt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 950, lineHeight: 1.35 }}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, lineHeight: 1.5 }}>{item.detail}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: group.accent, fontWeight: 900, mt: 0.5 }}>{item.action}</Typography>
                  {'proof' in item && item.proof && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4, lineHeight: 1.45 }}>
                      Proof: {item.proof}
                    </Typography>
                  )}
                  {'service' in item && item.service && (
                    <Button size="small" variant="outlined" onClick={onOpenServicesRecommend} sx={{ mt: 0.75, minHeight: 32 }}>
                      Review {item.service}
                    </Button>
                  )}
                </Box>
              )) : (
                <Typography variant="body2" color="text.secondary">No action needed.</Typography>
              )}
            </Stack>
          </Box>
        ))}
      </Box>
    </Surface>
  );
}
