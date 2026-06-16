'use client';

import {
  AddTaskOutlined,
  CheckCircleOutline,
  DeleteOutline,
  SearchOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState, type ReactNode } from 'react';

import {
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  categoryPalette,
} from './PlatformComponents';
import type { AttachmentScope, PackageModule, ServiceModule, WorkspaceParticipant } from './types';
import type {
  WorkspaceServiceAddResponse,
  WorkspaceServiceFindingImpact,
  WorkspaceServiceFindingsUpdateResponse,
} from './types';

interface IWorkspaceCommandServicesPanelProps {
  canCoordinate: boolean;
  catalogModules: ServiceModule[];
  packageModules: PackageModule[];
  participantList?: WorkspaceParticipant[] | undefined;
  participantCount?: number;
  assigningOwnerModuleId?: string | null | undefined;
  isAssigningService: boolean;
  lastServiceAdd?: WorkspaceServiceAddResponse | undefined;
  lastServiceFindingUpdate?: WorkspaceServiceFindingsUpdateResponse | undefined;
  removingServiceId?: string | null;
  serviceFindingImpacts?: WorkspaceServiceFindingImpact[] | undefined;
  isUpdatingServiceFindings?: boolean;
  onAssignService: (serviceModuleId: string) => void;
  onAssignServiceOwner?: ((packageModuleId: string, ownerUserId: string) => void) | undefined;
  onIncludeServiceFindings?: (
    serviceModuleId: string,
    riskThreadIds: string[],
    includeExcluded?: boolean
  ) => void;
  onOpenFixAndVerify?: () => void;
  onOpenChecklist?: () => void;
  onOpenPeople?: () => void;
  evidencePanel?: ((scopeType: AttachmentScope, scopeId: string) => ReactNode) | undefined;
  onRemoveService: (packageModuleId: string) => void;
}

