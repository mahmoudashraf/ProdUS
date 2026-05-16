'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowForwardOutlined,
  CheckCircleOutlineOutlined,
  Inventory2Outlined,
  LinkOutlined,
  PsychologyAltOutlined,
  SecurityOutlined,
} from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import { postJson, putJson } from './api';
import {
  DotLabel,
  PageHeader,
  QueryState,
  SaveButton,
  SectionTitle,
  Surface,
  TextInput,
  appleColors,
  categoryPalette,
  formatLabel,
} from './PlatformComponents';
import { ProductProfile, ProductizationCart } from './types';

interface ProductProfilePayload {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  productUrl: string;
  repositoryUrl: string;
  riskProfile: string;
}

const stages: ProductProfile['businessStage'][] = ['IDEA', 'PROTOTYPE', 'VALIDATED', 'LIVE', 'SCALING'];

const initialValues: ProductProfilePayload = {
  name: '',
  summary: '',
  businessStage: 'PROTOTYPE',
  techStack: '',
  productUrl: '',
  repositoryUrl: '',
  riskProfile: '',
};

const setupSteps = [
  {
    title: 'Product context',
    detail: 'Name the product and explain what outcome production readiness should unlock.',
    icon: Inventory2Outlined,
    accent: appleColors.purple,
  },
  {
    title: 'Evidence links',
    detail: 'Attach product and repository URLs so diagnosis and delivery work can stay grounded.',
    icon: LinkOutlined,
    accent: appleColors.cyan,
  },
  {
    title: 'Risks and constraints',
    detail: 'Capture known blockers early so service selection and team matching start with reality.',
    icon: SecurityOutlined,
    accent: appleColors.amber,
  },
];

export default function ProductOnboardingWizard() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const form = useAdvancedForm<ProductProfilePayload>({
    initialValues,
    validationRules: {
      name: [{ type: 'required', message: 'Product name is required' }],
      summary: [{ type: 'required', message: 'Product summary is required' }],
    },
  });

  const createProduct = useMutation({
    mutationFn: async () => {
      const product = await postJson<ProductProfile, ProductProfilePayload>('/products', form.values);
      await putJson<ProductizationCart, { productProfileId: string; title: string; businessGoal: string }>('/productization-cart/current', {
        productProfileId: product.id,
        title: `${product.name} productization draft`,
        businessGoal: form.values.summary,
      });
      return product;
    },
    onSuccess: async (product) => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      router.push(`/products/${product.id}`);
    },
  });

  const submit = form.handleSubmit(() => createProduct.mutate());

  return (
    <>
      <PageHeader
        title="Create Product"
        description="Capture the minimum product context needed to recommend lifecycle services, shortlist delivery talent, and start a governed workspace."
        action={
          <Button variant="outlined" onClick={() => router.push('/dashboard')} sx={{ minHeight: 42 }}>
            Back to dashboard
          </Button>
        }
      />
      <QueryState isLoading={createProduct.isPending} error={createProduct.error} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 340px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f7fbff)' }}>
            <Stack spacing={2}>
              <SectionTitle title="Guided Setup" action={<DotLabel label="Owner first" color={appleColors.purple} />} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                {setupSteps.map((step, index) => {
                  const Icon = step.icon;
                  const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                  return (
                    <Box
                      key={step.title}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: `${step.accent}33`,
                        borderTop: `3px solid ${step.accent}`,
                        background: `linear-gradient(145deg, #fff, ${palette.soft})`,
                      }}
                    >
                      <Stack spacing={1.3}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 1, display: 'grid', placeItems: 'center', color: step.accent, bgcolor: `${step.accent}14` }}>
                          <Icon />
                        </Box>
                        <Box>
                          <Typography variant="h4">{step.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
                            {step.detail}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            </Stack>
          </Surface>

          <Surface>
            <Box component="form" onSubmit={submit}>
              <Stack spacing={2.25}>
                <SectionTitle title="Product Profile" action={<Inventory2Outlined sx={{ color: appleColors.purple }} />} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' }, gap: 2 }}>
                  <TextInput label="Product name" value={form.values.name} onChange={(name) => form.setValue('name', name)} />
                  <TextField
                    select
                    fullWidth
                    label="Business stage"
                    value={form.values.businessStage}
                    onChange={(event) => form.setValue('businessStage', event.target.value as ProductProfile['businessStage'])}
                  >
                    {stages.map((stage) => (
                      <MenuItem key={stage} value={stage}>
                        {formatLabel(stage)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <TextInput label="Product outcome" value={form.values.summary} onChange={(summary) => form.setValue('summary', summary)} multiline />
                <TextInput label="Tech stack" value={form.values.techStack} onChange={(techStack) => form.setValue('techStack', techStack)} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <TextInput label="Product URL" value={form.values.productUrl} onChange={(productUrl) => form.setValue('productUrl', productUrl)} />
                  <TextInput label="Repository URL" value={form.values.repositoryUrl} onChange={(repositoryUrl) => form.setValue('repositoryUrl', repositoryUrl)} />
                </Box>
                <TextInput label="Known risks or constraints" value={form.values.riskProfile} onChange={(riskProfile) => form.setValue('riskProfile', riskProfile)} multiline />
                <SaveButton
                  disabled={!form.values.name || !form.values.summary || createProduct.isPending}
                  label={createProduct.isPending ? 'Creating product...' : 'Create product and open workspace'}
                  endIcon={<ArrowForwardOutlined />}
                />
              </Stack>
            </Box>
          </Surface>
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="What Happens Next" action={<PsychologyAltOutlined sx={{ color: appleColors.purple }} />} />
            <Stack spacing={1.5}>
              {[
                'The product becomes the selected owner context.',
                'A draft cart is prepared for that product.',
                'You choose lifecycle services and delivery talent.',
                'The draft converts into a project workspace with milestones.',
              ].map((item) => (
                <Stack key={item} direction="row" spacing={1.2} alignItems="flex-start">
                  <CheckCircleOutlineOutlined sx={{ color: appleColors.green, fontSize: 20, mt: 0.2 }} />
                  <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {item}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Surface>

          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
            <SectionTitle title="Design Principle" />
            <Typography variant="h4">Product first, pages second.</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
              Owners should not hunt across scattered pages. Each route should answer where the product is, what needs to happen next, and which decisions are ready.
            </Typography>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
