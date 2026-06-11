'use client';

import { AddTaskOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { ownerImpactForCategory, ownerProofLine } from './ownerWorkspaceModel';
import { findingStatusAccent, severityAccent } from './ownerFindingPresentation';
import { appleColors, formatLabel, PastelChip } from './PlatformComponents';
import type { NormalizedFinding, ServiceModule } from './types';

const wrapFindingText = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
} as const;

export function OwnerFindingSummaryPanel({
  finding,
  ownerCategory,
}: {
  finding: NormalizedFinding;
  ownerCategory: string;
}) {
  const confidenceBasis = finding.confidenceBasis || '';
  const compactConfidenceBasis = confidenceBasis && confidenceBasis.length <= 36;

  return (
    <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: `${findingStatusAccent(finding.status)}35` }}>
      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
        <PastelChip label={formatLabel(finding.severity)} accent={severityAccent(finding.severity)} bg={`${severityAccent(finding.severity)}12`} />
        <PastelChip label={formatLabel(finding.status)} accent={findingStatusAccent(finding.status)} bg={`${findingStatusAccent(finding.status)}12`} />
        <PastelChip label={compactConfidenceBasis ? confidenceBasis : 'Proof-backed'} accent={appleColors.cyan} bg="#e4f9fd" />
      </Stack>
      <Typography sx={{ mt: 1, fontWeight: 950, lineHeight: 1.35, ...wrapFindingText }}>
        {finding.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.65, lineHeight: 1.6, ...wrapFindingText }}>
        {finding.businessRisk || finding.description || ownerImpactForCategory(ownerCategory)}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8, lineHeight: 1.45, ...wrapFindingText }}>
        Proof: {ownerProofLine({ sourceTool: finding.sourceTool, sourceRuleId: finding.sourceRuleId, category: ownerCategory })}
      </Typography>
      {!compactConfidenceBasis && confidenceBasis && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, lineHeight: 1.45, color: appleColors.cyan, fontWeight: 800, ...wrapFindingText }}>
          Scanner context: {confidenceBasis}
        </Typography>
      )}
    </Box>
  );
}

export function OwnerFindingFactsGrid({
  finding,
  evidenceCount,
}: {
  finding: NormalizedFinding;
  evidenceCount: number;
}) {
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
        <Box sx={{ p: 1, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
          <Typography variant="caption" color="text.secondary">
            Affected area
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.35, ...wrapFindingText }}>
            {finding.readinessArea || finding.affectedComponent || 'Product surface'}
          </Typography>
        </Box>
        <Box sx={{ p: 1, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
          <Typography variant="caption" color="text.secondary">
            Source rule
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.35, ...wrapFindingText }}>
            {finding.sourceRuleId || finding.sourceTool}
          </Typography>
        </Box>
        <Box sx={{ p: 1, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
          <Typography variant="caption" color="text.secondary">
            Linked proof
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 850 }}>
            {evidenceCount}
          </Typography>
        </Box>
      </Box>

      {(finding.evidenceRequired || finding.mappingReason) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
          {finding.evidenceRequired && (
            <Box sx={{ p: 1, border: '1px solid', borderColor: '#dcfce7', borderRadius: 1, bgcolor: '#fff' }}>
              <Typography variant="caption" color="text.secondary">
                Proof needed
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.5, ...wrapFindingText }}>
                {finding.evidenceRequired}
              </Typography>
            </Box>
          )}
          {finding.mappingReason && (
            <Box sx={{ p: 1, border: '1px solid', borderColor: '#dbeafe', borderRadius: 1, bgcolor: '#fff' }}>
              <Typography variant="caption" color="text.secondary">
                Mapping reason
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.5, ...wrapFindingText }}>
                {finding.mappingReason}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </>
  );
}

export function OwnerFindingRecommendedServicePanel({
  finding,
  recommendedInCart,
  isAddingService,
  onAddService,
}: {
  finding: NormalizedFinding;
  recommendedInCart: boolean;
  isAddingService: boolean;
  onAddService: (serviceModule: ServiceModule, source: string) => void;
}) {
  if (!finding.recommendedModule) return null;

  return (
    <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e3e0ff', bgcolor: '#fff' }}>
      <Typography variant="caption" color="text.secondary">
        Recommended service
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.35, fontWeight: 950, ...wrapFindingText }}>
        {finding.recommendedModule.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.45, lineHeight: 1.45, ...wrapFindingText }}>
        {finding.recommendedModule.ownerOutcome || finding.recommendedModule.description || 'Choose this service for tracked remediation in Planning.'}
      </Typography>
      <Button
        size="small"
        variant={recommendedInCart ? 'outlined' : 'contained'}
        disabled={recommendedInCart || isAddingService}
        startIcon={<AddTaskOutlined />}
        onClick={() => finding.recommendedModule && onAddService(finding.recommendedModule, 'Risk review')}
        sx={{ mt: 1, minHeight: 34 }}
      >
        {recommendedInCart ? 'Already in Planning' : 'Choose service'}
      </Button>
    </Box>
  );
}
