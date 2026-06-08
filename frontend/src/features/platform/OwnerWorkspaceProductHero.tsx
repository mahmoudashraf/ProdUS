'use client';

import {
  CloudUploadOutlined,
  Inventory2Outlined,
  RocketLaunchOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  ProgressRing,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { ownerCategoryFromSignal, ownerProofLine, type OwnerLaunchStatus } from './ownerWorkspaceModel';
import { severityAccent } from './ownerFindingPresentation';
import type { ProductProfile } from './types';

interface EvidenceSummaryItem {
  label: string;
  value: string;
  accent: string;
}

interface OwnerRiskSummary {
  id: string;
  title: string;
  severity?: string | undefined;
  businessRisk?: string | undefined;
  readinessArea?: string | undefined;
  sourceTool?: string | undefined;
  sourceRuleId?: string | null | undefined;
}

interface OwnerWorkspaceProductHeroProps {
  product: ProductProfile;
  launchStatus: OwnerLaunchStatus;
  topOwnerRisks: OwnerRiskSummary[];
  evidenceSummaryItems: EvidenceSummaryItem[];
  onPrimaryAction: () => void;
  onViewProof: () => void;
  onExportReport: () => void;
  isExporting?: boolean;
}

export default function OwnerWorkspaceProductHero({
  product,
  launchStatus,
  topOwnerRisks,
  evidenceSummaryItems,
  onPrimaryAction,
  onViewProof,
  onExportReport,
  isExporting,
}: OwnerWorkspaceProductHeroProps) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 55%, #f6fff9 100%)' }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems={{ lg: 'flex-start' }} justifyContent="space-between">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 1,
              bgcolor: '#f1efff',
              color: appleColors.purple,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Inventory2Outlined />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h2">{product.name}</Typography>
              <PastelChip label={formatLabel(product.businessStage)} accent={appleColors.purple} />
              <PastelChip label={launchStatus.label} accent={launchStatus.accent} bg={`${launchStatus.accent}12`} />
            </Stack>
            <Typography color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.7, mt: 0.75 }}>
              {product.summary || 'Capture a concise product summary to drive service recommendations.'}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}>
          <ProgressRing value={launchStatus.score} size={104} color={launchStatus.accent} label="ready" />
          <Box sx={{ minWidth: 150 }}>
            <Typography variant="caption" color="text.secondary">
              Launch decision
            </Typography>
            <Typography variant="h4" sx={{ color: launchStatus.accent }}>
              {launchStatus.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
              {launchStatus.confidence}
            </Typography>
          </Box>
        </Stack>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)' }, gap: 1.5, mt: 2.25 }}>
        <Box sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: `${launchStatus.accent}35`, bgcolor: '#fff' }}>
          <Typography variant="caption" color="text.secondary">
            Status reason
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5, color: appleColors.ink }}>
            {launchStatus.headline}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
            {launchStatus.reason}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
            <Button variant="contained" startIcon={<RocketLaunchOutlined />} onClick={onPrimaryAction} sx={{ minHeight: 42, flex: { sm: '1 1 180px' }, whiteSpace: 'normal' }}>
              {topOwnerRisks.length ? 'Review launch blockers' : 'Plan next service'}
            </Button>
            <Button variant="outlined" startIcon={<ShieldOutlined />} onClick={onViewProof} sx={{ minHeight: 42, flex: { sm: '1 1 160px' }, whiteSpace: 'normal' }}>
              View scanner proof
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloudUploadOutlined />}
              onClick={onExportReport}
              disabled={Boolean(isExporting)}
              sx={{ minHeight: 42, flex: { sm: '1 1 140px' }, whiteSpace: 'normal' }}
            >
              Export report
            </Button>
          </Stack>
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: appleColors.line, bgcolor: '#fff' }}>
          <Typography variant="caption" color="text.secondary">
            Top risks
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {topOwnerRisks.slice(0, 3).length ? (
              topOwnerRisks.slice(0, 3).map((risk) => {
                const category = ownerCategoryFromSignal(risk.sourceTool, risk.readinessArea, risk.title);
                return (
                  <Box key={risk.id} sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: severityAccent(risk.severity), mt: 0.65 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.35 }}>
                        {risk.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                        {ownerProofLine({
                          ...(risk.sourceTool ? { sourceTool: risk.sourceTool } : {}),
                          ...(risk.sourceRuleId ? { sourceRuleId: risk.sourceRuleId } : {}),
                          category,
                        })}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                No launch blockers are visible from the latest stored evidence.
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.25, mt: 1.5 }}>
        {evidenceSummaryItems.map((item) => (
          <Box key={item.label} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${item.accent}32`, bgcolor: '#fff', minHeight: 84 }}>
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.55, fontWeight: 900, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Surface>
  );
}
