'use client';

import { Dispatch, ReactNode, SetStateAction } from 'react';
import { CloudUploadOutlined } from '@mui/icons-material';
import { Box, Button, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  AttachmentScope,
  Milestone,
  ScannerEvidenceItem,
} from './types';

export interface WorkspaceScannerUploadForm {
  toolName: string;
  toolVersion: string;
  format: 'SARIF' | 'JSON' | 'JUNIT' | 'LOG';
  artifactFileName: string;
  artifactPayload: string;
  milestoneId: string;
}

interface WorkspaceProofEvidencePanelProps {
  workspaceId: string;
  proofFileCount: number;
  scannerEvidenceList: ScannerEvidenceItem[];
  milestoneList: Milestone[];
  selectedMilestone: Milestone | undefined;
  scannerUploadForm: WorkspaceScannerUploadForm;
  isUploadingScannerEvidence: boolean;
  canSubmitScannerEvidence: boolean;
  onScannerUploadFormChange: Dispatch<SetStateAction<WorkspaceScannerUploadForm>>;
  onSubmitScannerEvidence: () => void;
  evidencePanel: (scopeType: AttachmentScope, scopeId: string) => ReactNode;
}

export default function WorkspaceProofEvidencePanel({
  workspaceId,
  proofFileCount,
  scannerEvidenceList,
  milestoneList,
  selectedMilestone,
  scannerUploadForm,
  isUploadingScannerEvidence,
  canSubmitScannerEvidence,
  onScannerUploadFormChange,
  onSubmitScannerEvidence,
  evidencePanel,
}: WorkspaceProofEvidencePanelProps) {
  return (
    <Surface>
      <SectionTitle title="Workspace proof" action={<PastelChip label={`${proofFileCount} files`} accent={appleColors.purple} />} />
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
        Keep the notes, decisions, acceptance records, and handoff files that support this workspace.
      </Typography>
      {evidencePanel('WORKSPACE', workspaceId)}
      <Divider sx={{ my: 2 }} />
      <Box component="form" onSubmit={(event) => {
        event.preventDefault();
        if (canSubmitScannerEvidence) onSubmitScannerEvidence();
      }}>
        <Stack spacing={1.25}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CloudUploadOutlined sx={{ color: appleColors.cyan }} />
              <Box>
                <Typography sx={{ fontWeight: 900 }}>Upload scan proof</Typography>
                <Typography variant="caption" color="text.secondary">
                  Add real scanner output for this workspace and connect it to the right milestone.
                </Typography>
              </Box>
            </Stack>
            <PastelChip label={`${scannerEvidenceList.length} scan proof records`} accent={appleColors.cyan} bg="#e4f9fd" />
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 140px 180px' }, gap: 1 }}>
            <TextField
              size="small"
              label="Scanner"
              value={scannerUploadForm.toolName}
              onChange={(event) => onScannerUploadFormChange((current) => ({ ...current, toolName: event.target.value }))}
            />
            <TextField
              select
              size="small"
              label="Format"
              value={scannerUploadForm.format}
              onChange={(event) => onScannerUploadFormChange((current) => ({ ...current, format: event.target.value as WorkspaceScannerUploadForm['format'] }))}
            >
              <MenuItem value="SARIF">SARIF</MenuItem>
              <MenuItem value="JSON">JSON</MenuItem>
              <MenuItem value="JUNIT">JUnit</MenuItem>
              <MenuItem value="LOG">Log</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Milestone"
              value={scannerUploadForm.milestoneId || selectedMilestone?.id || ''}
              onChange={(event) => onScannerUploadFormChange((current) => ({ ...current, milestoneId: event.target.value }))}
            >
              <MenuItem value="">Workspace-level</MenuItem>
              {milestoneList.map((milestone) => (
                <MenuItem key={milestone.id} value={milestone.id}>{milestone.title}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 180px' }, gap: 1 }}>
            <TextField
              size="small"
              label="Proof file name"
              value={scannerUploadForm.artifactFileName}
              onChange={(event) => onScannerUploadFormChange((current) => ({ ...current, artifactFileName: event.target.value }))}
            />
            <TextField
              size="small"
              label="Version"
              value={scannerUploadForm.toolVersion}
              onChange={(event) => onScannerUploadFormChange((current) => ({ ...current, toolVersion: event.target.value }))}
            />
          </Box>
          <TextField
            size="small"
            label="Scan output"
            placeholder="Paste SARIF, JSON, JUnit XML, or scanner log output from the team CI run."
            value={scannerUploadForm.artifactPayload}
            onChange={(event) => onScannerUploadFormChange((current) => ({ ...current, artifactPayload: event.target.value }))}
            multiline
            minRows={5}
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13, alignItems: 'flex-start' } }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<CloudUploadOutlined />}
            disabled={!canSubmitScannerEvidence || isUploadingScannerEvidence}
            sx={{ minHeight: 44, alignSelf: { md: 'flex-start' } }}
          >
            Save scan proof
          </Button>
          {scannerEvidenceList.length ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
              {scannerEvidenceList.slice(0, 4).map((item) => (
                <Box key={item.id} sx={{ p: 1, border: '1px solid', borderColor: '#e5edf7', borderRadius: 1, bgcolor: item.redactionStatus === 'NONE' ? '#fbfdff' : '#fff7f8' }}>
                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {item.source} · {formatLabel(item.confidenceLevel)}
                      </Typography>
                    </Box>
                    <StatusChip label={item.redactionStatus} color={item.redactionStatus === 'NONE' ? 'success' : 'warning'} />
                  </Stack>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No scan proof is attached to this workspace yet.
            </Typography>
          )}
        </Stack>
      </Box>
    </Surface>
  );
}
