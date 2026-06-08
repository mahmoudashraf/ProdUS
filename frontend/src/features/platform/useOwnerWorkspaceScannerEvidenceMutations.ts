'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getJson, patchJson, postJson } from './api';
import type {
  FindingStatusPayload,
  ScannerUploadPayload,
} from './ownerProductizationWorkspaceConfig';
import {
  buildExternalImportPayload,
  buildScannerUploadPayload,
} from './ownerWorkspaceScannerPayloads';
import type { OwnerWorkspaceScannerMutationsInput } from './ownerWorkspaceScannerMutationTypes';
import type {
  EvidenceExportBundle,
  NormalizedFinding,
  ScanRun,
  ScannerEvidenceItem,
  SignedArtifactResponse,
} from './types';

type ScannerEvidenceMutationInput = Pick<
  OwnerWorkspaceScannerMutationsInput,
  | 'externalImportForm'
  | 'scannerUploadForm'
  | 'selectedProduct'
  | 'selectedWorkspace'
  | 'setExternalImportForm'
>;

export function useOwnerWorkspaceScannerEvidenceMutations({
  externalImportForm,
  scannerUploadForm,
  selectedProduct,
  selectedWorkspace,
  setExternalImportForm,
}: ScannerEvidenceMutationInput) {
  const queryClient = useQueryClient();

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

  return {
    createEvidenceExport,
    importExternalEvidence,
    openEvidenceArtifact,
    openSignedEvidence,
    updateFindingStatus,
    uploadScannerEvidence,
  };
}
