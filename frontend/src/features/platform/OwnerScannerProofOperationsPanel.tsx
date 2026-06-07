'use client';

import { Dispatch, ReactNode, SetStateAction } from 'react';
import {
  AddOutlined,
  CancelOutlined,
  CloudUploadOutlined,
  ContentCopyOutlined,
  EventRepeatOutlined,
  ExpandMoreOutlined,
  OpenInNewOutlined,
  PlayArrowOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  StatusChip,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  CiTemplateResponse,
  ConnectorPermission,
  ExternalImportProvider,
  Milestone,
  ProductProfile,
  ProjectWorkspace,
  ScanRun,
  ScanSource,
  ScannerConnectorInstallation,
} from './types';

type ScannerArtifactFormat = 'SARIF' | 'JSON' | 'JUNIT' | 'LOG';
type ExternalImportMethod = 'MANUAL_API_IMPORT' | 'CI_TEMPLATE' | 'WEBHOOK' | 'CONNECTOR_SYNC';

interface ScanToolOption {
  key: string;
  label: string;
  depths: readonly string[];
}

interface ExternalImportProviderOption {
  value: ExternalImportProvider;
  label: string;
  toolName: string;
  format: ScannerArtifactFormat;
}

interface ScanSourceForm {
  providerType: ScanSource['providerType'];
  displayName: string;
  externalReference: string;
  authorizationConfirmed: boolean;
  scopeNote: string;
}

interface ProviderSourceForm {
  installationId: string;
  repositoryFullName: string;
  cloneUrl: string;
  defaultBranch: string;
}

interface HostedScanForm {
  sourceId: string;
  depth: ScanRun['depth'];
  toolKeys: string[];
  branchRef: string;
  runtimeTargetUrl: string;
  containerImageRef: string;
  authorizationConfirmed: boolean;
  runtimeAuthorizationConfirmed: boolean;
  reason: string;
}

interface ScannerUploadForm {
  sourceId: string;
  toolName: string;
  toolVersion: string;
  format: ScannerArtifactFormat;
  artifactFileName: string;
  artifactPayload: string;
  milestoneId: string;
}

interface ExternalImportForm {
  sourceId: string;
  provider: ExternalImportProvider;
  importMethod: ExternalImportMethod;
  toolName: string;
  toolVersion: string;
  format: ScannerArtifactFormat;
  artifactFileName: string;
  artifactPayload: string;
  externalReference: string;
  milestoneId: string;
  scopeNote: string;
}

interface ScannerScheduleForm {
  intervalDays: string;
  nextRunAt: string;
  reason: string;
}

