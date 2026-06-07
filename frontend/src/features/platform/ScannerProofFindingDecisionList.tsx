'use client';

import { AddTaskOutlined, InfoOutlined } from '@mui/icons-material';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';

import { EmptyState, PastelChip, appleColors, formatLabel } from './PlatformComponents';
import { findingStatusAccent, severityAccent } from './ownerFindingPresentation';
import { NormalizedFinding, ServiceModule } from './types';

type FindingDecisionStatus = NormalizedFinding['status'];

type ScannerProofFindingDecisionListProps = {
  findings: NormalizedFinding[];
  selectedFinding: NormalizedFinding | undefined;
  cartServiceIds: Set<string>;
  findingReasonById: Record<string, string>;
  findingReviewDueById: Record<string, string>;
  isUpdatingStatus: boolean;
  isAddingService: boolean;
  onSelectFinding: (findingId: string) => void;
  onFindingReasonChange: (findingId: string, value: string) => void;
  onFindingReviewDueChange: (findingId: string, value: string) => void;
  onAddService: (serviceModule: ServiceModule, source?: string) => void;
  onRecordDecision: (finding: NormalizedFinding, status: FindingDecisionStatus) => void;
};

export default function ScannerProofFindingDecisionList({
  findings,
  selectedFinding,
  cartServiceIds,
  findingReasonById,
  findingReviewDueById,
  isUpdatingStatus,
  isAddingService,
  onSelectFinding,
  onFindingReasonChange,
  onFindingReviewDueChange,
  onAddService,
  onRecordDecision,
}: ScannerProofFindingDecisionListProps) {
  if (!findings.length) {
    return (
      <EmptyState label="No normalized findings yet. Run a governed scan or upload SARIF, JSON, JUnit, or CI log evidence." />
    );
  }

  return (
    <Stack spacing={1.25}>
      {findings.slice(0, 8).map(finding => {
        const reason = findingReasonById[finding.id] || '';
        const reviewDue = findingReviewDueById[finding.id] || '';
        const canResolve = !!reason.trim();
        const canAcceptRisk = !!reason.trim() && !!reviewDue;
        const recommendedModule = finding.recommendedModule;
        const recommendedInCart = !!recommendedModule && cartServiceIds.has(recommendedModule.id);

        return (
          <Box
            key={finding.id}
            sx={{
              p: 1.5,
              borderRadius: 1,
              border: '1px solid',
              borderColor:
                selectedFinding?.id === finding.id
                  ? `${findingStatusAccent(finding.status)}66`
                  : appleColors.line,
              bgcolor: selectedFinding?.id === finding.id ? '#fbfdff' : '#fff',
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.25}
              justifyContent="space-between"
              alignItems={{ md: 'flex-start' }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                  <PastelChip
                    label={formatLabel(finding.severity)}
                    accent={severityAccent(finding.severity)}
                    bg={`${severityAccent(finding.severity)}12`}
                  />
                  <PastelChip
                    label={formatLabel(finding.status)}
                    accent={findingStatusAccent(finding.status)}
                    bg={`${findingStatusAccent(finding.status)}12`}
                  />
                  {finding.readinessArea && (
                    <PastelChip
                      label={finding.readinessArea}
                      accent={appleColors.green}
                      bg="#e7f8ee"
                    />
                  )}
                  {recommendedModule && (
                    <PastelChip label={recommendedModule.name} accent={appleColors.purple} />
                  )}
                </Stack>
                <Typography sx={{ mt: 1, fontWeight: 900 }}>{finding.title}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, lineHeight: 1.6 }}
                >
                  {finding.businessRisk || finding.description}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.75 }}
                >
                  {finding.sourceTool}
                  {finding.sourceRuleId ? ` / ${finding.sourceRuleId}` : ''}
                  {finding.affectedComponent ? ` / ${finding.affectedComponent}` : ''}
                </Typography>
              </Box>
              <Button
                size="small"
                variant={selectedFinding?.id === finding.id ? 'contained' : 'outlined'}
                startIcon={<InfoOutlined />}
                onClick={() => onSelectFinding(finding.id)}
                sx={{ minHeight: 34, minWidth: 132 }}
              >
                Review
              </Button>
            </Stack>
            {recommendedModule && (
              <Box
                sx={{
                  mt: 1.25,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: '#f8f7ff',
                  border: '1px solid',
                  borderColor: '#e3e0ff',
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ sm: 'center' }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      Recommended service: {recommendedModule.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.35 }}
                    >
                      {recommendedModule.ownerOutcome ||
                        recommendedModule.description ||
                        'Add this service to the productization plan for tracked remediation.'}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant={recommendedInCart ? 'outlined' : 'contained'}
                    disabled={recommendedInCart || isAddingService}
                    startIcon={<AddTaskOutlined />}
                    onClick={() => onAddService(recommendedModule, 'Scanner findings')}
                    sx={{ minHeight: 34, minWidth: 142 }}
                  >
                    {recommendedInCart ? 'In Plan' : 'Add Service'}
                  </Button>
                </Stack>
              </Box>
            )}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 150px' },
                gap: 1,
                mt: 1.25,
              }}
            >
              <TextField
                size="small"
                label="Decision note"
                value={reason}
                onChange={event => onFindingReasonChange(finding.id, event.target.value)}
                placeholder="Evidence reviewed, fix merged, compensating control..."
              />
              <TextField
                size="small"
                type="date"
                label="Risk review"
                value={reviewDue}
                onChange={event => onFindingReviewDueChange(finding.id, event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={!canResolve || isUpdatingStatus}
                onClick={() => onRecordDecision(finding, 'RESOLVED')}
              >
                Mark Resolved
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={!canAcceptRisk || isUpdatingStatus}
                onClick={() => onRecordDecision(finding, 'ACCEPTED_RISK')}
              >
                Accept Risk
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={!canResolve || isUpdatingStatus}
                onClick={() => onRecordDecision(finding, 'FALSE_POSITIVE')}
              >
                False Positive
              </Button>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}
