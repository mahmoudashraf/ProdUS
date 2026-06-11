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
        title="Scanner setup and runs"
        action={<PastelChip label="Owner workflow" accent={appleColors.cyan} bg="#e4f9fd" />}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, lineHeight: 1.6 }}>
        Use this area to connect the product source, run scanner checks, attach proof the team already has, and keep proof fresh after product changes.
      </Typography>

      <ScannerProofOperationAccordion
        title="Connect product source"
        eyebrow="1"
        detail="Connect the repository, live URL, CI export, or scanner result that belongs to this product."
        accent={appleColors.cyan}
        defaultExpanded
      >
        <ScannerProofSourcePanel {...props} />
      </ScannerProofOperationAccordion>

      <ScannerProofOperationAccordion
        title="Run scanner checks"
        eyebrow="2"
        detail="Start the right checks for this product, or run the full repository, dependency, container, and live app suite."
        accent={appleColors.blue}
      >
        <ScannerProofRunPanel {...props} />
      </ScannerProofOperationAccordion>

      <ScannerProofOperationAccordion
        title="Attach existing proof"
        eyebrow="3"
        detail="Paste CI scanner output or import external security results so ProdUS can turn them into owner-readable risks."
        accent={appleColors.purple}
      >
        <ScannerProofAttachPanel {...props} />
      </ScannerProofOperationAccordion>

      <ScannerProofOperationAccordion
        title="Keep proof fresh"
        eyebrow="4"
        detail="Set a refresh schedule or generate a CI template so scans stay current after product changes."
        accent={appleColors.amber}
      >
        <ScannerProofAutomationPanel {...props} />
      </ScannerProofOperationAccordion>
    </Box>
  );
}
