import { Team } from './types';

export type TeamMatchView = 'matches' | 'profile' | 'shortlist';

export const teamMatchViews: Array<{
  value: TeamMatchView;
  title: string;
  eyebrow: string;
  description: string;
}> = [
  {
    value: 'matches',
    title: 'Choose Match',
    eyebrow: 'Best next decision',
    description: 'Compare the top delivery teams for the selected product plan.',
  },
  {
    value: 'profile',
    title: 'Inspect Team',
    eyebrow: 'Proof before commitment',
    description: 'Review capability evidence, members, and workspace-backed reputation.',
  },
  {
    value: 'shortlist',
    title: 'Shortlist',
    eyebrow: 'Owner handoff',
    description: 'Keep the teams that can move into proposal and delivery.',
  },
];

export const teamVerificationScore = (team: Team) => {
  const scoreByStatus: Record<Team['verificationStatus'], number> = {
    APPLIED: 48,
    VERIFIED: 74,
    CERTIFIED: 84,
    SPECIALIST: 91,
    OPERATIONS_READY: 96,
    SUSPENDED: 20,
  };
  return scoreByStatus[team.verificationStatus] || 60;
};

export const teamMatchColor = (score: number) => {
  if (score >= 90) return '#13a66b';
  if (score >= 75) return '#625cff';
  return '#f59e0b';
};
