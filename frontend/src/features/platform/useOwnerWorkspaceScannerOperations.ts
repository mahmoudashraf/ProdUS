'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getJson, patchJson, postJson } from './api';
import {
  DisconnectSourcePayload,
  ExternalImportPayload,
  FindingStatusPayload,
  FullHostedScanPayload,
  HostedScanPayload,
  ProviderSourcePayload,
  ScanSourcePayload,
  ScannerSchedulePayload,
  ScannerUploadPayload,
} from './ownerProductizationWorkspaceConfig';
import { buildOwnerWorkspaceScannerDerivedState } from './ownerWorkspaceScannerDerivedState';
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
    mutationFn: () => {
      const payload: ScanSourcePayload = {
        productId: selectedProduct?.id || '',
        providerType: scanSourceForm.providerType,
        displayName: scanSourceForm.displayName,
        externalReference: scanSourceForm.externalReference,
        authorizationStatus: scanSourceForm.providerType === 'CI_UPLOAD' || scanSourceForm.authorizationConfirmed ? 'AUTHORIZED' : 'PENDING',
        scopeNote: scanSourceForm.scopeNote,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      return postJson<ScanSource, ScanSourcePayload>('/scanner/sources', payload);
    },
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
      const provider = scanSourceForm.providerType === 'GITLAB' ? 'gitlab' : 'github';
      const payload: ProviderSourcePayload = {
        installationId: providerSourceForm.installationId || activeProviderInstallations[0]?.id || '',
        productId: selectedProduct?.id || '',
        repositoryFullName: providerSourceForm.repositoryFullName.trim(),
        defaultBranch: providerSourceForm.defaultBranch.trim() || 'main',
        displayName: scanSourceForm.displayName || providerSourceForm.repositoryFullName,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      if (providerSourceForm.cloneUrl.trim()) payload.cloneUrl = providerSourceForm.cloneUrl.trim();
      return postJson<ScanSource, ProviderSourcePayload>(`/scanner/connectors/${provider}/sources`, payload);
    },
    onSuccess: async (source) => {
      setScannerUploadForm((current) => ({ ...current, sourceId: source.id }));
      setHostedScanForm((current) => ({ ...current, sourceId: source.id }));
      setProviderSourceForm((current) => ({ ...current, repositoryFullName: '', cloneUrl: '' }));
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const uploadScannerEvidence = useMutation({
    mutationFn: () => {
      const payload: ScannerUploadPayload = {
        productId: selectedProduct?.id || '',
        toolName: scannerUploadForm.toolName,
        toolVersion: scannerUploadForm.toolVersion,
        format: scannerUploadForm.format,
        artifactFileName: scannerUploadForm.artifactFileName,
        artifactPayload: scannerUploadForm.artifactPayload,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      if (scannerUploadForm.sourceId) payload.sourceId = scannerUploadForm.sourceId;
      if (scannerUploadForm.milestoneId) payload.milestoneId = scannerUploadForm.milestoneId;
      return postJson<ScanRun, ScannerUploadPayload>('/scanner/runs/ci-upload', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'diagnoses'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'ship-confidence'] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
  const importExternalEvidence = useMutation({
    mutationFn: () => {
      const payload: ExternalImportPayload = {
        productId: selectedProduct?.id || '',
        provider: externalImportForm.provider,
        importMethod: externalImportForm.importMethod,
        toolName: externalImportForm.toolName,
        format: externalImportForm.format,
        artifactPayload: externalImportForm.artifactPayload,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      if (externalImportForm.sourceId) payload.sourceId = externalImportForm.sourceId;
      if (externalImportForm.milestoneId) payload.milestoneId = externalImportForm.milestoneId;
      if (externalImportForm.toolVersion) payload.toolVersion = externalImportForm.toolVersion;
      if (externalImportForm.artifactFileName) payload.artifactFileName = externalImportForm.artifactFileName;
      if (externalImportForm.externalReference) payload.externalReference = externalImportForm.externalReference;
      if (externalImportForm.scopeNote) payload.scopeNote = externalImportForm.scopeNote;
      return postJson('/scanner/imports/external', payload);
    },
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
    mutationFn: () => {
      const payload: HostedScanPayload = {
        productId: selectedProduct?.id || '',
        depth: hostedScanForm.depth,
        toolKeys: hostedScanForm.toolKeys,
        authorizationConfirmed: hostedScanForm.authorizationConfirmed,
        runtimeAuthorizationConfirmed: hostedScanForm.depth === 'RUNTIME_BASELINE' ? hostedScanForm.runtimeAuthorizationConfirmed : false,
        reason: hostedScanForm.reason,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      if (hostedScanForm.sourceId) payload.sourceId = hostedScanForm.sourceId;
      if (hostedScanForm.branchRef.trim()) payload.branchRef = hostedScanForm.branchRef.trim();
      if (hostedScanForm.runtimeTargetUrl.trim()) payload.runtimeTargetUrl = hostedScanForm.runtimeTargetUrl.trim();
      if (hostedScanForm.containerImageRef.trim()) payload.containerImageRef = hostedScanForm.containerImageRef.trim();
      return postJson<ScanRun, HostedScanPayload>('/scanner/runs/hosted', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const startFullHostedScan = useMutation({
    mutationFn: () => {
      const payload: FullHostedScanPayload = {
        productId: selectedProduct?.id || '',
        authorizationConfirmed: hostedScanForm.authorizationConfirmed,
        runtimeAuthorizationConfirmed: hostedScanForm.runtimeAuthorizationConfirmed,
        reason: hostedScanForm.reason,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      if (hostedScanForm.sourceId) payload.sourceId = hostedScanForm.sourceId;
      if (hostedScanForm.branchRef.trim()) payload.branchRef = hostedScanForm.branchRef.trim();
      if (hostedScanForm.runtimeTargetUrl.trim()) payload.runtimeTargetUrl = hostedScanForm.runtimeTargetUrl.trim();
      if (hostedScanForm.containerImageRef.trim()) payload.containerImageRef = hostedScanForm.containerImageRef.trim();
      return postJson<FullHostedScanResponse, FullHostedScanPayload>('/scanner/runs/hosted/full', payload);
    },
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
    mutationFn: () => {
      const intervalDays = Number.parseInt(scheduleForm.intervalDays, 10);
      const payload: ScannerSchedulePayload = {
        productId: selectedProduct?.id || '',
        sourceId: hostedScanForm.sourceId,
        depth: hostedScanForm.depth,
        toolKeys: hostedScanForm.toolKeys,
        intervalDays: Number.isFinite(intervalDays) ? intervalDays : 7,
        reason: scheduleForm.reason,
        active: true,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      if (hostedScanForm.branchRef.trim()) payload.branchRef = hostedScanForm.branchRef.trim();
      if (hostedScanForm.runtimeTargetUrl.trim()) payload.runtimeTargetUrl = hostedScanForm.runtimeTargetUrl.trim();
      if (hostedScanForm.containerImageRef.trim()) payload.containerImageRef = hostedScanForm.containerImageRef.trim();
      if (scheduleForm.nextRunAt) payload.nextRunAt = scheduleForm.nextRunAt;
      return postJson('/scanner/schedules', payload);
    },
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
