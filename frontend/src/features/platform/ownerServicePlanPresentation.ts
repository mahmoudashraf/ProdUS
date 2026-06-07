import {
  appleColors,
  clampScore,
} from './PlatformComponents';
import type {
  PackageInstance,
  PackageModule,
  ProductProfile,
} from './types';

export const ownerServicePlanStageOptions: ProductProfile['businessStage'][] = [
  'IDEA',
  'PROTOTYPE',
  'VALIDATED',
  'LIVE',
  'SCALING',
];

export const ownerServicePlanStatusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('REJECT') || status.includes('URGENT')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING') || status.includes('SUBMITTED')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER') || status.includes('SIGNED') || status.includes('ON_TRACK')) return appleColors.green;
  return appleColors.purple;
};

export const ownerServicePackageScore = (packageInstance?: PackageInstance, modules?: PackageModule[]) => {
  if (!packageInstance) return 54;
  const moduleScore = modules?.length
    ? modules.reduce((total, module) => {
        if (module.status === 'ACCEPTED') return total + 100;
        if (module.status === 'REVIEW') return total + 78;
        if (module.status === 'IN_PROGRESS') return total + 64;
        if (module.status === 'BLOCKED') return total + 28;
        return total + 48;
      }, 0) / modules.length
    : 68;
  const statusBonus = packageInstance.status === 'ACTIVE_DELIVERY' ? 8 : packageInstance.status === 'DELIVERED' ? 16 : 0;
  return clampScore(moduleScore + statusBonus);
};

export const ownerServiceCompactIntakeFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1,
    background: '#fff',
    minHeight: 44,
  },
  '& .MuiInputBase-input': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

export const ownerServiceIntakeActionButtonSx = {
  minHeight: 44,
  borderRadius: 1,
  px: 2,
  textTransform: 'none',
  fontWeight: 900,
  whiteSpace: 'nowrap',
  boxShadow: '0 12px 26px rgba(99, 91, 255, 0.16)',
};
