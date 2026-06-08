import type {
  ExternalImportPayload,
  FullHostedScanPayload,
  HostedScanPayload,
  ProviderSourcePayload,
  ScanSourcePayload,
  ScannerSchedulePayload,
  ScannerUploadPayload,
} from './ownerProductizationWorkspaceConfig';
import type {
  ExternalImportForm,
  HostedScanForm,
  ProviderSourceForm,
  ScannerScheduleForm,
  ScannerUploadForm,
  ScanSourceForm,
} from './scannerProofOperationsTypes';
import type { ProductProfile, ProjectWorkspace, ScannerConnectorInstallation } from './types';

interface ScannerPayloadScope {
  selectedProduct: ProductProfile | undefined;
  selectedWorkspace: ProjectWorkspace | undefined;
}

const productId = ({ selectedProduct }: ScannerPayloadScope) => selectedProduct?.id || '';

const withWorkspace = <TPayload extends object>(
  payload: TPayload,
  { selectedWorkspace }: ScannerPayloadScope
): TPayload & { workspaceId?: string } => (
  selectedWorkspace?.id ? { ...payload, workspaceId: selectedWorkspace.id } : payload
);

export function buildScanSourcePayload({
  scanSourceForm,
  selectedProduct,
  selectedWorkspace,
}: ScannerPayloadScope & {
  scanSourceForm: ScanSourceForm;
}): ScanSourcePayload {
  return withWorkspace({
    productId: selectedProduct?.id || '',
    providerType: scanSourceForm.providerType,
    displayName: scanSourceForm.displayName,
    externalReference: scanSourceForm.externalReference,
    authorizationStatus: scanSourceForm.providerType === 'CI_UPLOAD' || scanSourceForm.authorizationConfirmed ? 'AUTHORIZED' : 'PENDING',
    scopeNote: scanSourceForm.scopeNote,
  }, { selectedProduct, selectedWorkspace });
}

export function providerSourceProvider(scanSourceForm: ScanSourceForm) {
  return scanSourceForm.providerType === 'GITLAB' ? 'gitlab' : 'github';
}

export function buildProviderSourcePayload({
  activeProviderInstallations,
  providerSourceForm,
  scanSourceForm,
  selectedProduct,
  selectedWorkspace,
}: ScannerPayloadScope & {
  activeProviderInstallations: ScannerConnectorInstallation[];
  providerSourceForm: ProviderSourceForm;
  scanSourceForm: ScanSourceForm;
}): ProviderSourcePayload {
  const payload: ProviderSourcePayload = withWorkspace({
    installationId: providerSourceForm.installationId || activeProviderInstallations[0]?.id || '',
    productId: selectedProduct?.id || '',
    repositoryFullName: providerSourceForm.repositoryFullName.trim(),
    defaultBranch: providerSourceForm.defaultBranch.trim() || 'main',
    displayName: scanSourceForm.displayName || providerSourceForm.repositoryFullName,
  }, { selectedProduct, selectedWorkspace });
  if (providerSourceForm.cloneUrl.trim()) payload.cloneUrl = providerSourceForm.cloneUrl.trim();
  return payload;
}

export function buildScannerUploadPayload({
  scannerUploadForm,
  selectedProduct,
  selectedWorkspace,
}: ScannerPayloadScope & {
  scannerUploadForm: ScannerUploadForm;
}): ScannerUploadPayload {
  const payload: ScannerUploadPayload = withWorkspace({
    productId: productId({ selectedProduct, selectedWorkspace }),
    toolName: scannerUploadForm.toolName,
    toolVersion: scannerUploadForm.toolVersion,
    format: scannerUploadForm.format,
    artifactFileName: scannerUploadForm.artifactFileName,
    artifactPayload: scannerUploadForm.artifactPayload,
  }, { selectedProduct, selectedWorkspace });
  if (scannerUploadForm.sourceId) payload.sourceId = scannerUploadForm.sourceId;
  if (scannerUploadForm.milestoneId) payload.milestoneId = scannerUploadForm.milestoneId;
  return payload;
}

