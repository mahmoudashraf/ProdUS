'use client';

import { ExpandMoreOutlined, RuleOutlined } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from '@mui/material';
import {
  ValidationRow,
  type ValidationState,
} from './ProductOnboardingValidationRow';
import { DotLabel, appleColors } from './PlatformComponents';

export interface ProductOnboardingValidationItem {
  title: string;
  detail: string;
  state: ValidationState;
}

interface ProductOnboardingValidationChecklistProps {
  items: ProductOnboardingValidationItem[];
}

export default function ProductOnboardingValidationChecklist({
  items,
}: ProductOnboardingValidationChecklistProps) {
  const blockedCount = items.filter(item => item.state === 'blocked').length;
  const attentionCount = items.filter(item => item.state === 'attention').length;
  const readyCount = items.filter(item => item.state === 'ready').length;
  const accent = blockedCount ? appleColors.red : attentionCount ? appleColors.amber : appleColors.green;
  const label = blockedCount
    ? `${blockedCount} needed`
    : attentionCount
      ? `${attentionCount} to review`
      : 'Ready';

  return (
    <Accordion
      defaultExpanded={blockedCount > 0}
      disableGutters
      elevation={0}
      sx={{
        borderRadius: 1,
        border: '1px solid #dfe7f5',
        bgcolor: '#fbfdff',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreOutlined />} sx={{ minHeight: 70 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, width: '100%' }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1,
              bgcolor: `${accent}12`,
              color: accent,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <RuleOutlined fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 950 }}>
              Creation checks
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.45 }}>
              {readyCount}/{items.length} ready before the owner-approved action runs.
            </Typography>
          </Box>
          <DotLabel label={label} color={accent} />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Stack spacing={0.75}>
          {items.map(item => (
            <ValidationRow
              key={item.title}
              title={item.title}
              detail={item.detail}
              state={item.state}
            />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
