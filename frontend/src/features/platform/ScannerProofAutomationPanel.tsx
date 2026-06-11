'use client';

import {
  ContentCopyOutlined,
  EventRepeatOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { appleColors } from './PlatformComponents';
import { ScannerProofAutomationPanelProps } from './scannerProofOperationsTypes';
import { CiTemplateResponse } from './types';

export default function ScannerProofAutomationPanel({
  selectedProduct,
  scheduleBlockedReason,
  scheduleForm,
  setScheduleForm,
  ciTemplateType,
  setCiTemplateType,
  ciTemplate,
  isCreatingSchedule,
  isFetchingCiTemplate,
  onCreateSchedule,
  onFetchCiTemplate,
}: ScannerProofAutomationPanelProps) {
  return (
    <Stack spacing={1.75}>
      <Box component="form" onSubmit={(event) => {
        event.preventDefault();
        if (!scheduleBlockedReason) onCreateSchedule();
      }}>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 900 }}>Schedule scan refresh</Typography>
            <EventRepeatOutlined sx={{ color: appleColors.cyan }} />
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1.4fr' }, gap: 1 }}>
            <TextField
              size="small"
              type="number"
              label="Every days"
              value={scheduleForm.intervalDays}
              inputProps={{ min: 1, max: 90 }}
              onChange={(event) => setScheduleForm((current) => ({ ...current, intervalDays: event.target.value }))}
            />
            <TextField
              size="small"
              type="datetime-local"
              label="First run"
              value={scheduleForm.nextRunAt}
              onChange={(event) => setScheduleForm((current) => ({ ...current, nextRunAt: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <TextField
            size="small"
            label="Why refresh?"
            value={scheduleForm.reason}
            onChange={(event) => setScheduleForm((current) => ({ ...current, reason: event.target.value }))}
          />
          {scheduleBlockedReason && <Alert severity="info" sx={{ borderRadius: 1 }}>{scheduleBlockedReason}</Alert>}
          <Button
            type="submit"
            variant="outlined"
            startIcon={<EventRepeatOutlined />}
            disabled={!!scheduleBlockedReason || isCreatingSchedule}
            sx={{ minHeight: 42 }}
          >
            Create schedule
          </Button>
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Stack spacing={1.25}>
          <Typography sx={{ fontWeight: 900 }}>CI scan template</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              select
              size="small"
              label="Template"
              value={ciTemplateType}
              onChange={(event) => setCiTemplateType(event.target.value as CiTemplateResponse['type'])}
              sx={{ flex: 1 }}
            >
              <MenuItem value="GITHUB_ACTIONS">GitHub Actions</MenuItem>
              <MenuItem value="GITLAB_CI">GitLab CI</MenuItem>
              <MenuItem value="GENERIC_CURL">Generic curl</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              onClick={onFetchCiTemplate}
              disabled={!selectedProduct || isFetchingCiTemplate}
              sx={{ minHeight: 40, minWidth: 132 }}
            >
              Generate
            </Button>
          </Stack>
          {ciTemplate && (
            <Box sx={{ border: 1, borderColor: appleColors.line, bgcolor: '#fbfdff', borderRadius: 1, overflow: 'hidden' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.25, py: 1, borderBottom: 1, borderColor: appleColors.line }}>
                <Typography variant="caption" color="text.secondary">
                  Uses `{ciTemplate.tokenEnvironmentVariable}` and sends scan proof to ProdUS.
                </Typography>
                <Tooltip title="Copy template">
                  <IconButton size="small" onClick={() => navigator.clipboard?.writeText(ciTemplate.template)}>
                    <ContentCopyOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Box component="pre" sx={{ m: 0, p: 1.25, maxHeight: 240, overflow: 'auto', fontSize: 12, lineHeight: 1.5, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {ciTemplate.template}
              </Box>
            </Box>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
