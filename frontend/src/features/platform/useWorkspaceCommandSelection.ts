'use client';

import { useEffect, useMemo, useState } from 'react';
import { sortWorkspacesForOwner } from './displayOrder';
import type { Milestone, ProjectWorkspace } from './types';

export function useWorkspaceCommandSelection(workspaces: ProjectWorkspace[], requestedWorkspaceId?: string | null) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');

  const workspaceList = useMemo(() => sortWorkspacesForOwner(workspaces), [workspaces]);
  const routeWorkspace = useMemo(
    () => workspaceList.find((workspace) => workspace.id === requestedWorkspaceId),
    [workspaceList, requestedWorkspaceId]
  );
  const selectedWorkspace = useMemo(
    () => routeWorkspace || workspaceList.find((workspace) => workspace.id === selectedWorkspaceId) || workspaceList[0],
    [routeWorkspace, workspaceList, selectedWorkspaceId]
  );

  useEffect(() => {
    if (!selectedWorkspaceId && selectedWorkspace?.id) setSelectedWorkspaceId(selectedWorkspace.id);
  }, [selectedWorkspace?.id, selectedWorkspaceId]);

  return {
    selectedWorkspace,
    selectedWorkspaceId,
    selectedWorkspaceProductId: selectedWorkspace?.packageInstance?.productProfile?.id || '',
    setSelectedWorkspaceId,
    workspaceList,
  };
}

export function useWorkspaceCommandMilestoneSelection(milestones: Milestone[]) {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');

  const selectedMilestone = useMemo(
    () => milestones.find((milestone) => milestone.id === selectedMilestoneId) || milestones[0],
    [milestones, selectedMilestoneId]
  );

  useEffect(() => {
    if (!selectedMilestoneId && milestones[0]) setSelectedMilestoneId(milestones[0].id);
  }, [selectedMilestoneId, milestones]);

  return {
    clearSelectedMilestone: () => setSelectedMilestoneId(''),
    selectedMilestone,
    selectedMilestoneId,
    setSelectedMilestoneId,
  };
}
