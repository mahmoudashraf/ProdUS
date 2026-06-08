'use client';

import { buildOwnerWorkspaceScannerDerivedState } from './ownerWorkspaceScannerDerivedState';
import { useOwnerWorkspaceScannerForms } from './useOwnerWorkspaceScannerForms';
import { useOwnerWorkspaceScannerMutations } from './useOwnerWorkspaceScannerMutations';
import type { ScannerEvidenceFilter } from './scannerProofOperationsTypes';
import type {
  ConnectorPermission,
  ProductProfile,
  ProductScannerSummary,
  ProjectWorkspace,
  ScannerConnectorInstallation,
} from './types';

interface OwnerWorkspaceScannerOperationsInput {
  connectorPermissions: ConnectorPermission[];
  evidenceFilter: ScannerEvidenceFilter;
  scannerConnectors: ScannerConnectorInstallation[];
  scannerSummary: ProductScannerSummary | undefined;
  selectedProduct: ProductProfile | undefined;
  selectedWorkspace: ProjectWorkspace | undefined;
  setCartNotice: (notice: string) => void;
}

export function useOwnerWorkspaceScannerOperations({
  connectorPermissions,
  evidenceFilter,
  scannerConnectors,
  scannerSummary,
  selectedProduct,
  selectedWorkspace,
  setCartNotice,
}: OwnerWorkspaceScannerOperationsInput) {
  const {
    ciTemplate,
    ciTemplateType,
    deleteArtifactsOnDisconnect,
    externalImportForm,
    hostedScanForm,
    providerSourceForm,
    scheduleForm,
    scannerUploadForm,
    scanSourceForm,
    setCiTemplate,
    setCiTemplateType,
    setDeleteArtifactsOnDisconnect,
    setExternalImportForm,
    setHostedScanForm,
    setProviderSourceForm,
    setScheduleForm,
    setScannerUploadForm,
    setScanSourceForm,
  } = useOwnerWorkspaceScannerForms(scannerSummary);
  const {
    activeProviderInstallations,
    activeScanRun,
    filteredScannerEvidence,
    fullHostedScanBlockedReason,
    hostedScanBlockedReason,
    scheduleBlockedReason,
    selectedConnectorPermission,
    selectedScanSource,
  } = buildOwnerWorkspaceScannerDerivedState({
    connectorPermissions,
    evidenceFilter,
    hostedScanForm,
    scanSourceForm,
    scannerConnectors,
    scannerSummary,
    scheduleForm,
    selectedProduct,
  });
  const mutations = useOwnerWorkspaceScannerMutations({
    activeProviderInstallations,
    ciTemplateType,
    deleteArtifactsOnDisconnect,
    externalImportForm,
    hostedScanForm,
    providerSourceForm,
    scheduleForm,
    scannerUploadForm,
    scanSourceForm,
    selectedProduct,
    selectedWorkspace,
    setCartNotice,
    setCiTemplate,
    setDeleteArtifactsOnDisconnect,
    setExternalImportForm,
    setHostedScanForm,
    setProviderSourceForm,
    setScannerUploadForm,
    setScanSourceForm,
  });

  return {
    activeProviderInstallations,
    activeScanRun,
    ciTemplate,
    ciTemplateType,
    deleteArtifactsOnDisconnect,
    externalImportForm,
    filteredScannerEvidence,
    fullHostedScanBlockedReason,
    hostedScanBlockedReason,
    hostedScanForm,
    providerSourceForm,
    scheduleBlockedReason,
    scheduleForm,
    scannerUploadForm,
    scanSourceForm,
    selectedConnectorPermission,
    selectedScanSource,
    setCiTemplateType,
    setDeleteArtifactsOnDisconnect,
    setExternalImportForm,
    setHostedScanForm,
    setProviderSourceForm,
    setScheduleForm,
    setScannerUploadForm,
    setScanSourceForm,
    ...mutations,
  };
}
