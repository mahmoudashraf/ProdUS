'use client';

import {
  AddOutlined,
  CheckCircleOutline,
  DeleteOutline,
  LocalOfferOutlined,
} from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import {
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { PackageModule, ServiceModule } from './types';

interface IWorkspaceCommandServicesPanelProps {
  canCoordinate: boolean;
  catalogModules: ServiceModule[];
  packageModules: PackageModule[];
  isAssigningService: boolean;
  removingServiceId?: string | null;
  onAssignService: (serviceModuleId: string) => void;
  onRemoveService: (packageModuleId: string) => void;
}

export default function WorkspaceCommandServicesPanel({
  canCoordinate,
  catalogModules,
  packageModules,
  isAssigningService,
  removingServiceId,
  onAssignService,
  onRemoveService,
}: IWorkspaceCommandServicesPanelProps) {
  const selectedServiceIds = useMemo(
    () => new Set(packageModules.map(module => module.serviceModule.id)),
    [packageModules]
  );
  const availableModules = useMemo(
    () =>
      catalogModules.filter(
        module => module.active && module.visible && !selectedServiceIds.has(module.id)
      ),
    [catalogModules, selectedServiceIds]
  );
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const selectedService = availableModules.find(module => module.id === selectedServiceId);

  return (
    <Stack spacing={2}>
      <Surface>
        <SectionTitle
          title="Workspace services"
          action={
            <PastelChip
              label={`${packageModules.length} selected`}
              accent={packageModules.length ? appleColors.purple : appleColors.amber}
              bg={packageModules.length ? '#f3edff' : '#fff4dc'}
            />
          }
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
          The services this workspace is responsible for delivering. Add or remove work here before
          assigning people and checking proof.
        </Typography>

        {packageModules.length ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
              gap: 1.25,
              mt: 1.5,
            }}
          >
            {[...packageModules]
              .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
              .map(module => (
                <Box
                  key={module.id}
                  sx={{
                    border: '1px solid',
                    borderColor: appleColors.line,
                    borderRadius: 1,
                    bgcolor: '#fff',
                    p: 1.35,
                    minWidth: 0,
                  }}
                >
                  <Stack spacing={1.1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                      justifyContent="space-between"
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}
                        >
                          {module.serviceModule.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {module.serviceModule.serviceLayer ||
                            module.serviceModule.category?.name ||
                            'Service'}
                        </Typography>
                      </Box>
                      <StatusChip label={module.status} />
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                      {module.serviceModule.ownerOutcome ||
                        module.serviceModule.description ||
                        module.rationale ||
                        'Selected for this workspace.'}
                    </Typography>

                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      <PastelChip
                        label={module.required ? 'Required' : 'Optional'}
                        accent={module.required ? appleColors.green : appleColors.blue}
                        bg={module.required ? '#e7f8ee' : '#eaf3ff'}
                      />
                      {module.serviceModule.timelineRange && (
                        <PastelChip
                          label={module.serviceModule.timelineRange}
                          accent={appleColors.purple}
                          bg="#f3edff"
                        />
                      )}
                      {module.serviceModule.priceRange && (
                        <PastelChip
                          label={module.serviceModule.priceRange}
                          accent={appleColors.amber}
                          bg="#fff4dc"
                        />
                      )}
                    </Stack>

                    {module.deliverables && (
                      <Box sx={{ borderTop: '1px solid', borderColor: appleColors.line, pt: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 900, color: appleColors.ink }}
                        >
                          Expected output
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.25, lineHeight: 1.5 }}
                        >
                          {module.deliverables}
                        </Typography>
                      </Box>
                    )}

                    {canCoordinate && (
                      <Button
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutline />}
                        disabled={removingServiceId === module.id}
                        onClick={() => onRemoveService(module.id)}
                        sx={{ alignSelf: 'flex-start', minHeight: 38 }}
                      >
                        Remove service
                      </Button>
                    )}
                  </Stack>
                </Box>
              ))}
          </Box>
        ) : (
          <Box sx={{ mt: 1.5 }}>
            <EmptyState label="No services are selected for this workspace yet." />
          </Box>
        )}
      </Surface>

      {canCoordinate && (
        <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
          <Stack spacing={1.5}>
            <SectionTitle
              title="Add a service"
              action={<LocalOfferOutlined sx={{ color: appleColors.purple }} />}
            />
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
              Use this when the work room needs another service, skill, or delivery track.
            </Typography>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1}
              alignItems={{ md: 'flex-start' }}
            >
              <TextField
                select
                size="small"
                label="Service"
                value={selectedServiceId}
                onChange={event => setSelectedServiceId(event.target.value)}
                sx={{ minWidth: { md: 340 }, flex: 1 }}
              >
                {availableModules.map(module => (
                  <MenuItem key={module.id} value={module.id}>
                    {module.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                startIcon={<AddOutlined />}
                disabled={!selectedServiceId || !selectedService || isAssigningService}
                onClick={() => selectedService && onAssignService(selectedService.id)}
                sx={{ minHeight: 40, whiteSpace: 'nowrap' }}
              >
                Add to workspace
              </Button>
            </Stack>

            {selectedService ? (
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: `${appleColors.purple}35`,
                  borderRadius: 1,
                  bgcolor: '#fff',
                  p: 1.2,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutline sx={{ color: appleColors.purple, mt: 0.2 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      {selectedService.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      {selectedService.ownerOutcome ||
                        selectedService.description ||
                        'This service will be added to the workspace and a matching checkpoint will be created.'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[
                        selectedService.timelineRange,
                        selectedService.priceRange,
                        selectedService.humanReviewRequired ? 'Human review' : 'AI-assisted',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {availableModules.length
                  ? 'Choose a service to preview what will be added.'
                  : 'All visible services are already selected.'}
              </Typography>
            )}
          </Stack>
        </Surface>
      )}
    </Stack>
  );
}
