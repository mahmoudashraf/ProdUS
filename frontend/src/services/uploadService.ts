import axios from 'axios';
import apiClient from '@/lib/api-client';
import type { AttachmentScope, EvidenceAttachment } from '@/features/platform/types';

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

class UploadService {
  async uploadFile(presignedUrl: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percentCompleted);
        }
      }
    });
  }

  async uploadFiles(
    files: File[],
    presignedUrls: string[],
    onProgress?: (fileName: string, progress: number) => void
  ): Promise<void> {
    const uploads = files.map((file, index) =>
      this.uploadFile(presignedUrls[index]!, file, (progress) => {
        onProgress?.(file.name, progress);
      })
    );

    await Promise.all(uploads);
  }

  async uploadEvidenceAttachment(
    input: {
      scopeType: AttachmentScope;
      scopeId: string;
      file: File;
      label?: string | undefined;
    },
    onProgress?: (progress: number) => void
  ): Promise<EvidenceAttachment> {
    const formData = new FormData();
    formData.append('scopeType', input.scopeType);
    formData.append('scopeId', input.scopeId);
    formData.append('file', input.file);
    if (input.label) {
      formData.append('label', input.label);
    }

    const response = await apiClient.post<EvidenceAttachment>('/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percentCompleted);
        }
      }
    });
    return response.data;
  }
}

export const uploadService = new UploadService();
