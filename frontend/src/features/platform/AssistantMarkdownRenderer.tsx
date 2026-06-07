'use client';

import { Box, Stack, Typography } from '@mui/material';
import { appleColors } from './PlatformComponents';

type AssistantMarkdownBlock =
  | { type: 'heading'; text: string; depth: number }
  | { type: 'paragraph'; text: string }
  | { type: 'ul' | 'ol'; items: string[] };

const parseAssistantMarkdown = (text: string): AssistantMarkdownBlock[] => {
  const blocks: AssistantMarkdownBlock[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listType && listItems.length) {
      blocks.push({ type: listType, items: listItems });
    }
    listType = null;
    listItems = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = /^(#{2,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const marker = heading[1] ?? '##';
      const headingText = (heading[2] ?? '').trim();
      blocks.push({ type: 'heading', depth: marker.length, text: headingText });
      return;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (ordered) {
      flushParagraph();
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push((ordered[1] ?? '').trim());
      return;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line);
    if (unordered) {
      flushParagraph();
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push((unordered[1] ?? '').trim());
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();
  return blocks;
};

const renderAssistantInline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Box component="strong" key={`${part}-${index}`} sx={{ fontWeight: 900 }}>
          {part.slice(2, -2)}
        </Box>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <Box
          component="code"
          key={`${part}-${index}`}
          sx={{
            px: 0.45,
            py: 0.1,
            borderRadius: 0.6,
            bgcolor: '#eef4ff',
            color: appleColors.ink,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.88em',
          }}
        >
          {part.slice(1, -1)}
        </Box>
      );
    }
    return part;
  });
};

export default function AssistantMarkdownRenderer({ text }: { text: string }) {
  const blocks = parseAssistantMarkdown(text);
  return (
    <Stack spacing={0.9}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Typography
              key={`${block.type}-${index}`}
              variant="subtitle2"
              sx={{
                mt: index === 0 ? 0 : 0.75,
                fontWeight: 950,
                color: appleColors.ink,
                lineHeight: 1.35,
              }}
            >
              {renderAssistantInline(block.text)}
            </Typography>
          );
        }
        if (block.type === 'paragraph') {
          return (
            <Typography key={`${block.type}-${index}`} variant="body2" sx={{ lineHeight: 1.7, color: appleColors.ink }}>
              {renderAssistantInline(block.text)}
            </Typography>
          );
        }
        return (
          <Box
            key={`${block.type}-${index}`}
            component={block.type}
            sx={{
              m: 0,
              pl: 2.35,
              display: 'grid',
              gap: 0.7,
              color: appleColors.ink,
              '& li::marker': { color: appleColors.purple, fontWeight: 900 },
            }}
          >
            {block.items.map((item, itemIndex) => (
              <Box key={`${item}-${itemIndex}`} component="li" sx={{ pl: 0.25 }}>
                <Typography component="span" variant="body2" sx={{ lineHeight: 1.65, color: appleColors.ink }}>
                  {renderAssistantInline(item)}
                </Typography>
              </Box>
            ))}
          </Box>
        );
      })}
    </Stack>
  );
}
