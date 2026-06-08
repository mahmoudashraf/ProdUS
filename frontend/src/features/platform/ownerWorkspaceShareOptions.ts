import { appleColors } from './PlatformComponents';
import type { ProductShareAudience, ProductShareSection } from './types';

export const shareSectionOptions: Array<{
  value: ProductShareSection;
  label: string;
  detail: string;
  sensitive?: boolean;
}> = [
  {
    value: 'PRODUCT_SUMMARY',
    label: 'Product summary',
    detail: 'Name, stage, and public owner summary.',
  },
  {
    value: 'LAUNCH_STATUS',
    label: 'Launch status',
    detail: 'Latest shared readiness label and summary when available.',
  },
  {
    value: 'SELECTED_SERVICES',
    label: 'Selected services',
    detail: 'Public service path selected for productization work.',
  },
  {
    value: 'TEAM_STATUS',
    label: 'Team status',
    detail: 'High-level delivery and team status only.',
  },
  {
    value: 'FINDINGS_SUMMARY',
    label: 'Findings summary',
    detail: 'Summary only; detailed findings stay private.',
    sensitive: true,
  },
  {
    value: 'EVIDENCE_SUMMARY',
    label: 'Evidence summary',
    detail: 'Summary only; artifacts stay private.',
    sensitive: true,
  },
];

export const shareAudienceOptions: Array<{
  value: ProductShareAudience;
  label: string;
  detail: string;
  accent: string;
}> = [
  {
    value: 'PUBLIC_SUMMARY',
    label: 'Public summary',
    detail: 'Anyone with the link can see only the selected safe summary sections.',
    accent: appleColors.green,
  },
  {
    value: 'REGISTERED_VIEWERS',
    label: 'Registered viewers',
    detail: 'The public page stays summary-first and asks viewers to sign in for deeper access.',
    accent: appleColors.cyan,
  },
  {
    value: 'INVITED_VIEWERS',
    label: 'Invited viewers',
    detail: 'Use when the link is meant for known advisors, customers, or collaborators.',
    accent: appleColors.purple,
  },
  {
    value: 'INTERNAL_ONLY',
    label: 'Internal only',
    detail: 'Creates an owner-tracked link that is not available on the public share route.',
    accent: appleColors.amber,
  },
];

export const shareExpiryOptions = [
  { value: 'none', label: 'No expiry' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: 'custom', label: 'Custom date' },
] as const;

export type ShareExpiryMode = (typeof shareExpiryOptions)[number]['value'];
export type ShareAudienceOption = (typeof shareAudienceOptions)[number];
export type ShareSectionOption = (typeof shareSectionOptions)[number];