export function buildExternalImportPayload({
  externalImportForm,
  selectedProduct,
  selectedWorkspace,
}: ScannerPayloadScope & {
  externalImportForm: ExternalImportForm;
}): ExternalImportPayload {
  const payload: ExternalImportPayload = withWorkspace({
    productId: productId({ selectedProduct, selectedWorkspace }),
    provider: externalImportForm.provider,
    importMethod: externalImportForm.importMethod,
    toolName: externalImportForm.toolName,
    format: externalImportForm.format,
    artifactPayload: externalImportForm.artifactPayload,
  }, { selectedProduct, selectedWorkspace });
  if (externalImportForm.sourceId) payload.sourceId = externalImportForm.sourceId;
  if (externalImportForm.milestoneId) payload.milestoneId = externalImportForm.milestoneId;
  if (externalImportForm.toolVersion) payload.toolVersion = externalImportForm.toolVersion;
  if (externalImportForm.artifactFileName) payload.artifactFileName = externalImportForm.artifactFileName;
  if (externalImportForm.externalReference) payload.externalReference = externalImportForm.externalReference;
  if (externalImportForm.scopeNote) payload.scopeNote = externalImportForm.scopeNote;
  return payload;
}

export function buildHostedScanPayload({
  hostedScanForm,
  selectedProduct,
  selectedWorkspace,
}: ScannerPayloadScope & {
  hostedScanForm: HostedScanForm;
}): HostedScanPayload {
  const payload: HostedScanPayload = withWorkspace({
    productId: productId({ selectedProduct, selectedWorkspace }),
    depth: hostedScanForm.depth,
    toolKeys: hostedScanForm.toolKeys,
    authorizationConfirmed: hostedScanForm.authorizationConfirmed,
    runtimeAuthorizationConfirmed: hostedScanForm.depth === 'RUNTIME_BASELINE' ? hostedScanForm.runtimeAuthorizationConfirmed : false,
    reason: hostedScanForm.reason,
  }, { selectedProduct, selectedWorkspace });
  if (hostedScanForm.sourceId) payload.sourceId = hostedScanForm.sourceId;
  if (hostedScanForm.branchRef.trim()) payload.branchRef = hostedScanForm.branchRef.trim();
  if (hostedScanForm.runtimeTargetUrl.trim()) payload.runtimeTargetUrl = hostedScanForm.runtimeTargetUrl.trim();
  if (hostedScanForm.containerImageRef.trim()) payload.containerImageRef = hostedScanForm.containerImageRef.trim();
  return payload;
}

export function buildFullHostedScanPayload({
  hostedScanForm,
  selectedProduct,
  selectedWorkspace,
}: ScannerPayloadScope & {
  hostedScanForm: HostedScanForm;
}): FullHostedScanPayload {
  const payload: FullHostedScanPayload = withWorkspace({
    productId: productId({ selectedProduct, selectedWorkspace }),
    authorizationConfirmed: hostedScanForm.authorizationConfirmed,
    runtimeAuthorizationConfirmed: hostedScanForm.runtimeAuthorizationConfirmed,
    reason: hostedScanForm.reason,
  }, { selectedProduct, selectedWorkspace });
  if (hostedScanForm.sourceId) payload.sourceId = hostedScanForm.sourceId;
  if (hostedScanForm.branchRef.trim()) payload.branchRef = hostedScanForm.branchRef.trim();
  if (hostedScanForm.runtimeTargetUrl.trim()) payload.runtimeTargetUrl = hostedScanForm.runtimeTargetUrl.trim();
  if (hostedScanForm.containerImageRef.trim()) payload.containerImageRef = hostedScanForm.containerImageRef.trim();
  return payload;
}

export function buildScannerSchedulePayload({
  hostedScanForm,
  scheduleForm,
  selectedProduct,
  selectedWorkspace,
}: ScannerPayloadScope & {
  hostedScanForm: HostedScanForm;
  scheduleForm: ScannerScheduleForm;
}): ScannerSchedulePayload {
  const intervalDays = Number.parseInt(scheduleForm.intervalDays, 10);
  const payload: ScannerSchedulePayload = withWorkspace({
    productId: productId({ selectedProduct, selectedWorkspace }),
    sourceId: hostedScanForm.sourceId,
    depth: hostedScanForm.depth,
    toolKeys: hostedScanForm.toolKeys,
    intervalDays: Number.isFinite(intervalDays) ? intervalDays : 7,
    reason: scheduleForm.reason,
    active: true,
  }, { selectedProduct, selectedWorkspace });
  if (hostedScanForm.branchRef.trim()) payload.branchRef = hostedScanForm.branchRef.trim();
  if (hostedScanForm.runtimeTargetUrl.trim()) payload.runtimeTargetUrl = hostedScanForm.runtimeTargetUrl.trim();
  if (hostedScanForm.containerImageRef.trim()) payload.containerImageRef = hostedScanForm.containerImageRef.trim();
  if (scheduleForm.nextRunAt) payload.nextRunAt = scheduleForm.nextRunAt;
  return payload;
}
