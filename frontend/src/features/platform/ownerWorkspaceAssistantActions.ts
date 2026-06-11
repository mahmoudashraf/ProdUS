import { assistantRecordText, type StudioAssistantContext } from './StudioAssistantCard';
import type { PackageInstance, ProductProfile, ProjectWorkspace } from './types';

interface OwnerWorkspaceAssistantActionsInput {
  buildTargetRequirementId: string;
  cartBlockers: number;
  cartBlockingGapTitles: string[];
  cartBlockingRecommendationNames: string[];
  cartServiceItemCount: number;
  hostedScanBlockedReason: string;
  onAcceptFindingRisk: (reason: string) => Promise<void>;
  onBuildPackage: (requirementId: string) => Promise<void>;
  onConvertCart: () => Promise<void>;
  onStartHostedScan: () => Promise<void>;
  selectedFindingId?: string | undefined;
  selectedPackage?: PackageInstance | undefined;
  selectedProduct?: ProductProfile | undefined;
  selectedWorkspace?: ProjectWorkspace | undefined;
  startReadiness: StudioAssistantContext['startReadiness'];
}

const assistantActionName = (action: Record<string, unknown>) =>
  assistantRecordText(action, ['name', 'action', 'toolName']).toLowerCase();

const assistantActionInput = (action: Record<string, unknown>) =>
  action.input && typeof action.input === 'object' && !Array.isArray(action.input)
    ? action.input as Record<string, unknown>
    : {};

const blockingServiceMessage = (gapTitles: string[], recommendationNames: string[]) =>
  `Choose required services first: ${gapTitles.join(', ') || recommendationNames.join(', ')}.`;

export function buildOwnerWorkspaceAssistantActions({
  buildTargetRequirementId,
  cartBlockers,
  cartBlockingGapTitles,
  cartBlockingRecommendationNames,
  cartServiceItemCount,
  hostedScanBlockedReason,
  onAcceptFindingRisk,
  onBuildPackage,
  onConvertCart,
  onStartHostedScan,
  selectedFindingId,
  selectedPackage,
  selectedProduct,
  selectedWorkspace,
  startReadiness,
}: OwnerWorkspaceAssistantActionsInput) {
  const assistantContext = (pageType: string, overrides: Partial<StudioAssistantContext> = {}): StudioAssistantContext => ({
    pageType,
    productId: selectedProduct?.id,
    packageId: selectedPackage?.id,
    workspaceId: selectedWorkspace?.id,
    startReadiness,
    ...overrides,
  });

  const actionDisabledReason = (action: Record<string, unknown>) => {
    const name = assistantActionName(action);
    if (name.includes('package.build') || name.includes('requirement.submit')) {
      const requirementId = assistantActionInput(action).requirementId;
      return typeof requirementId === 'string' || buildTargetRequirementId ? '' : 'Submit a product brief before building a package.';
    }
    if (name.includes('workspace.create')) {
      if (!cartServiceItemCount) {
        return 'Choose at least one service in Planning first.';
      }
      if (cartBlockers > 0) {
        return blockingServiceMessage(cartBlockingGapTitles, cartBlockingRecommendationNames);
      }
      return '';
    }
    if (name.includes('scan.start')) {
      return hostedScanBlockedReason;
    }
    if (name.includes('finding.accept_risk')) {
      return selectedFindingId ? '' : 'Select a scanner finding first.';
    }
    return 'This action is not in the confirmed ProdUS execution allowlist yet.';
  };

  const onConfirmAction = async (action: Record<string, unknown>) => {
    const name = assistantActionName(action);
    const input = assistantActionInput(action);
    if (name.includes('package.build') || name.includes('requirement.submit')) {
      const requirementId = typeof input.requirementId === 'string' && input.requirementId ? input.requirementId : buildTargetRequirementId;
      if (!requirementId) throw new Error('No requirement intake is available for package creation.');
      await onBuildPackage(requirementId);
      return;
    }
    if (name.includes('workspace.create')) {
      if (!cartServiceItemCount) throw new Error('Choose services in Planning before creating a workspace.');
      if (cartBlockers > 0) {
        throw new Error(blockingServiceMessage(cartBlockingGapTitles, cartBlockingRecommendationNames));
      }
      await onConvertCart();
      return;
    }
    if (name.includes('scan.start')) {
      if (hostedScanBlockedReason) throw new Error(hostedScanBlockedReason);
      await onStartHostedScan();
      return;
    }
    if (name.includes('finding.accept_risk')) {
      if (!selectedFindingId) throw new Error('Select a scanner finding first.');
      await onAcceptFindingRisk(
        assistantRecordText(action, ['rationale', 'summary'], 'Owner confirmed AI-proposed risk acceptance for review tracking.')
      );
      return;
    }
    throw new Error('This AI proposed action is not enabled for execution in this surface.');
  };

  return {
    assistantActionProps: {
      onConfirmAction,
      actionDisabledReason,
    },
    assistantContext,
  };
}
