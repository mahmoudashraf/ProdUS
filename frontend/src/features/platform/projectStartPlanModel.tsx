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

export const projectStartReadinessScore = (cart?: ProductizationCart) =>
  clampScore((cart?.productProfile ? 30 : 0) + (cart?.serviceItems.length || 0) * 18 + (cart?.talentItems.length || 0) * 12);

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
    accent: appleColors.green,
    meta: <PastelChip label={canStartWorkspace ? 'Can start' : 'Blocked'} accent={canStartWorkspace ? appleColors.green : appleColors.amber} bg={canStartWorkspace ? '#e7f8ee' : '#fff4dc'} />,
  },
];

export const projectStartPlanDetailLabel = (items: ProjectStartJourneyItem[], value: ProjectStartJourneyItem['value']) =>
  items.find((item) => item.value === value)?.label || 'Start plan';
