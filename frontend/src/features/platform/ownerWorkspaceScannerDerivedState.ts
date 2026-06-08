import {
  fullHostedScanBlockReason,
  hostedScanBlockReason,
} from './ownerProductizationWorkspaceConfig';
import type {
  HostedScanForm,
  ScannerEvidenceFilter,
  ScannerScheduleForm,
  ScanSourceForm,
} from './scannerProofOperationsTypes';
import type {
  ConnectorPermission,
  ProductProfile,
  ProductScannerSummary,
  ScannerConnectorInstallation,
} from './types';

interface OwnerWorkspaceScannerDerivedStateInput {
  connectorPermissions: ConnectorPermission[];
  evidenceFilter: ScannerEvidenceFilter;
  hostedScanForm: HostedScanForm;
  scanSourceForm: ScanSourceForm;
  scannerConnectors: ScannerConnectorInstallation[];
  scannerSummary: ProductScannerSummary | undefined;
  scheduleForm: ScannerScheduleForm;
  selectedProduct: ProductProfile | undefined;
}

export function buildOwnerWorkspaceScannerDerivedState({
  connectorPermissions,
  evidenceFilter,
  hostedScanForm,
  scanSourceForm,
  scannerConnectors,
  scannerSummary,
  scheduleForm,
  selectedProduct,
}: OwnerWorkspaceScannerDerivedStateInput) {
  const filteredScannerEvidence = (scannerSummary?.evidence || []).filter((item) => {
    if (evidenceFilter === 'FINDINGS') return !!item.findingId;
    if (evidenceFilter === 'MILESTONES') return !!item.milestoneId;
    if (evidenceFilter === 'REDACTED') return item.redactionStatus !== 'NONE';
    return true;
  });
  const activeScanRun = scannerSummary?.recentRuns.find((run) => run.status === 'QUEUED' || run.status === 'RUNNING');
  const selectedScanSource = (scannerSummary?.sources || []).find((source) => source.id === hostedScanForm.sourceId);
  const hostedScanBlockedReason = hostedScanBlockReason(selectedProduct, selectedScanSource, hostedScanForm);
  const fullHostedScanBlockedReason = fullHostedScanBlockReason(selectedProduct, selectedScanSource, hostedScanForm);
  const selectedConnectorPermission = connectorPermissions.find((permission) => permission.providerType === scanSourceForm.providerType);
  const activeProviderInstallations = scannerConnectors.filter(
    (connector) => connector.providerType === scanSourceForm.providerType && connector.status === 'ACTIVE'
  );
  const scheduleInterval = Number.parseInt(scheduleForm.intervalDays, 10);
  const scheduleBlockedReason = !selectedProduct
    ? 'Select a product first.'
    : !hostedScanForm.sourceId || !selectedScanSource
      ? 'Choose an authorized evidence source before scheduling scans.'
      : selectedScanSource.authorizationStatus !== 'AUTHORIZED'
        ? 'Only authorized evidence sources can be scheduled.'
        : !Number.isFinite(scheduleInterval) || scheduleInterval < 1 || scheduleInterval > 90
          ? 'Use a schedule interval between 1 and 90 days.'
          : '';

  return {
    activeProviderInstallations,
    activeScanRun,
    filteredScannerEvidence,
    fullHostedScanBlockedReason,
    hostedScanBlockedReason,
    scheduleBlockedReason,
    selectedConnectorPermission,
    selectedScanSource,
  };
}
