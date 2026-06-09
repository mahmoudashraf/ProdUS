'use client';

import { WorkspaceBreadcrumbs } from './OwnerWorkspaceJourneyNav';
import { adminCatalogViewLabel, type AdminCatalogView } from './adminCatalogModel';

export function AdminCatalogBreadcrumb({
  view,
  onOpenHub,
}: {
  view: AdminCatalogView;
  onOpenHub: () => void;
}) {
  return (
    <WorkspaceBreadcrumbs
      items={[
        { label: 'Admin Catalog', onClick: onOpenHub },
        { label: adminCatalogViewLabel[view] },
      ]}
      backLabel="Catalog hub"
      onBack={onOpenHub}
    />
  );
}
