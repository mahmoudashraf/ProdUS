'use client';

import { AddOutlined, OpenInNewOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  PastelChip,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { ScannerProofSourcePanelProps } from './scannerProofOperationsTypes';
import { ScanSource } from './types';

export default function ScannerProofSourcePanel({
  selectedProduct,
  selectedConnectorPermission,
  activeProviderInstallations,
  scanSourceForm,
  setScanSourceForm,
  providerSourceForm,
  setProviderSourceForm,
  isCreatingSource,
  isRequestingConnectorInstall,
  isCreatingProviderSource,
  onCreateScanSource,
  onRequestConnectorInstall,
  onCreateProviderSource,
}: ScannerProofSourcePanelProps) {
  return (
    <Box component="form" onSubmit={(event) => {
      event.preventDefault();
      if (selectedProduct && scanSourceForm.displayName.trim()) onCreateScanSource();
    }}>
      <Stack spacing={1.25}>
        <TextField
          select
          size="small"
          label="Source type"
          value={scanSourceForm.providerType}
          onChange={(event) => setScanSourceForm((current) => ({ ...current, providerType: event.target.value as ScanSource['providerType'] }))}
        >
          <MenuItem value="GITHUB">GitHub</MenuItem>
          <MenuItem value="GITLAB">GitLab</MenuItem>
          <MenuItem value="CI_UPLOAD">CI upload</MenuItem>
          <MenuItem value="RUNTIME_URL">Runtime URL</MenuItem>
          <MenuItem value="EXTERNAL_TOOL">External tool</MenuItem>
        </TextField>
        {selectedConnectorPermission && (
          <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#dbeafe', bgcolor: '#f8fbff' }}>
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>{selectedConnectorPermission.label}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35, lineHeight: 1.45 }}>
                  {selectedConnectorPermission.purpose}
                </Typography>
              </Box>
              {selectedConnectorPermission.appConnectorPreferred && <PastelChip label="Preferred app" accent={appleColors.purple} />}
            </Stack>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {selectedConnectorPermission.permissions.map((permission) => (
                <PastelChip key={permission} label={permission} accent={appleColors.cyan} bg="#e8f8ff" />
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, lineHeight: 1.45 }}>
              {selectedConnectorPermission.operatingNote}
            </Typography>
          </Box>
        )}
        {(scanSourceForm.providerType === 'GITHUB' || scanSourceForm.providerType === 'GITLAB') && (
          <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e7e4ff', bgcolor: '#fbfaff' }}>
            <Stack spacing={1}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    {scanSourceForm.providerType === 'GITHUB' ? 'GitHub App connection' : 'GitLab project connection'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Connect once, then choose the repository this product uses.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<OpenInNewOutlined />}
                  onClick={() => onRequestConnectorInstall(scanSourceForm.providerType === 'GITHUB' ? 'github' : 'gitlab')}
                  disabled={isRequestingConnectorInstall}
                  sx={{ minHeight: 36, minWidth: 154 }}
                >
                  Connect app
                </Button>
              </Stack>
              {activeProviderInstallations.length ? (
                <>
                  <TextField
                    select
                    size="small"
                    label="Connected account"
                    value={providerSourceForm.installationId || activeProviderInstallations[0]?.id || ''}
                    onChange={(event) => setProviderSourceForm((current) => ({ ...current, installationId: event.target.value }))}
                  >
                    {activeProviderInstallations.map((installation) => (
                      <MenuItem key={installation.id} value={installation.id}>
                        {installation.accountLogin || installation.externalInstallationId} · {formatLabel(installation.providerType)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    label="Repository full name"
                    placeholder={scanSourceForm.providerType === 'GITHUB' ? 'owner/repository' : 'group/project'}
                    value={providerSourceForm.repositoryFullName}
                    onChange={(event) => setProviderSourceForm((current) => ({ ...current, repositoryFullName: event.target.value }))}
                  />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, gap: 1 }}>
                    <TextField
                      size="small"
                      label="Default branch"
                      value={providerSourceForm.defaultBranch}
                      onChange={(event) => setProviderSourceForm((current) => ({ ...current, defaultBranch: event.target.value }))}
                    />
                    <TextField
                      size="small"
                      label="Clone URL override"
                      placeholder="Optional. Leave empty for standard provider HTTPS URL."
                      value={providerSourceForm.cloneUrl}
                      onChange={(event) => setProviderSourceForm((current) => ({ ...current, cloneUrl: event.target.value }))}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddOutlined />}
                    disabled={!selectedProduct || !providerSourceForm.repositoryFullName.trim() || !(providerSourceForm.installationId || activeProviderInstallations[0]?.id) || isCreatingProviderSource}
                    onClick={onCreateProviderSource}
                    sx={{ minHeight: 42 }}
                  >
                    Add repository source
                  </Button>
                </>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 1 }}>
                  No active {formatLabel(scanSourceForm.providerType)} app is connected yet. Manual source entry still works for public repositories and CI imports.
                </Alert>
              )}
            </Stack>
          </Box>
        )}
        <TextField
          size="small"
          label="Display name"
          value={scanSourceForm.displayName}
          onChange={(event) => setScanSourceForm((current) => ({ ...current, displayName: event.target.value }))}
        />
        <TextField
          size="small"
          label="Reference"
          placeholder="Repository, pipeline, or scanner URL"
          value={scanSourceForm.externalReference}
          onChange={(event) => setScanSourceForm((current) => ({ ...current, externalReference: event.target.value }))}
        />
        <TextField
          size="small"
          label="Scope note"
          value={scanSourceForm.scopeNote}
          onChange={(event) => setScanSourceForm((current) => ({ ...current, scopeNote: event.target.value }))}
          multiline
          minRows={2}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={scanSourceForm.authorizationConfirmed}
              onChange={(event) => setScanSourceForm((current) => ({ ...current, authorizationConfirmed: event.target.checked }))}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              I confirm this source belongs to this product and can be scanned.
            </Typography>
          }
        />
        <Button
          type="submit"
          variant="outlined"
          startIcon={<AddOutlined />}
          disabled={!selectedProduct || !scanSourceForm.displayName.trim() || isCreatingSource}
          sx={{ minHeight: 42 }}
        >
          Save source
        </Button>
      </Stack>
    </Box>
  );
}
