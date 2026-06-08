'use client';

import { appleColors, clampScore } from './PlatformComponents';
import type { PackageInstance, ProductProfile } from './types';

export const productScore = (profile: ProductProfile, packages: PackageInstance[]) => {
  const packageInstance = packages.find((item) => item.productProfile?.id === profile.id);
  if (!packageInstance) return profile.businessStage === 'LIVE' ? 74 : 58;
  if (packageInstance.status === 'DELIVERED') return 96;
  if (packageInstance.status === 'ACTIVE_DELIVERY') return 88;
  if (packageInstance.status === 'MILESTONE_REVIEW') return 72;
  if (packageInstance.status === 'SCOPE_NEGOTIATION') return 65;
  return 52;
};

export const productReadinessTone = (score: number) => {
  const safeScore = clampScore(score);
  if (safeScore >= 80) return { label: 'On Track', color: appleColors.green };
  if (safeScore >= 65) return { label: 'Needs Review', color: appleColors.amber };
  return { label: 'Needs Owner Action', color: appleColors.red };
};

export const productPortfolioStats = (products: ProductProfile[], packages: PackageInstance[]) => {
  const scoredProducts = products.map((profile) => ({
    profile,
    score: clampScore(productScore(profile, packages)),
  }));
  const healthyCount = scoredProducts.filter((item) => item.score >= 80).length;
  const attentionCount = scoredProducts.filter((item) => item.score < 65).length;
  const inDeliveryCount = packages.filter((item) => item.status === 'ACTIVE_DELIVERY' || item.status === 'MILESTONE_REVIEW').length;

  return {
    healthyCount,
    attentionCount,
    inDeliveryCount,
    healthPercent: products.length ? Math.round((healthyCount / products.length) * 100) : 0,
  };
};
