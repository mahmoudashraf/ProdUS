'use client';

import NextLink from 'next/link';
import {
  AddTaskOutlined,
  AutoAwesomeOutlined,
  DeleteOutlineOutlined,
  OpenInNewOutlined,
  PlaylistAddCheckOutlined,
  RocketLaunchOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Divider, IconButton, Stack, TextField, Typography } from '@mui/material';
import {
  DotLabel,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
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
  const statusAccent = canStartWorkspace ? appleColors.green : blockers ? appleColors.red : appleColors.amber;
  const missingServiceNames = blockingGaps.map((gap) => gap.title).join(', ') || blockingRecommendationNames.join(', ');

  return (
    <Box id="project-cart" sx={{ scrollMarginTop: 96 }}>
      <Surface>
        <SectionTitle
          title="Project Start Plan"
          action={<PlaylistAddCheckOutlined sx={{ color: appleColors.purple }} />}
        />
        <Stack spacing={1.5}>
          {notice && (
            <Alert severity="success" onClose={onNoticeClose} sx={{ borderRadius: 1 }}>
              {notice}
            </Alert>
          )}

          <Box sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: `${statusAccent}30`, bgcolor: `${statusAccent}0d` }}>
            <Typography variant="body2" color="text.secondary">
              {product ? `Draft for ${product.name}` : 'Select a product before starting a workspace'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              <PastelChip label={`${serviceItems.length} services`} accent={appleColors.purple} />
              <PastelChip label={`${talentItems.length} teams / experts`} accent={appleColors.cyan} bg="#e4f9fd" />
              {readiness?.status && <PastelChip label={formatLabel(readiness.status)} accent={statusAccent} bg={`${statusAccent}12`} />}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.55 }}>
              {readiness?.summary || (canStartWorkspace ? 'This plan has enough scope to become a project workspace.' : 'Pick the services and delivery support that make the first workspace actionable.')}
            </Typography>
          </Box>

          {serviceItems.length ? (
            <Stack spacing={0.75}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Selected services</Typography>
              {serviceItems.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  spacing={1}
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                      {item.serviceModule.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.serviceModule.category?.name || 'Lifecycle service'}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    onClick={() => onRemoveService(item.id)}
                    disabled={isRemovingService}
                    sx={{ minHeight: 32, minWidth: 72 }}
                  >
                    Remove
                  </Button>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Box sx={{ p: 1.25, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Add the service that resolves the launch decision before starting the workspace.
              </Typography>
            </Box>
          )}

          {blockingGaps.length > 0 && (
            <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: '#fff7ed', border: '1px solid', borderColor: '#fed7aa' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AutoAwesomeOutlined sx={{ color: appleColors.amber }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      Before this becomes a workspace
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Required scope gaps for the first delivery handoff.
                    </Typography>
                  </Box>
                </Stack>
                {blockingGaps.map((gap) => (
                  <Box
                    key={`${gap.type}-${gap.serviceModule?.id || gap.title}`}
                    sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1, alignItems: 'center' }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{gap.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {gap.description || 'Required before starting.'}
                      </Typography>
                    </Box>
                    {gap.serviceModule ? (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddTaskOutlined />}
                        disabled={isAddingService}
                        onClick={() => onAddGapService(gap.serviceModule!, `Added from the project start plan. ${gap.description || ''}`.trim())}
                        sx={{ minHeight: 36 }}
                      >
                        Add
                      </Button>
                    ) : (
                      <Button component={NextLink} href={gap.type === 'PRODUCT' ? '/products/new' : '/services'} size="small" variant="outlined" sx={{ minHeight: 36 }}>
                        Open
                      </Button>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {talentItems.length ? (
            <Stack spacing={0.75}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Delivery support</Typography>
              {talentItems.map((item) => (
                <Stack key={item.id} direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                      {item.team?.name || item.expertProfile?.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{formatLabel(item.itemType)}</Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => onRemoveTalent(item.id)}
                    disabled={isRemovingTalent}
                    sx={{ width: 34, height: 34, borderRadius: 1, color: appleColors.red, bgcolor: '#fff7f8' }}
                  >
                    <DeleteOutlineOutlined fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Add a matched team or solo expert after the service path is clear.
            </Typography>
          )}

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
            {isConverting ? 'Creating...' : 'Start Project Workspace'}
          </Button>
          {!product && <DotLabel label="Select a product before starting" color={appleColors.amber} />}
          {product && !serviceItems.length && <DotLabel label="Add at least one productization service" color={appleColors.amber} />}
          {product && serviceItems.length > 0 && blockers > 0 && (
            <DotLabel
              label={`Add these services first: ${missingServiceNames}`}
              color={appleColors.red}
            />
          )}
          {hasWorkspace && (
            <Button component={NextLink} href="/workspaces" variant="outlined" endIcon={<OpenInNewOutlined />} sx={{ minHeight: 42 }}>
              Open Project Workspace
            </Button>
          )}
        </Stack>
      </Surface>
    </Box>
  );
}
