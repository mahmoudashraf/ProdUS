'use client';

import { type ComponentProps } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import OwnerScannerProofCompanionPanel from './OwnerScannerProofCompanionPanel';
import OwnerScannerProofOperationsPanel from './OwnerScannerProofOperationsPanel';
import { PastelChip, Surface, appleColors } from './PlatformComponents';
import ScannerCoverageGrid from './ScannerCoverageGrid';
import ScannerFixPathPanel from './ScannerFixPathPanel';
import ScannerProofRunway from './ScannerProofRunway';
import StudioAssistantCard from './StudioAssistantCard';
import type { TechnicalProofView } from './ownerTechnicalProofJourneyModel';

type ScannerRunwayProps = ComponentProps<typeof ScannerProofRunway>;
type ScannerCoverageProps = ComponentProps<typeof ScannerCoverageGrid>;
type ScannerFixPathProps = ComponentProps<typeof ScannerFixPathPanel>;
type AssistantProps = ComponentProps<typeof StudioAssistantCard>;
type ScannerOperationsProps = ComponentProps<typeof OwnerScannerProofOperationsPanel>;
type ScannerCompanionProps = ComponentProps<typeof OwnerScannerProofCompanionPanel>;

export interface OwnerTechnicalProofProps {
  runway: ScannerRunwayProps;
  coverage: ScannerCoverageProps;
  fixPath: ScannerFixPathProps;
  assistant: AssistantProps;
  operations: ScannerOperationsProps;
  companion: ScannerCompanionProps;
}

export default function OwnerTechnicalProofJourneyPanel({
  technical,
  view,
  detailOpen,
  onOpenHub,
  onViewChange,
}: {
  technical: OwnerTechnicalProofProps;
  view: TechnicalProofView;
  detailOpen: boolean;
  onOpenHub: () => void;
  onViewChange: (view: TechnicalProofView) => void;
}) {
  const openFindingCount = technical.runway.openFindingCount;
  const completedTools = technical.coverage.latestCoveredTools;
  const totalTools = technical.coverage.totalTools;
  const storedProofCount = technical.runway.evidenceCount;
  const mappedServiceCount = technical.fixPath.mappedServiceNames.length;

  const items: JourneyStepItem<TechnicalProofView>[] = [
    {
      value: 'run',
      label: 'Run Proof',
      detail: 'Prepare the source and queue the scanner suite.',
      accent: completedTools === totalTools ? appleColors.green : appleColors.blue,
      meta: (
        <PastelChip
          label={`${completedTools}/${totalTools} checks`}
          accent={completedTools === totalTools ? appleColors.green : appleColors.blue}
          bg={completedTools === totalTools ? '#e7f8ee' : '#eaf3ff'}
        />
      ),
    },
    {
      value: 'result',
      label: 'Review Result',
      detail: 'Confirm scanner coverage, source health, and recent runs.',
      accent: openFindingCount ? appleColors.amber : appleColors.green,
      meta: (
        <PastelChip
          label={`${openFindingCount} open`}
          accent={openFindingCount ? appleColors.amber : appleColors.green}
          bg={openFindingCount ? '#fff4dc' : '#e7f8ee'}
        />
      ),
    },
    {
      value: 'fix',
      label: 'Fix Path',
      detail: 'Convert blocker proof into services and owner decisions.',
      accent: mappedServiceCount ? appleColors.purple : appleColors.amber,
      meta: (
        <PastelChip
          label={`${mappedServiceCount} services`}
          accent={mappedServiceCount ? appleColors.purple : appleColors.amber}
          bg={mappedServiceCount ? '#f1efff' : '#fff4dc'}
        />
      ),
    },
    {
      value: 'stored',
      label: 'Stored Proof',
      detail: 'Open, export, and filter stored artifacts.',
      accent: storedProofCount ? appleColors.cyan : appleColors.muted,
      meta: (
        <PastelChip
          label={`${storedProofCount} proof`}
          accent={storedProofCount ? appleColors.cyan : appleColors.muted}
          bg={storedProofCount ? '#e4f9fd' : '#f8fafc'}
        />
      ),
    },
  ];
  const selectedItem = items.find((item) => item.value === view) ?? items[0]!;
  const proofContent = (
    <>
      {view === 'run' && (
        <Stack spacing={2}>
          <ScannerProofRunway {...technical.runway} />
          <OwnerScannerProofOperationsPanel {...technical.operations} />
        </Stack>
      )}

      {view === 'result' && (
        <Stack spacing={2}>
          <ScannerCoverageGrid {...technical.coverage} />
          <OwnerScannerProofCompanionPanel {...technical.companion} view="result" />
        </Stack>
      )}

      {view === 'fix' && (
        <Stack spacing={2}>
          <ScannerFixPathPanel {...technical.fixPath} />
          <Box>
            <StudioAssistantCard {...technical.assistant} />
          </Box>
          <OwnerScannerProofCompanionPanel {...technical.companion} view="decisions" />
        </Stack>
      )}

      {view === 'stored' && (
        <OwnerScannerProofCompanionPanel {...technical.companion} view="stored" />
      )}
    </>
  );

  if (!detailOpen) {
    return (
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fffb 100%)' }}>
        <Stack spacing={2}>
          <Box>
            <PastelChip label="Scanner proof workspace" accent={appleColors.green} bg="#e7f8ee" />
            <Typography variant="h3" sx={{ mt: 1 }}>
              Choose the proof task to work on
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 780, lineHeight: 1.65 }}>
              Start with the scanner run, review the latest result, convert blockers into a fix path, or open stored proof. Each task opens as its own internal proof view.
            </Typography>
          </Box>
          <OwnerWorkspaceJourneyNav
            label="Technical proof journey"
            value={null}
            items={items}
            maxColumns={4}
            onChange={onViewChange}
          />
        </Stack>
      </Surface>
    );
  }

  return (
    <Stack spacing={2}>
      <WorkspaceBreadcrumbs
        items={[
          { label: 'Technical proof', onClick: onOpenHub },
          { label: selectedItem.label },
        ]}
        backLabel="Proof choices"
        onBack={onOpenHub}
      />
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fffb 100%)' }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h3">{selectedItem.label}</Typography>
            {selectedItem.meta}
          </Stack>
          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {selectedItem.detail}
          </Typography>
          {proofContent}
        </Stack>
      </Surface>
    </Stack>
  );
}
