'use client';

import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';

export type ProjectStartJourneyView = 'readiness' | 'services' | 'talent' | 'handoff';
export type ProjectStartJourneyItem = JourneyStepItem<ProjectStartJourneyView>;

export const isProjectStartJourneyView = (value: string | null): value is ProjectStartJourneyView =>
  value === 'readiness' || value === 'services' || value === 'talent' || value === 'handoff';

export function ProjectStartJourneyNavigation({
  detailOpen,
  value,
  items,
  productName,
  currentDetailLabel,
  onOpenHub,
  onOpenDetail,
}: {
  detailOpen: boolean;
  value: ProjectStartJourneyView;
  items: ProjectStartJourneyItem[];
  productName: string;
  currentDetailLabel: string;
  onOpenHub: () => void;
  onOpenDetail: (step: ProjectStartJourneyView) => void;
}) {
  if (detailOpen) {
    return (
      <WorkspaceBreadcrumbs
        items={[
          { label: 'Project Start Plan', onClick: onOpenHub },
          { label: productName },
          { label: currentDetailLabel },
        ]}
        backLabel="Start plan hub"
        onBack={onOpenHub}
      />
    );
  }

  return (
    <OwnerWorkspaceJourneyNav
      label="Project start plan hub"
      value={value}
      items={items}
      onChange={onOpenDetail}
    />
  );
}
