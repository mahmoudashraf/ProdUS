'use client';

import {
  PlaylistAddCheckOutlined,
} from '@mui/icons-material';
import { Alert, Box, Stack } from '@mui/material';
import {
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import OwnerProjectStartApprovalControls from './OwnerProjectStartApprovalControls';
import OwnerProjectStartServicesPanel from './OwnerProjectStartServicesPanel';
import OwnerProjectStartSummaryCard from './OwnerProjectStartSummaryCard';
import OwnerProjectStartTalentPanel from './OwnerProjectStartTalentPanel';
import type {
  ProductProfile,
  ProductizationCart,
  ProductizationStartGap,
  ServiceModule,
} from './types';

interface OwnerProjectStartPanelProps {
  product?: ProductProfile | undefined;
  cart?: ProductizationCart | undefined;
  notice?: string;
  canStartWorkspace: boolean;
  blockers: number;
  blockingGaps: ProductizationStartGap[];
  blockingRecommendationNames: string[];
  projectName: string;
  hasWorkspace: boolean;
  isAddingService: boolean;
  isRemovingService: boolean;
  isRemovingTalent: boolean;
  isConverting: boolean;
  onNoticeClose: () => void;
  onProjectNameChange: (value: string) => void;
  onAddGapService: (serviceModule: ServiceModule, notes: string) => void;
  onRemoveService: (itemId: string) => void;
  onRemoveTalent: (itemId: string) => void;
  onConvert: () => void;
}

export default function OwnerProjectStartPanel({
  product,
  cart,
  notice,
  canStartWorkspace,
  blockers,
  blockingGaps,
  blockingRecommendationNames,
  projectName,
  hasWorkspace,
  isAddingService,
  isRemovingService,
  isRemovingTalent,
  isConverting,
  onNoticeClose,
  onProjectNameChange,
  onAddGapService,
  onRemoveService,
  onRemoveTalent,
  onConvert,
}: OwnerProjectStartPanelProps) {
  const serviceItems = cart?.serviceItems || [];
  const talentItems = cart?.talentItems || [];
  const readiness = cart?.startReadiness;
  const missingServiceNames = blockingGaps.map((gap) => gap.title).join(', ') || blockingRecommendationNames.join(', ');

  return (
    <Box id="project-cart" sx={{ scrollMarginTop: 96 }}>
      <Surface>
        <SectionTitle
          title="Product Plan"
          action={<PlaylistAddCheckOutlined sx={{ color: appleColors.purple }} />}
        />
        <Stack spacing={1.5}>
          {notice && (
            <Alert severity="success" onClose={onNoticeClose} sx={{ borderRadius: 1 }}>
              {notice}
            </Alert>
          )}

          <OwnerProjectStartSummaryCard
            product={product}
            readiness={readiness}
            canStartWorkspace={canStartWorkspace}
            blockers={blockers}
            serviceCount={serviceItems.length}
            talentCount={talentItems.length}
          />
          <OwnerProjectStartServicesPanel
            serviceItems={serviceItems}
            productId={product?.id}
            blockingGaps={blockingGaps}
            isAddingService={isAddingService}
            isRemovingService={isRemovingService}
            onAddGapService={onAddGapService}
            onRemoveService={onRemoveService}
          />
          <OwnerProjectStartTalentPanel
            talentItems={talentItems}
            isRemovingTalent={isRemovingTalent}
            onRemoveTalent={onRemoveTalent}
          />
          <OwnerProjectStartApprovalControls
            product={product}
            projectName={projectName}
            canStartWorkspace={canStartWorkspace}
            blockers={blockers}
            missingServiceNames={missingServiceNames}
            hasWorkspace={hasWorkspace}
            serviceCount={serviceItems.length}
            isConverting={isConverting}
            onProjectNameChange={onProjectNameChange}
            onConvert={onConvert}
          />
        </Stack>
      </Surface>
    </Box>
  );
}
