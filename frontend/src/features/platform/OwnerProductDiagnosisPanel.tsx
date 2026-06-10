'use client';

import { FormEvent } from 'react';
import {
  ArticleOutlined,
  BugReportOutlined,
  FactCheckOutlined,
  InfoOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import {
  EmptyState,
  MetricTile,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import StudioAssistantCard, { StudioAssistantContext } from './StudioAssistantCard';
import {
  ProductDiagnosis,
  ProductProfile,
  ServiceModule,
} from './types';

interface DiagnosisFormValues {
  businessGoal: string;
  currentProblems: string;
  accessSignals: string;
  summary: string;
}

interface DiagnosisFormController {
  values: DiagnosisFormValues;
  setValue: <TKey extends keyof DiagnosisFormValues>(key: TKey, value: DiagnosisFormValues[TKey]) => void;
  handleSubmit: (onSubmit: () => void) => (event?: FormEvent) => Promise<void>;
}

interface OwnerProductDiagnosisPanelProps {
  product: ProductProfile;
  diagnosisForm: DiagnosisFormController;
  latestDiagnosis?: ProductDiagnosis | undefined;
  catalogModules: ServiceModule[];
  cartServiceIds: Set<string>;
  diagnosisPromptFacts: string;
  assistantContext: StudioAssistantContext;
  assistantActions: {
    onConfirmAction: (action: Record<string, unknown>) => Promise<void> | void;
    actionDisabledReason: (action: Record<string, unknown>) => string;
  };
  isCreatingDiagnosis: boolean;
  isAddingService: boolean;
  onCreateDiagnosis: () => void;
  onAddService: (module: ServiceModule, source: string) => void;
}

export default function OwnerProductDiagnosisPanel({
  product,
  diagnosisForm,
  latestDiagnosis,
  catalogModules,
  cartServiceIds,
  diagnosisPromptFacts,
  assistantContext,
  assistantActions,
  isCreatingDiagnosis,
  isAddingService,
  onCreateDiagnosis,
  onAddService,
}: OwnerProductDiagnosisPanelProps) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
      <SectionTitle
        title="Product Diagnosis"
        action={<PastelChip label={latestDiagnosis ? `${latestDiagnosis.findings.length} findings` : 'Not run'} accent={latestDiagnosis ? appleColors.amber : appleColors.purple} />}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px minmax(0, 1fr)' }, gap: 2 }}>
        <Box component="form" onSubmit={diagnosisForm.handleSubmit(onCreateDiagnosis)}>
          <Stack spacing={1.25}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Turn the owner brief into a practical launch-readiness view. This is deterministic and stored; AI explanation only runs when you ask for it.
            </Typography>
            <TextField
              size="small"
              label="Launch goal"
              value={diagnosisForm.values.businessGoal}
              onChange={(event) => diagnosisForm.setValue('businessGoal', event.target.value)}
            />
            <TextField
              size="small"
              label="Known rough edges"
              value={diagnosisForm.values.currentProblems}
              onChange={(event) => diagnosisForm.setValue('currentProblems', event.target.value)}
              multiline
            />
            <TextField
              size="small"
              label="Repo / app signals"
              placeholder="Repo available, staging missing, no monitoring, payment flow exists..."
              value={diagnosisForm.values.accessSignals}
              onChange={(event) => diagnosisForm.setValue('accessSignals', event.target.value)}
              multiline
            />
            <Button type="submit" variant="contained" disabled={isCreatingDiagnosis} sx={{ minHeight: 42 }}>
              Map rough edges
            </Button>
          </Stack>
        </Box>

        <Stack spacing={1.25}>
          {latestDiagnosis ? (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 54, height: 54, borderRadius: 1, bgcolor: '#f8f7ff', color: appleColors.purple, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <FactCheckOutlined />
                  </Box>
                  <Box>
                    <Typography variant="h4">{latestDiagnosis.productName}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{latestDiagnosis.summary}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ sm: 'flex-end' }}>
                  <PastelChip label={formatLabel(latestDiagnosis.diagnosisSource || 'MANUAL_DETERMINISTIC')} accent={latestDiagnosis.diagnosisSource === 'SCANNER_READINESS' ? appleColors.green : appleColors.blue} bg={latestDiagnosis.diagnosisSource === 'SCANNER_READINESS' ? '#e7f8ee' : '#eaf3ff'} />
                  <PastelChip label={latestDiagnosis.aiExecuted ? 'AI analyzed' : 'AI context ready'} accent={appleColors.blue} bg="#eaf3ff" />
                </Stack>
              </Stack>

              {latestDiagnosis.diagnosisSource === 'SCANNER_READINESS' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
                  <MetricTile label="Priority fixes" value={latestDiagnosis.topBlockerCount || 0} detail="Critical/high scanner findings" accent={(latestDiagnosis.topBlockerCount || 0) ? appleColors.red : appleColors.green} icon={<BugReportOutlined />} />
                  <MetricTile label="Proof linked" value={latestDiagnosis.evidenceCount || 0} detail="Scanner proof items" accent={appleColors.cyan} icon={<ArticleOutlined />} />
                  <MetricTile label="Unmapped" value={latestDiagnosis.unmappedFindingCount || 0} detail="Need human classification" accent={(latestDiagnosis.unmappedFindingCount || 0) ? appleColors.amber : appleColors.green} icon={<InfoOutlined />} />
                </Box>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                {latestDiagnosis.findings.map((finding) => {
                  const recommendedModule = catalogModules.find((module) => module.id === finding.recommendedModuleId);
                  const inCart = !!recommendedModule && cartServiceIds.has(recommendedModule.id);
                  return (
                    <Box key={finding.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
                      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900 }}>{finding.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>{finding.businessRisk || finding.description}</Typography>
                        </Box>
                        <StatusChip label={finding.severity} color={finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'error' : 'warning'} />
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        <PastelChip label={finding.confidenceLevel} accent={appleColors.cyan} bg="#e4f9fd" />
                        {finding.readinessArea && <PastelChip label={finding.readinessArea} accent={appleColors.green} bg="#e7f8ee" />}
                        {finding.recommendedModuleName && <PastelChip label={finding.recommendedModuleName} accent={appleColors.purple} />}
                      </Stack>
                      {(finding.ownerDecision || finding.evidenceRequired) && (
                        <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                          {finding.ownerDecision && (
                            <Box sx={{ p: 1, borderRadius: 1, border: '1px solid', borderColor: '#dbeafe', bgcolor: '#fbfdff' }}>
                              <Typography variant="caption" color="text.secondary">Owner decision</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.45 }}>{finding.ownerDecision}</Typography>
                            </Box>
                          )}
                          {finding.evidenceRequired && (
                            <Box sx={{ p: 1, borderRadius: 1, border: '1px solid', borderColor: '#dcfce7', bgcolor: '#fbfffd' }}>
                              <Typography variant="caption" color="text.secondary">Proof needed</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.45 }}>{finding.evidenceRequired}</Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                      {recommendedModule && (
                        <Button
                          variant={inCart ? 'outlined' : 'contained'}
                          size="small"
                          disabled={inCart || isAddingService}
                          onClick={() => onAddService(recommendedModule, 'Diagnosis')}
                          sx={{ mt: 1.25, minHeight: 36 }}
                        >
                          {inCart ? 'Service in plan' : 'Add recommended service'}
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </>
          ) : (
            <EmptyState label="No product diagnosis yet. Add the launch goal and map the rough edges." />
          )}
        </Stack>
      </Box>

      <Box sx={{ mt: 2 }}>
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
      </Box>
    </Surface>
  );
}
