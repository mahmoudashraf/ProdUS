'use client';

import { ExpandMoreOutlined } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { ownerRiskSummary, severityAccent } from './ownerFindingPresentation';
import { ownerCategoryFromSignal, ownerImpactForCategory } from './ownerWorkspaceModel';

export interface OwnerGroupedFinding {
  id: string;
  title: string;
  severity?: string | undefined;
  description?: string | null | undefined;
  businessRisk?: string | null | undefined;
  readinessArea?: string | null | undefined;
  sourceTool?: string | null | undefined;
  sourceRuleId?: string | null | undefined;
}

export interface OwnerFindingGroup {
  label: string;
  findings: OwnerGroupedFinding[];
  accent: string;
}

interface OwnerFindingsRiskPanelProps {
  groups: OwnerFindingGroup[];
  totalFindingCount: number;
  openGroups: Record<string, boolean>;
  onGroupToggle: (label: string, expanded: boolean) => void;
  onReviewFinding: (findingId: string) => void;
  onOpenTechnicalProof: () => void;
}

export default function OwnerFindingsRiskPanel({
  groups,
  totalFindingCount,
  openGroups,
  onGroupToggle,
  onReviewFinding,
  onOpenTechnicalProof,
}: OwnerFindingsRiskPanelProps) {
  return (
    <Surface>
      <SectionTitle
        title="Risks to fix"
        action={<PastelChip label={`${totalFindingCount} total`} accent={totalFindingCount ? appleColors.amber : appleColors.green} bg={totalFindingCount ? '#fff4dc' : '#e7f8ee'} />}
      />
      <Stack spacing={1.25}>
        {groups.map((group) => (
          <Accordion
            key={group.label}
            expanded={!!openGroups[group.label]}
            onChange={(_, expanded) => onGroupToggle(group.label, expanded)}
            disableGutters
            sx={{
              border: '1px solid',
              borderColor: `${group.accent}30`,
              borderRadius: 1,
              bgcolor: '#fff',
              overflow: 'hidden',
              boxShadow: 'none',
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreOutlined />}
              sx={{
                px: 1.5,
                py: 0.35,
                bgcolor: `${group.accent}0f`,
                borderBottom: openGroups[group.label] ? '1px solid' : 0,
                borderColor: `${group.accent}20`,
                minHeight: 58,
                '& .MuiAccordionSummary-content': { my: 0.8 },
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ width: '100%', pr: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 950 }}>{group.label}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                    {group.findings[0]?.title || 'No risks in this group.'}
                  </Typography>
                </Box>
                <PastelChip label={`${group.findings.length}`} accent={group.accent} bg="#fff" />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {group.findings.length ? (
                <Stack spacing={0} divider={<Divider />}>
                  {group.findings.slice(0, group.label === 'Launch blockers' ? 8 : 5).map((finding) => {
                    const category = ownerCategoryFromSignal(finding.sourceTool ?? undefined, finding.readinessArea ?? undefined, finding.title);
                    const sourceLabel = finding.sourceTool
                      ? `Found by ${finding.sourceTool}${finding.sourceRuleId ? ` · ${finding.sourceRuleId}` : ''}`
                      : finding.sourceRuleId
                        ? `Rule ${finding.sourceRuleId}`
                        : 'Source proof available';
                    return (
                      <Box key={finding.id} sx={{ p: 1.35 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                              <PastelChip label={formatLabel(finding.severity)} accent={severityAccent(finding.severity)} bg={`${severityAccent(finding.severity)}12`} />
                              <PastelChip label={category} accent={group.accent} bg={`${group.accent}12`} />
                            </Stack>
                            <Typography sx={{ mt: 0.8, fontWeight: 950, lineHeight: 1.35 }}>{finding.title}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>
                              {ownerRiskSummary(finding.businessRisk, finding.description, ownerImpactForCategory(category))}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.45 }}>
                              {sourceLabel}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onReviewFinding(finding.id)}
                            sx={{ minHeight: 34, minWidth: 112 }}
                          >
                            Review
                          </Button>
                        </Stack>
                      </Box>
                    );
                  })}
                  {group.findings.length > (group.label === 'Launch blockers' ? 8 : 5) && (
                    <Box sx={{ p: 1.25 }}>
                      <Button size="small" variant="text" onClick={onOpenTechnicalProof} sx={{ minHeight: 34 }}>
                        View all {group.findings.length} risks
                      </Button>
                    </Box>
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>No risks in this group.</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Surface>
  );
}
