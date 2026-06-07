'use client';

import {
  AddShoppingCartOutlined,
  BugReportOutlined,
  EventRepeatOutlined,
  FactCheckOutlined,
  OpenInNewOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  MetricTile,
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
  type OwnerLaunchStatus,
} from './ownerWorkspaceModel';
import { PackageInstance, ScannerToolCoverage } from './types';

interface OwnerDecisionRisk {
  id: string;
  title: string;
  severity?: string | undefined;
  businessRisk?: string | null | undefined;
  readinessArea?: string | null | undefined;
  sourceTool?: string | null | undefined;
  sourceRuleId?: string | null | undefined;
}

interface OwnerActionGroup {
  label: string;
  accent: string;
  items: {
    title: string;
    detail: string;
    action: string;
    proof?: string;
    service?: string;
  }[];
}

interface OwnerDecisionScannerCoverageGroup {
  key: string;
  label: string;
  tools: ScannerToolCoverage[];
  expectedLabels: string[];
  normalizedCount: number;
  mappedFindingCount: number;
  status: string;
  accent: string;
}

interface OwnerOverviewDecisionPanelProps {
  launchStatus: OwnerLaunchStatus;
  latestCompletedTools: number;
  totalScanTools: number;
  topRecommendedServiceName: string;
  topOwnerRisks: OwnerDecisionRisk[];
  ownerActionGroups: OwnerActionGroup[];
  scannerCoverageGroups: OwnerDecisionScannerCoverageGroup[];
  selectedPackage: PackageInstance | undefined;
  scannerMappedServices: string[];
  onOpenServicesRecommend: () => void;
  onOpenServicesPlan: () => void;
  onOpenFindingsEvidence: () => void;
  onOpenFindingsRisks: () => void;
  onOpenTimeline: () => void;
}

export default function OwnerOverviewDecisionPanel({
  launchStatus,
  latestCompletedTools,
  totalScanTools,
  topRecommendedServiceName,
  topOwnerRisks,
  ownerActionGroups,
  scannerCoverageGroups,
  selectedPackage,
  scannerMappedServices,
  onOpenServicesRecommend,
  onOpenServicesPlan,
  onOpenFindingsEvidence,
  onOpenFindingsRisks,
  onOpenTimeline,
}: OwnerOverviewDecisionPanelProps) {
  const proofLineForRisk = (risk: OwnerDecisionRisk, category: string) => ownerProofLine({
    category,
    ...(risk.sourceTool ? { sourceTool: risk.sourceTool } : {}),
    ...(risk.sourceRuleId ? { sourceRuleId: risk.sourceRuleId } : {}),
  });

  return (
    <>
      <Surface>
        <SectionTitle
          title="Launch Decision"
          action={<PastelChip label={launchStatus.confidence} accent={launchStatus.accent} bg={`${launchStatus.accent}12`} />}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' }, gap: 2, alignItems: 'start' }}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="h3" sx={{ color: launchStatus.accent }}>{launchStatus.headline}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                The canonical readiness score is shown once in the page header. These counts explain the verdict.
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ lineHeight: 1.75, fontWeight: 700 }}>
              {launchStatus.reason}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
              <MetricTile label="Blockers" value={launchStatus.blockerCount} detail="Must fix before launch" accent={launchStatus.blockerCount ? appleColors.red : appleColors.green} icon={<BugReportOutlined />} />
              <MetricTile label="Improvements" value={launchStatus.improvementCount} detail="Can be scheduled" accent={launchStatus.improvementCount ? appleColors.amber : appleColors.green} icon={<FactCheckOutlined />} />
              <MetricTile label="Evidence checks" value={`${latestCompletedTools}/${totalScanTools}`} detail="Completed scanner tools" accent={latestCompletedTools === totalScanTools ? appleColors.green : appleColors.amber} icon={<ShieldOutlined />} />
            </Box>
          </Stack>
          <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: '#fbfdff' }}>
            <Typography variant="caption" color="text.secondary">Primary next step</Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }}>{launchStatus.blockerCount ? 'Fix launch blockers' : topRecommendedServiceName ? 'Confirm launch plan' : 'Add evidence'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
              {topRecommendedServiceName
                ? `${topRecommendedServiceName} should carry the highest-priority action so the service plan follows the verdict.`
                : 'Connect proof or run the full scanner suite so ProdUS can make a stronger launch call.'}
            </Typography>
            <Button
              variant="contained"
              startIcon={topRecommendedServiceName ? <AddShoppingCartOutlined /> : <ShieldOutlined />}
              onClick={topRecommendedServiceName ? onOpenServicesRecommend : onOpenFindingsEvidence}
              sx={{ mt: 1.25, minHeight: 40 }}
            >
              {topRecommendedServiceName ? 'Review service path' : 'Open proof'}
            </Button>
            <Button
              variant="text"
              startIcon={<EventRepeatOutlined />}
              onClick={onOpenTimeline}
              sx={{ mt: 0.75, minHeight: 36, alignSelf: 'flex-start' }}
            >
              View product timeline
            </Button>
          </Box>
        </Box>
      </Surface>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)' }, gap: 2.5 }}>
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
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(320px, 0.8fr)' }, gap: 2.5 }}>
        <Surface>
          <SectionTitle
            title="Evidence Checks"
            action={<PastelChip label={`${latestCompletedTools}/${totalScanTools} completed`} accent={latestCompletedTools === totalScanTools ? appleColors.green : appleColors.amber} bg={latestCompletedTools === totalScanTools ? '#e7f8ee' : '#fff4dc'} />}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
            {scannerCoverageGroups.map((group) => (
              <Box key={group.key} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${group.accent}32`, bgcolor: '#fff' }}>
                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 950 }}>{group.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {group.tools.length ? group.tools.map((tool) => tool.displayName).join(', ') : group.expectedLabels.join(', ')}
                    </Typography>
                  </Box>
                  <PastelChip label={group.status} accent={group.accent} bg={`${group.accent}12`} />
                </Stack>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 850 }}>
                  {group.normalizedCount ? `${group.normalizedCount} findings` : 'No findings'}
                  {group.mappedFindingCount ? ` · ${group.mappedFindingCount} mapped` : ''}
                </Typography>
              </Box>
            ))}
          </Box>
        </Surface>

        <Surface>
          <SectionTitle title="Top Service Recommendation" action={<PastelChip label={selectedPackage ? 'Plan exists' : 'Next step'} accent={selectedPackage ? appleColors.green : appleColors.amber} bg={selectedPackage ? '#e7f8ee' : '#fff4dc'} />} />
          {selectedPackage ? (
            <Stack spacing={1}>
              <Typography variant="h4">{selectedPackage.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{selectedPackage.summary}</Typography>
              <Button variant="outlined" startIcon={<OpenInNewOutlined />} onClick={onOpenServicesPlan} sx={{ minHeight: 40, alignSelf: 'flex-start' }}>
                Review services
              </Button>
            </Stack>
          ) : scannerMappedServices.length ? (
            <Stack spacing={1}>
              <Typography variant="h4">{scannerMappedServices[0]}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                This service appears because scanner findings mapped to launch-readiness work.
              </Typography>
              <Button variant="contained" startIcon={<AddShoppingCartOutlined />} onClick={onOpenServicesRecommend} sx={{ minHeight: 40, alignSelf: 'flex-start' }}>
                Add services
              </Button>
            </Stack>
          ) : (
            <EmptyState label="Run or map scanner evidence to generate a service recommendation." />
          )}
        </Surface>
      </Box>
    </>
  );
}
