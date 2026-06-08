'use client';

import type { ChangeEvent } from 'react';
import {
  CloudUploadOutlined,
  FilePresentOutlined,
} from '@mui/icons-material';
import { Box, Button, Checkbox, Stack, Typography } from '@mui/material';
import { appleColors } from './PlatformComponents';

export interface IntakeDocumentItem {
  name: string;
  size: number;
  shareWithAi: boolean;
}

export function ProductIntakeDocumentsPanel({
  documents,
  selectedDocumentCount,
  onFileInput,
  onRemoveDocument,
  onToggleDocument,
}: {
  documents: IntakeDocumentItem[];
  selectedDocumentCount: number;
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveDocument: (index: number) => void;
  onToggleDocument: (index: number, shareWithAi: boolean) => void;
}) {
  return (
    <Box sx={{ p: 1.4, border: '1px dashed #c8d4e5', borderRadius: 1, bgcolor: '#fff' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 38, height: 38, borderRadius: 1, display: 'grid', placeItems: 'center', bgcolor: '#ecfeff', color: appleColors.cyan }}>
            <CloudUploadOutlined fontSize="small" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              Private documents
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {documents.length
                ? `${documents.length} attached, ${selectedDocumentCount} shared temporarily with AI`
                : 'Attach a brief, spec, README, screenshot, or notes'}
            </Typography>
          </Box>
        </Stack>
        <Button component="label" variant="outlined" startIcon={<CloudUploadOutlined />} sx={{ minHeight: 40 }}>
          Add files
          <input hidden multiple type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.json,.zip,image/png,image/jpeg,image/webp" onChange={onFileInput} />
        </Button>
      </Stack>

      {documents.length > 0 && (
        <Stack spacing={0.8} sx={{ mt: 1.3 }}>
          {documents.map((item, index) => (
            <Box
              key={`${item.name}-${index}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto auto' },
                gap: 1,
                alignItems: 'center',
                p: 1,
                borderRadius: 1,
                border: '1px solid #edf2f7',
                bgcolor: item.shareWithAi ? '#f8f7ff' : '#fff',
              }}
            >
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0 }}>
                <FilePresentOutlined sx={{ color: appleColors.cyan, fontSize: 18, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 850 }} noWrap>
                    {item.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(item.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={0.4} alignItems="center">
                <Checkbox checked={item.shareWithAi} onChange={(event) => onToggleDocument(index, event.target.checked)} />
                <Typography variant="caption" sx={{ fontWeight: 850 }}>
                  Share with AI
                </Typography>
              </Stack>
              <Button variant="text" color="inherit" onClick={() => onRemoveDocument(index)} sx={{ minHeight: 34 }}>
                Remove
              </Button>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
