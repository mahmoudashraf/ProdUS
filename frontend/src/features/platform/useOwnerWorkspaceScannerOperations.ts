'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getJson, patchJson, postJson } from './api';
import {
  DisconnectSourcePayload,
  FindingStatusPayload,
  FullHostedScanPayload,
  HostedScanPayload,
  ProviderSourcePayload,
  ScanSourcePayload,
  ScannerUploadPayload,
} from './ownerProductizationWorkspaceConfig';
import { buildOwnerWorkspaceScannerDerivedState } from './ownerWorkspaceScannerDerivedState';
import {
  buildExternalImportPayload,
  buildFullHostedScanPayload,
  buildHostedScanPayload,
  buildProviderSourcePayload,
  buildScannerSchedulePayload,
  buildScannerUploadPayload,
  buildScanSourcePayload,
  providerSourceProvider,
} from './ownerWorkspaceScannerPayloads';
import { useOwnerWorkspaceScannerForms } from './useOwnerWorkspaceScannerForms';
import type { ScannerEvidenceFilter } from './scannerProofOperationsTypes';
import type {
  CiTemplateResponse,
  ConnectorInstallUrlResponse,
  ConnectorPermission,
  EvidenceExportBundle,
  FullHostedScanResponse,
  NormalizedFinding,
  ProductProfile,
  ProductScannerSummary,
  ProjectWorkspace,
  ScanRun,
  ScannerConnectorInstallation,
  ScannerEvidenceItem,
  ScanSource,
  SignedArtifactResponse,
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
  const queryClient = useQueryClient();
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

  const createScanSource = useMutation({
    mutationFn: () =>
      postJson<ScanSource, ScanSourcePayload>('/scanner/sources', buildScanSourcePayload({
        scanSourceForm,
        selectedProduct,
        selectedWorkspace,
      })),
    onSuccess: async (source) => {
      setScannerUploadForm((current) => ({ ...current, sourceId: source.id }));
      setHostedScanForm((current) => ({ ...current, sourceId: source.id }));
      setScanSourceForm((current) => ({ ...current, externalReference: '', authorizationConfirmed: false }));
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const requestConnectorInstall = useMutation({
    mutationFn: (provider: 'github' | 'gitlab') =>
      postJson<ConnectorInstallUrlResponse, { returnPath: string }>(`/scanner/connectors/${provider}/install-url`, {
        returnPath: typeof window === 'undefined' ? '/owner/productization' : window.location.pathname + window.location.search,
      }),
    onSuccess: (response) => {
      if (response.url) {
        window.location.assign(response.url);
      }
    },
  });
  const createProviderSource = useMutation({
    mutationFn: () => {
      const provider = providerSourceProvider(scanSourceForm);
      return postJson<ScanSource, ProviderSourcePayload>(`/scanner/connectors/${provider}/sources`, buildProviderSourcePayload({
        activeProviderInstallations,
        providerSourceForm,
        scanSourceForm,
        selectedProduct,
        selectedWorkspace,
      }));
    },
    onSuccess: async (source) => {
      setScannerUploadForm((current) => ({ ...current, sourceId: source.id }));
      setHostedScanForm((current) => ({ ...current, sourceId: source.id }));
      setProviderSourceForm((current) => ({ ...current, repositoryFullName: '', cloneUrl: '' }));
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const uploadScannerEvidence = useMutation({
    mutationFn: () =>
      postJson<ScanRun, ScannerUploadPayload>('/scanner/runs/ci-upload', buildScannerUploadPayload({
        scannerUploadForm,
        selectedProduct,
        selectedWorkspace,
      })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'diagnoses'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'ship-confidence'] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
  const importExternalEvidence = useMutation({
    mutationFn: () =>
      postJson('/scanner/imports/external', buildExternalImportPayload({
        externalImportForm,
        selectedProduct,
        selectedWorkspace,
      })),
    onSuccess: async () => {
      setExternalImportForm((current) => ({ ...current, artifactPayload: '', externalReference: '' }));
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'diagnoses'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'ship-confidence'] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
  const fetchCiTemplate = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ productId: selectedProduct?.id || '' });
      if (selectedWorkspace?.id) params.set('workspaceId', selectedWorkspace.id);
      if (scannerUploadForm.sourceId) params.set('sourceId', scannerUploadForm.sourceId);
      return getJson<CiTemplateResponse>(`/scanner/ci-templates/${ciTemplateType}?${params.toString()}`);
    },
    onSuccess: (template) => {
      setCiTemplate(template);
    },
  });
  const disconnectScanSource = useMutation({
    mutationFn: (sourceId: string) => postJson<ScanSource, DisconnectSourcePayload>(`/scanner/sources/${sourceId}/disconnect`, {
      reason: deleteArtifactsOnDisconnect ? 'Owner disconnected source and requested scanner artifact deletion from Studio.' : 'Owner disconnected source from Studio.',
      deleteArtifacts: deleteArtifactsOnDisconnect,
    }),
    onSuccess: async () => {
      setDeleteArtifactsOnDisconnect(false);
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const startHostedScan = useMutation({
    mutationFn: () =>
      postJson<ScanRun, HostedScanPayload>('/scanner/runs/hosted', buildHostedScanPayload({
        hostedScanForm,
        selectedProduct,
        selectedWorkspace,
      })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const startFullHostedScan = useMutation({
    mutationFn: () =>
      postJson<FullHostedScanResponse, FullHostedScanPayload>('/scanner/runs/hosted/full', buildFullHostedScanPayload({
        hostedScanForm,
        selectedProduct,
        selectedWorkspace,
      })),
    onSuccess: async (response) => {
      setCartNotice(`Full scanner suite queued ${response.queuedToolKeys.length} tool${response.queuedToolKeys.length === 1 ? '' : 's'} across ${response.queuedRuns.length} run${response.queuedRuns.length === 1 ? '' : 's'}.`);
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'diagnoses'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'ship-confidence'] });
      await queryClient.invalidateQueries({ queryKey: ['repo-signals', selectedProduct?.id] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
  const cancelScannerRun = useMutation({
    mutationFn: (runId: string) => postJson<ScanRun, { reason: string }>(`/scanner/runs/${runId}/cancel`, { reason: 'Owner canceled scanner run from Studio.' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const rescanRun = useMutation({
    mutationFn: (runId: string) => postJson<ScanRun, { reason: string }>(`/scanner/runs/${runId}/rescan`, { reason: 'Owner requested rescan after remediation or evidence review.' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const createScannerSchedule = useMutation({
    mutationFn: () =>
      postJson('/scanner/schedules', buildScannerSchedulePayload({
        hostedScanForm,
        scheduleForm,
        selectedProduct,
        selectedWorkspace,
      })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const updateScannerSchedule = useMutation({
    mutationFn: ({ scheduleId, active }: { scheduleId: string; active: boolean }) =>
      patchJson(`/scanner/schedules/${scheduleId}`, { active }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const updateFindingStatus = useMutation({
    mutationFn: ({ findingId, payload }: { findingId: string; payload: FindingStatusPayload }) =>
      patchJson<NormalizedFinding, FindingStatusPayload>(`/scanner/findings/${findingId}/status`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const openSignedEvidence = useMutation({
    mutationFn: (evidenceId: string) => getJson<SignedArtifactResponse>(`/scanner/evidence/${evidenceId}/artifact-url`),
    onSuccess: (response) => {
      window.open(response.signedUrl, '_blank', 'noopener,noreferrer');
    },
  });
  const createEvidenceExport = useMutation({
    mutationFn: () => postJson<EvidenceExportBundle, { productId: string; workspaceId?: string }>('/scanner/evidence-exports', {
      productId: selectedProduct?.id || '',
      ...(selectedWorkspace?.id ? { workspaceId: selectedWorkspace.id } : {}),
    }),
    onSuccess: async (bundle) => {
      if (bundle.signedUrl) {
        window.open(bundle.signedUrl, '_blank', 'noopener,noreferrer');
      }
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });

  const openEvidenceArtifact = (evidence: ScannerEvidenceItem) => {
    if (evidence.storageKey) {
      openSignedEvidence.mutate(evidence.id);
      return;
    }
    if (evidence.artifactRef) {
      window.open(evidence.artifactRef, '_blank', 'noopener,noreferrer');
    }
  };

  const scannerOperationError = createScanSource.error
    || requestConnectorInstall.error
    || createProviderSource.error
    || uploadScannerEvidence.error
    || importExternalEvidence.error
    || fetchCiTemplate.error
    || disconnectScanSource.error
    || startHostedScan.error
    || startFullHostedScan.error
    || cancelScannerRun.error
    || rescanRun.error
    || createScannerSchedule.error
    || updateScannerSchedule.error
    || updateFindingStatus.error
    || openSignedEvidence.error
    || createEvidenceExport.error;

  const scannerOperationBusy = createProviderSource.isPending
    || requestConnectorInstall.isPending
    || uploadScannerEvidence.isPending
    || importExternalEvidence.isPending
    || fetchCiTemplate.isPending
    || disconnectScanSource.isPending
    || startHostedScan.isPending
    || startFullHostedScan.isPending
    || cancelScannerRun.isPending
    || rescanRun.isPending
    || createScannerSchedule.isPending
    || updateScannerSchedule.isPending
    || updateFindingStatus.isPending
    || openSignedEvidence.isPending
    || createEvidenceExport.isPending;

  return {
    activeProviderInstallations,
    activeScanRun,
    ciTemplate,
    ciTemplateType,
    createEvidenceExport,
    createProviderSource,
    createScanSource,
    createScannerSchedule,
    deleteArtifactsOnDisconnect,
    disconnectScanSource,
    externalImportForm,
    fetchCiTemplate,
    filteredScannerEvidence,
    fullHostedScanBlockedReason,
    hostedScanBlockedReason,
    hostedScanForm,
    importExternalEvidence,
    openEvidenceArtifact,
    openSignedEvidence,
    providerSourceForm,
    requestConnectorInstall,
    rescanRun,
    scheduleBlockedReason,
    scheduleForm,
    scannerOperationBusy,
    scannerOperationError,
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
    startFullHostedScan,
    startHostedScan,
    updateFindingStatus,
    updateScannerSchedule,
    uploadScannerEvidence,
    cancelScannerRun,
  };
}
