'use client';

import NextLink from 'next/link';
import { OpenInNewOutlined, RocketLaunchOutlined } from '@mui/icons-material';
import { Button, Divider, TextField } from '@mui/material';
import { DotLabel, appleColors } from './PlatformComponents';
import type { ProductProfile } from './types';

interface OwnerProjectStartApprovalControlsProps {
  product?: ProductProfile | undefined;
  projectName: string;
  canStartWorkspace: boolean;
  blockers: number;
  missingServiceNames: string;
  hasWorkspace: boolean;
  serviceCount: number;
  isConverting: boolean;
  onProjectNameChange: (value: string) => void;
  onConvert: () => void;
}

export default function OwnerProjectStartApprovalControls({
  product,
  projectName,
  canStartWorkspace,
  blockers,
  missingServiceNames,
  hasWorkspace,
  serviceCount,
  isConverting,
  onProjectNameChange,
  onConvert,
}: OwnerProjectStartApprovalControlsProps) {
  return (
    <>
      <Divider />
      <TextField
        size="small"
        label="Project workspace name"
        value={projectName}
        onChange={(event) => onProjectNameChange(event.target.value)}
        placeholder={product ? `${product.name} productization workspace` : 'Productization workspace'}
      />

      <Button
        variant="contained"
        startIcon={<RocketLaunchOutlined />}
        disabled={!canStartWorkspace || isConverting}
        onClick={onConvert}
        sx={{ minHeight: 44 }}
      >
        {isConverting ? 'Creating...' : 'Approve Plan And Start Workspace'}
      </Button>
      {!product && <DotLabel label="Select a product before starting" color={appleColors.amber} />}
      {product && !serviceCount && <DotLabel label="Choose at least one productization service" color={appleColors.amber} />}
      {product && serviceCount > 0 && blockers > 0 && (
        <DotLabel
          label={`Choose these services first: ${missingServiceNames}`}
          color={appleColors.red}
        />
      )}
      {hasWorkspace && (
        <Button component={NextLink} href="/workspaces" variant="outlined" endIcon={<OpenInNewOutlined />} sx={{ minHeight: 42 }}>
          Open Project Workspace
        </Button>
      )}
    </>
  );
}
