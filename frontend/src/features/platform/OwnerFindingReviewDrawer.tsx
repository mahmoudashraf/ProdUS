'use client';

import { ReactNode } from 'react';
import { AddTaskOutlined, CancelOutlined } from '@mui/icons-material';
import { Box, Button, Drawer, IconButton, Stack, TextField, Typography } from '@mui/material';
import { ownerImpactForCategory, ownerProofLine } from './ownerWorkspaceModel';
import { findingStatusAccent, severityAccent } from './ownerFindingPresentation';
import { appleColors, formatLabel, PastelChip, SectionTitle } from './PlatformComponents';
import { NormalizedFinding, ProductProfile, ScannerEvidenceItem, ServiceModule } from './types';

interface OwnerFindingReviewDrawerProps {
  open: boolean;
  product?: ProductProfile | undefined;
  finding?: NormalizedFinding | undefined;
  ownerCategory: string;
  evidence: ScannerEvidenceItem[];
  decisionReason: string;
  reviewDueOn: string;
  canResolve: boolean;
  canAcceptRisk: boolean;
  recommendedInCart: boolean;
  isAddingService: boolean;
  isUpdatingStatus: boolean;
  isOpeningEvidence: boolean;
  assistantSlot?: ReactNode | undefined;
  onClose: () => void;
  onDecisionReasonChange: (value: string) => void;
  onReviewDueChange: (value: string) => void;
  onRecordDecision: (status: NormalizedFinding['status']) => void;
  onAddService: (serviceModule: ServiceModule, source: string) => void;
  onOpenEvidence: (evidence: ScannerEvidenceItem) => void;
}

