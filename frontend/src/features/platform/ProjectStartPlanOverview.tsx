'use client';

import ProjectStartPlanHeroCard from './ProjectStartPlanHeroCard';
import ProjectStartPlanMetricStrip from './ProjectStartPlanMetricStrip';
import type { ProductProfile } from './types';

interface ProjectStartPlanOverviewProps {
  title?: string | undefined;
  product?: ProductProfile | undefined;
  productOptions: ProductProfile[];
  hasPlaceholderProduct: boolean;
  score: number;
  canStartWorkspace: boolean;
  blockers: number;
  serviceCount: number;
  talentCount: number;
  notice?: string;
  isUpdatingProduct: boolean;
  onNoticeClose: () => void;
  onSelectProduct: (productId: string) => void;
}

export default function ProjectStartPlanOverview({
  title,
  product,
  productOptions,
  hasPlaceholderProduct,
  score,
  canStartWorkspace,
  blockers,
  serviceCount,
  talentCount,
  notice,
  isUpdatingProduct,
  onNoticeClose,
  onSelectProduct,
}: ProjectStartPlanOverviewProps) {
  return (
    <>
      <ProjectStartPlanHeroCard
        title={title}
        product={product}
        productOptions={productOptions}
        hasPlaceholderProduct={hasPlaceholderProduct}
        score={score}
        canStartWorkspace={canStartWorkspace}
        blockers={blockers}
        notice={notice}
        isUpdatingProduct={isUpdatingProduct}
        onNoticeClose={onNoticeClose}
        onSelectProduct={onSelectProduct}
      />
      <ProjectStartPlanMetricStrip
        canStartWorkspace={canStartWorkspace}
        serviceCount={serviceCount}
        talentCount={talentCount}
      />
    </>
  );
}
