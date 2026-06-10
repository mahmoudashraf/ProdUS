'use client';

import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';

export type ProjectStartJourneyView = 'readiness' | 'services' | 'talent' | 'handoff';
export type ProjectStartJourneyItem = JourneyStepItem<ProjectStartJourneyView>;

export const isProjectStartJourneyView = (value: string | null): value is ProjectStartJourneyView =>
  value === 'readiness' || value === 'services' || value === 'talent' || value === 'handoff';

export function ProjectStartJourneyNavigation({
  detailOpen,
  items,
  productName,
  currentDetailLabel,
  onOpenHub,
  onOpenDetail,
}: {
  detailOpen: boolean;
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
          { label: 'Product Plan', onClick: onOpenHub },
          { label: productName },
          { label: currentDetailLabel },
        ]}
        backLabel="Product plan"
        onBack={onOpenHub}
      />
    );
  }

  return (
    <OwnerWorkspaceJourneyNav
      label="Product plan"
      value={null}
      items={items}
      onChange={onOpenDetail}
    />
  );
}
