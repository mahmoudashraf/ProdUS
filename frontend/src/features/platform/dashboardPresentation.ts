import {
  appleColors,
  clampScore,
} from './PlatformComponents';
import type { PackageInstance } from './types';

export const statusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('CRITICAL') || status.includes('OVERDUE')) return appleColors.red;
  if (status.includes('RISK') || status.includes('WAIT') || status.includes('REVIEW') || status.includes('DUE')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER') || status.includes('RESOLVED')) return appleColors.green;
  return appleColors.purple;
};

export const packageHealth = (item: PackageInstance, index: number) => {
  const base = item.status === 'DELIVERED' ? 96 : item.status === 'ACTIVE_DELIVERY' ? 78 : item.status === 'MILESTONE_REVIEW' ? 72 : 64;
  return clampScore(base - index * 3);
};
