import { formatLabel } from './PlatformComponents';
import type { ProductCreationFields, ProductProfile } from './types';

export type ProductProfileField =
  | 'name'
  | 'summary'
  | 'businessStage'
  | 'techStack'
  | 'productUrl'
  | 'repositoryUrl'
  | 'riskProfile';

export interface ProductProfileUpdatePayload {
  name: string;
  summary?: string;
  businessStage: ProductProfile['businessStage'];
  techStack?: string;
  productUrl?: string;
  repositoryUrl?: string;
  riskProfile?: string;
}

export interface ProductFieldSuggestion {
  field: ProductProfileField;
  current: string;
  suggested: string;
  changed: boolean;
}

export const fieldLabels: Record<ProductProfileField, string> = {
  name: 'Product name',
  summary: 'Summary',
  businessStage: 'Stage',
  techStack: 'Tech stack',
  productUrl: 'Product URL',
  repositoryUrl: 'Repository URL',
  riskProfile: 'Risk notes',
};

export const fieldOrder: ProductProfileField[] = [
  'name',
  'summary',
  'businessStage',
  'techStack',
  'productUrl',
  'repositoryUrl',
  'riskProfile',
];

const businessStageValues: ProductProfile['businessStage'][] = [
  'IDEA',
  'PROTOTYPE',
  'VALIDATED',
  'LIVE',
  'SCALING',
];

export const textValue = (value?: string | null) => (value || '').trim();

export const toBusinessStage = (value: string): ProductProfile['businessStage'] | null => {
  const normalized = value.trim().toUpperCase();
  return businessStageValues.includes(normalized as ProductProfile['businessStage'])
    ? (normalized as ProductProfile['businessStage'])
    : null;
};

export const currentFieldValue = (product: ProductProfile, field: ProductProfileField) => {
  if (field === 'name') return product.name;
  if (field === 'summary') return product.summary || '';
  if (field === 'businessStage') return product.businessStage;
  if (field === 'techStack') return product.techStack || '';
  if (field === 'productUrl') return product.productUrl || '';
  if (field === 'repositoryUrl') return product.repositoryUrl || '';
  return product.riskProfile || '';
};

export const suggestedFieldValue = (analysis: ProductCreationFields, field: ProductProfileField) => {
  if (field === 'name') return analysis.productName || '';
  if (field === 'summary') return analysis.summary || analysis.projectDescription || '';
  if (field === 'businessStage') return analysis.businessStage || '';
  if (field === 'techStack') return analysis.techStack || '';
  if (field === 'productUrl') return analysis.productUrl || '';
  if (field === 'repositoryUrl') return analysis.repositoryUrl || '';
  return analysis.riskProfile || '';
};

export const changedFields = (product: ProductProfile, analysis: ProductCreationFields) =>
  fieldOrder.filter(field => {
    const suggested = textValue(suggestedFieldValue(analysis, field));
    if (!suggested) return false;
    return suggested !== textValue(currentFieldValue(product, field));
  });

export const buildFieldSuggestions = (
  product: ProductProfile,
  analysis: ProductCreationFields
): ProductFieldSuggestion[] =>
  fieldOrder
    .map(field => ({
      field,
      current: currentFieldValue(product, field),
      suggested: suggestedFieldValue(analysis, field),
      changed:
        textValue(currentFieldValue(product, field)) !==
        textValue(suggestedFieldValue(analysis, field)),
    }))
    .filter(item => textValue(item.suggested));

export const fieldDisplayValue = (field: ProductProfileField, value: string) =>
  field === 'businessStage' && value ? formatLabel(value) : value || 'Not set';
