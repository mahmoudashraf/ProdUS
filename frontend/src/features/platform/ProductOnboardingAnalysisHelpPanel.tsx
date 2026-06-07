'use client';

import { ExpandMoreOutlined, HelpOutlineOutlined } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from '@mui/material';
import {
  ProjectAnalysisChatPanel,
} from './ProductOnboardingAiPanels';
import { DotLabel, appleColors } from './PlatformComponents';

interface ProductOnboardingAnalysisHelpPanelProps {
  disabled: boolean;
  requestContext: Record<string, unknown>;
  conversationId: string;
}

export default function ProductOnboardingAnalysisHelpPanel({
  disabled,
  requestContext,
  conversationId,
}: ProductOnboardingAnalysisHelpPanelProps) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        borderRadius: 1,
        border: '1px solid #dfe7f5',
        bgcolor: '#fff',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreOutlined />} sx={{ minHeight: 68 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, width: '100%' }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1,
              bgcolor: '#f1efff',
              color: appleColors.purple,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <HelpOutlineOutlined fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 950 }}>
              Ask about this analysis
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.45 }}>
              Optional read-only AI help after you review the owner decision.
            </Typography>
          </Box>
          <DotLabel label="Optional" color={appleColors.purple} />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <ProjectAnalysisChatPanel
          disabled={disabled}
          requestContext={requestContext}
          conversationId={conversationId}
        />
      </AccordionDetails>
    </Accordion>
  );
}
