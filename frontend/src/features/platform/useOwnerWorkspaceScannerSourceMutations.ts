'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postJson } from './api';
import type {
  DisconnectSourcePayload,
  ProviderSourcePayload,
  ScanSourcePayload,
} from './ownerProductizationWorkspaceConfig';
import {
  buildProviderSourcePayload,
  buildScanSourcePayload,
  providerSourceProvider,
} from './ownerWorkspaceScannerPayloads';
import type { OwnerWorkspaceScannerMutationsInput } from './ownerWorkspaceScannerMutationTypes';
import type {
  ConnectorInstallUrlResponse,
  ScanSource,
} from './types';

type ScannerSourceMutationInput = Pick<
  OwnerWorkspaceScannerMutationsInput,
  | 'activeProviderInstallations'
  | 'deleteArtifactsOnDisconnect'
  | 'providerSourceForm'
  | 'scanSourceForm'
  | 'selectedProduct'
  | 'selectedWorkspace'
  | 'setDeleteArtifactsOnDisconnect'
  | 'setHostedScanForm'
  | 'setProviderSourceForm'
  | 'setScannerUploadForm'
  | 'setScanSourceForm'
>;

export function useOwnerWorkspaceScannerSourceMutations({
  activeProviderInstallations,
  deleteArtifactsOnDisconnect,
  providerSourceForm,
  scanSourceForm,
  selectedProduct,
  selectedWorkspace,
  setDeleteArtifactsOnDisconnect,
  setHostedScanForm,
  setProviderSourceForm,
  setScannerUploadForm,
  setScanSourceForm,
}: ScannerSourceMutationInput) {
  const queryClient = useQueryClient();

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

  return {
    createProviderSource,
    createScanSource,
    disconnectScanSource,
    requestConnectorInstall,
  };
}
