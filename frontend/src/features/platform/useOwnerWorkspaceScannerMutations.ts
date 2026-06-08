'use client';

import { useOwnerWorkspaceScannerEvidenceMutations } from './useOwnerWorkspaceScannerEvidenceMutations';
import { useOwnerWorkspaceScannerRunMutations } from './useOwnerWorkspaceScannerRunMutations';
import { useOwnerWorkspaceScannerSourceMutations } from './useOwnerWorkspaceScannerSourceMutations';
import type { OwnerWorkspaceScannerMutationsInput } from './ownerWorkspaceScannerMutationTypes';

export function useOwnerWorkspaceScannerMutations(input: OwnerWorkspaceScannerMutationsInput) {
  const source = useOwnerWorkspaceScannerSourceMutations(input);
  const run = useOwnerWorkspaceScannerRunMutations(input);
  const evidence = useOwnerWorkspaceScannerEvidenceMutations(input);

  const scannerOperationError = source.createScanSource.error
    || source.requestConnectorInstall.error
    || source.createProviderSource.error
    || evidence.uploadScannerEvidence.error
    || evidence.importExternalEvidence.error
    || run.fetchCiTemplate.error
    || source.disconnectScanSource.error
    || run.startHostedScan.error
    || run.startFullHostedScan.error
    || run.cancelScannerRun.error
    || run.rescanRun.error
    || run.createScannerSchedule.error
    || run.updateScannerSchedule.error
    || evidence.updateFindingStatus.error
    || evidence.openSignedEvidence.error
    || evidence.createEvidenceExport.error;

  const scannerOperationBusy = source.createProviderSource.isPending
    || source.requestConnectorInstall.isPending
    || evidence.uploadScannerEvidence.isPending
    || evidence.importExternalEvidence.isPending
    || run.fetchCiTemplate.isPending
    || source.disconnectScanSource.isPending
    || run.startHostedScan.isPending
    || run.startFullHostedScan.isPending
    || run.cancelScannerRun.isPending
    || run.rescanRun.isPending
    || run.createScannerSchedule.isPending
    || run.updateScannerSchedule.isPending
    || evidence.updateFindingStatus.isPending
    || evidence.openSignedEvidence.isPending
    || evidence.createEvidenceExport.isPending;

  return {
    ...source,
    ...run,
    ...evidence,
    scannerOperationBusy,
    scannerOperationError,
  };
}
