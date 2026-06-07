import { appleColors, clampScore } from './PlatformComponents';
import type { PackageInstance, Team, TeamCapability, TeamReputationEvent } from './types';

export const teamDeliveryStatusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('REJECT') || status.includes('URGENT') || status.includes('OVERDUE')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING') || status.includes('SUBMITTED')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER') || status.includes('RESOLVED')) return appleColors.green;
  return appleColors.purple;
};

export const packageDeliveryHealth = (item: PackageInstance, index: number) => {
  const base = item.status === 'DELIVERED' ? 96 : item.status === 'ACTIVE_DELIVERY' ? 78 : item.status === 'MILESTONE_REVIEW' ? 72 : 64;
  return clampScore(base - index * 3);
};

export const formatDeliveryMoney = (amountCents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format((amountCents || 0) / 100);

export const formatEvidenceFileSize = (sizeBytes: number) => {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
};

export const teamDeliveryScore = (team?: Team, capabilities?: TeamCapability[], reputation?: TeamReputationEvent[]) => {
  if (!team) return 0;
  const statusScore = {
    APPLIED: 44,
    VERIFIED: 72,
    CERTIFIED: 82,
    SPECIALIST: 90,
    OPERATIONS_READY: 96,
    SUSPENDED: 20,
  }[team.verificationStatus] || 58;
  const capabilityBonus = Math.min(12, (capabilities?.length || 0) * 2);
  const ratingBonus = reputation?.length
    ? Math.round((reputation.reduce((total, event) => total + event.rating, 0) / reputation.length - 4) * 7)
    : 0;
  return clampScore(statusScore + capabilityBonus + ratingBonus);
};
