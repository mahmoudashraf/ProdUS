'use client';

import type { ChangeEvent } from 'react';
import {
  ArrowForwardOutlined,
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
  CloudUploadOutlined,
  FilePresentOutlined,
  LockOutlined,
} from '@mui/icons-material';
import { Box, Button, Checkbox, LinearProgress, Stack, TextField, Typography } from '@mui/material';
import {
  DotLabel,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { AiOpportunityReport, ProductAnalysisMode } from './types';

export interface IntakeDocumentItem {
  name: string;
  size: number;
  shareWithAi: boolean;
}

interface AnalysisModeOption {
  mode: ProductAnalysisMode;
  title: string;
  detail: string;
  accent: string;
}

export function ProductIntakeFrontDoor({
  brief,
  productUrl,
  repositoryUrl,
  analysisMode,
  analysisModeOptions,
  documents,
  selectedDocumentCount,
  isBusy,
  onBriefChange,
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
  productUrl: string;
  repositoryUrl: string;
  analysisMode: ProductAnalysisMode;
  analysisModeOptions: AnalysisModeOption[];
  documents: IntakeDocumentItem[];
  selectedDocumentCount: number;
  isBusy: boolean;
  onBriefChange: (value: string) => void;
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
            <Typography color="text.secondary" sx={{ fontSize: 16, lineHeight: 1.7, maxWidth: 720 }}>
              Tell ProdUS about the product in plain words. ProdUS checks it privately, shows what it understood, and turns the result into a launch-readiness path.
            </Typography>
          </Box>

          <TextField
            label="Describe your product in your own words"
            value={brief}
            onChange={(event) => onBriefChange(event.target.value)}
            multiline
            minRows={5}
            fullWidth
            placeholder="What does it do, who is it for, and what would ready mean to you?"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
            <TextField
              label="Repository URL"
              value={repositoryUrl}
              onChange={(event) => onRepositoryUrlChange(event.target.value)}
              placeholder="github.com/you/project"
              fullWidth
            />
            <TextField
              label="Live or staging URL"
              value={productUrl}
              onChange={(event) => onProductUrlChange(event.target.value)}
              placeholder="https://myapp.example.com"
              fullWidth
            />
          </Box>

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

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
            {analysisModeOptions.map((option) => {
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
                    <DotLabel label={selected ? 'Selected' : 'Optional'} color={selected ? option.accent : appleColors.muted} />
                    <Typography variant="body2" sx={{ fontWeight: 950 }}>
                      {option.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
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
              Private by default. ProdUS only shares the files you select, uses short-lived access for AI analysis, and keeps ProdUS as the system of record.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems={{ sm: 'center' }}>
            <Button variant="contained" size="large" endIcon={<ArrowForwardOutlined />} disabled={!canAnalyze} onClick={onAnalyze} sx={{ minHeight: 48 }}>
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

export function ProductAnalysisProgress({ modeLabel }: { modeLabel: string }) {
  const steps = [
    'Reading product context',
    'Checking private document access',
    'Preparing repository and runtime signals',
    'Mapping services and scanner focus',
    modeLabel.includes('AI') ? 'Looking for AI opportunities' : 'Preparing owner review',
  ];

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
      <Stack spacing={1.5}>
        <SectionTitle title="Checking your product" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
        <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
          ProdUS is turning the brief, links, and selected files into an owner-readable productization plan.
        </Typography>
        <LinearProgress sx={{ borderRadius: 999, height: 7 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1 }}>
          {steps.map((step, index) => (
            <Box key={step} sx={{ p: 1, borderRadius: 1, border: '1px solid #e7eaf3', bgcolor: '#fff', minHeight: 70 }}>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: index < 2 ? '#e7f8ee' : '#f1efff', color: index < 2 ? appleColors.green : appleColors.purple, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 900 }}>
                  {index < 2 ? <CheckCircleOutlineOutlined sx={{ fontSize: 15 }} /> : index + 1}
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 900, lineHeight: 1.3 }}>
                  {step}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </Stack>
    </Surface>
  );
}

export function AiOpportunityDiscoveryPanel({ report }: { report: AiOpportunityReport | undefined }) {
  if (!report) return null;

  const useCases = report.useCases ?? [];
  return (
    <Box sx={{ p: 1.5, borderRadius: 1, border: `1px solid ${appleColors.purple}24`, bgcolor: '#fff' }}>
      <Stack spacing={1.4}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'flex-start' }}>
          <Box>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <AutoAwesomeOutlined sx={{ color: appleColors.purple }} />
              <Typography variant="h4">Where AI could make this product better</Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.6 }}>
              {report.summary || 'Product-specific opportunities grounded in the context ProdUS inspected.'}
            </Typography>
          </Box>
          <PastelChip label={report.live ? 'LoomAI analyzed' : 'Prepared'} accent={report.live ? appleColors.green : appleColors.amber} bg={report.live ? '#e7f8ee' : '#fff4dc'} />
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
          {useCases.slice(0, 3).map((useCase) => (
            <Box key={useCase.title} sx={{ p: 1.25, borderRadius: 1, border: '1px solid #e8ddff', bgcolor: '#fbfaff' }}>
              <Stack spacing={0.85}>
                <Typography variant="body2" sx={{ fontWeight: 950, lineHeight: 1.35 }}>
                  {useCase.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  {useCase.userValue || useCase.businessValue || useCase.workflow || 'Useful AI opportunity identified from the current product context.'}
                </Typography>
                <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                  {useCase.workflow && <DotLabel label={`Attaches to: ${useCase.workflow}`} color={appleColors.cyan} />}
                  <DotLabel label={formatLabel(useCase.priority || 'should')} color={appleColors.purple} />
                  <DotLabel label={useCase.confidence ? `${Math.round(useCase.confidence * 100)}% confidence` : 'Evidence grounded'} color={appleColors.green} />
                </Stack>
              </Stack>
            </Box>
          ))}
        </Box>

        <Box sx={{ p: 1.35, borderRadius: 1, bgcolor: '#eeedfe' }}>
          <Typography variant="body2" sx={{ color: '#26215c', fontWeight: 950 }}>
            Ready to explore one?
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: '#3c3489', lineHeight: 1.55, mt: 0.45 }}>
            LoomAI is the preferred integration partner for these opportunities. The owner can still choose another verified provider.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
            <Button variant="contained" startIcon={<AutoAwesomeOutlined />} sx={{ bgcolor: appleColors.purple, minHeight: 38 }}>
              Explore with LoomAI
            </Button>
            <Button variant="text" sx={{ color: '#3c3489', minHeight: 38 }}>
              See other providers
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
