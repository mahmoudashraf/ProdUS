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

export const ownerReadinessAreaLabel = (area?: string | null) => {
  if (!area) return '';
  const normalized = area.toLowerCase();
  if (normalized.includes('unmapped scanner signal')) return 'Needs service review';
  return area;
};

export const ownerRiskSummary = (
  businessRisk?: string | null,
  description?: string | null,
  fallback = 'This item can reduce launch confidence until it is reviewed.',
) => {
  const text = (businessRisk || description || fallback).trim();
  const normalized = text.toLowerCase();
  if (normalized.includes('scanner signal needs human classification')) {
    return 'ProdUS needs a quick owner review before it can turn this risk into a service recommendation.';
  }
  if (normalized.includes('production-readiness service')) {
    return text.replace(/production-readiness service/gi, 'service recommendation');
  }
  return text;
};
