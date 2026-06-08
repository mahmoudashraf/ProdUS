'use client';

import type { ComponentProps } from 'react';
import OwnerFindingsEvidencePanel from './OwnerFindingsEvidencePanel';
import OwnerFindingsRiskPanel from './OwnerFindingsRiskPanel';
import OwnerScannerProofCompanionPanel from './OwnerScannerProofCompanionPanel';
import OwnerScannerProofOperationsPanel from './OwnerScannerProofOperationsPanel';
import OwnerTechnicalProofJourneyPanel from './OwnerTechnicalProofJourneyPanel';
import type { FindingsJourneyView } from './ownerWorkspaceJourneyConfig';
import type { TechnicalProofView } from './ownerTechnicalProofJourneyModel';
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
  technicalProofView?: TechnicalProofView;
  technicalProofDetailOpen?: boolean;
  onOpenTechnicalProofHub?: () => void;
  onOpenTechnicalProofView?: (view: TechnicalProofView) => void;
}

export default function OwnerWorkspaceFindingsPane({
  view,
  detailOpen,
  risks,
  evidence,
  repoReadout,
  technical,
  technicalProofView = 'run',
  technicalProofDetailOpen = false,
  onOpenTechnicalProofHub = () => {},
  onOpenTechnicalProofView = () => {},
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
      <OwnerTechnicalProofJourneyPanel
        detailOpen={technicalProofDetailOpen}
        technical={technical}
        view={technicalProofView}
        onOpenHub={onOpenTechnicalProofHub}
        onViewChange={onOpenTechnicalProofView}
      />
    );
  }

  return <OwnerFindingsRiskPanel {...risks} />;
}
