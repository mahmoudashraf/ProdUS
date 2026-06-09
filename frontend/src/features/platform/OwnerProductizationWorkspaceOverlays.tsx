'use client';

import type { ComponentProps } from 'react';
import OwnerFindingReviewDrawerHost from './OwnerFindingReviewDrawerHost';
import OwnerWorkspaceTimelineDialog from './OwnerWorkspaceTimelineDialog';

type FindingReviewDrawerProps = ComponentProps<typeof OwnerFindingReviewDrawerHost>;
type TimelineDialogProps = ComponentProps<typeof OwnerWorkspaceTimelineDialog>;

export default function OwnerProductizationWorkspaceOverlays({
  findingReview,
  timeline,
}: {
  findingReview: FindingReviewDrawerProps;
  timeline: TimelineDialogProps;
}) {
  return (
    <>
      <OwnerFindingReviewDrawerHost {...findingReview} />
      <OwnerWorkspaceTimelineDialog {...timeline} />
    </>
  );
}
