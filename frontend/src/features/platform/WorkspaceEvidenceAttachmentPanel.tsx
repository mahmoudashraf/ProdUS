'use client';

import { Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import FileUpload from '@/components/ui-component/FileUpload';
import type { EvidenceAttachment } from './types';

const fileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

interface WorkspaceEvidenceAttachmentPanelProps {
  attachments: EvidenceAttachment[];
  canAttachEvidence: boolean;
  selectedFile: File | null;
  labelValue: string;
  isUploading: boolean;
  error?: string | undefined;
  progress?: number | undefined;
  onOpenAttachment: (attachment: EvidenceAttachment) => void;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  onLabelChange: (value: string) => void;
  onSubmit: () => void;
}

export default function WorkspaceEvidenceAttachmentPanel({
  attachments,
  canAttachEvidence,
  selectedFile,
  labelValue,
  isUploading,
  error,
  progress,
  onOpenAttachment,
  onFileSelect,
  onClear,
  onLabelChange,
  onSubmit,
}: WorkspaceEvidenceAttachmentPanelProps) {
  return (
    <Stack spacing={1} sx={{ mt: 1.25 }}>
      {attachments.map((attachment) => (
        <Box key={attachment.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, px: 1.25, py: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} justifyContent="space-between">
            <Box>
              <Link component="button" type="button" underline="hover" variant="body2" onClick={() => onOpenAttachment(attachment)} sx={{ cursor: 'pointer', textAlign: 'left' }}>
                {attachment.label || attachment.fileName}
              </Link>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {attachment.fileName}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">{fileSize(attachment.sizeBytes)}</Typography>
          </Stack>
        </Box>
      ))}
      {canAttachEvidence && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: selectedFile ? 'minmax(220px, 1fr) 220px auto' : 'minmax(220px, 1fr)' }, gap: 1 }}>
          <FileUpload
            label="Attach evidence"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,.json,.zip,.docx,.xlsx,.pptx"
            maxSize={10}
            selectedFile={selectedFile}
            loading={isUploading}
            error={error}
            helperText={progress ? `${progress}% uploaded` : undefined}
            onFileSelect={onFileSelect}
            onClear={onClear}
          />
          {selectedFile && (
            <>
              <TextField
                size="small"
                label="Evidence label"
                value={labelValue}
                onChange={(event) => onLabelChange(event.target.value)}
              />
              <Button variant="contained" onClick={onSubmit} disabled={isUploading}>
                Upload
              </Button>
            </>
          )}
        </Box>
      )}
    </Stack>
  );
}
