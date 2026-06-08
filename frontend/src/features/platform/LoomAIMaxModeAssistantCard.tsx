'use client';

import { AutoAwesomeOutlined, ChatBubbleOutlineOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { DotLabel, appleColors } from './PlatformComponents';
import type { WidgetStatus } from './loomAIMaxModeWidgetRuntime';

export default function LoomAIMaxModeAssistantCard({
  canUseAssistant,
  description,
  error,
  eyebrow,
  onOpenAssistant,
  onSendPrompt,
  starterPrompts,
  status,
  title,
}: {
  canUseAssistant: boolean;
  description: string;
  error: string | null;
  eyebrow: string;
  onOpenAssistant: () => void;
  onSendPrompt: (prompt: string) => void;
  starterPrompts: string[];
  status: WidgetStatus;
  title: string;
}) {
  return (
    <Box
      sx={{
        borderRadius: 1,
        border: '1px solid #dfe7f5',
        background: 'linear-gradient(145deg, #ffffff, #f8fbff)',
        p: 1.25,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.045)',
      }}
    >
      <Stack spacing={1.15}>
        <Stack direction="row" spacing={0.85} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.85} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                display: 'grid',
                placeItems: 'center',
                bgcolor: '#f0efff',
                color: appleColors.purple,
                flex: '0 0 auto',
              }}
            >
              <ChatBubbleOutlineOutlined sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 950 }} noWrap>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {eyebrow}
              </Typography>
            </Box>
          </Stack>
          <DotLabel
            label={status === 'ready' ? 'Fixed dock ready' : status === 'loading' ? 'Loading' : 'Page AI'}
            color={status === 'error' ? appleColors.amber : appleColors.purple}
          />
        </Stack>

        <Box
          sx={{
            borderRadius: 1,
            border: '1px solid #eef2ff',
            bgcolor: '#fbfbff',
            p: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.55 }}>
            {description}
          </Typography>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={0.65} flexWrap="wrap" useFlexGap>
          {starterPrompts.map(prompt => (
            <Button
              key={prompt}
              size="small"
              variant="outlined"
              disabled={!canUseAssistant}
              onClick={() => onSendPrompt(prompt)}
              sx={{ minHeight: 30, px: 1, fontSize: 12 }}
            >
              {prompt}
            </Button>
          ))}
        </Stack>

        <Button
          variant="contained"
          startIcon={<AutoAwesomeOutlined />}
          disabled={!canUseAssistant}
          onClick={onOpenAssistant}
          sx={{ minHeight: 40 }}
        >
          {status === 'loading' ? 'Preparing ProdUS AI...' : 'Open analysis chat'}
        </Button>
      </Stack>
    </Box>
  );
}