export default function OwnerFindingReviewDrawer({
  open,
  product,
  finding,
  ownerCategory,
  evidence,
  decisionReason,
  reviewDueOn,
  canResolve,
  canAcceptRisk,
  recommendedInCart,
  isAddingService,
  isUpdatingStatus,
  isOpeningEvidence,
  assistantSlot,
  onClose,
  onDecisionReasonChange,
  onReviewDueChange,
  onRecordDecision,
  onAddService,
  onOpenEvidence,
}: OwnerFindingReviewDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open && !!finding && !!product}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 560 },
          maxWidth: '100%',
          bgcolor: '#f8fafc',
          overflowX: 'hidden',
        },
      }}
    >
      {finding && product && (
        <Stack sx={{ minHeight: '100%' }}>
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              p: 1.5,
              borderBottom: '1px solid',
              borderColor: appleColors.line,
              bgcolor: '#fff',
            }}
          >
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  Finding review
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.25 }}>
                  {ownerCategory}
                </Typography>
              </Box>
              <IconButton
                aria-label="Close finding review"
                onClick={onClose}
                sx={{ width: 38, height: 38, borderRadius: 1, border: '1px solid', borderColor: appleColors.line }}
              >
                <CancelOutlined fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          <Stack spacing={1.4} sx={{ p: 1.5 }}>
            <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: `${findingStatusAccent(finding.status)}35` }}>
              <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                <PastelChip label={formatLabel(finding.severity)} accent={severityAccent(finding.severity)} bg={`${severityAccent(finding.severity)}12`} />
                <PastelChip label={formatLabel(finding.status)} accent={findingStatusAccent(finding.status)} bg={`${findingStatusAccent(finding.status)}12`} />
                <PastelChip label={finding.confidenceBasis || 'Evidence-backed'} accent={appleColors.cyan} bg="#e4f9fd" />
              </Stack>
              <Typography sx={{ mt: 1, fontWeight: 950, lineHeight: 1.35 }}>
                {finding.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.65, lineHeight: 1.6 }}>
                {finding.businessRisk || finding.description || ownerImpactForCategory(ownerCategory)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8, lineHeight: 1.45 }}>
                Evidence: {ownerProofLine({ sourceTool: finding.sourceTool, sourceRuleId: finding.sourceRuleId, category: ownerCategory })}
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
              <Box sx={{ p: 1, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
                <Typography variant="caption" color="text.secondary">
                  Affected area
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.35 }}>
                  {finding.readinessArea || finding.affectedComponent || 'Product surface'}
                </Typography>
              </Box>
              <Box sx={{ p: 1, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
                <Typography variant="caption" color="text.secondary">
                  Source rule
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
                  {finding.sourceRuleId || finding.sourceTool}
                </Typography>
              </Box>
              <Box sx={{ p: 1, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
                <Typography variant="caption" color="text.secondary">
                  Linked proof
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 850 }}>
                  {evidence.length}
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
                    <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.5 }}>
                      {finding.evidenceRequired}
                    </Typography>
                  </Box>
                )}
                {finding.mappingReason && (
                  <Box sx={{ p: 1, border: '1px solid', borderColor: '#dbeafe', borderRadius: 1, bgcolor: '#fff' }}>
                    <Typography variant="caption" color="text.secondary">
                      Mapping reason
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.5 }}>
                      {finding.mappingReason}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {finding.recommendedModule && (
              <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e3e0ff', bgcolor: '#fff' }}>
                <Typography variant="caption" color="text.secondary">
                  Recommended service
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.35, fontWeight: 950 }}>
                  {finding.recommendedModule.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.45, lineHeight: 1.45 }}>
                  {finding.recommendedModule.ownerOutcome || finding.recommendedModule.description || 'Choose this service for tracked remediation in the productization plan.'}
                </Typography>
                <Button
                  size="small"
                  variant={recommendedInCart ? 'outlined' : 'contained'}
                  disabled={recommendedInCart || isAddingService}
                  startIcon={<AddTaskOutlined />}
                  onClick={() => finding.recommendedModule && onAddService(finding.recommendedModule, 'Finding review')}
                  sx={{ mt: 1, minHeight: 34 }}
                >
                  {recommendedInCart ? 'Already in plan' : 'Choose service'}
                </Button>
              </Box>
            )}

            <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: appleColors.line }}>
              <Typography sx={{ fontWeight: 950 }}>
                Owner decision
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) 150px' }, gap: 1, mt: 1 }}>
                <TextField
                  size="small"
                  label="Decision note"
                  value={decisionReason}
                  onChange={(event) => onDecisionReasonChange(event.target.value)}
                  placeholder="Evidence reviewed, fix merged, compensating control..."
                />
                <TextField
                  size="small"
                  type="date"
                  label="Risk review"
                  value={reviewDueOn}
                  onChange={(event) => onReviewDueChange(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                <Button size="small" variant="outlined" disabled={!canResolve || isUpdatingStatus} onClick={() => onRecordDecision('RESOLVED')}>
                  Mark Resolved
                </Button>
                <Button size="small" variant="outlined" disabled={!canAcceptRisk || isUpdatingStatus} onClick={() => onRecordDecision('ACCEPTED_RISK')}>
                  Accept Risk
                </Button>
                <Button size="small" variant="outlined" disabled={!canResolve || isUpdatingStatus} onClick={() => onRecordDecision('FALSE_POSITIVE')}>
                  False Positive
                </Button>
              </Stack>
            </Box>

            {assistantSlot}

            <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: appleColors.line }}>
              <SectionTitle title="Linked Evidence" action={<PastelChip label={`${evidence.length}`} accent={appleColors.cyan} bg="#e4f9fd" />} />
              {evidence.length ? (
                <Stack spacing={0.75}>
                  {evidence.slice(0, 4).map((item) => (
                    <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 0.75 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 850 }} noWrap>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.source} · {formatLabel(item.confidenceLevel)}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={(!item.storageKey && !item.artifactRef) || isOpeningEvidence}
                        onClick={() => onOpenEvidence(item)}
                        sx={{ minHeight: 34, minWidth: 112 }}
                      >
                        Open Evidence
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                  No dedicated evidence item is linked to this finding yet.
                </Typography>
              )}
            </Box>
          </Stack>
        </Stack>
      )}
    </Drawer>
  );
}
