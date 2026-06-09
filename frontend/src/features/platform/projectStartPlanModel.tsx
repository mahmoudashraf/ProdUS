'use client';

import { PastelChip, appleColors, clampScore } from './PlatformComponents';
import type { ProjectStartJourneyItem } from './ProjectStartJourneyNavigation';
import type { ProductizationCart } from './types';

interface ProjectStartPlanReadinessInput {
  canStartWorkspace: boolean;
  blockers: number;
  serviceCount: number;
  talentCount: number;
}

export const projectStartReadinessScore = (cart?: ProductizationCart) => {
  const rawScore = clampScore((cart?.productProfile ? 30 : 0) + (cart?.serviceItems.length || 0) * 18 + (cart?.talentItems.length || 0) * 12);
  const blockers = cart?.startReadiness?.blockerCount ?? cart?.catalogEvaluation?.blockerCount ?? 0;
  if (!blockers) return rawScore;
  const blockerCap = blockers >= 3 ? 45 : blockers === 2 ? 58 : 68;
  return Math.min(rawScore, blockerCap);
};

export const projectStartPlanTitle = (title?: string | null, productName?: string | null) => {
  const fallback = productName ? `${productName} Project Start Plan` : 'Project Start Plan';
  const source = title?.trim() || fallback;
  return source
    .replace(/\bproductization start plan\b/gi, 'Project Start Plan')
    .replace(/\bproductization plan\b/gi, 'Project Start Plan');
};

export const compactProjectTechStack = (techStack?: string | null) => {
  const value = techStack?.trim();
  if (!value) return '';
  return value.length > 44 ? `${value.slice(0, 41)}...` : value;
};

export const buildProjectStartPlanJourneyItems = ({
  canStartWorkspace,
  blockers,
  serviceCount,
  talentCount,
}: ProjectStartPlanReadinessInput): ProjectStartJourneyItem[] => [
  {
    value: 'readiness',
    label: 'Readiness',
    detail: 'Product, templates, service gaps, and start blockers.',
    accent: canStartWorkspace ? appleColors.green : blockers ? appleColors.red : appleColors.amber,
    meta: <PastelChip label={canStartWorkspace ? 'Ready' : blockers ? `${blockers} gaps` : 'Needs scope'} accent={canStartWorkspace ? appleColors.green : blockers ? appleColors.red : appleColors.amber} bg={canStartWorkspace ? '#e7f8ee' : blockers ? '#fff1f2' : '#fff4dc'} />,
  },
  {
    value: 'services',
    label: 'Services',
    detail: 'Review selected lifecycle services and choose missing ones.',
    accent: appleColors.purple,
    meta: <PastelChip label={`${serviceCount} selected`} accent={serviceCount ? appleColors.purple : appleColors.amber} />,
  },
  {
    value: 'talent',
    label: 'Talent',
    detail: 'Review teams and experts before handoff.',
    accent: appleColors.cyan,
    meta: <PastelChip label={`${talentCount} saved`} accent={talentCount ? appleColors.cyan : appleColors.muted} bg="#e4f9fd" />,
  },
  {
    value: 'handoff',
    label: 'Approve',
    detail: 'Approve the launch-hardening plan when scope is ready.',
    accent: canStartWorkspace ? appleColors.green : blockers ? appleColors.red : appleColors.amber,
    meta: <PastelChip label={canStartWorkspace ? 'Can start' : blockers ? 'Blocked' : 'Needs scope'} accent={canStartWorkspace ? appleColors.green : blockers ? appleColors.red : appleColors.amber} bg={canStartWorkspace ? '#e7f8ee' : blockers ? '#fff1f2' : '#fff4dc'} />,
  },
];

export const projectStartPlanDetailLabel = (items: ProjectStartJourneyItem[], value: ProjectStartJourneyItem['value']) =>
  items.find((item) => item.value === value)?.label || 'Start plan';
