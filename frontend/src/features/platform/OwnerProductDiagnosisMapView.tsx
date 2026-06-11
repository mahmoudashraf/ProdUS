'use client';

import { ArrowBackOutlined, FactCheckOutlined, TuneOutlined } from '@mui/icons-material';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { PastelChip, Surface, appleColors } from './PlatformComponents';
import type { OwnerProductDiagnosisCommonProps } from './ownerProductDiagnosisTypes';

type OwnerProductDiagnosisMapViewProps = Pick<
  OwnerProductDiagnosisCommonProps,
  'diagnosisForm' | 'isCreatingDiagnosis' | 'latestDiagnosis' | 'onCreateDiagnosis' | 'onOpenSummary'
>;

export default function OwnerProductDiagnosisMapView({
  diagnosisForm,
  isCreatingDiagnosis,
  latestDiagnosis,
  onCreateDiagnosis,
  onOpenSummary,
}: OwnerProductDiagnosisMapViewProps) {
  return (
    <Stack spacing={2}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ lg: 'flex-start' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <TuneOutlined sx={{ color: appleColors.blue }} />
              <Typography variant="h3">Map rough edges</Typography>
              <PastelChip
                label={latestDiagnosis ? 'Updates saved diagnosis' : 'Creates diagnosis'}
                accent={latestDiagnosis ? appleColors.blue : appleColors.purple}
                bg={latestDiagnosis ? '#eaf3ff' : '#f1efff'}
              />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 820, lineHeight: 1.6 }}>
              Capture the launch goal, known gaps, and repo or app signals. ProdUS stores the
              deterministic diagnosis after you submit, then the saved diagnosis page explains the
              owner decision and service path.
            </Typography>
          </Box>
          {latestDiagnosis && (
            <Button
              variant="outlined"
              startIcon={<ArrowBackOutlined />}
              onClick={onOpenSummary}
              sx={{ minHeight: 44, whiteSpace: 'normal', minWidth: { lg: 190 } }}
            >
              Saved diagnosis
            </Button>
          )}
        </Stack>
      </Surface>

      {latestDiagnosis && (
        <Surface>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="h4">Current saved diagnosis</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                {latestDiagnosis.summary}
              </Typography>
            </Box>
            <PastelChip
              label={`${latestDiagnosis.findings.length} rough edges`}
              accent={appleColors.amber}
              bg="#fff4dc"
            />
          </Stack>
        </Surface>
      )}

      <Surface>
        <Box component="form" onSubmit={diagnosisForm.handleSubmit(onCreateDiagnosis)}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FactCheckOutlined sx={{ color: appleColors.blue }} />
              <Typography variant="h4">Owner context</Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              This is not an AI autopilot action. It maps the owner-provided context into stored
              rough edges that can later be explained by AI on request.
            </Typography>
            <TextField
              size="small"
              label="Launch goal"
              value={diagnosisForm.values.businessGoal}
              onChange={event => diagnosisForm.setValue('businessGoal', event.target.value)}
            />
            <TextField
              size="small"
              label="Known rough edges"
              value={diagnosisForm.values.currentProblems}
              onChange={event => diagnosisForm.setValue('currentProblems', event.target.value)}
              multiline
              minRows={3}
            />
            <TextField
              size="small"
              label="Repo or app signals"
              placeholder="Repo available, staging missing, no monitoring, payment flow exists..."
              value={diagnosisForm.values.accessSignals}
              onChange={event => diagnosisForm.setValue('accessSignals', event.target.value)}
              multiline
              minRows={3}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isCreatingDiagnosis}
              sx={{ minHeight: 44, alignSelf: 'flex-start' }}
            >
              {isCreatingDiagnosis ? 'Mapping...' : 'Save diagnosis map'}
            </Button>
          </Stack>
        </Box>
      </Surface>
    </Stack>
  );
}
