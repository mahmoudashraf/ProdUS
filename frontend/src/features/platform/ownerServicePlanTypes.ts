import type { StudioAssistantContext } from './StudioAssistantCard';
import type { ProductProfile } from './types';

export type OwnerProductFormValues = {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  riskProfile: string;
};

export type OwnerRequirementFormValues = {
  requestedServiceModuleId: string | null;
  businessGoal: string;
};

export type AssistantActionProps = {
  onConfirmAction?: (action: Record<string, unknown>) => Promise<void> | void;
  actionDisabledReason?: (action: Record<string, unknown>) => string;
};

export type OwnerServicePlanAssistantContext = StudioAssistantContext;
