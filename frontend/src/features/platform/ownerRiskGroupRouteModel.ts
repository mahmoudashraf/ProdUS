'use client';

export type OwnerRiskGroupView =
  | 'launch-blockers'
  | 'technical-risks'
  | 'improvements'
  | 'handled';

export const ownerRiskGroupViewValues: readonly OwnerRiskGroupView[] = [
  'launch-blockers',
  'technical-risks',
  'improvements',
  'handled',
];

export const isOwnerRiskGroupView = (value: string | null): value is OwnerRiskGroupView =>
  !!value && ownerRiskGroupViewValues.includes(value as OwnerRiskGroupView);

export const riskGroupViewByLabel = (label: string): OwnerRiskGroupView => {
  if (label === 'Launch blockers') return 'launch-blockers';
  if (label === 'High-priority technical risks') return 'technical-risks';
  if (label === 'Medium-priority improvements') return 'improvements';
  return 'handled';
};

export const riskGroupLabelByView: Record<OwnerRiskGroupView, string> = {
  'launch-blockers': 'Launch blockers',
  'technical-risks': 'High-priority technical risks',
  improvements: 'Medium-priority improvements',
  handled: 'Resolved or accepted',
};

