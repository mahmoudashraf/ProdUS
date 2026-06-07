'use client';

import { CloudUploadOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ScannerArtifactFormat,
  ScannerProofAttachPanelProps,
} from './scannerProofOperationsTypes';

export default function ScannerProofAttachPanel({
  selectedProduct,
  selectedWorkspace,
  milestones,
  scannerSources,
  externalImportProviders,
  scannerUploadForm,
  setScannerUploadForm,
  externalImportForm,
  setExternalImportForm,
  isUploadingEvidence,
  isImportingExternalEvidence,
  onUploadScannerEvidence,
  onImportExternalEvidence,
}: ScannerProofAttachPanelProps) {
  return (
    <Stack spacing={1.75}>
      <Box component="form" onSubmit={(event) => {
        event.preventDefault();
        if (selectedProduct && scannerUploadForm.toolName.trim() && scannerUploadForm.artifactPayload.trim()) onUploadScannerEvidence();
      }}>
        <Stack spacing={1.25}>
          <Typography sx={{ fontWeight: 900 }}>Upload CI evidence</Typography>
          <TextField
            select
            size="small"
            label="Evidence source"
            value={scannerUploadForm.sourceId}
            onChange={(event) => setScannerUploadForm((current) => ({ ...current, sourceId: event.target.value }))}
          >
            <MenuItem value="">Auto-create CI source</MenuItem>
            {scannerSources.map((source) => (
              <MenuItem key={source.id} value={source.id}>{source.displayName}</MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 120px' }, gap: 1 }}>
            <TextField
              size="small"
              label="Tool"
              value={scannerUploadForm.toolName}
              onChange={(event) => setScannerUploadForm((current) => ({ ...current, toolName: event.target.value }))}
            />
            <TextField
              select
              size="small"
              label="Format"
              value={scannerUploadForm.format}
              onChange={(event) => setScannerUploadForm((current) => ({ ...current, format: event.target.value as ScannerArtifactFormat }))}
            >
              <MenuItem value="SARIF">SARIF</MenuItem>
              <MenuItem value="JSON">JSON</MenuItem>
              <MenuItem value="LOG">Log</MenuItem>
              <MenuItem value="JUNIT">JUnit</MenuItem>
            </TextField>
          </Box>
          <TextField
            size="small"
            label="Tool version"
            value={scannerUploadForm.toolVersion}
            onChange={(event) => setScannerUploadForm((current) => ({ ...current, toolVersion: event.target.value }))}
          />
          <TextField
            size="small"
            label="Artifact file name"
            value={scannerUploadForm.artifactFileName}
            onChange={(event) => setScannerUploadForm((current) => ({ ...current, artifactFileName: event.target.value }))}
          />
          {selectedWorkspace && (
            <TextField
              select
              size="small"
              label="Attach to milestone"
              value={scannerUploadForm.milestoneId}
              onChange={(event) => setScannerUploadForm((current) => ({ ...current, milestoneId: event.target.value }))}
            >
              <MenuItem value="">Product-level evidence</MenuItem>
              {milestones.map((milestone) => (
                <MenuItem key={milestone.id} value={milestone.id}>{milestone.title}</MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            size="small"
            label="Artifact payload"
            placeholder="Paste SARIF, JSON, JUnit XML, or CI log output from a real scanner run."
            value={scannerUploadForm.artifactPayload}
            onChange={(event) => setScannerUploadForm((current) => ({ ...current, artifactPayload: event.target.value }))}
            multiline
            minRows={7}
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13, alignItems: 'flex-start' } }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<CloudUploadOutlined />}
            disabled={!selectedProduct || !scannerUploadForm.toolName.trim() || !scannerUploadForm.artifactPayload.trim() || isUploadingEvidence}
            sx={{ minHeight: 44 }}
          >
            Normalize Evidence
          </Button>
        </Stack>
      </Box>

      <Divider />

      <Box component="form" onSubmit={(event) => {
        event.preventDefault();
        if (selectedProduct && externalImportForm.toolName.trim() && externalImportForm.artifactPayload.trim()) onImportExternalEvidence();
      }}>
        <Stack spacing={1.25}>
          <Typography sx={{ fontWeight: 900 }}>Import external tool results</Typography>
          <TextField
            select
            size="small"
            label="Provider"
            value={externalImportForm.provider}
            onChange={(event) => {
              const provider = externalImportProviders.find((item) => item.value === event.target.value) ?? externalImportProviders[0]!;
              setExternalImportForm((current) => ({
                ...current,
                provider: provider.value,
                toolName: provider.toolName,
                format: provider.format,
                artifactFileName: provider.format === 'SARIF' ? 'external-results.sarif' : `${provider.value.toLowerCase().replaceAll('_', '-')}.json`,
              }));
            }}
          >
            {externalImportProviders.map((provider) => (
              <MenuItem key={provider.value} value={provider.value}>{provider.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Source"
            value={externalImportForm.sourceId}
            onChange={(event) => setExternalImportForm((current) => ({ ...current, sourceId: event.target.value }))}
          >
            <MenuItem value="">Create provider source automatically</MenuItem>
            {scannerSources.map((source) => (
              <MenuItem key={source.id} value={source.id}>{source.displayName}</MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 120px' }, gap: 1 }}>
            <TextField
              size="small"
              label="Tool"
              value={externalImportForm.toolName}
              onChange={(event) => setExternalImportForm((current) => ({ ...current, toolName: event.target.value }))}
            />
            <TextField
              select
              size="small"
              label="Format"
              value={externalImportForm.format}
              onChange={(event) => setExternalImportForm((current) => ({ ...current, format: event.target.value as ScannerArtifactFormat }))}
            >
              <MenuItem value="SARIF">SARIF</MenuItem>
              <MenuItem value="JSON">JSON</MenuItem>
              <MenuItem value="LOG">Log</MenuItem>
            </TextField>
          </Box>
          <TextField
            size="small"
            label="External reference"
            placeholder="Run URL, import job ID, commit SHA, or provider project URL"
            value={externalImportForm.externalReference}
            onChange={(event) => setExternalImportForm((current) => ({ ...current, externalReference: event.target.value }))}
          />
          {selectedWorkspace && (
            <TextField
              select
              size="small"
              label="Attach to milestone"
              value={externalImportForm.milestoneId}
              onChange={(event) => setExternalImportForm((current) => ({ ...current, milestoneId: event.target.value }))}
            >
              <MenuItem value="">Product-level evidence</MenuItem>
              {milestones.map((milestone) => (
                <MenuItem key={milestone.id} value={milestone.id}>{milestone.title}</MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            size="small"
            label="Artifact payload"
            placeholder="Paste a real provider JSON, SARIF, or scanner export."
            value={externalImportForm.artifactPayload}
            onChange={(event) => setExternalImportForm((current) => ({ ...current, artifactPayload: event.target.value }))}
            multiline
            minRows={6}
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13, alignItems: 'flex-start' } }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<CloudUploadOutlined />}
            disabled={!selectedProduct || !externalImportForm.toolName.trim() || !externalImportForm.artifactPayload.trim() || isImportingExternalEvidence}
            sx={{ minHeight: 44 }}
          >
            Import Results
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
