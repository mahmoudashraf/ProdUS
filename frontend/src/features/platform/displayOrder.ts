import { PackageInstance, ProductProfile, ProjectWorkspace } from './types';

const packageStatusRank: Record<PackageInstance['status'], number> = {
  ACTIVE_DELIVERY: 0,
  MILESTONE_REVIEW: 1,
  SCOPE_NEGOTIATION: 2,
  AWAITING_TEAM: 3,
  SUPPORT_HANDOFF: 4,
  DRAFT: 5,
  DELIVERED: 6,
  CLOSED: 7,
};

const workspaceStatusRank: Record<ProjectWorkspace['status'], number> = {
  ACTIVE_DELIVERY: 0,
  MILESTONE_REVIEW: 1,
  BLOCKED: 2,
  SUPPORT_HANDOFF: 3,
  SCOPE_NEGOTIATION: 4,
  AWAITING_TEAM_PROPOSAL: 5,
  DRAFT_PACKAGE: 6,
  DELIVERED: 7,
  CLOSED: 8,
};

const productStageRank: Record<ProductProfile['businessStage'], number> = {
  LIVE: 0,
  SCALING: 1,
  VALIDATED: 2,
  PROTOTYPE: 3,
  IDEA: 4,
};

const recordTime = (record: { updatedAt?: string; createdAt?: string }) =>
  Date.parse(record.updatedAt || record.createdAt || '') || 0;

export const isPlaceholderName = (name?: string | null) => {
  const normalized = (name || '').trim().toLowerCase();
  return normalized === 'name' || /^t{3,}$/.test(normalized) || /^redesign smoke \d+/.test(normalized);
};

export const isPlaceholderProduct = (product?: ProductProfile | null) =>
  !!product && isPlaceholderName(product.name);

export const isPlaceholderPackage = (packageInstance?: PackageInstance | null) =>
  !!packageInstance && (isPlaceholderName(packageInstance.name) || isPlaceholderProduct(packageInstance.productProfile));

export const isPlaceholderWorkspace = (workspace?: ProjectWorkspace | null) =>
  !!workspace && (isPlaceholderName(workspace.name) || isPlaceholderPackage(workspace.packageInstance));

export const sortProductsForOwner = (products: ProductProfile[], packages: PackageInstance[] = []) =>
  [...products].sort((a, b) => {
    const placeholderDelta = Number(isPlaceholderProduct(a)) - Number(isPlaceholderProduct(b));
    if (placeholderDelta) return placeholderDelta;

    const aPackage = packages.find((item) => item.productProfile?.id === a.id);
    const bPackage = packages.find((item) => item.productProfile?.id === b.id);
    const packageDelta = (packageStatusRank[aPackage?.status || 'DRAFT'] ?? 99) - (packageStatusRank[bPackage?.status || 'DRAFT'] ?? 99);
    if (packageDelta) return packageDelta;

    const stageDelta = (productStageRank[a.businessStage] ?? 99) - (productStageRank[b.businessStage] ?? 99);
    if (stageDelta) return stageDelta;

    return recordTime(b) - recordTime(a);
  });

export const sortPackagesForOwner = (packages: PackageInstance[]) =>
  [...packages].sort((a, b) => {
    const placeholderDelta = Number(isPlaceholderPackage(a)) - Number(isPlaceholderPackage(b));
    if (placeholderDelta) return placeholderDelta;

    const statusDelta = (packageStatusRank[a.status] ?? 99) - (packageStatusRank[b.status] ?? 99);
    if (statusDelta) return statusDelta;

    return recordTime(b) - recordTime(a);
  });

export const sortWorkspacesForOwner = (workspaces: ProjectWorkspace[]) =>
  [...workspaces].sort((a, b) => {
    const placeholderDelta = Number(isPlaceholderWorkspace(a)) - Number(isPlaceholderWorkspace(b));
    if (placeholderDelta) return placeholderDelta;

    const statusDelta = (workspaceStatusRank[a.status] ?? 99) - (workspaceStatusRank[b.status] ?? 99);
    if (statusDelta) return statusDelta;

    return recordTime(b) - recordTime(a);
  });
