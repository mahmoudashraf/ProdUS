'use client';

import type { ChangeEvent } from 'react';
import { ArrowForwardOutlined, LockOutlined } from '@mui/icons-material';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { DotLabel, PastelChip, Surface, appleColors } from './PlatformComponents';
import {
  type IntakeDocumentItem,
  ProductIntakeDocumentsPanel,
} from './ProductIntakeDocumentsPanel';
import type { ProductAnalysisMode } from './types';

interface AnalysisModeOption {
  mode: ProductAnalysisMode;
  title: string;
  detail: string;
  accent: string;
}

export function ProductIntakeFrontDoor({
  brief,
  productName,
  productUrl,
  repositoryUrl,
  analysisMode,
  analysisModeOptions,
  documents,
  selectedDocumentCount,
  isBusy,
  onBriefChange,
  onProductNameChange,
  onProductUrlChange,
  onRepositoryUrlChange,
  onAnalysisModeChange,
  onFileInput,
  onToggleDocument,
  onRemoveDocument,
  onAnalyze,
  onManualSetup,
}: {
  brief: string;
  productName: string;
  productUrl: string;
  repositoryUrl: string;
  analysisMode: ProductAnalysisMode;
  analysisModeOptions: AnalysisModeOption[];
  documents: IntakeDocumentItem[];
  selectedDocumentCount: number;
  isBusy: boolean;
  onBriefChange: (value: string) => void;
  onProductNameChange: (value: string) => void;
  onProductUrlChange: (value: string) => void;
  onRepositoryUrlChange: (value: string) => void;
  onAnalysisModeChange: (mode: ProductAnalysisMode) => void;
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleDocument: (index: number, shareWithAi: boolean) => void;
  onRemoveDocument: (index: number) => void;
  onAnalyze: () => void;
  onManualSetup: () => void;
}) {
  const canAnalyze = brief.trim().length > 0 && !isBusy;

  return (
    <Surface
      sx={{
        p: { xs: 2, md: 3 },
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)',
      }}
    >
      <Box sx={{ maxWidth: 880, mx: 'auto' }}>
        <Stack spacing={2.2}>
          <Box>
            <PastelChip label="Owner front door" accent={appleColors.purple} />
            <Typography variant="h2" sx={{ mt: 1.25, mb: 0.75 }}>
              Let's see what it takes to make this production-ready
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: 16, lineHeight: 1.7, maxWidth: 720 }}
            >
              Tell ProdUS about the product in plain words. ProdUS checks it privately, shows what
              it understood, and turns the result into a launch-readiness path.
            </Typography>
          </Box>

          <TextField
            label="Product name"
            value={productName}
            onChange={event => onProductNameChange(event.target.value)}
            fullWidth
            placeholder="Inventory launch desk"
            helperText="Use the name you want to see across the product workspace."
          />

          <TextField
            label="Describe your product in your own words"
            value={brief}
            onChange={event => onBriefChange(event.target.value)}
            multiline
            minRows={5}
            fullWidth
            placeholder="What does it do, who is it for, and what would ready mean to you?"
          />

          <Box
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}
          >
            <TextField
              label="Repository URL"
              value={repositoryUrl}
              onChange={event => onRepositoryUrlChange(event.target.value)}
              placeholder="github.com/you/product"
              fullWidth
            />
            <TextField
              label="Live or staging URL"
              value={productUrl}
              onChange={event => onProductUrlChange(event.target.value)}
              placeholder="https://myapp.example.com"
              fullWidth
            />
          </Box>

          <ProductIntakeDocumentsPanel
            documents={documents}
            selectedDocumentCount={selectedDocumentCount}
            onFileInput={onFileInput}
            onRemoveDocument={onRemoveDocument}
            onToggleDocument={onToggleDocument}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
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
                    whiteSpace: 'normal',
                    minWidth: 0,
                    overflow: 'hidden',
                    minHeight: 88,
                    p: 1.25,
                    borderRadius: 1,
                    borderColor: selected ? option.accent : '#dfe7f5',
                    borderWidth: selected ? 2 : 1,
                    bgcolor: selected ? `${option.accent}08` : '#fff',
                    color: appleColors.ink,
                  }}
                >
                  <Stack spacing={0.5} alignItems="flex-start" sx={{ minWidth: 0, width: '100%' }}>
                    <DotLabel
                      label={selected ? 'Selected' : 'Optional'}
                      color={selected ? option.accent : appleColors.muted}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 950 }}>
                      {option.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ lineHeight: 1.45, whiteSpace: 'normal', overflowWrap: 'anywhere' }}
                    >
                      {option.detail}
                    </Typography>
                  </Stack>
                </Button>
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary' }}>
            <LockOutlined sx={{ fontSize: 17 }} />
            <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
              Private by default. ProdUS only shares the files you select, uses short-lived access
              for AI analysis, and keeps ProdUS as the system of record.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.2}
            alignItems={{ sm: 'center' }}
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardOutlined />}
              disabled={!canAnalyze}
              onClick={onAnalyze}
              sx={{ minHeight: 48 }}
            >
              {isBusy ? 'Analyzing...' : 'Analyze my product'}
            </Button>
            <Button variant="text" color="inherit" onClick={onManualSetup} sx={{ minHeight: 44 }}>
              Set up manually instead
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Surface>
  );
}
