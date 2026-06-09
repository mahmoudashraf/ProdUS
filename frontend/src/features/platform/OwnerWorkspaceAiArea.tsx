'use client';

import OwnerProductAiOpportunityPanel from './OwnerProductAiOpportunityPanel';
import type { AiJourneyView } from './ownerWorkspaceJourneyConfig';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import type { ProductProfile } from './types';

export default function OwnerWorkspaceAiArea({
  selectedProduct,
  view,
  workspaceTab,
}: {
  selectedProduct: ProductProfile | undefined;
  view: AiJourneyView;
  workspaceTab: WorkspaceTab;
}) {
  if (!selectedProduct || workspaceTab !== 'ai') return null;
  return <OwnerProductAiOpportunityPanel product={selectedProduct} view={view} />;
}
