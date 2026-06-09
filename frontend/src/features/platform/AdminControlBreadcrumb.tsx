'use client';

import { WorkspaceBreadcrumbs } from './OwnerWorkspaceJourneyNav';
import { adminControlViewLabel, type AdminControlView } from './adminControlModel';

export function AdminControlBreadcrumb({
  view,
  onOpenHub,
}: {
  view: AdminControlView;
  onOpenHub: () => void;
}) {
  return (
    <WorkspaceBreadcrumbs
      items={[
        { label: 'Admin Control', onClick: onOpenHub },
        { label: adminControlViewLabel[view] },
      ]}
      backLabel="Admin home"
      onBack={onOpenHub}
    />
  );
}
