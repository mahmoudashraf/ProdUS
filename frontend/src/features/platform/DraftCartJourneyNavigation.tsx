'use client';

import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';

export type CartJourneyView = 'readiness' | 'services' | 'talent' | 'handoff';
export type CartJourneyItem = JourneyStepItem<CartJourneyView>;

export const isCartJourneyView = (value: string | null): value is CartJourneyView =>
  value === 'readiness' || value === 'services' || value === 'talent' || value === 'handoff';

export function DraftCartJourneyNavigation({
  detailOpen,
  value,
  items,
  productName,
  currentDetailLabel,
  onOpenHub,
  onOpenDetail,
}: {
  detailOpen: boolean;
  value: CartJourneyView;
  items: CartJourneyItem[];
  productName: string;
  currentDetailLabel: string;
  onOpenHub: () => void;
  onOpenDetail: (step: CartJourneyView) => void;
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
