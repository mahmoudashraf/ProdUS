'use client';

import { CloudUploadOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DotLabel, TextInput, appleColors } from './PlatformComponents';
import type {
  ProductAnalysisModeOption,
  ProductOnboardingAnalysisDocument,
  ProductOnboardingProfileDraft,
} from './ProductOnboardingAnalysisTypes';
import type { ProductAnalysisMode } from './types';

export default function ProductOnboardingAnalysisContextEditor({
  analysisMode,
  analysisModeOptions,
  brief,
  documents,
  profile,
  selectedDocumentCount,
  onAddFiles,
  onAnalysisModeChange,
  onBriefChange,
  onProductNameChange,
  onProductUrlChange,
  onRemoveDocument,
  onRepositoryUrlChange,
  onToggleDocument,
}: {
  analysisMode: ProductAnalysisMode;
  analysisModeOptions: ProductAnalysisModeOption[];
  brief: string;
  documents: ProductOnboardingAnalysisDocument[];
  profile: ProductOnboardingProfileDraft;
  selectedDocumentCount: number;
  onAddFiles: (files: File[]) => void;
  onAnalysisModeChange: (mode: ProductAnalysisMode) => void;
  onBriefChange: (value: string) => void;
  onProductNameChange: (value: string) => void;
  onProductUrlChange: (value: string) => void;
  onRemoveDocument: (index: number) => void;
  onRepositoryUrlChange: (value: string) => void;
  onToggleDocument: (index: number, shareWithAi: boolean) => void;
}) {
  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 1,
        }}
      >
        {analysisModeOptions.map(option => {
          const selected = analysisMode === option.mode;
          return (
            <Button
              key={option.mode}
              variant="outlined"
              onClick={() => onAnalysisModeChange(option.mode)}
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                alignItems: 'stretch',
                minHeight: 92,
                p: 1.25,
                borderRadius: 1,
                borderColor: selected ? option.accent : '#dfe7f5',
                borderWidth: selected ? 2 : 1,
                bgcolor: selected ? `${option.accent}08` : '#fff',
                color: appleColors.ink,
                '&:hover': {
                  borderColor: option.accent,
                  bgcolor: `${option.accent}0f`,
                },
              }}
            >
              <Stack spacing={0.5} sx={{ width: '100%' }}>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <DotLabel
                    label={selected ? 'Selected' : 'Available'}
                    color={selected ? option.accent : appleColors.muted}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 950 }}>
                    {option.title}
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ lineHeight: 1.45, whiteSpace: 'normal' }}
                >
                  {option.detail}
                </Typography>
              </Stack>
            </Button>
          );
        })}
      </Box>
      <TextField
        label="Tell ProdUS what you want to productize"
        value={brief}
        onChange={event => onBriefChange(event.target.value)}
        multiline
        minRows={5}
        fullWidth
        placeholder="Describe the prototype, target users, links, rough edges, and what ready-to-ship should mean."
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 1.5,
        }}
      >
        <TextInput label="Product name" value={profile.name} onChange={onProductNameChange} />
        <TextInput
          label="Product or app URL"
          value={profile.productUrl}
          onChange={onProductUrlChange}
        />
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 1.5,
        }}
      >
        <TextInput
          label="Repository URL"
          value={profile.repositoryUrl}
          onChange={onRepositoryUrlChange}
        />
      </Box>
      <Box
        sx={{
          border: '1px dashed #c8d4e5',
          borderRadius: 1,
          bgcolor: '#fff',
          p: 1.5,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                bgcolor: '#ecfeff',
                color: appleColors.cyan,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <CloudUploadOutlined fontSize="small" />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 900 }}>
                Product documents
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {documents.length
                  ? `${documents.length} attached, ${selectedDocumentCount} shared temporarily with AI`
                  : 'Attach briefs, screenshots, notes, or specs'}
              </Typography>
            </Box>
          </Stack>
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadOutlined />}
            sx={{ minHeight: 40, flexShrink: 0 }}
          >
            Add files
            <input
              hidden
              multiple
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.json,.zip,image/png,image/jpeg,image/webp"
              onChange={event => {
                onAddFiles(Array.from(event.target.files || []));
                event.target.value = '';
              }}
            />
          </Button>
        </Stack>
        {documents.length > 0 && (
          <Stack spacing={0.75} sx={{ mt: 1.25 }}>
            {documents.map((item, index) => (
              <Box
                key={`${item.file.name}-${index}`}
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
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={item.shareWithAi}
                      onChange={event => onToggleDocument(index, event.target.checked)}
                    />
                  }
                  label="Share with AI"
                  sx={{
                    m: 0,
                    '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 800 },
                  }}
                />
                <Button
                  variant="text"
                  color="inherit"
                  onClick={() => onRemoveDocument(index)}
                  sx={{ minHeight: 34, minWidth: 72 }}
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
