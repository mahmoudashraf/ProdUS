'use client';

import { FormEvent, ReactNode } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  AttachmentScope,
  Deliverable,
  Milestone,
  WorkspaceScannerReadiness,
} from './types';

interface FormController<TValues> {
  values: TValues;
  setValue: <TKey extends keyof TValues>(key: TKey, value: TValues[TKey]) => void;
  handleSubmit: (onSubmit: () => void) => (event: FormEvent<HTMLFormElement>) => void;
}

interface MilestoneFormValues {
  title: string;
  description: string;
  dueDate: string | null;
  status: Milestone['status'];
}

interface DeliverableFormValues {
  title: string;
  evidence: string;
  status: Deliverable['status'];
}

type MilestoneRisk = WorkspaceScannerReadiness['milestoneRisks'][number];

const statusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('DELIVER') || status.includes('SUPPORT')) return appleColors.green;
  return appleColors.purple;
};

const severityAccent = (severity?: string) => {
  if (severity === 'CRITICAL' || severity === 'HIGH') return appleColors.red;
  if (severity === 'MEDIUM') return appleColors.amber;
  if (severity === 'LOW') return appleColors.cyan;
  return appleColors.green;
};

interface WorkspaceProofMilestonesPanelProps {
  milestoneList: Milestone[];
  selectedMilestone: Milestone | undefined;
  deliverableList: Deliverable[];
  milestoneRiskById: Record<string, MilestoneRisk>;
  milestoneForm: FormController<MilestoneFormValues>;
  deliverableForm: FormController<DeliverableFormValues>;
  isCreatingMilestone: boolean;
  isCreatingDeliverable: boolean;
  onCreateMilestone: () => void;
  onCreateDeliverable: () => void;
  onSelectMilestone: (milestoneId: string) => void;
  evidencePanel: (scopeType: AttachmentScope, scopeId: string) => ReactNode;
}

export default function WorkspaceProofMilestonesPanel({
  milestoneList,
  selectedMilestone,
  deliverableList,
  milestoneRiskById,
  milestoneForm,
  deliverableForm,
  isCreatingMilestone,
  isCreatingDeliverable,
  onCreateMilestone,
  onCreateDeliverable,
  onSelectMilestone,
  evidencePanel,
}: WorkspaceProofMilestonesPanelProps) {
  return (
    <>
      <Surface>
        <SectionTitle title="Workspace steps" action={selectedMilestone && <PastelChip label={`Selected: ${selectedMilestone.title}`} accent={statusAccent(selectedMilestone.status)} />} />
        <Box component="form" onSubmit={milestoneForm.handleSubmit(onCreateMilestone)} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 1fr) 170px auto' }, gap: 1, mb: 2 }}>
          <TextField size="small" label="New step" value={milestoneForm.values.title} onChange={(event) => milestoneForm.setValue('title', event.target.value)} />
          <TextField size="small" type="date" label="Due" value={milestoneForm.values.dueDate || ''} onChange={(event) => milestoneForm.setValue('dueDate', event.target.value || null)} InputLabelProps={{ shrink: true }} />
          <Button type="submit" variant="outlined" disabled={!milestoneForm.values.title || isCreatingMilestone}>Add</Button>
        </Box>
        {milestoneList.length ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
            {milestoneList.map((milestone) => {
              const milestoneRisk = milestoneRiskById[milestone.id];
              const selected = selectedMilestone?.id === milestone.id;
              return (
                <Button
                  key={milestone.id}
                  variant={selected ? 'contained' : 'outlined'}
                  color={selected ? 'primary' : 'inherit'}
                  onClick={() => onSelectMilestone(milestone.id)}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: 104, p: 1.5, borderRadius: 1, whiteSpace: 'normal' }}
                >
                  <Box sx={{ width: '100%', minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusAccent(milestone.status) }} />
                      <Typography sx={{ fontWeight: 900, minWidth: 0 }} noWrap>{milestone.title}</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: selected ? 'inherit' : 'text.secondary', display: 'block' }}>
                      {formatLabel(milestone.status)}{milestone.dueDate ? ` · due ${milestone.dueDate}` : ''}
                    </Typography>
                    {milestoneRisk && (
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        <PastelChip
                          label={`${milestoneRisk.scannerFindingCount} scan ${milestoneRisk.scannerFindingCount === 1 ? 'risk' : 'risks'}`}
                          accent={severityAccent(milestoneRisk.highestSeverity)}
                          bg={milestoneRisk.highestSeverity === 'CRITICAL' || milestoneRisk.highestSeverity === 'HIGH' ? '#fff1f1' : '#fff4dc'}
                        />
                        <PastelChip
                          label={`${milestoneRisk.missingEvidenceCount} proof ${milestoneRisk.missingEvidenceCount === 1 ? 'gap' : 'gaps'}`}
                          accent={milestoneRisk.missingEvidenceCount ? appleColors.amber : appleColors.green}
                          bg={milestoneRisk.missingEvidenceCount ? '#fff4dc' : '#e7f8ee'}
                        />
                        {milestoneRisk.mappedServices.slice(0, 2).map((service) => (
                          <PastelChip key={service} label={service} accent={appleColors.cyan} bg="#e4f9fd" />
                        ))}
                      </Stack>
                    )}
                    {milestone.description && (
                      <Typography variant="body2" sx={{ color: selected ? 'inherit' : 'text.secondary', mt: 0.75, lineHeight: 1.45 }}>
                        {milestone.description}
                      </Typography>
                    )}
                  </Box>
                </Button>
              );
            })}
          </Box>
        ) : (
          <EmptyState label="No workspace steps yet. Add the first launch step for this workspace." />
        )}
      </Surface>

      <Surface>
        <SectionTitle title={selectedMilestone ? `${selectedMilestone.title} outputs` : 'Outputs'} />
        <Box component="form" onSubmit={deliverableForm.handleSubmit(onCreateDeliverable)} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(240px, 1fr) auto' }, gap: 1, mb: 2 }}>
          <TextField size="small" label="New output" value={deliverableForm.values.title} onChange={(event) => deliverableForm.setValue('title', event.target.value)} />
          <Button type="submit" variant="outlined" disabled={!selectedMilestone?.id || !deliverableForm.values.title || isCreatingDeliverable}>Add</Button>
        </Box>
        <Stack spacing={1.5}>
          {deliverableList.length ? (
            deliverableList.map((deliverable) => (
              <Box key={deliverable.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'center' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{deliverable.title}</Typography>
                    {deliverable.evidence && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>{deliverable.evidence}</Typography>}
                  </Box>
                  <StatusChip label={deliverable.status} />
                </Stack>
                {evidencePanel('DELIVERABLE', deliverable.id)}
              </Box>
            ))
          ) : (
            <EmptyState label={selectedMilestone ? 'No outputs yet. Add proof-backed outputs for this step.' : 'Select a workspace step to see outputs.'} />
          )}
        </Stack>
      </Surface>
    </>
  );
}
