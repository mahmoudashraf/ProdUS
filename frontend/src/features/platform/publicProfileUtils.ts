import type { Team } from './types';

export const splitProfileTags = (value?: string) =>
  (value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

export const teamReadinessScore = (team: Team) => {
  const scores: Record<Team['verificationStatus'], number> = {
    APPLIED: 58,
    VERIFIED: 82,
    CERTIFIED: 88,
    SPECIALIST: 92,
    OPERATIONS_READY: 96,
    SUSPENDED: 30,
  };
  return scores[team.verificationStatus] || 76;
};
