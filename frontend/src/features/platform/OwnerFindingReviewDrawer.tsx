'use client';

import { ReactNode } from 'react';
import { CancelOutlined } from '@mui/icons-material';
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { appleColors } from './PlatformComponents';
import {
  OwnerFindingDecisionPanel,
  OwnerFindingLinkedEvidencePanel,
} from './OwnerFindingReviewDecisionPanels';
import {
  OwnerFindingFactsGrid,
  OwnerFindingRecommendedServicePanel,
  OwnerFindingSummaryPanel,
} from './OwnerFindingReviewSummaryPanels';
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
                  Risk review
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.25 }}>
                  {ownerCategory}
                </Typography>
              </Box>
              <IconButton
                aria-label="Close risk review"
                onClick={onClose}
                sx={{ width: 38, height: 38, borderRadius: 1, border: '1px solid', borderColor: appleColors.line }}
              >
                <CancelOutlined fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          <Stack spacing={1.4} sx={{ p: 1.5 }}>
            <OwnerFindingSummaryPanel finding={finding} ownerCategory={ownerCategory} />
            <OwnerFindingFactsGrid finding={finding} evidenceCount={evidence.length} />
            <OwnerFindingRecommendedServicePanel
              finding={finding}
              recommendedInCart={recommendedInCart}
              isAddingService={isAddingService}
              onAddService={onAddService}
            />
            <OwnerFindingDecisionPanel
              decisionReason={decisionReason}
              reviewDueOn={reviewDueOn}
              canResolve={canResolve}
              canAcceptRisk={canAcceptRisk}
              isUpdatingStatus={isUpdatingStatus}
              onDecisionReasonChange={onDecisionReasonChange}
              onReviewDueChange={onReviewDueChange}
              onRecordDecision={onRecordDecision}
            />

            {assistantSlot}

            <OwnerFindingLinkedEvidencePanel
              evidence={evidence}
              isOpeningEvidence={isOpeningEvidence}
              onOpenEvidence={onOpenEvidence}
            />
          </Stack>
        </Stack>
      )}
    </Drawer>
  );
}
