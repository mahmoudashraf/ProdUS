'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { uploadService } from '@/services/uploadService';
import { getJson } from './api';
import { errorMessageFromUnknown } from './PlatformComponents';
import WorkspaceEvidenceAttachmentPanel from './WorkspaceEvidenceAttachmentPanel';
import type {
  AttachmentDownloadUrl,
  AttachmentScope,
  EvidenceAttachment,
} from './types';

const attachmentKey = (scopeType: AttachmentScope, scopeId: string) => `${scopeType}:${scopeId}`;

export function useWorkspaceEvidenceAttachmentControls({
  canAttachEvidence,
  selectedWorkspaceId,
}: {
  canAttachEvidence: boolean;
  selectedWorkspaceId: string | undefined;
}) {
  const queryClient = useQueryClient();
  const [attachmentFilesByKey, setAttachmentFilesByKey] = useState<Record<string, File | null>>({});
  const [attachmentLabelsByKey, setAttachmentLabelsByKey] = useState<Record<string, string>>({});
  const [attachmentProgressByKey, setAttachmentProgressByKey] = useState<Record<string, number>>({});
  const [attachmentErrorsByKey, setAttachmentErrorsByKey] = useState<Record<string, string>>({});
  const [uploadingAttachmentKey, setUploadingAttachmentKey] = useState('');
  const [attachmentOpenError, setAttachmentOpenError] = useState('');

  const attachments = useQuery({
    queryKey: ['attachments', selectedWorkspaceId],
    enabled: !!selectedWorkspaceId,
    queryFn: () => getJson<EvidenceAttachment[]>(`/attachments?workspaceId=${selectedWorkspaceId}`),
  });

  const attachmentsByScope = useMemo(
    () =>
      (attachments.data || []).reduce<Record<string, EvidenceAttachment[]>>((grouped, attachment) => {
        const key = attachmentKey(attachment.scopeType, attachment.scopeId);
        grouped[key] = [...(grouped[key] || []), attachment];
        return grouped;
      }, {}),
    [attachments.data]
  );

  const scopedAttachments = (scopeType: AttachmentScope, scopeId: string) => attachmentsByScope[attachmentKey(scopeType, scopeId)] || [];

  const uploadAttachment = useMutation({
    mutationFn: (input: { key: string; scopeType: AttachmentScope; scopeId: string; file: File; label?: string | undefined }) => {
      setUploadingAttachmentKey(input.key);
      setAttachmentErrorsByKey((current) => ({ ...current, [input.key]: '' }));
      return uploadService.uploadEvidenceAttachment(
        { scopeType: input.scopeType, scopeId: input.scopeId, file: input.file, label: input.label },
        (progress) => setAttachmentProgressByKey((current) => ({ ...current, [input.key]: progress }))
      );
    },
    onSuccess: async (_attachment, input) => {
      setAttachmentFilesByKey((current) => ({ ...current, [input.key]: null }));
      setAttachmentLabelsByKey((current) => ({ ...current, [input.key]: '' }));
      setAttachmentProgressByKey((current) => ({ ...current, [input.key]: 0 }));
      await queryClient.invalidateQueries({ queryKey: ['attachments', selectedWorkspaceId] });
    },
    onError: (error, input) => {
      setAttachmentErrorsByKey((current) => ({ ...current, [input.key]: errorMessageFromUnknown(error, 'Evidence upload failed.') }));
    },
    onSettled: () => setUploadingAttachmentKey(''),
  });

  const setAttachmentFile = (scopeType: AttachmentScope, scopeId: string, file: File | null) => {
    const key = attachmentKey(scopeType, scopeId);
    setAttachmentFilesByKey((current) => ({ ...current, [key]: file }));
    setAttachmentErrorsByKey((current) => ({ ...current, [key]: '' }));
  };

  const submitAttachment = (scopeType: AttachmentScope, scopeId: string) => {
    const key = attachmentKey(scopeType, scopeId);
    const file = attachmentFilesByKey[key];
    if (!file) {
      setAttachmentErrorsByKey((current) => ({ ...current, [key]: 'Choose a file before uploading evidence.' }));
      return;
    }
    uploadAttachment.mutate({ key, scopeType, scopeId, file, label: attachmentLabelsByKey[key] || undefined });
  };

  const openAttachment = async (attachment: EvidenceAttachment) => {
    setAttachmentOpenError('');
    const popup = window.open('about:blank', '_blank');
    try {
      const response = await getJson<AttachmentDownloadUrl>(`/attachments/${attachment.id}/download-url`);
      if (popup) {
        popup.opener = null;
        popup.location.href = response.downloadUrl;
      } else {
        window.location.assign(response.downloadUrl);
      }
    } catch (error) {
      popup?.close();
      setAttachmentOpenError(errorMessageFromUnknown(error, 'Evidence attachment could not be opened.'));
    }
  };

  const evidencePanel = (scopeType: AttachmentScope, scopeId: string) => {
    const key = attachmentKey(scopeType, scopeId);
    const selectedFile = attachmentFilesByKey[key] || null;
    const isUploading = uploadingAttachmentKey === key && uploadAttachment.isPending;

    return (
      <WorkspaceEvidenceAttachmentPanel
        attachments={scopedAttachments(scopeType, scopeId)}
        canAttachEvidence={canAttachEvidence}
        selectedFile={selectedFile}
        labelValue={attachmentLabelsByKey[key] || ''}
        isUploading={isUploading}
        error={attachmentErrorsByKey[key]}
        progress={attachmentProgressByKey[key]}
        onOpenAttachment={openAttachment}
        onFileSelect={(file) => setAttachmentFile(scopeType, scopeId, file)}
        onClear={() => setAttachmentFile(scopeType, scopeId, null)}
        onLabelChange={(value) => setAttachmentLabelsByKey((current) => ({ ...current, [key]: value }))}
        onSubmit={() => submitAttachment(scopeType, scopeId)}
      />
    );
  };

  return {
    attachmentOpenError,
    attachments,
    clearAttachmentOpenError: () => setAttachmentOpenError(''),
    evidencePanel,
    scopedAttachments,
    uploadAttachment,
  };
}
