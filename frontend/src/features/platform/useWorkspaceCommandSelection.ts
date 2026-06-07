'use client';

import { useEffect, useMemo, useState } from 'react';
import { sortWorkspacesForOwner } from './displayOrder';
import type { Milestone, ProjectWorkspace } from './types';

export function useWorkspaceCommandSelection(workspaces: ProjectWorkspace[]) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');

  const workspaceList = useMemo(() => sortWorkspacesForOwner(workspaces), [workspaces]);
  const selectedWorkspace = useMemo(
    () => workspaceList.find((workspace) => workspace.id === selectedWorkspaceId) || workspaceList[0],
    [workspaceList, selectedWorkspaceId]
  );

  useEffect(() => {
    if (!selectedWorkspaceId && workspaceList[0]) setSelectedWorkspaceId(workspaceList[0].id);
  }, [selectedWorkspaceId, workspaceList]);

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
