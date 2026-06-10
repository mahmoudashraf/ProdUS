'use client';

import { AutoAwesomeOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';

export default function OwnerAiBriefPanel({
  fallbackReason,
  isDisabled,
  isFetching,
  mode,
  recommendationRationale,
  suggestions,
  onSuggest,
}: {
  fallbackReason?: string | undefined;
  isDisabled: boolean;
  isFetching: boolean;
  mode?: string | undefined;
  recommendationRationale?: string | undefined;
  suggestions: string[];
  onSuggest: () => void;
}) {
  const live = Boolean(mode && mode !== 'FALLBACK');
  const visibleSuggestions = suggestions.slice(0, 3);
  const hasAskedAi = Boolean(mode || fallbackReason || suggestions.length);

  return (
    <Surface>
      <SectionTitle
        title="AI Owner Brief"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <PastelChip
              label={mode ? (live ? 'LoomAI live' : 'AI fallback') : 'Ask AI'}
              accent={live ? appleColors.purple : appleColors.blue}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<AutoAwesomeOutlined />}
              disabled={isDisabled || isFetching}
              onClick={onSuggest}
              sx={{ minHeight: 34 }}
            >
              {isFetching ? 'Thinking...' : 'Suggest'}
            </Button>
          </Stack>
        }
      />
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 1,
            bgcolor: '#f1efff',
            color: appleColors.purple,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <AutoAwesomeOutlined />
        </Box>
        <Box>
          <Typography variant="h4">Product clarity</Typography>
          <Typography color="success.main" sx={{ fontWeight: 800 }}>
            Evidence-led next steps
          </Typography>
        </Box>
      </Stack>
      <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
        {recommendationRationale ||
          (hasAskedAi
            ? 'AI did not return a usable owner brief. Check the status label and try again after confirming LoomAI is available.'
            : 'Ask AI for a short product-owner brief based on the current product, launch status, services, scanner evidence, and next decision.')}
      </Typography>
      {visibleSuggestions.length ? (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {visibleSuggestions.map((suggestion) => (
            <Box
              key={suggestion}
              sx={{
                p: 1.25,
                border: '1px solid',
                borderColor: appleColors.line,
                borderRadius: 1,
                background: 'rgba(248, 250, 252, 0.78)',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoAwesomeOutlined sx={{ color: appleColors.purple, fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {suggestion}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Box
          sx={{
            mt: 2,
            p: 1.25,
            border: '1px dashed',
            borderColor: appleColors.line,
            borderRadius: 1,
            bgcolor: '#f8fafc',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {hasAskedAi
              ? 'No AI suggestions were returned for this context.'
              : 'No AI suggestions loaded yet. Use Suggest to request a live owner brief.'}
          </Typography>
        </Box>
      )}
      {fallbackReason && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          {formatLabel(fallbackReason)}. This is not a live LoomAI suggestion result.
        </Typography>
      )}
    </Surface>
  );
}