interface OwnerScannerProofOperationsPanelProps {
  selectedProduct?: ProductProfile;
  selectedWorkspace?: ProjectWorkspace | undefined;
  milestones: Milestone[];
  scannerSources: ScanSource[];
  scanToolOptions: readonly ScanToolOption[];
  externalImportProviders: ExternalImportProviderOption[];
  selectedConnectorPermission?: ConnectorPermission | undefined;
  activeProviderInstallations: ScannerConnectorInstallation[];
  activeScanRun?: ScanRun | undefined;
  hostedScanBlockedReason?: string | undefined;
  fullHostedScanBlockedReason?: string | undefined;
  scheduleBlockedReason?: string | undefined;
  scanSourceForm: ScanSourceForm;
  setScanSourceForm: Dispatch<SetStateAction<ScanSourceForm>>;
  providerSourceForm: ProviderSourceForm;
  setProviderSourceForm: Dispatch<SetStateAction<ProviderSourceForm>>;
  hostedScanForm: HostedScanForm;
  setHostedScanForm: Dispatch<SetStateAction<HostedScanForm>>;
  scheduleForm: ScannerScheduleForm;
  setScheduleForm: Dispatch<SetStateAction<ScannerScheduleForm>>;
  scannerUploadForm: ScannerUploadForm;
  setScannerUploadForm: Dispatch<SetStateAction<ScannerUploadForm>>;
  externalImportForm: ExternalImportForm;
  setExternalImportForm: Dispatch<SetStateAction<ExternalImportForm>>;
  ciTemplateType: CiTemplateResponse['type'];
  setCiTemplateType: Dispatch<SetStateAction<CiTemplateResponse['type']>>;
  ciTemplate: CiTemplateResponse | null;
  isCreatingSource: boolean;
  isRequestingConnectorInstall: boolean;
  isCreatingProviderSource: boolean;
  isStartingHostedScan: boolean;
  isStartingFullHostedScan: boolean;
  isCancelingScan: boolean;
  isCreatingSchedule: boolean;
  isUploadingEvidence: boolean;
  isImportingExternalEvidence: boolean;
  isFetchingCiTemplate: boolean;
  onCreateScanSource: () => void;
  onRequestConnectorInstall: (provider: 'github' | 'gitlab') => void;
  onCreateProviderSource: () => void;
  onStartHostedScan: () => void;
  onStartFullHostedScan: () => void;
  onCancelScan: (runId: string) => void;
  onCreateSchedule: () => void;
  onUploadScannerEvidence: () => void;
  onImportExternalEvidence: () => void;
  onFetchCiTemplate: () => void;
  defaultToolsForDepth: (depth: ScanRun['depth']) => string[];
}

function OperationAccordion({
  title,
  eyebrow,
  detail,
  accent,
  defaultExpanded,
  children,
}: {
  title: string;
  eyebrow: string;
  detail: string;
  accent: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}) {
  return (
    <Accordion
      defaultExpanded={Boolean(defaultExpanded)}
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: `${accent}38`,
        borderRadius: 1,
        bgcolor: '#fff',
        '&:before': { display: 'none' },
        '& + &': { mt: 1 },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreOutlined />} sx={{ px: 1.5, minHeight: 72 }}>
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ width: '100%' }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              bgcolor: `${accent}14`,
              color: accent,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 950,
              flexShrink: 0,
              mt: 0.25,
            }}
          >
            {eyebrow}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35, lineHeight: 1.45 }}>
              {detail}
            </Typography>
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

