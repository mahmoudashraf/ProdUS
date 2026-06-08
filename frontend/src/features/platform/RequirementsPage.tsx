'use client';

import { Stack } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import { getJson, postJson } from './api';
import {
  ProductBriefFormPanel,
  ProductBriefQueuePanel,
  ProductBriefsBreadcrumb,
  ProductBriefsHubPanel,
  type ProductBriefPayload,
  type ProductBriefsView,
  isProductBriefsView,
} from './ProductBriefsPanels';
import { PageHeader, QueryState } from './PlatformComponents';
import type { ProductProfile, RequirementIntake, ServiceModule } from './types';

const initialRequirementValues: ProductBriefPayload = {
  productProfileId: '',
  requestedServiceModuleId: null,
  businessGoal: '',
  currentProblems: '',
  constraints: '',
  riskSignals: '',
  requirementBrief: '',
  status: 'SUBMITTED',
};

export default function RequirementsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const viewParam = searchParams?.get('view') || null;
  const activeView = isProductBriefsView(viewParam) ? viewParam : null;

  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const modules = useQuery({ queryKey: ['catalog-modules'], queryFn: () => getJson<ServiceModule[]>('/catalog/modules') });
  const requirements = useQuery({ queryKey: ['requirements'], queryFn: () => getJson<RequirementIntake[]>('/requirements') });
  const form = useAdvancedForm<ProductBriefPayload>({
    initialValues: initialRequirementValues,
    validationRules: {
      productProfileId: [{ type: 'required', message: 'Product is required' }],
      businessGoal: [{ type: 'required', message: 'Business goal is required' }],
    },
  });

  const createRequirement = useMutation({
    mutationFn: () => postJson<RequirementIntake, ProductBriefPayload>('/requirements', form.values),
    onSuccess: async () => {
      form.resetForm({
        ...initialRequirementValues,
        productProfileId: form.values.productProfileId,
        requestedServiceModuleId: form.values.requestedServiceModuleId,
      });
      await queryClient.invalidateQueries({ queryKey: ['requirements'] });
    },
  });

  const openView = (view: ProductBriefsView) => {
    const next = new URLSearchParams(searchParamString);
    next.set('view', view);
    router.push(`${pathname || '/owner/requirements'}?${next.toString()}`, { scroll: false });
  };

  const openHub = () => {
    const next = new URLSearchParams(searchParamString);
    next.delete('view');
    const query = next.toString();
    router.push(query ? `${pathname || '/owner/requirements'}?${query}` : (pathname || '/owner/requirements'), { scroll: false });
  };

  const submit = form.handleSubmit(() => {
    createRequirement.mutate();
  });
  const requirementList = requirements.data || [];
  const productList = products.data || [];
  const moduleList = modules.data || [];
  const submittedCount = requirementList.filter((requirement) => requirement.status === 'SUBMITTED').length;
  const packageReadyCount = requirementList.filter((requirement) => requirement.status === 'PACKAGE_RECOMMENDED').length;

  return (
    <>
      <PageHeader title="Product Briefs" description="Convert product pain into structured service needs, risk signals, and service-plan inputs." />
      <QueryState isLoading={products.isLoading || modules.isLoading || requirements.isLoading} error={products.error || modules.error || requirements.error || createRequirement.error} />

      {!activeView && (
        <ProductBriefsHubPanel
          productCount={productList.length}
          requirementCount={requirementList.length}
          submittedCount={submittedCount}
          packageReadyCount={packageReadyCount}
          onOpenView={openView}
        />
      )}

      {activeView && (
        <Stack spacing={2}>
          <ProductBriefsBreadcrumb view={activeView} onOpenHub={openHub} />

          {activeView === 'create' && (
            <ProductBriefFormPanel
              formValues={form.values}
              products={productList}
              modules={moduleList}
              isSaving={createRequirement.isPending}
              onChange={form.setValue}
              onSubmit={submit}
            />
          )}

          {activeView === 'queue' && (
            <ProductBriefQueuePanel requirements={requirementList} />
          )}
        </Stack>
      )}
    </>
  );
}
