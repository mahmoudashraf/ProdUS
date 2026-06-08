import { appleColors, clampScore } from './PlatformComponents';
import type { PackageInstance } from './types';

export type LaunchpadDetailView = 'products' | 'workspaces';
export type LaunchpadJourneyValue = 'plan' | LaunchpadDetailView;

export const packageHealth = (item?: PackageInstance) => {
  if (!item) return 54;
  if (item.status === 'DELIVERED') return 96;
  if (item.status === 'ACTIVE_DELIVERY') return 86;
  if (item.status === 'MILESTONE_REVIEW') return 76;
  if (item.status === 'SCOPE_NEGOTIATION') return 68;
  return 58;
};

export const indexedPackageHealth = (item: PackageInstance, index: number) => {
  const base = item.status === 'DELIVERED' ? 96 : item.status === 'ACTIVE_DELIVERY' ? 78 : item.status === 'MILESTONE_REVIEW' ? 72 : 64;
  return clampScore(base - index * 3);
};

export const launchpadStatusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('CRITICAL') || status.includes('OVERDUE')) return appleColors.red;
  if (status.includes('RISK') || status.includes('WAIT') || status.includes('REVIEW') || status.includes('DUE')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER')) return appleColors.green;
  return appleColors.purple;
};
