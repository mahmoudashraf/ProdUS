'use client';

import type { FormEvent } from 'react';
import { appleColors, clampScore } from './PlatformComponents';
import type {
  ContractAgreement,
  InvoiceRecord,
  PackageInstance,
  PackageModule,
  QuoteProposal,
} from './types';

export interface BuildPackagePayload {
  requirementId: string;
}

export type ServicePlanBuilderView = 'summary' | 'services' | 'milestones' | 'team' | 'commercial';

export const isServicePlanBuilderView = (value: string | null): value is ServicePlanBuilderView =>
  value === 'summary' || value === 'services' || value === 'milestones' || value === 'team' || value === 'commercial';

export type ServicePlanFormController<TValues> = {
  values: TValues;
  setValue: <TKey extends keyof TValues>(key: TKey, value: TValues[TKey]) => void;
  handleSubmit: (onSubmit: () => void) => (event: FormEvent<HTMLFormElement>) => void;
};

export interface ProposalPayload {
  teamId: string;
  title: string;
  scope: string;
  assumptions: string;
  timelineDays: number;
  currency: string;
  fixedPriceCents: number;
  platformFeeCents: number;
  status: QuoteProposal['status'];
}

export interface ContractPayload {
  workspaceId: string | null;
  title: string;
  terms: string;
  effectiveOn: string | null;
  status: ContractAgreement['status'];
}

export interface InvoicePayload {
  invoiceNumber: string;
  description: string;
  amountCents: number;
  currency: string;
  dueDate: string | null;
  status: InvoiceRecord['status'];
}

export const initialProposalValues: ProposalPayload = {
  teamId: '',
  title: '',
  scope: '',
  assumptions: '',
  timelineDays: 42,
  currency: 'USD',
  fixedPriceCents: 0,
  platformFeeCents: 0,
  status: 'SUBMITTED',
};

export const initialContractValues: ContractPayload = {
  workspaceId: null,
  title: '',
  terms: '',
  effectiveOn: null,
  status: 'SIGNED',
};

export const initialInvoiceValues: InvoicePayload = {
  invoiceNumber: '',
  description: '',
  amountCents: 0,
  currency: 'USD',
  dueDate: null,
  status: 'ISSUED',
};

export const formatMoney = (amountCents: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format((amountCents || 0) / 100);

export const formatCompactMoney = (amountCents: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format((amountCents || 0) / 100);

export const servicePlanStatusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('REJECT')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING') || status.includes('SUBMITTED')) {
    return appleColors.amber;
  }
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER') || status.includes('SIGNED')) {
    return appleColors.green;
  }
  return appleColors.purple;
};

export const packageScore = (packageInstance?: PackageInstance, modules?: PackageModule[]) => {
  if (!packageInstance) return 0;
  const moduleScore = modules?.length
    ? modules.reduce((total, module) => {
        if (module.status === 'ACCEPTED') return total + 100;
        if (module.status === 'REVIEW') return total + 78;
        if (module.status === 'IN_PROGRESS') return total + 62;
        if (module.status === 'BLOCKED') return total + 24;
        return total + 42;
      }, 0) / modules.length
    : 68;
  const statusBonus = packageInstance.status === 'ACTIVE_DELIVERY' ? 8 : packageInstance.status === 'DELIVERED' ? 16 : 0;
  return clampScore(moduleScore + statusBonus);
};