export default function OwnerScannerProofOperationsPanel({
  selectedProduct,
  selectedWorkspace,
  milestones,
  scannerSources,
  scanToolOptions,
  externalImportProviders,
  selectedConnectorPermission,
  activeProviderInstallations,
  activeScanRun,
  hostedScanBlockedReason,
  fullHostedScanBlockedReason,
  scheduleBlockedReason,
  scanSourceForm,
  setScanSourceForm,
  providerSourceForm,
  setProviderSourceForm,
  hostedScanForm,
  setHostedScanForm,
  scheduleForm,
  setScheduleForm,
  scannerUploadForm,
  setScannerUploadForm,
  externalImportForm,
  setExternalImportForm,
  ciTemplateType,
  setCiTemplateType,
  ciTemplate,
  isCreatingSource,
  isRequestingConnectorInstall,
  isCreatingProviderSource,
  isStartingHostedScan,
  isStartingFullHostedScan,
  isCancelingScan,
  isCreatingSchedule,
  isUploadingEvidence,
  isImportingExternalEvidence,
  isFetchingCiTemplate,
  onCreateScanSource,
  onRequestConnectorInstall,
  onCreateProviderSource,
  onStartHostedScan,
  onStartFullHostedScan,
  onCancelScan,
  onCreateSchedule,
  onUploadScannerEvidence,
  onImportExternalEvidence,
  onFetchCiTemplate,
  defaultToolsForDepth,
}: OwnerScannerProofOperationsPanelProps) {
  return (
    <Box id="scanner-operations" sx={{ scrollMarginTop: 96 }}>
      <SectionTitle
        title="Proof Operations"
        action={<PastelChip label="Owner workflow" accent={appleColors.cyan} bg="#e4f9fd" />}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, lineHeight: 1.6 }}>
        Use this area to prepare a trusted source, run or schedule proof, and attach evidence the team already has. Tool details stay available, but the decision path stays centered on launch proof.
      </Typography>

      <OperationAccordion
        title="Prepare proof source"
        eyebrow="1"
        detail="Connect the repository, runtime, CI export, or external scanner source that is authorized for this product."
        accent={appleColors.cyan}
        defaultExpanded
      >
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
                  {selectedConnectorPermission.appConnectorPreferred && <PastelChip label="App Preferred" accent={appleColors.purple} />}
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
                        Connect once, then attach repository sources to this product with an auditable installation record.
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
                      Connect App
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
                        Add Repository Source
                      </Button>
                    </>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 1 }}>
                      No active {formatLabel(scanSourceForm.providerType)} connector is attached yet. Manual source entry still works for public repositories and CI imports.
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
                  I confirm this source is authorized for scanner evidence collection.
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
              Save Source
            </Button>
          </Stack>
        </Box>
      </OperationAccordion>

      <OperationAccordion
        title="Run launch proof"
        eyebrow="2"
        detail="Queue the governed proof checks for the chosen source, or run the full repository, dependency, container, and runtime suite."
        accent={appleColors.blue}
      >
        <Box component="form" onSubmit={(event) => {
          event.preventDefault();
          if (!hostedScanBlockedReason && !activeScanRun) onStartHostedScan();
        }}>
          <Stack spacing={1.25}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography sx={{ fontWeight: 900 }}>Run governed scan</Typography>
              {activeScanRun && <StatusChip label={activeScanRun.status} color={activeScanRun.status === 'RUNNING' ? 'warning' : 'default'} />}
            </Stack>
            <TextField
              select
              size="small"
              label="Evidence source"
              value={hostedScanForm.sourceId}
              onChange={(event) => setHostedScanForm((current) => ({ ...current, sourceId: event.target.value }))}
            >
              <MenuItem value="">Use product repository / target</MenuItem>
              {scannerSources.map((source) => (
                <MenuItem key={source.id} value={source.id}>
                  {source.displayName} · {formatLabel(source.authorizationStatus)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Scan depth"
              value={hostedScanForm.depth}
              onChange={(event) => {
                const depth = event.target.value as ScanRun['depth'];
                setHostedScanForm((current) => ({ ...current, depth, toolKeys: defaultToolsForDepth(depth) }));
              }}
            >
              <MenuItem value="SAFE_STATIC">L1 Safe static</MenuItem>
              <MenuItem value="DEPENDENCY_CONTAINER">L2 Dependency / container</MenuItem>
              <MenuItem value="RUNTIME_BASELINE">L3 Runtime baseline</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Scanner tools"
              value={hostedScanForm.toolKeys}
              SelectProps={{ multiple: true }}
              onChange={(event) => {
                const value = event.target.value;
                setHostedScanForm((current) => ({
                  ...current,
                  toolKeys: typeof value === 'string' ? value.split(',') : value as string[],
                }));
              }}
            >
              {scanToolOptions
                .filter((tool) => tool.depths.includes(hostedScanForm.depth))
                .map((tool) => (
                  <MenuItem key={tool.key} value={tool.key}>{tool.label}</MenuItem>
                ))}
            </TextField>
            {hostedScanForm.depth === 'SAFE_STATIC' && (
              <TextField
                size="small"
                label="Branch"
                value={hostedScanForm.branchRef}
                onChange={(event) => setHostedScanForm((current) => ({ ...current, branchRef: event.target.value }))}
              />
            )}
            {hostedScanForm.depth === 'DEPENDENCY_CONTAINER' && (
              <TextField
                size="small"
                label="Container image"
                placeholder="registry.example.com/app:sha"
                value={hostedScanForm.containerImageRef}
                onChange={(event) => setHostedScanForm((current) => ({ ...current, containerImageRef: event.target.value }))}
              />
            )}
            {hostedScanForm.depth === 'RUNTIME_BASELINE' && (
              <TextField
                size="small"
                label="Runtime URL"
                placeholder={selectedProduct?.productUrl || 'https://staging.example.com'}
                value={hostedScanForm.runtimeTargetUrl}
                onChange={(event) => setHostedScanForm((current) => ({ ...current, runtimeTargetUrl: event.target.value }))}
              />
            )}
            <TextField
              size="small"
              label="Audit reason"
              value={hostedScanForm.reason}
              onChange={(event) => setHostedScanForm((current) => ({ ...current, reason: event.target.value }))}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={hostedScanForm.authorizationConfirmed}
                  onChange={(event) => setHostedScanForm((current) => ({ ...current, authorizationConfirmed: event.target.checked }))}
                />
              }
              label={<Typography variant="body2" color="text.secondary">I am authorized to run selected scanners on this source.</Typography>}
            />
            {hostedScanForm.depth === 'RUNTIME_BASELINE' && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hostedScanForm.runtimeAuthorizationConfirmed}
                    onChange={(event) => setHostedScanForm((current) => ({ ...current, runtimeAuthorizationConfirmed: event.target.checked }))}
                  />
                }
                label={<Typography variant="body2" color="text.secondary">I confirm the runtime URL/domain is authorized for baseline scanning.</Typography>}
              />
            )}
            {hostedScanBlockedReason && <Alert severity="info" sx={{ borderRadius: 1 }}>{hostedScanBlockedReason}</Alert>}
            {fullHostedScanBlockedReason && fullHostedScanBlockedReason !== hostedScanBlockedReason && (
              <Alert severity="info" sx={{ borderRadius: 1 }}>Full suite: {fullHostedScanBlockedReason}</Alert>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<PlayArrowOutlined />}
                disabled={!!hostedScanBlockedReason || !!activeScanRun || isStartingHostedScan}
                sx={{ minHeight: 44, flex: 1 }}
              >
                Start Scan
              </Button>
              <Tooltip title={fullHostedScanBlockedReason || 'Queue every configured scanner across repository, image, and runtime targets.'}>
                <span style={{ flex: 1 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<ShieldOutlined />}
                    disabled={!!fullHostedScanBlockedReason || !!activeScanRun || isStartingFullHostedScan}
                    onClick={onStartFullHostedScan}
                    sx={{ minHeight: 44, width: '100%' }}
                  >
                    Run Full Suite
                  </Button>
                </span>
              </Tooltip>
              {activeScanRun && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelOutlined />}
                  disabled={isCancelingScan}
                  onClick={() => onCancelScan(activeScanRun.id)}
                  sx={{ minHeight: 44, flex: 1 }}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      </OperationAccordion>

      <OperationAccordion
        title="Attach proof already collected"
        eyebrow="3"
        detail="Normalize CI scanner output or import external security results without making the owner read raw artifacts first."
        accent={appleColors.purple}
      >
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
      </OperationAccordion>

      <OperationAccordion
        title="Automate proof refresh"
        eyebrow="4"
        detail="Set a refresh cadence or generate a CI template so the latest proof stays current after each product change."
        accent={appleColors.amber}
      >
        <Stack spacing={1.75}>
          <Box component="form" onSubmit={(event) => {
            event.preventDefault();
            if (!scheduleBlockedReason) onCreateSchedule();
          }}>
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography sx={{ fontWeight: 900 }}>Schedule evidence refresh</Typography>
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
                label="Schedule reason"
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
                Create Schedule
              </Button>
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Stack spacing={1.25}>
              <Typography sx={{ fontWeight: 900 }}>Customer-owned CI template</Typography>
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
                      Uses `{ciTemplate.tokenEnvironmentVariable}` and uploads to ProdUS.
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
      </OperationAccordion>
    </Box>
  );
}
