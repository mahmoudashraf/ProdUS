import { appleColors } from './PlatformComponents';

export const severityAccent = (severity?: string) => {
  if (severity === 'CRITICAL') return appleColors.red;
  if (severity === 'HIGH') return '#ea580c';
  if (severity === 'MEDIUM') return appleColors.amber;
  if (severity === 'LOW') return appleColors.blue;
  return appleColors.muted;
};

export const findingStatusAccent = (status?: string) => {
  if (status === 'RESOLVED') return appleColors.green;
  if (status === 'ACCEPTED_RISK') return appleColors.amber;
  if (status === 'FALSE_POSITIVE') return appleColors.muted;
  if (status === 'REGRESSED') return appleColors.red;
  if (status === 'INSUFFICIENT_EVIDENCE') return '#7c3aed';
  return appleColors.purple;
};
