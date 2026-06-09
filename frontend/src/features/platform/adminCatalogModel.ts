export type AdminCatalogView = 'categories' | 'templates' | 'rules' | 'ai' | 'audit';

export interface CategoryPayload {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

export const isAdminCatalogView = (value: string | null): value is AdminCatalogView =>
  value === 'categories' || value === 'templates' || value === 'rules' || value === 'ai' || value === 'audit';

export const adminCatalogViewLabel: Record<AdminCatalogView, string> = {
  categories: 'Categories And Services',
  templates: 'Package Templates',
  rules: 'Governance Rules',
  ai: 'AI Setup',
  audit: 'Audit Trail',
};
