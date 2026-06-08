import { Dispatch, SetStateAction } from 'react';
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

export type ScannerArtifactFormat = 'SARIF' | 'JSON' | 'JUNIT' | 'LOG';
export type ScannerEvidenceFilter = 'ALL' | 'FINDINGS' | 'MILESTONES' | 'REDACTED';
export type ExternalImportMethod = 'MANUAL_API_IMPORT' | 'CI_TEMPLATE' | 'WEBHOOK' | 'CONNECTOR_SYNC';

export interface ScanToolOption {
  key: string;
  label: string;
  depths: readonly string[];
}

export interface ExternalImportProviderOption {
  value: ExternalImportProvider;
  label: string;
  toolName: string;
  format: ScannerArtifactFormat;
}

export interface ScanSourceForm {
  providerType: ScanSource['providerType'];
  displayName: string;
  externalReference: string;
  authorizationConfirmed: boolean;
  scopeNote: string;
}

export interface ProviderSourceForm {
  installationId: string;
  repositoryFullName: string;
  cloneUrl: string;
  defaultBranch: string;
}

export interface HostedScanForm {
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

export interface ScannerUploadForm {
  sourceId: string;
  toolName: string;
  toolVersion: string;
  format: ScannerArtifactFormat;
  artifactFileName: string;
  artifactPayload: string;
  milestoneId: string;
}

export interface ExternalImportForm {
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

export interface ScannerScheduleForm {
  intervalDays: string;
  nextRunAt: string;
  reason: string;
}

export interface ScannerProofSourcePanelProps {
  selectedProduct?: ProductProfile;
  selectedConnectorPermission?: ConnectorPermission | undefined;
  activeProviderInstallations: ScannerConnectorInstallation[];
  scanSourceForm: ScanSourceForm;
  setScanSourceForm: Dispatch<SetStateAction<ScanSourceForm>>;
  providerSourceForm: ProviderSourceForm;
  setProviderSourceForm: Dispatch<SetStateAction<ProviderSourceForm>>;
  isCreatingSource: boolean;
  isRequestingConnectorInstall: boolean;
  isCreatingProviderSource: boolean;
  onCreateScanSource: () => void;
  onRequestConnectorInstall: (provider: 'github' | 'gitlab') => void;
  onCreateProviderSource: () => void;
}

export interface ScannerProofRunPanelProps {
  selectedProduct?: ProductProfile;
  scannerSources: ScanSource[];
  scanToolOptions: readonly ScanToolOption[];
  activeScanRun?: ScanRun | undefined;
  hostedScanBlockedReason?: string | undefined;
  fullHostedScanBlockedReason?: string | undefined;
  hostedScanForm: HostedScanForm;
  setHostedScanForm: Dispatch<SetStateAction<HostedScanForm>>;
  isStartingHostedScan: boolean;
  isStartingFullHostedScan: boolean;
  isCancelingScan: boolean;
  onStartHostedScan: () => void;
  onStartFullHostedScan: () => void;
  onCancelScan: (runId: string) => void;
  defaultToolsForDepth: (depth: ScanRun['depth']) => string[];
}

export interface ScannerProofAttachPanelProps {
  selectedProduct?: ProductProfile;
  selectedWorkspace?: ProjectWorkspace | undefined;
  milestones: Milestone[];
  scannerSources: ScanSource[];
  externalImportProviders: ExternalImportProviderOption[];
  scannerUploadForm: ScannerUploadForm;
  setScannerUploadForm: Dispatch<SetStateAction<ScannerUploadForm>>;
  externalImportForm: ExternalImportForm;
  setExternalImportForm: Dispatch<SetStateAction<ExternalImportForm>>;
  isUploadingEvidence: boolean;
  isImportingExternalEvidence: boolean;
  onUploadScannerEvidence: () => void;
  onImportExternalEvidence: () => void;
}

export interface ScannerProofAutomationPanelProps {
  selectedProduct?: ProductProfile;
  scheduleBlockedReason?: string | undefined;
  scheduleForm: ScannerScheduleForm;
  setScheduleForm: Dispatch<SetStateAction<ScannerScheduleForm>>;
  ciTemplateType: CiTemplateResponse['type'];
  setCiTemplateType: Dispatch<SetStateAction<CiTemplateResponse['type']>>;
  ciTemplate: CiTemplateResponse | null;
  isCreatingSchedule: boolean;
  isFetchingCiTemplate: boolean;
  onCreateSchedule: () => void;
  onFetchCiTemplate: () => void;
}
