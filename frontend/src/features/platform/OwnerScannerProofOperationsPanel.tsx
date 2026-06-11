'use client';

import { ArrowBackOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { OwnerWorkspaceJourneyNav, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import {
  PastelChip,
  SectionTitle,
  appleColors,
} from './PlatformComponents';
import ScannerProofAttachPanel from './ScannerProofAttachPanel';
import ScannerProofAutomationPanel from './ScannerProofAutomationPanel';
import ScannerProofRunPanel from './ScannerProofRunPanel';
import ScannerProofSourcePanel from './ScannerProofSourcePanel';
import {
  ScannerProofAttachPanelProps,
  ScannerProofAutomationPanelProps,
  ScannerProofRunPanelProps,
  ScannerProofSourcePanelProps,
} from './scannerProofOperationsTypes';
import type { ScannerProofOperationView } from './scannerProofOperationModel';

interface OwnerScannerProofOperationsPanelProps
  extends ScannerProofSourcePanelProps,
  ScannerProofRunPanelProps,
  ScannerProofAttachPanelProps,
  ScannerProofAutomationPanelProps {
  operationView?: ScannerProofOperationView | null;
  onOpenOperationHub?: () => void;
  onOpenOperationView?: (view: ScannerProofOperationView) => void;
}

const operationLabels: Record<ScannerProofOperationView, string> = {
  source: 'Connect source',
  run: 'Run checks',
  attach: 'Attach proof',
  fresh: 'Keep proof fresh',
};

export default function OwnerScannerProofOperationsPanel({
  operationView = null,
  onOpenOperationHub = () => {},
  onOpenOperationView = () => {},
  ...props
}: OwnerScannerProofOperationsPanelProps) {
  const activeRunLabel = props.activeScanRun ? 'Running' : props.hostedScanBlockedReason ? 'Needs setup' : 'Ready';
  const operationItems: JourneyStepItem<ScannerProofOperationView>[] = [
    {
      value: 'source',
      label: operationLabels.source,
      detail: 'Choose the repository, live app URL, CI export, or external scanner source for this product.',
      accent: props.scannerSources.length ? appleColors.green : appleColors.amber,
      meta: (
        <PastelChip
          label={`${props.scannerSources.length} source${props.scannerSources.length === 1 ? '' : 's'}`}
          accent={props.scannerSources.length ? appleColors.green : appleColors.amber}
          bg={props.scannerSources.length ? '#e7f8ee' : '#fff4dc'}
        />
      ),
    },
    {
      value: 'run',
      label: operationLabels.run,
      detail: 'Start a focused check or run the full repository, dependency, container, and live app suite.',
      accent: props.activeScanRun ? appleColors.purple : props.hostedScanBlockedReason ? appleColors.amber : appleColors.blue,
      meta: (
        <PastelChip
          label={activeRunLabel}
          accent={props.activeScanRun ? appleColors.purple : props.hostedScanBlockedReason ? appleColors.amber : appleColors.blue}
          bg={props.activeScanRun ? '#f1efff' : props.hostedScanBlockedReason ? '#fff4dc' : '#eaf3ff'}
        />
      ),
    },
    {
      value: 'attach',
      label: operationLabels.attach,
      detail: 'Paste CI output or import scanner results that already exist outside ProdUS.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${props.externalImportProviders.length} imports`} accent={appleColors.purple} bg="#f1efff" />,
    },
    {
      value: 'fresh',
      label: operationLabels.fresh,
      detail: 'Create a refresh schedule or CI template so proof stays current after product changes.',
      accent: props.scheduleBlockedReason ? appleColors.amber : appleColors.cyan,
      meta: (
        <PastelChip
          label={props.scheduleBlockedReason ? 'Needs source' : props.ciTemplate ? 'Template ready' : 'Optional'}
          accent={props.scheduleBlockedReason ? appleColors.amber : appleColors.cyan}
          bg={props.scheduleBlockedReason ? '#fff4dc' : '#e4f9fd'}
        />
      ),
    },
  ];
  const selectedItem = operationItems.find((item) => item.value === operationView) || null;

  const operationContent = operationView === 'source'
    ? <ScannerProofSourcePanel {...props} />
    : operationView === 'run'
      ? <ScannerProofRunPanel {...props} />
      : operationView === 'attach'
        ? <ScannerProofAttachPanel {...props} />
        : operationView === 'fresh'
          ? <ScannerProofAutomationPanel {...props} />
          : null;

  return (
    <Box id="scanner-operations" sx={{ scrollMarginTop: 96 }}>
      <SectionTitle
        title={operationView && selectedItem ? selectedItem.label : 'Scanner setup'}
        action={<PastelChip label={operationView ? 'Focused view' : '4 setup steps'} accent={appleColors.cyan} bg="#e4f9fd" />}
      />
      {!operationView && (
        <Stack spacing={1.25}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Choose the scanner setup task you need now. Each task opens as its own focused setup view, so source setup, scan runs, imports, and refresh rules do not compete on one long page.
          </Typography>
          <OwnerWorkspaceJourneyNav
            label="Scanner setup steps"
            value={null}
            items={operationItems}
            maxColumns={4}
            onChange={onOpenOperationView}
          />
        </Stack>
      )}

      {operationView && selectedItem && (
        <Stack spacing={1.5}>
          <Button
            variant="text"
            startIcon={<ArrowBackOutlined />}
            onClick={onOpenOperationHub}
            sx={{ alignSelf: 'flex-start', minHeight: 36, px: 0.5 }}
          >
            Back to scanner setup
          </Button>
          <Box sx={{ maxWidth: 920 }}>
            <Stack spacing={0.75} sx={{ mb: 1.25 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography sx={{ fontWeight: 950 }}>{selectedItem.label}</Typography>
                {selectedItem.meta}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {selectedItem.detail}
              </Typography>
            </Stack>
            {operationContent}
          </Box>
        </Stack>
      )}
    </Box>
  );
}
