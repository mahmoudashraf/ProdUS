'use client';

import type { ComponentProps } from 'react';
import { Box } from '@mui/material';
import OwnerFindingsEvidencePanel from './OwnerFindingsEvidencePanel';
import OwnerFindingsRiskPanel from './OwnerFindingsRiskPanel';
import OwnerScannerProofCompanionPanel from './OwnerScannerProofCompanionPanel';
import OwnerScannerProofOperationsPanel from './OwnerScannerProofOperationsPanel';
import type { FindingsJourneyView } from './ownerWorkspaceJourneyConfig';
import { Surface } from './PlatformComponents';
import RepoReadoutPanel from './RepoReadoutPanel';
import ScannerCoverageGrid from './ScannerCoverageGrid';
import ScannerFixPathPanel from './ScannerFixPathPanel';
import ScannerProofRunway from './ScannerProofRunway';
import StudioAssistantCard from './StudioAssistantCard';

type RiskPanelProps = ComponentProps<typeof OwnerFindingsRiskPanel>;
type EvidencePanelProps = ComponentProps<typeof OwnerFindingsEvidencePanel>;
type RepoReadoutProps = ComponentProps<typeof RepoReadoutPanel>;
type ScannerRunwayProps = ComponentProps<typeof ScannerProofRunway>;
type ScannerCoverageProps = ComponentProps<typeof ScannerCoverageGrid>;
type ScannerFixPathProps = ComponentProps<typeof ScannerFixPathPanel>;
type AssistantProps = ComponentProps<typeof StudioAssistantCard>;
type ScannerOperationsProps = ComponentProps<typeof OwnerScannerProofOperationsPanel>;
type ScannerCompanionProps = ComponentProps<typeof OwnerScannerProofCompanionPanel>;

interface TechnicalProofProps {
  runway: ScannerRunwayProps;
  coverage: ScannerCoverageProps;
  fixPath: ScannerFixPathProps;
  assistant: AssistantProps;
  operations: ScannerOperationsProps;
  companion: ScannerCompanionProps;
}

interface OwnerWorkspaceFindingsPaneProps {
  view: FindingsJourneyView;
  detailOpen: boolean;
  risks: RiskPanelProps;
  evidence: EvidencePanelProps;
  repoReadout: RepoReadoutProps;
  technical: TechnicalProofProps;
}

export default function OwnerWorkspaceFindingsPane({
  view,
  detailOpen,
  risks,
  evidence,
  repoReadout,
  technical,
}: OwnerWorkspaceFindingsPaneProps) {
  if (!detailOpen) return null;

  if (view === 'evidence') {
    return (
      <>
        <OwnerFindingsEvidencePanel {...evidence} />
        <RepoReadoutPanel {...repoReadout} />
      </>
    );
  }

  if (view === 'technical') {
    return (
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fffb 100%)' }}>
        <ScannerProofRunway {...technical.runway} />
        <ScannerCoverageGrid {...technical.coverage} />
        <ScannerFixPathPanel {...technical.fixPath} />

        <Box sx={{ mb: 2 }}>
          <StudioAssistantCard {...technical.assistant} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '360px minmax(0, 1fr)' }, gap: 2 }}>
          <OwnerScannerProofOperationsPanel {...technical.operations} />
          <OwnerScannerProofCompanionPanel {...technical.companion} />
        </Box>
      </Surface>
    );
  }

  return <OwnerFindingsRiskPanel {...risks} />;
}
