'use client';

import NextLink from 'next/link';
import {
  AddTaskOutlined,
  AutoAwesomeOutlined,
  OpenInNewOutlined,
  RocketLaunchOutlined,
} from '@mui/icons-material';
import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import {
  DotLabel,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { CatalogRuleItem, ProductProfile, ProjectWorkspace } from './types';

interface ProjectStartApprovalPanelProps {
  product?: ProductProfile | undefined;
  projectName: string;
  canStartWorkspace: boolean;
  serviceCount: number;
  blockers: number;
  blockingRecommendations: CatalogRuleItem[];
  createdWorkspace?: ProjectWorkspace | null | undefined;
  convertedWorkspace?: ProjectWorkspace | undefined;
  isStartingWorkspace: boolean;
  isAddingService: boolean;
  onProjectNameChange: (value: string) => void;
  onStartWorkspace: () => void;
  onAddCatalogRecommendation: (item: CatalogRuleItem) => void;
}

export default function ProjectStartApprovalPanel({
  product,
  projectName,
  canStartWorkspace,
  serviceCount,
  blockers,
  blockingRecommendations,
  createdWorkspace,
  convertedWorkspace,
  isStartingWorkspace,
  isAddingService,
  onProjectNameChange,
  onStartWorkspace,
  onAddCatalogRecommendation,
}: ProjectStartApprovalPanelProps) {
  const hasStartedWorkspace = Boolean(createdWorkspace || convertedWorkspace);
  const blockerText = blockers === 1 ? '1 blocker' : `${blockers} blockers`;

  return (
    <Stack spacing={2.5}>
      <Surface>
        <SectionTitle title="Approve Product Plan" action={<RocketLaunchOutlined sx={{ color: appleColors.purple }} />} />
        <Stack spacing={1.5}>
          <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Approve the selected services and team when they cover the must-fix launch blockers. ProdUS will turn this product plan into delivery milestones, participants, and a workspace.
          </Typography>
          <TextField
            size="small"
            label="Product workspace name"
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
            placeholder={product ? `${product.name} product workspace` : 'Product workspace'}
          />
          <Button
            variant="contained"
            startIcon={<RocketLaunchOutlined />}
            disabled={!canStartWorkspace || isStartingWorkspace}
            onClick={onStartWorkspace}
            sx={{ minHeight: 46 }}
          >
            {isStartingWorkspace ? 'Starting...' : 'Approve product plan'}
          </Button>
          {!product && <DotLabel label="Select a production product first" color={appleColors.amber} />}
          {product && !serviceCount && <DotLabel label="Choose at least one launch-hardening service" color={appleColors.amber} />}
          {product && serviceCount > 0 && blockers > 0 && <DotLabel label={`Cover ${blockerText} before approval`} color={appleColors.red} />}
          {hasStartedWorkspace && (
            <Button component={NextLink} href="/workspaces" variant="outlined" endIcon={<OpenInNewOutlined />} sx={{ minHeight: 42 }}>
              Open created workspace
            </Button>
          )}
        </Stack>
      </Surface>

      {serviceCount > 0 && blockers > 0 && (
        <Surface sx={{ boxShadow: 'none', bgcolor: '#fff7ed', borderColor: '#fed7aa' }}>
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeOutlined sx={{ color: appleColors.amber }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  Blockers to cover before approval
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.45 }}>
                  Choose the missing service work so the plan matches the launch decision.
                </Typography>
              </Box>
            </Stack>
            {blockingRecommendations.length ? (
              blockingRecommendations.map((item) => (
                <Box
                  key={item.recommendedModule.id}
                  sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1, alignItems: 'center' }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{item.recommendedModule.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.reason || item.recommendedModule.ownerOutcome}</Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddTaskOutlined />}
                    disabled={isAddingService}
                    onClick={() => onAddCatalogRecommendation(item)}
                    sx={{ minHeight: 36 }}
                  >
                    Choose
                  </Button>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                This plan still has {blockerText}, but no automatic service recommendation is available. Review the readiness step before approving the workspace.
              </Typography>
            )}
          </Stack>
        </Surface>
      )}

      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
        <SectionTitle title="What Approval Creates" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
        <Stack spacing={1.25}>
          {[
            'Selected services become service plan modules and milestones.',
            'Teams become shortlist records and workspace participants.',
            'Solo experts become specialist participants.',
            'The product becomes the workspace context.',
          ].map((item) => (
            <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
              <Box sx={{ width: 7, height: 7, mt: 1, borderRadius: '50%', bgcolor: appleColors.purple, boxShadow: `0 0 0 4px ${appleColors.purple}14` }} />
              <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {item}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
          Product briefs stay separate. Use them when you need a specific business-goal brief before building a service plan.
        </Typography>
      </Surface>

      <Surface>
        <SectionTitle title="Continue Planning" />
        <Stack spacing={1}>
          <Button component={NextLink} href="/products/new" variant="outlined" sx={{ minHeight: 42 }}>
            Create another product
          </Button>
          <Button component={NextLink} href={product ? `/products/${product.id}` : '/products'} variant="outlined" sx={{ minHeight: 42 }}>
            Open product workspace
          </Button>
          <Button component={NextLink} href="/dashboard" variant="text" sx={{ minHeight: 42 }}>
            Back to Product Home
          </Button>
        </Stack>
      </Surface>
    </Stack>
  );
}
