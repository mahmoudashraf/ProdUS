'use client';

import ProjectStartPlanHeroCard from './ProjectStartPlanHeroCard';
import ProjectStartPlanMetricStrip from './ProjectStartPlanMetricStrip';
import type { ProductProfile } from './types';

interface ProjectStartPlanOverviewProps {
  title?: string | undefined;
  product?: ProductProfile | undefined;
  hasPlaceholderProduct: boolean;
  score: number;
  canStartWorkspace: boolean;
  blockers: number;
  serviceCount: number;
  talentCount: number;
  notice?: string;
  onNoticeClose: () => void;
}

export default function ProjectStartPlanOverview({
  title,
  product,
  hasPlaceholderProduct,
  score,
  canStartWorkspace,
  blockers,
  serviceCount,
  talentCount,
  notice,
  onNoticeClose,
}: ProjectStartPlanOverviewProps) {
  return (
    <>
      <ProjectStartPlanHeroCard
        title={title}
        product={product}
        hasPlaceholderProduct={hasPlaceholderProduct}
        score={score}
        canStartWorkspace={canStartWorkspace}
        blockers={blockers}
        notice={notice}
        onNoticeClose={onNoticeClose}
      />
      <ProjectStartPlanMetricStrip
        canStartWorkspace={canStartWorkspace}
        serviceCount={serviceCount}
        talentCount={talentCount}
      />
    </>
  );
}
