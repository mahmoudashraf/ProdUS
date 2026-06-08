'use client';

import type { FormEvent, ReactNode } from 'react';
import { ManageAccountsOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import {
  SaveButton,
  SectionTitle,
  Surface,
  TextInput,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  type CapabilityPayload,
  type ReputationPayload,
  type TeamMemberPayload,
  type TeamPayload,
  memberRoles,
  teamVerificationStatuses,
} from './teamMatchForms';
import type {
  ProjectWorkspace,
  ServiceCategory,
  ServiceModule,
  Team,
  TeamMember,
} from './types';

type TeamMatchForm<TValues> = {
  values: TValues;
  setValue: <K extends keyof TValues>(field: K, value: TValues[K]) => void;
};

export function CapabilityManagementPanel({
  categories,
  form,
  isSaving,
  modules,
  onSubmit,
}: {
  categories: ServiceCategory[];
  form: TeamMatchForm<CapabilityPayload>;
  isSaving: boolean;
  modules: ServiceModule[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Box component="form" onSubmit={onSubmit}>
      <SectionTitle title="Maintain Capability Evidence" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto' }, gap: 1 }}>
        <TextField
          select
          size="small"
          label="Category"
          value={form.values.serviceCategoryId}
          onChange={(event) => {
            form.setValue('serviceCategoryId', event.target.value);
            form.setValue('serviceModuleId', null);
          }}
        >
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Module" value={form.values.serviceModuleId || ''} onChange={(event) => form.setValue('serviceModuleId', event.target.value || null)}>
          <MenuItem value="">Category level</MenuItem>
          {modules
            .filter((module) => !form.values.serviceCategoryId || module.category?.id === form.values.serviceCategoryId)
            .map((module) => (
              <MenuItem key={module.id} value={module.id}>{module.name}</MenuItem>
            ))}
        </TextField>
        <Button type="submit" variant="outlined" disabled={!form.values.serviceCategoryId || isSaving}>
          Save capability
        </Button>
      </Box>
    </Box>
  );
}

export function MemberManagementPanel({
  form,
  isSaving,
  onSubmit,
}: {
  form: TeamMatchForm<TeamMemberPayload>;
  isSaving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Box component="form" onSubmit={onSubmit}>
      <SectionTitle title="Maintain Delivery Roster" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 190px auto' }, gap: 1 }}>
        <TextField size="small" label="Email" value={form.values.email} onChange={(event) => form.setValue('email', event.target.value)} />
        <TextField select size="small" label="Role" value={form.values.role} onChange={(event) => form.setValue('role', event.target.value as TeamMember['role'])}>
          {memberRoles.map((role) => (
            <MenuItem key={role} value={role}>{formatLabel(role)}</MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="outlined" disabled={!form.values.email || isSaving}>
          Save member
        </Button>
      </Box>
    </Box>
  );
}

export function ReputationManagementPanel({
  form,
  isSaving,
  onSubmit,
  workspaces,
}: {
  form: TeamMatchForm<ReputationPayload>;
  isSaving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  workspaces: ProjectWorkspace[];
}) {
  return (
    <Box component="form" onSubmit={onSubmit}>
      <SectionTitle title="Capture Workspace Review" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 110px 1fr auto' }, gap: 1 }}>
        <TextField select size="small" label="Workspace" value={form.values.workspaceId} onChange={(event) => form.setValue('workspaceId', event.target.value)}>
          {workspaces.map((workspace) => (
            <MenuItem key={workspace.id} value={workspace.id}>{workspace.name}</MenuItem>
          ))}
        </TextField>
        <TextField size="small" type="number" label="Rating" value={form.values.rating} onChange={(event) => form.setValue('rating', Number(event.target.value))} inputProps={{ min: 1, max: 5 }} />
        <TextField size="small" label="Notes" value={form.values.notes} onChange={(event) => form.setValue('notes', event.target.value)} />
        <Button type="submit" variant="outlined" disabled={!form.values.workspaceId || isSaving}>
          Save review
        </Button>
      </Box>
    </Box>
  );
}

export function TeamCreatePanel({
  form,
  isSaving,
  onSubmit,
}: {
  form: TeamMatchForm<TeamPayload>;
  isSaving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Surface>
      <SectionTitle title="Create Team" action={<ManageAccountsOutlined sx={{ color: appleColors.purple }} />} />
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={1.5}>
          <TextInput label="Team name" value={form.values.name} onChange={(name) => form.setValue('name', name)} />
          <TextInput label="Description" value={form.values.description} onChange={(description) => form.setValue('description', description)} multiline />
          <TextInput label="Location / timezone" value={form.values.timezone} onChange={(timezone) => form.setValue('timezone', timezone)} />
          <TextInput label="Capabilities" value={form.values.capabilitiesSummary} onChange={(capabilitiesSummary) => form.setValue('capabilitiesSummary', capabilitiesSummary)} multiline />
          <TextInput label="Typical project size" value={form.values.typicalProjectSize} onChange={(typicalProjectSize) => form.setValue('typicalProjectSize', typicalProjectSize)} />
          <TextField select fullWidth label="Verification" value={form.values.verificationStatus} onChange={(event) => form.setValue('verificationStatus', event.target.value as Team['verificationStatus'])}>
            {teamVerificationStatuses.map((status) => (
              <MenuItem key={status} value={status}>{formatLabel(status)}</MenuItem>
            ))}
          </TextField>
          <SaveButton disabled={!form.values.name || isSaving} label="Create team" />
        </Stack>
      </Box>
    </Surface>
  );
}

export const visibleManagementPanel = (canShow: boolean, panel: ReactNode) => canShow ? panel : null;
