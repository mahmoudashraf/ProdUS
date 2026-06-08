'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getJson, patchJson, postJson } from './api';
import type {
  FullHostedScanPayload,
  HostedScanPayload,
} from './ownerProductizationWorkspaceConfig';
import {
  buildFullHostedScanPayload,
  buildHostedScanPayload,
  buildScannerSchedulePayload,
} from './ownerWorkspaceScannerPayloads';
import type { OwnerWorkspaceScannerMutationsInput } from './ownerWorkspaceScannerMutationTypes';
import type {
  CiTemplateResponse,
  FullHostedScanResponse,
  ScanRun,
} from './types';

type ScannerRunMutationInput = Pick<
  OwnerWorkspaceScannerMutationsInput,
  | 'ciTemplateType'
  | 'hostedScanForm'
  | 'scannerUploadForm'
  | 'scheduleForm'
  | 'selectedProduct'
  | 'selectedWorkspace'
  | 'setCartNotice'
  | 'setCiTemplate'
>;

export function useOwnerWorkspaceScannerRunMutations({
  ciTemplateType,
  hostedScanForm,
  scannerUploadForm,
  scheduleForm,
  selectedProduct,
  selectedWorkspace,
  setCartNotice,
  setCiTemplate,
}: ScannerRunMutationInput) {
  const queryClient = useQueryClient();

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

  return {
    cancelScannerRun,
    createScannerSchedule,
    fetchCiTemplate,
    rescanRun,
    startFullHostedScan,
    startHostedScan,
    updateScannerSchedule,
  };
}