export default function WorkspaceCommandServicesPanel({
  canCoordinate,
  catalogModules,
  packageModules,
  participantList = [],
  participantCount = 0,
  assigningOwnerModuleId,
  isAssigningService,
  lastServiceAdd,
  lastServiceFindingUpdate,
  removingServiceId,
  serviceFindingImpacts = [],
  isUpdatingServiceFindings,
  onAssignService,
  onAssignServiceOwner,
  onIncludeServiceFindings,
  onOpenFixAndVerify,
  onOpenChecklist,
  onOpenPeople,
  evidencePanel,
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
  const impactByServiceId = useMemo(
    () => new Map(serviceFindingImpacts.map(impact => [impact.serviceModuleId, impact])),
    [serviceFindingImpacts]
  );
  const [serviceQuery, setServiceQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [showAllMatches, setShowAllMatches] = useState(false);
  const normalizedQuery = serviceQuery.trim().toLowerCase();
  const ownerOptions = useMemo(
    () =>
      participantList
        .filter(participant => participant.active)
        .map(participant => participant.user)
        .filter((user, index, users) => users.findIndex(item => item.id === user.id) === index),
    [participantList]
  );

  const sortedAvailableModules = useMemo(
    () =>
      [...availableModules].sort((a, b) => {
        const categoryOrder = (a.category?.sortOrder ?? 999) - (b.category?.sortOrder ?? 999);
        if (categoryOrder !== 0) return categoryOrder;
        return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
      }),
    [availableModules]
  );

  const serviceCategories = useMemo(() => {
    const categoryMap = new Map<
      string,
      { id: string; name: string; count: number; sortOrder: number }
    >();

    sortedAvailableModules.forEach(module => {
      const id = module.category?.id || 'uncategorized';
      const existing = categoryMap.get(id);
      if (existing) {
        existing.count += 1;
        return;
      }
      categoryMap.set(id, {
        id,
        name: module.category?.name || 'Other services',
        count: 1,
        sortOrder: module.category?.sortOrder ?? 999,
      });
    });

    return [...categoryMap.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
    );
  }, [sortedAvailableModules]);

  const matchedModules = useMemo(
    () =>
      sortedAvailableModules.filter(module => {
        const categoryMatches =
          selectedCategoryId === 'all' ||
          (module.category?.id || 'uncategorized') === selectedCategoryId;
        if (!categoryMatches) return false;

        if (!normalizedQuery) return true;
        const searchable = [
          module.name,
          module.category?.name,
          module.serviceLayer,
          module.ownerOutcome,
          module.description,
          module.expectedDeliverables,
          module.suggestedTeamRoles,
          module.aiAssistanceTags,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchable.includes(normalizedQuery);
      }),
    [normalizedQuery, selectedCategoryId, sortedAvailableModules]
  );

  const initialVisibleCount = selectedCategoryId === 'all' && !normalizedQuery ? 4 : 6;
  const visibleModules = showAllMatches
    ? matchedModules
    : matchedModules.slice(0, initialVisibleCount);
  const hiddenModuleCount = Math.max(0, matchedModules.length - visibleModules.length);

  return (
    <Stack spacing={2}>
      {lastServiceAdd?.ownerNotice && (
        <Alert severity={lastServiceAdd.addedFindingCount ? 'success' : 'info'}>
          {lastServiceAdd.ownerNotice}
        </Alert>
      )}
      {lastServiceFindingUpdate?.ownerNotice && (
        <Alert severity="success">{lastServiceFindingUpdate.ownerNotice}</Alert>
      )}

      <Surface>
        <SectionTitle
          title="Work scope"
          action={
            <PastelChip
              label={`${packageModules.length} selected`}
              accent={packageModules.length ? appleColors.purple : appleColors.amber}
              bg={packageModules.length ? '#f3edff' : '#fff4dc'}
            />
          }
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
          The services this workspace owns. Findings should enter the workspace through these
          services, then people and checks can be attached to the work.
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
              .map(module => {
                const impact = impactByServiceId.get(module.serviceModule.id);
                const coveredCount = impact?.findingsAlreadyInWorkspaceCount || 0;
                const willAddCount = impact?.findingsWillBeAddedCount || 0;
                const excludedCount = impact?.findingsExcludedFromWorkspaceCount || 0;
                const laneState = serviceLaneState(
                  module,
                  coveredCount,
                  willAddCount,
                  participantCount
                );
                const ownerValue = module.owner?.email || 'Needs named owner';
                return (
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
                          <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                            <PastelChip
                              label="Service lane"
                              accent={appleColors.purple}
                              bg="#f3edff"
                            />
                            <PastelChip
                              label={laneState.label}
                              accent={laneState.accent}
                              bg={laneState.bg}
                            />
                          </Stack>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 950, overflowWrap: 'anywhere', mt: 0.55 }}
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

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                          gap: 0.75,
                        }}
                      >
                        <WorkLaneFact
                          label="Why here"
                          value={
                            coveredCount
                              ? `${coveredCount} scanner finding${coveredCount === 1 ? '' : 's'} already map to this service.`
                              : willAddCount
                                ? `${willAddCount} matching finding${willAddCount === 1 ? '' : 's'} can be pulled into this lane.`
                                : module.rationale ||
                                  module.serviceModule.ownerOutcome ||
                                  'Selected as useful productionization work.'
                          }
                        />
                        <WorkLaneFact label="Owner" value={ownerValue} />
                        <WorkLaneFact
                          label="Findings"
                          value={`${coveredCount} included, ${willAddCount} available, ${excludedCount} removed`}
                        />
                        <WorkLaneFact label="State" value={laneState.detail} />
                      </Box>

                      {canCoordinate && onAssignServiceOwner && (
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Service owner"
                          value={module.owner?.id || ''}
                          disabled={!ownerOptions.length || assigningOwnerModuleId === module.id}
                          onChange={event => onAssignServiceOwner(module.id, event.target.value)}
                          helperText={
                            ownerOptions.length
                              ? 'Pick the person accountable for this service lane.'
                              : 'Add a person before assigning this service.'
                          }
                        >
                          <MenuItem value="" disabled>
                            Needs named owner
                          </MenuItem>
                          {ownerOptions.map(owner => (
                            <MenuItem key={owner.id} value={owner.id}>
                              {owner.email}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}

                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        <PastelChip
                          label={
                            coveredCount
                              ? `${coveredCount} finding${coveredCount === 1 ? '' : 's'} covered`
                              : 'No assigned findings yet'
                          }
                          accent={coveredCount ? appleColors.amber : appleColors.muted}
                          bg={coveredCount ? '#fff4dc' : '#f8fafc'}
                        />
                        {excludedCount > 0 && (
                          <PastelChip
                            label={`${excludedCount} removed`}
                            accent={appleColors.red}
                            bg="#fff1f2"
                          />
                        )}
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
                            Owner-visible output
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

                      <Box
                        sx={{
                          border: '1px solid',
                          borderColor: '#dbe7f5',
                          borderRadius: 1,
                          bgcolor: '#fbfdff',
                          p: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 900, color: appleColors.ink }}
                        >
                          Service checklist
                        </Typography>
                        <Stack spacing={0.6} sx={{ mt: 0.75 }}>
                          <ChecklistRow
                            done={!!module.owner?.id}
                            label="Confirm owner"
                            detail={
                              module.owner?.email
                                ? `${module.owner.email} owns this lane.`
                                : participantCount
                                  ? 'People are attached; choose who owns this lane.'
                                  : 'Add or assign a person before handoff.'
                            }
                          />
                          <ChecklistRow
                            done={coveredCount > 0 && module.status !== 'PLANNED'}
                            label="Work included findings"
                            detail={
                              coveredCount
                                ? `${coveredCount} finding${coveredCount === 1 ? '' : 's'} in this lane.`
                                : 'Include service-owned findings when they become real work.'
                            }
                          />
                          <ChecklistRow
                            done={module.status === 'REVIEW' || module.status === 'ACCEPTED'}
                            label="Attach proof or run Check fixes"
                            detail="Verify the claim before calling this service ready."
                          />
                          <ChecklistRow
                            done={module.status === 'ACCEPTED'}
                            label="Prepare handoff when complete"
                            detail="Runbook and support notes matter after fixes are verified."
                          />
                        </Stack>
                      </Box>

                      {impact?.findingsAlreadyInWorkspace?.length ? (
                        <Box
                          sx={{
                            border: '1px solid',
                            borderColor: '#e1e8f4',
                            borderRadius: 1,
                            bgcolor: '#fbfdff',
                            p: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 900, color: appleColors.ink }}
                          >
                            Findings this service is already helping
                          </Typography>
                          <Stack spacing={0.5} sx={{ mt: 0.6 }}>
                            {impact.findingsAlreadyInWorkspace.slice(0, 2).map(finding => (
                              <Typography
                                key={finding.id}
                                variant="body2"
                                color="text.secondary"
                                sx={{ lineHeight: 1.4, overflowWrap: 'anywhere' }}
                              >
                                {finding.title}
                              </Typography>
                            ))}
                          </Stack>
                        </Box>
                      ) : null}

                      {impact?.findingsWillBeAdded?.length ? (
                        <Box
                          sx={{
                            border: '1px solid',
                            borderColor: '#eadfc1',
                            borderRadius: 1,
                            bgcolor: '#fffaf0',
                            p: 1,
                          }}
                        >
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={0.75}
                            alignItems={{ sm: 'center' }}
                            justifyContent="space-between"
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 900, color: appleColors.ink }}
                              >
                                Available findings for this service
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                {impact.findingsWillBeAdded.length} matching finding
                                {impact.findingsWillBeAdded.length === 1 ? '' : 's'} can be included
                                in this workspace lane.
                              </Typography>
                            </Box>
                            {onIncludeServiceFindings && (
                              <Button
                                variant="outlined"
                                size="small"
                                disabled={!!isUpdatingServiceFindings}
                                onClick={() =>
                                  onIncludeServiceFindings(
                                    module.serviceModule.id,
                                    impact.findingsWillBeAdded.map(finding => finding.id),
                                    false
                                  )
                                }
                                sx={{ minHeight: 36, flex: '0 0 auto' }}
                              >
                                Include findings
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      ) : null}

                      {evidencePanel && (
                        <Box
                          sx={{
                            border: '1px solid',
                            borderColor: '#dbe7f5',
                            borderRadius: 1,
                            bgcolor: '#fbfdff',
                            p: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 900, color: appleColors.ink }}
                          >
                            Service proof
                          </Typography>
                          {evidencePanel('SERVICE', module.id)}
                        </Box>
                      )}

                      {impact?.findingsExcludedFromWorkspace?.length ? (
                        <Box
                          sx={{
                            border: '1px solid',
                            borderColor: '#ffd7cc',
                            borderRadius: 1,
                            bgcolor: '#fff8f5',
                            p: 1,
                          }}
                        >
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={0.75}
                            alignItems={{ sm: 'center' }}
                            justifyContent="space-between"
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 900, color: appleColors.ink }}
                              >
                                Removed from this workspace
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                {impact.findingsExcludedFromWorkspace.length} finding
                                {impact.findingsExcludedFromWorkspace.length === 1 ? '' : 's'} can
                                be re-added under this service.
                              </Typography>
                            </Box>
                            {onIncludeServiceFindings && (
                              <Button
                                variant="outlined"
                                size="small"
                                disabled={!!isUpdatingServiceFindings}
                                onClick={() =>
                                  onIncludeServiceFindings(
                                    module.serviceModule.id,
                                    impact.findingsExcludedFromWorkspace.map(finding => finding.id),
                                    true
                                  )
                                }
                                sx={{ minHeight: 36, flex: '0 0 auto' }}
                              >
                                Re-add
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      ) : null}

                      {canCoordinate && (
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={0.75}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {onOpenPeople && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={onOpenPeople}
                              sx={{ minHeight: 36 }}
                            >
                              Assign owner
                            </Button>
                          )}
                          {onOpenFixAndVerify && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={onOpenFixAndVerify}
                              sx={{ minHeight: 36 }}
                            >
                              Manage findings
                            </Button>
                          )}
                          {onOpenChecklist && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={onOpenChecklist}
                              sx={{ minHeight: 36 }}
                            >
                              Create checklist
                            </Button>
                          )}
                          <Button
                            color="error"
                            variant="outlined"
                            size="small"
                            startIcon={<DeleteOutline />}
                            disabled={removingServiceId === module.id}
                            onClick={() => onRemoveService(module.id)}
                            sx={{ minHeight: 36 }}
                          >
                            Remove service
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  </Box>
                );
              })}
          </Box>
        ) : (
          <Box sx={{ mt: 1.5 }}>
            <EmptyState label="No services are selected for this workspace yet." />
          </Box>
        )}
      </Surface>

      {canCoordinate && (
        <Surface
          id="browse-workspace-services"
          sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}
        >
          <Stack spacing={1.5}>
            <SectionTitle
              title="Add work to this scope"
              action={
                <PastelChip
                  label={`${availableModules.length} available`}
                  accent={availableModules.length ? appleColors.cyan : appleColors.green}
                  bg={availableModules.length ? '#e4f9fd' : '#e7f8ee'}
                />
              }
            />
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
              Add more productionization work without leaving the workspace. Each service previews
              which scanner findings it can bring into scope before you add it.
            </Typography>

            {availableModules.length ? (
              <>
                <TextField
                  size="small"
                  label="Find a service"
                  value={serviceQuery}
                  onChange={event => {
                    setServiceQuery(event.target.value);
                    setShowAllMatches(false);
                  }}
                  placeholder="Search security, testing, launch, database..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  <Button
                    variant={selectedCategoryId === 'all' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => {
                      setSelectedCategoryId('all');
                      setShowAllMatches(false);
                    }}
                    sx={{ minHeight: 34 }}
                  >
                    All services
                  </Button>
                  {serviceCategories.map((category, index) => {
                    const palette =
                      categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategoryId === category.id ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setShowAllMatches(false);
                        }}
                        sx={{
                          minHeight: 34,
                          color: selectedCategoryId === category.id ? '#fff' : palette.accent,
                          borderColor: `${palette.accent}55`,
                          bgcolor: selectedCategoryId === category.id ? palette.accent : '#fff',
                          '&:hover': {
                            borderColor: palette.accent,
                            bgcolor:
                              selectedCategoryId === category.id ? palette.accent : palette.bg,
                          },
                        }}
                      >
                        {category.name} · {category.count}
                      </Button>
                    );
                  })}
                </Stack>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, minmax(0, 1fr))',
                      xl: 'repeat(3, minmax(0, 1fr))',
                    },
                    gap: 1.25,
                  }}
                >
                  {visibleModules.map((module, index) => {
                    const categoryIndex = serviceCategories.findIndex(
                      category => category.id === (module.category?.id || 'uncategorized')
                    );
                    const palette =
                      categoryPalette[
                        (categoryIndex >= 0 ? categoryIndex : index) % categoryPalette.length
                      ] ?? categoryPalette[0]!;
                    const impact = impactByServiceId.get(module.id);
                    const willAddCount = impact?.findingsWillBeAddedCount || 0;
                    const alreadyCoveredCount = impact?.findingsAlreadyInWorkspaceCount || 0;
                    const excludedCount = impact?.findingsExcludedFromWorkspaceCount || 0;

                    return (
                      <Box
                        key={module.id}
                        sx={{
                          border: '1px solid',
                          borderColor: `${palette.accent}33`,
                          borderRadius: 1,
                          bgcolor: '#fff',
                          p: 1.35,
                          minWidth: 0,
                          borderTop: `3px solid ${palette.accent}`,
                        }}
                      >
                        <Stack spacing={1.1} sx={{ height: '100%' }}>
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 1,
                                bgcolor: palette.bg,
                                color: palette.accent,
                                display: 'grid',
                                placeItems: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <CheckCircleOutline fontSize="small" />
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}
                              >
                                {module.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {module.category?.name || module.serviceLayer || 'Service'}
                              </Typography>
                            </Box>
                          </Stack>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              lineHeight: 1.55,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {module.ownerOutcome ||
                              module.description ||
                              'Add this service when the workspace needs this workstream.'}
                          </Typography>

                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <PastelChip
                              label={
                                willAddCount
                                  ? `${willAddCount} finding${willAddCount === 1 ? '' : 's'} will be added`
                                  : excludedCount
                                    ? `${excludedCount} removed finding${excludedCount === 1 ? '' : 's'}`
                                    : alreadyCoveredCount
                                      ? `${alreadyCoveredCount} already covered`
                                      : 'No scanner finding match'
                              }
                              accent={
                                willAddCount
                                  ? appleColors.amber
                                  : excludedCount
                                    ? appleColors.red
                                    : alreadyCoveredCount
                                      ? appleColors.green
                                      : appleColors.muted
                              }
                              bg={
                                willAddCount
                                  ? '#fff4dc'
                                  : excludedCount
                                    ? '#fff1f2'
                                    : alreadyCoveredCount
                                      ? '#e7f8ee'
                                      : '#f8fafc'
                              }
                            />
                            {module.timelineRange && (
                              <PastelChip
                                label={module.timelineRange}
                                accent={palette.accent}
                                bg={palette.bg}
                              />
                            )}
                            {module.priceRange && (
                              <PastelChip
                                label={module.priceRange}
                                accent={appleColors.amber}
                                bg="#fff4dc"
                              />
                            )}
                            {module.humanReviewRequired && (
                              <PastelChip
                                label="Human reviewed"
                                accent={appleColors.green}
                                bg="#e7f8ee"
                              />
                            )}
                          </Stack>

                          {module.expectedDeliverables && (
                            <Box
                              sx={{
                                borderTop: '1px solid',
                                borderColor: appleColors.line,
                                pt: 1,
                                mt: 'auto',
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 900, color: appleColors.ink }}
                              >
                                What it adds
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mt: 0.25,
                                  lineHeight: 1.45,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {module.expectedDeliverables}
                              </Typography>
                            </Box>
                          )}

                          {impact?.findingsWillBeAdded?.length ? (
                            <Box
                              sx={{
                                border: '1px solid',
                                borderColor: '#eadfc1',
                                borderRadius: 1,
                                bgcolor: '#fffaf0',
                                p: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 900, color: appleColors.ink }}
                              >
                                Findings that will move into this workspace
                              </Typography>
                              <Stack spacing={0.45} sx={{ mt: 0.65 }}>
                                {impact.findingsWillBeAdded.slice(0, 3).map(finding => (
                                  <Typography
                                    key={finding.id}
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      lineHeight: 1.35,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {finding.title}
                                  </Typography>
                                ))}
                                {impact.findingsWillBeAdded.length > 3 && (
                                  <Typography variant="caption" color="text.secondary">
                                    +{impact.findingsWillBeAdded.length - 3} more matching findings
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                          ) : null}

                          <Button
                            variant="contained"
                            startIcon={<AddTaskOutlined />}
                            disabled={isAssigningService}
                            onClick={() => onAssignService(module.id)}
                            sx={{
                              mt: module.expectedDeliverables ? 0 : 'auto',
                              minHeight: 40,
                              alignSelf: 'flex-start',
                              bgcolor: palette.accent,
                              '&:hover': { bgcolor: palette.accent },
                            }}
                          >
                            {willAddCount
                              ? `Add service + ${willAddCount} finding${willAddCount === 1 ? '' : 's'}`
                              : 'Add to workspace'}
                          </Button>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>

                {hiddenModuleCount > 0 && (
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    alignItems={{ sm: 'center' }}
                    justifyContent="space-between"
                  >
                    <Typography variant="body2" color="text.secondary">
                      Showing {visibleModules.length} focused services. Search or choose a category
                      to narrow the remaining {hiddenModuleCount}.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setShowAllMatches(true)}
                      sx={{ minHeight: 36, alignSelf: { xs: 'stretch', sm: 'center' } }}
                    >
                      Show more services
                    </Button>
                  </Stack>
                )}

                {showAllMatches && matchedModules.length > initialVisibleCount && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowAllMatches(false)}
                    sx={{ minHeight: 34, alignSelf: 'flex-start' }}
                  >
                    Show fewer services
                  </Button>
                )}

                {!visibleModules.length && (
                  <EmptyState label="No available service matches this search. Clear the search or choose another category." />
                )}
              </>
            ) : (
              <EmptyState label="All visible services are already assigned to this workspace." />
            )}
          </Stack>
        </Surface>
      )}
    </Stack>
  );
}

