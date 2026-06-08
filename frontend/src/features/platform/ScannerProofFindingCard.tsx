'use client';

import { AddTaskOutlined, InfoOutlined } from '@mui/icons-material';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { PastelChip, appleColors, formatLabel } from './PlatformComponents';
import { findingStatusAccent, severityAccent } from './ownerFindingPresentation';
import type { NormalizedFinding, ServiceModule } from './types';

type FindingDecisionStatus = NormalizedFinding['status'];

interface ScannerProofFindingCardProps {
  finding: NormalizedFinding;
  expanded: boolean;
  cartServiceIds: Set<string>;
  reason: string;
  reviewDue: string;
  isUpdatingStatus: boolean;
  isAddingService: boolean;
  onSelectFinding: (findingId: string) => void;
  onFindingReasonChange: (findingId: string, value: string) => void;
  onFindingReviewDueChange: (findingId: string, value: string) => void;
  onAddService: (serviceModule: ServiceModule, source?: string) => void;
  onRecordDecision: (finding: NormalizedFinding, status: FindingDecisionStatus) => void;
}

export default function ScannerProofFindingCard({
  finding,
  expanded,
  cartServiceIds,
  reason,
  reviewDue,
  isUpdatingStatus,
  isAddingService,
  onSelectFinding,
  onFindingReasonChange,
  onFindingReviewDueChange,
  onAddService,
  onRecordDecision,
}: ScannerProofFindingCardProps) {
  const canResolve = !!reason.trim();
  const canAcceptRisk = !!reason.trim() && !!reviewDue;
  const recommendedModule = finding.recommendedModule;
  const recommendedInCart = !!recommendedModule && cartServiceIds.has(recommendedModule.id);
  const activeAccent = findingStatusAccent(finding.status);

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: expanded ? `${activeAccent}66` : appleColors.line,
        bgcolor: expanded ? '#fbfdff' : '#fff',
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
              accent={activeAccent}
              bg={`${activeAccent}12`}
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
          <Typography sx={{ mt: 1, fontWeight: 900, overflowWrap: 'anywhere' }}>
            {finding.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, lineHeight: 1.6, overflowWrap: 'anywhere' }}
          >
            {finding.businessRisk || finding.description}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.75, overflowWrap: 'anywhere' }}
          >
            {finding.sourceTool}
            {finding.sourceRuleId ? ` / ${finding.sourceRuleId}` : ''}
            {finding.affectedComponent ? ` / ${finding.affectedComponent}` : ''}
          </Typography>
        </Box>
        <Button
          size="small"
          variant={expanded ? 'contained' : 'outlined'}
          startIcon={<InfoOutlined />}
          onClick={() => onSelectFinding(finding.id)}
          sx={{ minHeight: 34, minWidth: 132 }}
        >
          {expanded ? 'Reviewing' : 'Review'}
        </Button>
      </Stack>

      {expanded && recommendedModule && (
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
              <Typography variant="body2" sx={{ fontWeight: 900, overflowWrap: 'anywhere' }}>
                Recommended service: {recommendedModule.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.35, overflowWrap: 'anywhere' }}
              >
                {recommendedModule.ownerOutcome ||
                  recommendedModule.description ||
                  'Choose this service for tracked remediation in the productization plan.'}
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
              {recommendedInCart ? 'In Plan' : 'Choose Service'}
            </Button>
          </Stack>
        </Box>
      )}

      {expanded && (
        <>
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
        </>
      )}
    </Box>
  );
}
