'use client';

import {
  ArticleOutlined,
  AutoAwesomeOutlined,
  BugReportOutlined,
  InfoOutlined,
  TuneOutlined,
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
import StudioAssistantCard from './StudioAssistantCard';
import OwnerProductDiagnosisFindingCard from './OwnerProductDiagnosisFindingCard';
import type { OwnerProductDiagnosisCommonProps } from './ownerProductDiagnosisTypes';

type OwnerProductDiagnosisSummaryViewProps = Pick<
  OwnerProductDiagnosisCommonProps,
  | 'assistantActions'
  | 'assistantContext'
  | 'cartServiceIds'
  | 'catalogModules'
  | 'diagnosisPromptFacts'
  | 'isAddingService'
  | 'latestDiagnosis'
  | 'onAddService'
  | 'onOpenFindingsRisks'
  | 'onOpenMap'
  | 'product'
>;

export default function OwnerProductDiagnosisSummaryView({
  assistantActions,
  assistantContext,
  cartServiceIds,
  catalogModules,
  diagnosisPromptFacts,
  isAddingService,
  latestDiagnosis,
  onAddService,
  onOpenFindingsRisks,
  onOpenMap,
  product,
}: OwnerProductDiagnosisSummaryViewProps) {
  const visibleFindings = latestDiagnosis?.findings.slice(0, 4) ?? [];
  const hiddenFindingCount = Math.max((latestDiagnosis?.findings.length ?? 0) - visibleFindings.length, 0);

  return (
    <Stack spacing={2}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ lg: 'flex-start' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant="h3">Saved diagnosis</Typography>
              <PastelChip
                label={latestDiagnosis ? `${latestDiagnosis.findings.length} rough edges` : 'Not mapped yet'}
                accent={latestDiagnosis ? appleColors.amber : appleColors.purple}
                bg={latestDiagnosis ? '#fff4dc' : '#f1efff'}
              />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 820, lineHeight: 1.6 }}>
              {latestDiagnosis
                ? 'Review the saved owner diagnosis, the rough edges it found, and the service work that can move the product forward.'
                : 'Map the product rough edges first, then return here for the saved diagnosis and service path.'}
            </Typography>
          </Box>
          <Button
            variant={latestDiagnosis ? 'outlined' : 'contained'}
            startIcon={<TuneOutlined />}
            onClick={onOpenMap}
            sx={{ minHeight: 44, whiteSpace: 'normal', minWidth: { lg: 190 } }}
          >
            Map rough edges
          </Button>
        </Stack>
      </Surface>

      {latestDiagnosis ? (
        <>
          <Surface>
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ sm: 'center' }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 1,
                      bgcolor: '#f8f7ff',
                      color: appleColors.purple,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ArticleOutlined />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h4" sx={{ overflowWrap: 'anywhere' }}>
                      {latestDiagnosis.productName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {latestDiagnosis.summary}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ sm: 'flex-end' }}>
                  <PastelChip
                    label={formatLabel(latestDiagnosis.diagnosisSource || 'MANUAL_DETERMINISTIC')}
                    accent={latestDiagnosis.diagnosisSource === 'SCANNER_READINESS' ? appleColors.green : appleColors.blue}
                    bg={latestDiagnosis.diagnosisSource === 'SCANNER_READINESS' ? '#e7f8ee' : '#eaf3ff'}
                  />
                  <PastelChip
                    label={latestDiagnosis.aiExecuted ? 'AI explanation run' : 'AI not run'}
                    accent={latestDiagnosis.aiExecuted ? appleColors.blue : appleColors.muted}
                    bg={latestDiagnosis.aiExecuted ? '#eaf3ff' : '#f5f7fb'}
                  />
                </Stack>
              </Stack>

              {latestDiagnosis.diagnosisSource === 'SCANNER_READINESS' && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                    gap: 1,
                  }}
                >
                  <MetricTile
                    label="Priority fixes"
                    value={latestDiagnosis.topBlockerCount || 0}
                    detail="Critical/high findings"
                    accent={(latestDiagnosis.topBlockerCount || 0) ? appleColors.red : appleColors.green}
                    icon={<BugReportOutlined />}
                  />
                  <MetricTile
                    label="Proof linked"
                    value={latestDiagnosis.evidenceCount || 0}
                    detail="Evidence items"
                    accent={appleColors.cyan}
                    icon={<ArticleOutlined />}
                  />
                  <MetricTile
                    label="Needs mapping"
                    value={latestDiagnosis.unmappedFindingCount || 0}
                    detail="Needs human classification"
                    accent={(latestDiagnosis.unmappedFindingCount || 0) ? appleColors.amber : appleColors.green}
                    icon={<InfoOutlined />}
                  />
                </Box>
              )}
            </Stack>
          </Surface>

          <Surface>
            <Stack spacing={1.5}>
              <SectionTitle
                title="Rough edges to resolve"
                action={
                  <PastelChip
                    label={hiddenFindingCount ? `Top ${visibleFindings.length} of ${latestDiagnosis.findings.length}` : `${latestDiagnosis.findings.length} items`}
                    accent={appleColors.amber}
                    bg="#fff4dc"
                  />
                }
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1,
                }}
              >
                {visibleFindings.map((finding) => {
                  const recommendedModule = catalogModules.find(
                    module => module.id === finding.recommendedModuleId
                  );
                  const serviceInPlan = !!recommendedModule && cartServiceIds.has(recommendedModule.id);
                  return (
                    <OwnerProductDiagnosisFindingCard
                      key={finding.id}
                      finding={finding}
                      isAddingService={isAddingService}
                      recommendedModule={recommendedModule}
                      serviceInPlan={serviceInPlan}
                      onChooseService={(module) => onAddService(module, 'Diagnosis')}
                    />
                  );
                })}
              </Box>
              {hiddenFindingCount > 0 && (
                <Button
                  variant="outlined"
                  onClick={onOpenFindingsRisks}
                  sx={{ alignSelf: 'flex-start', minHeight: 38 }}
                >
                  Review all owner risks
                </Button>
              )}
            </Stack>
          </Surface>

          <StudioAssistantCard
            title="Ask AI About This Diagnosis"
            description="Translate the diagnosis into practical fixes, tradeoffs, and the next owner decision."
            prompt={`Do not call tools for this answer. Explain the product readiness diagnosis for ${product.name} using these visible facts directly. ${diagnosisPromptFacts} Focus on the ship-readiness score, priority fixes, recommended lifecycle services, scanner signals, and the next owner decision. Do not certify production readiness; call out where human review is needed.`}
            conversationId={`studio-diagnosis-${product.id}`}
            context={assistantContext}
            {...assistantActions}
            accent={appleColors.purple}
            cta="Ask AI"
          />
        </>
      ) : (
        <Surface>
          <EmptyState label="No saved diagnosis yet. Map the launch goal and rough edges to create one." />
          <Button
            variant="contained"
            startIcon={<AutoAwesomeOutlined />}
            onClick={onOpenMap}
            sx={{ mt: 1.5, minHeight: 42 }}
          >
            Map rough edges
          </Button>
        </Surface>
      )}
    </Stack>
  );
}
