'use client';

import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import {
  AcceptanceCriterion,
  AutomatedCheck,
  EvidenceRequirement,
  Milestone,
  ReviewDecision,
} from './types';

interface EvidenceStatusPayload {
  status: EvidenceRequirement['status'];
  evidenceReference?: string;
}

interface CheckPayload {
  checkType: string;
  provider: string;
  externalRef?: string;
  status: AutomatedCheck['status'];
  summary?: string;
  rawPayload?: string;
}

interface ReviewPayload {
  decision: ReviewDecision['decision'];
  note: string;
}

interface WorkspaceAcceptanceReviewPanelProps {
  selectedMilestone: Milestone | undefined;
  criteria: AcceptanceCriterion[];
  totalCriteriaCount: number;
  passedCriteriaCount: number;
  isGovernanceFetching: boolean;
  isGeneratingCriteria: boolean;
  isUpdatingEvidenceRequirement: boolean;
  isCreatingCheck: boolean;
  isReviewingCriterion: boolean;
  onGenerateCriteria: () => void;
  onUpdateEvidenceRequirement: (id: string, payload: EvidenceStatusPayload) => void;
  onCreateCheck: (criterionId: string, payload: CheckPayload) => void;
  onReviewCriterion: (criterionId: string, payload: ReviewPayload) => void;
}

export default function WorkspaceAcceptanceReviewPanel({
  selectedMilestone,
  criteria,
  totalCriteriaCount,
  passedCriteriaCount,
  isGovernanceFetching,
  isGeneratingCriteria,
  isUpdatingEvidenceRequirement,
  isCreatingCheck,
  isReviewingCriterion,
  onGenerateCriteria,
  onUpdateEvidenceRequirement,
  onCreateCheck,
  onReviewCriterion,
}: WorkspaceAcceptanceReviewPanelProps) {
  const allCriteriaPassed = passedCriteriaCount === totalCriteriaCount && totalCriteriaCount > 0;

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
      <SectionTitle
        title="Acceptance And Evidence Review"
        action={<PastelChip label={`${passedCriteriaCount}/${totalCriteriaCount || 0} passed`} accent={allCriteriaPassed ? appleColors.green : appleColors.amber} bg={allCriteriaPassed ? '#e7f8ee' : '#fff4dc'} />}
      />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, maxWidth: 720 }}>
          Generate acceptance criteria from the service plan, attach or verify required evidence, record checks, and make owner review decisions from one place.
        </Typography>
        <Button
          variant="outlined"
          onClick={onGenerateCriteria}
          disabled={!selectedMilestone?.id || isGeneratingCriteria}
          sx={{ minHeight: 40, flex: { md: '0 0 auto' } }}
        >
          Generate checklist
        </Button>
      </Stack>
      {(isGovernanceFetching || isGeneratingCriteria) && <LinearProgress sx={{ mb: 1.5, borderRadius: 999 }} />}
      {criteria.length ? (
        <Stack spacing={1.25}>
          {criteria.map((criterion) => {
            const hasMissingRequired = criterion.evidenceRequirements.some((requirement) => requirement.required && requirement.status === 'MISSING');
            return (
              <Box key={criterion.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: '#fff' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                      <Typography sx={{ fontWeight: 900 }}>{criterion.title}</Typography>
                      {criterion.serviceName && <PastelChip label={criterion.serviceName} accent={appleColors.cyan} bg="#e4f9fd" />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                      {criterion.description || 'Acceptance criterion requires owner-visible evidence before approval.'}
                    </Typography>
                  </Box>
                  <StatusChip label={criterion.status} color={criterion.status === 'PASSED' ? 'success' : criterion.status === 'FAILED' ? 'error' : 'default'} />
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 250px' }, gap: 1.25, mt: 1.25 }}>
                  <Stack spacing={0.75}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
                      Required evidence
                    </Typography>
                    {criterion.evidenceRequirements.map((requirement) => (
                      <Box key={requirement.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' }, gap: 1, alignItems: 'center', border: '1px solid', borderColor: '#e5edf7', borderRadius: 1, p: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{requirement.evidenceType}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {requirement.evidenceReference || requirement.description || 'No reference attached'}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          <Button
                            size="small"
                            variant={requirement.status === 'ATTACHED' ? 'contained' : 'outlined'}
                            onClick={() => onUpdateEvidenceRequirement(requirement.id, { status: 'ATTACHED', evidenceReference: requirement.evidenceReference || 'Workspace evidence attached' })}
                            disabled={isUpdatingEvidenceRequirement}
                            sx={{ minHeight: 32 }}
                          >
                            Attach
                          </Button>
                          <Button
                            size="small"
                            variant={requirement.status === 'VERIFIED' ? 'contained' : 'outlined'}
                            onClick={() => onUpdateEvidenceRequirement(requirement.id, { status: 'VERIFIED', evidenceReference: requirement.evidenceReference || 'Verified workspace evidence' })}
                            disabled={isUpdatingEvidenceRequirement}
                            sx={{ minHeight: 32 }}
                          >
                            Verify
                          </Button>
                          <Button
                            size="small"
                            variant={requirement.status === 'WAIVED' ? 'contained' : 'outlined'}
                            color="warning"
                            onClick={() => onUpdateEvidenceRequirement(requirement.id, { status: 'WAIVED', evidenceReference: requirement.evidenceReference || 'Waived by workspace coordinator' })}
                            disabled={isUpdatingEvidenceRequirement}
                            sx={{ minHeight: 32 }}
                          >
                            Waive
                          </Button>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                  <Stack spacing={0.75}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
                      Review actions
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => onCreateCheck(criterion.id, {
                        checkType: 'manual-evidence-review',
                        provider: 'ProdUS Workspace',
                        status: hasMissingRequired ? 'WARNING' : 'PASSED',
                        summary: hasMissingRequired ? 'Evidence review found missing required proof.' : 'Evidence review passed with available proof.',
                      })}
                      disabled={isCreatingCheck}
                      sx={{ minHeight: 38 }}
                    >
                      Record check
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => onReviewCriterion(criterion.id, { decision: 'APPROVE', note: 'Evidence is acceptable for this milestone criterion.' })}
                      disabled={hasMissingRequired || isReviewingCriterion}
                      sx={{ minHeight: 38 }}
                    >
                      Approve criterion
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => onReviewCriterion(criterion.id, { decision: 'REQUEST_CHANGES', note: 'Additional evidence or remediation is required before approval.' })}
                      disabled={isReviewingCriterion}
                      sx={{ minHeight: 38 }}
                    >
                      Request changes
                    </Button>
                  </Stack>
                </Box>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <EmptyState label={selectedMilestone ? 'No acceptance checklist exists yet. Generate it from the selected milestone service plan.' : 'Select a milestone to review acceptance criteria.'} />
      )}
    </Surface>
  );
}
