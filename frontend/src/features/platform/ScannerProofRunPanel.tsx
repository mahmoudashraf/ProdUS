'use client';

import {
  CancelOutlined,
  PlayArrowOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { StatusChip, formatLabel } from './PlatformComponents';
import { ScannerProofRunPanelProps } from './scannerProofOperationsTypes';
import { ScanRun } from './types';

export default function ScannerProofRunPanel({
  selectedProduct,
  scannerSources,
  scanToolOptions,
  activeScanRun,
  hostedScanBlockedReason,
  fullHostedScanBlockedReason,
  hostedScanForm,
  setHostedScanForm,
  isStartingHostedScan,
  isStartingFullHostedScan,
  isCancelingScan,
  onStartHostedScan,
  onStartFullHostedScan,
  onCancelScan,
  defaultToolsForDepth,
}: ScannerProofRunPanelProps) {
  return (
    <Box component="form" onSubmit={(event) => {
      event.preventDefault();
      if (!hostedScanBlockedReason && !activeScanRun) onStartHostedScan();
    }}>
      <Stack spacing={1.25}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography sx={{ fontWeight: 900 }}>Run scanner check</Typography>
          {activeScanRun && <StatusChip label={activeScanRun.status} color={activeScanRun.status === 'RUNNING' ? 'warning' : 'default'} />}
        </Stack>
        <TextField
          select
          size="small"
          label="Source to check"
          value={hostedScanForm.sourceId}
          onChange={(event) => setHostedScanForm((current) => ({ ...current, sourceId: event.target.value }))}
        >
          <MenuItem value="">Use product repository / target</MenuItem>
          {scannerSources.map((source) => (
            <MenuItem key={source.id} value={source.id}>
              {source.displayName} · {formatLabel(source.authorizationStatus)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Check type"
          value={hostedScanForm.depth}
          onChange={(event) => {
            const depth = event.target.value as ScanRun['depth'];
            setHostedScanForm((current) => ({ ...current, depth, toolKeys: defaultToolsForDepth(depth) }));
          }}
        >
          <MenuItem value="SAFE_STATIC">Repository safety check</MenuItem>
          <MenuItem value="DEPENDENCY_CONTAINER">Dependency and container check</MenuItem>
          <MenuItem value="RUNTIME_BASELINE">Live app baseline check</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Checks to run"
          value={hostedScanForm.toolKeys}
          SelectProps={{ multiple: true }}
          onChange={(event) => {
            const value = event.target.value;
            setHostedScanForm((current) => ({
              ...current,
              toolKeys: typeof value === 'string' ? value.split(',') : value as string[],
            }));
          }}
        >
          {scanToolOptions
            .filter((tool) => tool.depths.includes(hostedScanForm.depth))
            .map((tool) => (
              <MenuItem key={tool.key} value={tool.key}>{tool.label}</MenuItem>
            ))}
        </TextField>
        {hostedScanForm.depth === 'SAFE_STATIC' && (
          <TextField
            size="small"
            label="Branch"
            value={hostedScanForm.branchRef}
            onChange={(event) => setHostedScanForm((current) => ({ ...current, branchRef: event.target.value }))}
          />
        )}
        {hostedScanForm.depth === 'DEPENDENCY_CONTAINER' && (
          <TextField
            size="small"
            label="Container image"
            placeholder="registry.example.com/app:sha"
            value={hostedScanForm.containerImageRef}
            onChange={(event) => setHostedScanForm((current) => ({ ...current, containerImageRef: event.target.value }))}
          />
        )}
        {hostedScanForm.depth === 'RUNTIME_BASELINE' && (
          <TextField
            size="small"
            label="Live app URL"
            placeholder={selectedProduct?.productUrl || 'https://staging.example.com'}
            value={hostedScanForm.runtimeTargetUrl}
            onChange={(event) => setHostedScanForm((current) => ({ ...current, runtimeTargetUrl: event.target.value }))}
          />
        )}
        <TextField
          size="small"
          label="Why run this now?"
          value={hostedScanForm.reason}
          onChange={(event) => setHostedScanForm((current) => ({ ...current, reason: event.target.value }))}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={hostedScanForm.authorizationConfirmed}
              onChange={(event) => setHostedScanForm((current) => ({ ...current, authorizationConfirmed: event.target.checked }))}
            />
          }
          label={<Typography variant="body2" color="text.secondary">I am allowed to run these checks on this source.</Typography>}
        />
        {hostedScanForm.depth === 'RUNTIME_BASELINE' && (
          <FormControlLabel
            control={
              <Checkbox
                checked={hostedScanForm.runtimeAuthorizationConfirmed}
                onChange={(event) => setHostedScanForm((current) => ({ ...current, runtimeAuthorizationConfirmed: event.target.checked }))}
              />
            }
            label={<Typography variant="body2" color="text.secondary">I confirm this live app URL is allowed to be checked.</Typography>}
          />
        )}
        {hostedScanBlockedReason && <Alert severity="info" sx={{ borderRadius: 1 }}>{hostedScanBlockedReason}</Alert>}
        {fullHostedScanBlockedReason && fullHostedScanBlockedReason !== hostedScanBlockedReason && (
          <Alert severity="info" sx={{ borderRadius: 1 }}>Full scan suite: {fullHostedScanBlockedReason}</Alert>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<PlayArrowOutlined />}
            disabled={!!hostedScanBlockedReason || !!activeScanRun || isStartingHostedScan}
            sx={{ minHeight: 44, flex: 1 }}
          >
            Start scan
          </Button>
          <Tooltip title={fullHostedScanBlockedReason || 'Run every configured check across the repository, container image, and live app.'}>
            <span style={{ flex: 1 }}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<ShieldOutlined />}
                disabled={!!fullHostedScanBlockedReason || !!activeScanRun || isStartingFullHostedScan}
                onClick={onStartFullHostedScan}
                sx={{ minHeight: 44, width: '100%' }}
              >
                Run full suite
              </Button>
            </span>
          </Tooltip>
          {activeScanRun && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelOutlined />}
              disabled={isCancelingScan}
              onClick={() => onCancelScan(activeScanRun.id)}
              sx={{ minHeight: 44, flex: 1 }}
            >
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