function WorkLaneFact({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: '#e2e8f0',
        borderRadius: 1,
        bgcolor: '#f8fafc',
        p: 0.85,
        minWidth: 0,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, lineHeight: 1.4, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  );
}

function ChecklistRow({ done, detail, label }: { done: boolean; detail: string; label: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="flex-start">
      <CheckCircleOutline
        fontSize="small"
        sx={{ color: done ? appleColors.green : appleColors.muted, mt: 0.1 }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.35 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
          {detail}
        </Typography>
      </Box>
    </Stack>
  );
}

function serviceLaneState(
  module: PackageModule,
  coveredCount: number,
  willAddCount: number,
  participantCount: number
) {
  if (module.status === 'BLOCKED') {
    return {
      label: 'Blocked',
      detail: 'Needs a decision before this service can move.',
      accent: appleColors.red,
      bg: '#fff1f1',
    };
  }
  if (!module.owner?.id) {
    return {
      label: 'Needs owner',
      detail: participantCount
        ? 'Choose which workspace person owns this lane.'
        : 'No person is attached to own this lane yet.',
      accent: appleColors.amber,
      bg: '#fff4dc',
    };
  }
  if (!coveredCount && willAddCount) {
    return {
      label: 'Needs findings',
      detail: 'Matching findings are available but not included yet.',
      accent: appleColors.blue,
      bg: '#eaf3ff',
    };
  }
  if (module.status === 'REVIEW' || module.status === 'ACCEPTED') {
    return {
      label: module.status === 'ACCEPTED' ? 'Ready' : 'Ready to check',
      detail: 'Proof/check work is ready for owner review.',
      accent: appleColors.green,
      bg: '#e7f8ee',
    };
  }
  return {
    label: coveredCount ? 'Needs proof/check' : 'Needs scope',
    detail: coveredCount
      ? 'Included findings need proof or targeted checks.'
      : 'No service-owned findings are included yet.',
    accent: coveredCount ? appleColors.purple : appleColors.muted,
    bg: coveredCount ? '#f3edff' : '#f8fafc',
  };
}
