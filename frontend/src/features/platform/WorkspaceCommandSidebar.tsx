'use client';

import { AddOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { PackageInstance, ProjectWorkspace } from './types';
import {
  type WorkspaceCommandFormController,
  type WorkspaceFormValues,
  workspaceAccent,
} from './workspaceCommandTeamTypes';

interface WorkspaceCommandSidebarProps {
  packages: PackageInstance[];
  workspaceList: ProjectWorkspace[];
  selectedWorkspace: ProjectWorkspace | undefined;
  workspaceForm: WorkspaceCommandFormController<WorkspaceFormValues>;
  isCreatingWorkspace: boolean;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: () => void;
}

export default function WorkspaceCommandSidebar({
  packages,
  workspaceList,
  selectedWorkspace,
  workspaceForm,
  isCreatingWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
}: WorkspaceCommandSidebarProps) {
  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Surface sx={{ maxHeight: { lg: 'calc(100vh - 260px)' }, overflow: { lg: 'auto' }, minWidth: 0 }}>
        <SectionTitle title="Workspaces" action={<PastelChip label={`${workspaceList.length}`} accent={appleColors.cyan} bg="#e4f9fd" />} />
        {workspaceList.length ? (
          <Stack spacing={1}>
            {workspaceList.map((workspace) => (
              <Button
                key={workspace.id}
                fullWidth
                variant={selectedWorkspace?.id === workspace.id ? 'contained' : 'outlined'}
                color={selectedWorkspace?.id === workspace.id ? 'primary' : 'inherit'}
                onClick={() => onSelectWorkspace(workspace.id)}
                sx={{ justifyContent: 'space-between', minHeight: 56, textAlign: 'left', borderRadius: 1, gap: 1.5, minWidth: 0 }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: selectedWorkspace?.id === workspace.id ? 'inherit' : 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {workspace.packageInstance?.productProfile?.name || workspace.packageInstance?.name || 'Service plan'}
                  </Typography>
                </Box>
                <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: workspaceAccent(workspace.status), flex: '0 0 auto' }} />
              </Button>
            ))}
          </Stack>
        ) : (
          <EmptyState label="No workspaces have been opened yet." />
        )}
      </Surface>

      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)', minWidth: 0 }}>
        <SectionTitle title="Create Workspace" action={<AddOutlined sx={{ color: appleColors.purple }} />} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
          Use this when a service plan exists and delivery needs its own workspace.
        </Typography>
        <Box component="form" onSubmit={workspaceForm.handleSubmit(onCreateWorkspace)}>
          <Stack spacing={1.5}>
            <TextField select fullWidth label="Service plan" value={workspaceForm.values.packageInstanceId} onChange={(event) => workspaceForm.setValue('packageInstanceId', event.target.value)}>
              {packages.map((item) => (
                <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
              ))}
            </TextField>
            <TextField fullWidth label="Workspace name" value={workspaceForm.values.name} onChange={(event) => workspaceForm.setValue('name', event.target.value)} />
            <Button type="submit" variant="contained" disabled={!workspaceForm.values.packageInstanceId || isCreatingWorkspace} sx={{ minHeight: 42 }}>
              Create workspace
            </Button>
          </Stack>
        </Box>
      </Surface>
    </Stack>
  );
}
