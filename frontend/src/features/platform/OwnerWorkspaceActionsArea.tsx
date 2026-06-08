'use client';

import type { ComponentProps } from 'react';
import OwnerWorkspaceActionsPane from './OwnerWorkspaceActionsPane';
import type { ActionJourneyView } from './ownerWorkspaceJourneyConfig';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import type { ProductProfile } from './types';

type ActionsPaneProps = ComponentProps<typeof OwnerWorkspaceActionsPane>;
type ActionPlanProps = ActionsPaneProps['actionPlan'];
type DiagnosisProps = ActionsPaneProps['diagnosis'];

interface OwnerWorkspaceActionsAreaProps {
  assistantActions: DiagnosisProps['assistantActions'];
  assistantContext: DiagnosisProps['assistantContext'];
  cartServiceIds: DiagnosisProps['cartServiceIds'];
  catalogModules: DiagnosisProps['catalogModules'];
  detailOpen: boolean;
  diagnosisForm: DiagnosisProps['diagnosisForm'];
  diagnosisPromptFacts: DiagnosisProps['diagnosisPromptFacts'];
  isAddingService: boolean;
  isCreatingDiagnosis: boolean;
  latestDiagnosis: DiagnosisProps['latestDiagnosis'];
  onAddService: DiagnosisProps['onAddService'];
  onCreateDiagnosis: DiagnosisProps['onCreateDiagnosis'];
  onOpenServicesRecommend: ActionPlanProps['onOpenServicesRecommend'];
  ownerActionGroups: ActionPlanProps['ownerActionGroups'];
  selectedProduct: ProductProfile | undefined;
  view: ActionJourneyView;
  workspaceTab: WorkspaceTab;
}

export default function OwnerWorkspaceActionsArea({
  assistantActions,
  assistantContext,
  cartServiceIds,
  catalogModules,
  detailOpen,
  diagnosisForm,
  diagnosisPromptFacts,
  isAddingService,
  isCreatingDiagnosis,
  latestDiagnosis,
  onAddService,
  onCreateDiagnosis,
  onOpenServicesRecommend,
  ownerActionGroups,
  selectedProduct,
  view,
  workspaceTab,
}: OwnerWorkspaceActionsAreaProps) {
  if (!selectedProduct || workspaceTab !== 'actions') return null;

  return (
    <OwnerWorkspaceActionsPane
      view={view}
      detailOpen={detailOpen}
      actionPlan={{
        ownerActionGroups,
        onOpenServicesRecommend,
      }}
      diagnosis={{
        product: selectedProduct,
        diagnosisForm,
        latestDiagnosis,
        catalogModules,
        cartServiceIds,
        diagnosisPromptFacts,
        assistantContext,
        assistantActions,
        isCreatingDiagnosis,
        isAddingService,
        onCreateDiagnosis,
        onAddService,
      }}
    />
  );
}
