'use client';

import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { ownerRiskSummary, severityAccent } from './ownerFindingPresentation';
import { ownerCategoryFromSignal, ownerImpactForCategory } from './ownerWorkspaceModel';
import {
  riskGroupLabelByView,
  riskGroupViewByLabel,
  type OwnerRiskGroupView,
} from './ownerRiskGroupRouteModel';

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
  activeGroupView: OwnerRiskGroupView | null;
  onGroupToggle: (label: string, expanded: boolean) => void;
  onReviewFinding: (findingId: string) => void;
  onOpenHub?: () => void;
  onOpenGroupView?: (view: OwnerRiskGroupView) => void;
  onOpenTechnicalProof: () => void;
}

export default function OwnerFindingsRiskPanel({
  groups,
  totalFindingCount,
  activeGroupView = null,
  onReviewFinding,
  onOpenHub = () => {},
  onOpenGroupView = () => {},
  onOpenTechnicalProof,
}: OwnerFindingsRiskPanelProps) {
  const selectedGroup = activeGroupView
    ? groups.find((group) => group.label === riskGroupLabelByView[activeGroupView])
    : null;
  const hubItems: JourneyStepItem<OwnerRiskGroupView>[] = groups.map((group) => {
    const groupView = riskGroupViewByLabel(group.label);
    const firstFinding = group.findings[0];
    return {
      value: groupView,
      label: group.label,
      detail: firstFinding
        ? ownerRiskSummary(firstFinding.businessRisk, firstFinding.description, group.label === 'Resolved or accepted' ? 'Already handled or accepted by the owner.' : 'Review the risk and decide the next owner action.')
        : 'No risks in this group right now.',
      accent: group.accent,
      meta: <PastelChip label={`${group.findings.length}`} accent={group.accent} bg={`${group.accent}12`} />,
    };
  });

  if (!selectedGroup) {
    return (
      <Surface>
        <SectionTitle
          title="Risks to fix"
          action={<PastelChip label={`${totalFindingCount} total`} accent={totalFindingCount ? appleColors.amber : appleColors.green} bg={totalFindingCount ? '#fff4dc' : '#e7f8ee'} />}
        />
        <Stack spacing={1.5}>
          <Typography color="text.secondary" sx={{ maxWidth: 820, lineHeight: 1.65 }}>
            Choose the risk group you want to handle now. Launch blockers should come first; improvements and handled risks stay available without making the first screen feel crowded.
          </Typography>
          <OwnerWorkspaceJourneyNav
            label="Risk groups"
            value={null}
            items={hubItems}
            maxColumns={4}
            onChange={onOpenGroupView}
          />
          <Button size="small" variant="outlined" onClick={onOpenTechnicalProof} sx={{ minHeight: 38, alignSelf: 'flex-start' }}>
            Go to scanners
          </Button>
        </Stack>
      </Surface>
    );
  }

  return (
    <Stack spacing={2}>
      <WorkspaceBreadcrumbs
        items={[
          { label: 'Risks to fix', onClick: onOpenHub },
          { label: selectedGroup.label },
        ]}
        backLabel="Risk groups"
        onBack={onOpenHub}
      />
      <Surface>
        <SectionTitle
          title={selectedGroup.label}
          action={<PastelChip label={`${selectedGroup.findings.length}`} accent={selectedGroup.accent} bg={`${selectedGroup.accent}12`} />}
        />
        {selectedGroup.findings.length ? (
          <Stack spacing={0} divider={<Divider />}>
            {selectedGroup.findings.map((finding) => (
              <OwnerFindingRiskRow
                key={finding.id}
                finding={finding}
                group={selectedGroup}
                onReviewFinding={onReviewFinding}
              />
            ))}
          </Stack>
        ) : (
          <EmptyState label="No risks in this group." />
        )}
        {selectedGroup.findings.length > 0 && (
          <Button size="small" variant="text" onClick={onOpenTechnicalProof} sx={{ mt: 1.25, minHeight: 34 }}>
            Go to scanners
          </Button>
        )}
      </Surface>
    </Stack>
  );
}

function OwnerFindingRiskRow({
  finding,
  group,
  onReviewFinding,
}: {
  finding: OwnerGroupedFinding;
  group: OwnerFindingGroup;
  onReviewFinding: (findingId: string) => void;
}) {
  const category = ownerCategoryFromSignal(finding.sourceTool ?? undefined, finding.readinessArea ?? undefined, finding.title);
  const sourceLabel = finding.sourceTool
    ? `Found by ${finding.sourceTool}${finding.sourceRuleId ? ` · ${finding.sourceRuleId}` : ''}`
    : finding.sourceRuleId
      ? `Rule ${finding.sourceRuleId}`
      : 'Source proof available';

  return (
    <Box sx={{ p: 1.35 }}>
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
}
