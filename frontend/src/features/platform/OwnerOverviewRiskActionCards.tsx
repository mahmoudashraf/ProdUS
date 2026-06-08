'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { severityAccent } from './ownerFindingPresentation';
import {
  ownerActionForCategory,
  ownerCategoryFromSignal,
  ownerImpactForCategory,
  ownerProofLine,
} from './ownerWorkspaceModel';
import type { OwnerActionGroup, OwnerDecisionRisk } from './ownerOverviewDecisionTypes';

function proofLineForRisk(risk: OwnerDecisionRisk, category: string) {
  return ownerProofLine({
    category,
    ...(risk.sourceTool ? { sourceTool: risk.sourceTool } : {}),
    ...(risk.sourceRuleId ? { sourceRuleId: risk.sourceRuleId } : {}),
  });
}

export function OwnerOverviewTopRisksCard({
  topOwnerRisks,
  onOpenFindingsRisks,
}: {
  topOwnerRisks: OwnerDecisionRisk[];
  onOpenFindingsRisks: () => void;
}) {
  return (
    <Surface>
      <SectionTitle title="Top Risks" action={<PastelChip label={`${topOwnerRisks.slice(0, 3).length} shown`} accent={topOwnerRisks.length ? appleColors.amber : appleColors.green} bg={topOwnerRisks.length ? '#fff4dc' : '#e7f8ee'} />} />
      {topOwnerRisks.length ? (
        <Stack spacing={1.25}>
          {topOwnerRisks.slice(0, 3).map((risk) => {
            const category = ownerCategoryFromSignal(risk.sourceTool ?? undefined, risk.readinessArea ?? undefined, risk.title);
            return (
              <Box key={risk.id} sx={{ p: 1.35, borderRadius: 1, bgcolor: '#fff' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'flex-start' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: severityAccent(risk.severity), fontWeight: 900 }}>
                      {category} · {formatLabel(risk.severity)}
                    </Typography>
                    <Typography sx={{ mt: 0.55, fontWeight: 950, lineHeight: 1.35 }}>{risk.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55, lineHeight: 1.55 }}>
                      {risk.businessRisk || ownerImpactForCategory(category)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.55, lineHeight: 1.45 }}>
                      Evidence: {proofLineForRisk(risk, category)}
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={onOpenFindingsRisks} sx={{ minHeight: 34, minWidth: 112 }}>
                    Inspect
                  </Button>
                </Stack>
                <Box sx={{ mt: 1, p: 1, borderRadius: 1, bgcolor: '#fbfdff' }}>
                  <Typography variant="caption" color="text.secondary">Recommended owner action</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.5 }}>{ownerActionForCategory(category)}</Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <EmptyState label="No launch blockers are visible. Keep final human review, evidence export, and a clean rerun before public launch." />
      )}
    </Surface>
  );
}

export function OwnerOverviewRecommendedActionsCard({
  ownerActionGroups,
}: {
  ownerActionGroups: OwnerActionGroup[];
}) {
  return (
    <Surface>
      <SectionTitle title="Recommended Next Actions" action={<PastelChip label="Owner plan" accent={appleColors.purple} />} />
      <Stack spacing={1.25}>
        {ownerActionGroups.map((group) => (
          <Box key={group.label} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${group.accent}32`, bgcolor: '#fff' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.9 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: group.accent }} />
              <Typography variant="body2" sx={{ fontWeight: 950 }}>{group.label}</Typography>
            </Stack>
            <Stack spacing={0.8}>
              {group.items.length ? group.items.slice(0, 2).map((item) => (
                <Box key={`${group.label}-${item.title}`}>
                  <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.35 }}>{item.title}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.45 }}>{item.action}</Typography>
                  {'proof' in item && item.proof && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.45 }}>
                      Evidence: {item.proof}
                    </Typography>
                  )}
                </Box>
              )) : (
                <Typography variant="body2" color="text.secondary">No action needed in this group right now.</Typography>
              )}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Surface>
  );
}
