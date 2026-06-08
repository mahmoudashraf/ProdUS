'use client';

import { useEffect, useState } from 'react';
import {
  ScannerUploadPayload,
  defaultToolsForDepth,
} from './ownerProductizationWorkspaceConfig';
import type {
  ExternalImportForm,
  HostedScanForm,
  ProviderSourceForm,
  ScannerScheduleForm,
  ScannerUploadForm,
  ScanSourceForm,
} from './scannerProofOperationsTypes';
import type {
  CiTemplateResponse,
  ProductScannerSummary,
} from './types';

export function useOwnerWorkspaceScannerForms(scannerSummary: ProductScannerSummary | undefined) {
  const [scanSourceForm, setScanSourceForm] = useState<ScanSourceForm>({
    providerType: 'GITHUB',
    displayName: 'GitHub Security Pipeline',
    externalReference: '',
    authorizationConfirmed: false,
    scopeNote: 'CI and security evidence imported for production readiness review.',
  });
  const [providerSourceForm, setProviderSourceForm] = useState<ProviderSourceForm>({
    installationId: '',
    repositoryFullName: '',
    cloneUrl: '',
    defaultBranch: 'main',
  });
  const [hostedScanForm, setHostedScanForm] = useState<HostedScanForm>({
    sourceId: '',
    depth: 'SAFE_STATIC',
    toolKeys: defaultToolsForDepth('SAFE_STATIC'),
    branchRef: 'main',
    runtimeTargetUrl: '',
    containerImageRef: '',
    authorizationConfirmed: false,
    runtimeAuthorizationConfirmed: false,
    reason: 'Owner authorized scanner execution for productization readiness.',
  });
  const [scannerUploadForm, setScannerUploadForm] = useState<ScannerUploadForm>({
    sourceId: '',
    toolName: 'CodeQL',
    toolVersion: '',
    format: 'SARIF' as ScannerUploadPayload['format'],
    artifactFileName: 'scanner-results.sarif',
    artifactPayload: '',
    milestoneId: '',
  });
  const [externalImportForm, setExternalImportForm] = useState<ExternalImportForm>({
    sourceId: '',
    provider: 'GITHUB_CODE_SCANNING',
    importMethod: 'MANUAL_API_IMPORT',
    toolName: 'GitHub Code Scanning',
    toolVersion: '',
    format: 'JSON',
    artifactFileName: 'github-code-scanning-alerts.json',
    artifactPayload: '',
    externalReference: '',
    milestoneId: '',
    scopeNote: 'Customer-owned scanner evidence imported without source code upload.',
  });
  const [ciTemplateType, setCiTemplateType] = useState<CiTemplateResponse['type']>('GITHUB_ACTIONS');
  const [ciTemplate, setCiTemplate] = useState<CiTemplateResponse | null>(null);
  const [deleteArtifactsOnDisconnect, setDeleteArtifactsOnDisconnect] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<ScannerScheduleForm>({
    intervalDays: '7',
    nextRunAt: '',
    reason: 'Scheduled evidence refresh for productization readiness.',
  });

  useEffect(() => {
    if (!scannerUploadForm.sourceId && scannerSummary?.sources[0]?.id) {
      setScannerUploadForm((current) => ({ ...current, sourceId: scannerSummary?.sources[0]?.id || '' }));
    }
    if (!hostedScanForm.sourceId && scannerSummary?.sources[0]?.id) {
      setHostedScanForm((current) => ({ ...current, sourceId: scannerSummary?.sources[0]?.id || '' }));
    }
    if (!externalImportForm.sourceId && scannerSummary?.sources[0]?.id) {
      setExternalImportForm((current) => ({ ...current, sourceId: scannerSummary?.sources[0]?.id || '' }));
    }
  }, [scannerSummary?.sources, scannerUploadForm.sourceId, hostedScanForm.sourceId, externalImportForm.sourceId]);

  return {
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
  };
}
