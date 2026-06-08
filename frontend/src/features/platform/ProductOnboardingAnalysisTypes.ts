import type { ProductAnalysisMode, ProductProfile } from './types';

export interface ProductAnalysisModeOption {
  mode: ProductAnalysisMode;
  title: string;
  detail: string;
  accent: string;
}

export interface ProductOnboardingAnalysisDocument {
  file: File;
  shareWithAi: boolean;
}

export interface ProductOnboardingProfileDraft {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  productUrl: string;
  repositoryUrl: string;
  riskProfile: string;
}

export interface ProductOnboardingAttributeItem {
  label: string;
  value?: string | null | undefined;
  source: string;
  accent: string;
  wide?: boolean;
}
