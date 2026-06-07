'use client';

import { Box, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  appleColors,
} from './PlatformComponents';
import ScannerProofAttachPanel from './ScannerProofAttachPanel';
import ScannerProofAutomationPanel from './ScannerProofAutomationPanel';
import ScannerProofOperationAccordion from './ScannerProofOperationAccordion';
import ScannerProofRunPanel from './ScannerProofRunPanel';
import ScannerProofSourcePanel from './ScannerProofSourcePanel';
import {
  ScannerProofAttachPanelProps,
  ScannerProofAutomationPanelProps,
  ScannerProofRunPanelProps,
  ScannerProofSourcePanelProps,
} from './scannerProofOperationsTypes';

interface OwnerScannerProofOperationsPanelProps
  extends ScannerProofSourcePanelProps,
  ScannerProofRunPanelProps,
  ScannerProofAttachPanelProps,
  ScannerProofAutomationPanelProps {}

export default function OwnerScannerProofOperationsPanel(props: OwnerScannerProofOperationsPanelProps) {
  return (
    <Box id="scanner-operations" sx={{ scrollMarginTop: 96 }}>
      <SectionTitle
        title="Proof Operations"
        action={<PastelChip label="Owner workflow" accent={appleColors.cyan} bg="#e4f9fd" />}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, lineHeight: 1.6 }}>
        Use this area to prepare a trusted source, run or schedule proof, and attach evidence the team already has. Tool details stay available, but the decision path stays centered on launch proof.
      </Typography>

      <ScannerProofOperationAccordion
        title="Prepare proof source"
        eyebrow="1"
        detail="Connect the repository, runtime, CI export, or external scanner source that is authorized for this product."
        accent={appleColors.cyan}
        defaultExpanded
      >
        <ScannerProofSourcePanel {...props} />
      </ScannerProofOperationAccordion>

      <ScannerProofOperationAccordion
        title="Run launch proof"
        eyebrow="2"
        detail="Queue the governed proof checks for the chosen source, or run the full repository, dependency, container, and runtime suite."
        accent={appleColors.blue}
      >
        <ScannerProofRunPanel {...props} />
      </ScannerProofOperationAccordion>

      <ScannerProofOperationAccordion
        title="Attach proof already collected"
        eyebrow="3"
        detail="Normalize CI scanner output or import external security results without making the owner read raw artifacts first."
        accent={appleColors.purple}
      >
        <ScannerProofAttachPanel {...props} />
      </ScannerProofOperationAccordion>

      <ScannerProofOperationAccordion
        title="Automate proof refresh"
        eyebrow="4"
        detail="Set a refresh cadence or generate a CI template so the latest proof stays current after each product change."
        accent={appleColors.amber}
      >
        <ScannerProofAutomationPanel {...props} />
      </ScannerProofOperationAccordion>
    </Box>
  );
}
