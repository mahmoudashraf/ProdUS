import { appleColors } from './PlatformComponents';

export const statusAccent = (status?: string) => {
  if (status === 'PASS') return appleColors.green;
  if (status === 'WARN') return appleColors.amber;
  if (status === 'FAIL') return appleColors.red;
  return appleColors.cyan;
};

export const scoreAccent = (score: number) => {
  if (score >= 86) return appleColors.green;
  if (score >= 72) return appleColors.amber;
  return appleColors.red;
};

export const scoreLabel = (score: number) => {
  if (score >= 86) return 'Specific';
  if (score >= 72) return 'Needs tuning';
  return 'Too generic';
};
