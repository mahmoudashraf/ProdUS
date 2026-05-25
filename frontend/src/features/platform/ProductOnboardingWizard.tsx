'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AutoAwesomeOutlined,
  ArrowForwardOutlined,
  CheckCircleOutlineOutlined,
  CloudUploadOutlined,
  Inventory2Outlined,
  LinkOutlined,
  PsychologyAltOutlined,
  SecurityOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import { postFormData, postJson, putJson } from './api';
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
import { AiAssistedProductCreationResponse, ProductProfile, ProductizationCart } from './types';

interface ProductProfilePayload {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  productUrl: string;
  repositoryUrl: string;
  riskProfile: string;
}

const stages: ProductProfile['businessStage'][] = [
  'IDEA',
  'PROTOTYPE',
  'VALIDATED',
  'LIVE',
  'SCALING',
];

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
    detail:
      'Capture known blockers early so the created project starts with grounded analysis.',
    icon: SecurityOutlined,
    accent: appleColors.amber,
  },
];

export default function ProductOnboardingWizard() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [aiBrief, setAiBrief] = useState('');
  const [aiDocumentFiles, setAiDocumentFiles] = useState<
    Array<{ file: File; shareWithAi: boolean }>
  >([]);
  const form = useAdvancedForm<ProductProfilePayload>({
    initialValues,
    validationRules: {
      name: [{ type: 'required', message: 'Product name is required' }],
      summary: [{ type: 'required', message: 'Product summary is required' }],
    },
  });

  const createProduct = useMutation({
    mutationFn: async () => {
      const product = await postJson<ProductProfile, ProductProfilePayload>(
        '/products',
        form.values
      );
      await putJson<
        ProductizationCart,
        { productProfileId: string; title: string; businessGoal: string }
      >('/productization-cart/current', {
        productProfileId: product.id,
        title: `${product.name} productization draft`,
        businessGoal: form.values.summary,
      });
      return product;
    },
    onSuccess: async product => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      router.push(`/products/${product.id}`);
    },
  });

  const createProductWithAI = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append('ownerMessage', aiBrief);
      if (form.values.name) payload.append('productName', form.values.name);
      if (form.values.businessStage) payload.append('businessStage', form.values.businessStage);
      if (form.values.techStack) payload.append('techStack', form.values.techStack);
      if (form.values.productUrl) payload.append('productUrl', form.values.productUrl);
      if (form.values.repositoryUrl) payload.append('repositoryUrl', form.values.repositoryUrl);
      if (form.values.riskProfile) payload.append('knownRisks', form.values.riskProfile);
      aiDocumentFiles.forEach((item, index) => {
        payload.append('files', item.file);
        if (item.shareWithAi) {
          payload.append('aiSharedFileIndexes', String(index));
        }
      });
      const response = await postFormData<AiAssistedProductCreationResponse>(
        '/products/ai-assisted',
        payload
      );
      await putJson<
        ProductizationCart,
        { productProfileId: string; title: string; businessGoal: string }
      >('/productization-cart/current', {
        productProfileId: response.product.id,
        title: `${response.product.name} productization draft`,
        businessGoal: response.product.summary || aiBrief,
      });
      return response;
    },
    onSuccess: async response => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      router.push(`/products/${response.product.id}`);
    },
  });

  const submit = form.handleSubmit(() => createProduct.mutate());
  const selectedAiDocumentCount = aiDocumentFiles.filter(item => item.shareWithAi).length;

  return (
    <>
      <PageHeader
        title="Create Product"
        description="Create the owner product context with optional private documents and AI-assisted analysis."
        action={
          <Button
            variant="outlined"
            onClick={() => router.push('/dashboard')}
            sx={{ minHeight: 42 }}
          >
            Back to dashboard
          </Button>
        }
      />
      <QueryState
        isLoading={createProduct.isPending || createProductWithAI.isPending}
        error={createProduct.error || createProductWithAI.error}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 340px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Surface
            sx={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 48%, #f8f7ff 100%)',
              borderColor: '#dfe7f5',
            }}
          >
            <Stack spacing={2.25}>
              <SectionTitle
                title="AI Project Creation"
                action={<DotLabel label="Owner approved" color={appleColors.purple} />}
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 300px' },
                  gap: 2.25,
                  alignItems: 'stretch',
                }}
              >
                <Stack spacing={1.5}>
                  <TextField
                    label="Tell ProdUS what you want to productize"
                    value={aiBrief}
                    onChange={event => setAiBrief(event.target.value)}
                    multiline
                    minRows={5}
                    fullWidth
                    placeholder="Describe the prototype, target users, links, risks, current blockers, and what production-ready should mean."
                  />
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      gap: 1.5,
                    }}
                  >
                    <TextInput
                      label="Product or app URL"
                      value={form.values.productUrl}
                      onChange={productUrl => form.setValue('productUrl', productUrl)}
                    />
                    <TextInput
                      label="Repository URL"
                      value={form.values.repositoryUrl}
                      onChange={repositoryUrl => form.setValue('repositoryUrl', repositoryUrl)}
                    />
                  </Box>
                  <Box
                    sx={{
                      border: '1px dashed #c8d4e5',
                      borderRadius: 1,
                      bgcolor: '#fff',
                      p: 1.5,
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.25}
                      justifyContent="space-between"
                      alignItems={{ sm: 'center' }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1,
                            bgcolor: '#ecfeff',
                            color: appleColors.cyan,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <CloudUploadOutlined fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>
                            Project documents
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {aiDocumentFiles.length
                              ? `${aiDocumentFiles.length} attached, ${selectedAiDocumentCount} shared temporarily with AI`
                              : 'Attach briefs, screenshots, notes, or specs'}
                          </Typography>
                        </Box>
                      </Stack>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadOutlined />}
                        sx={{ minHeight: 40, flexShrink: 0 }}
                      >
                        Add files
                        <input
                          hidden
                          multiple
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.json,.zip,image/png,image/jpeg,image/webp"
                          onChange={event => {
                            const files = Array.from(event.target.files || []).map(file => ({
                              file,
                              shareWithAi: true,
                            }));
                            setAiDocumentFiles(current => [...current, ...files]);
                            event.target.value = '';
                          }}
                        />
                      </Button>
                    </Stack>
                    {aiDocumentFiles.length > 0 && (
                      <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                        {aiDocumentFiles.map((item, index) => (
                          <Box
                            key={`${item.file.name}-${index}`}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto auto' },
                              gap: 1,
                              alignItems: 'center',
                              p: 1,
                              borderRadius: 1,
                              border: '1px solid #edf2f7',
                              bgcolor: item.shareWithAi ? '#f8f7ff' : '#fff',
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 800,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.file.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {(item.file.size / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                            </Box>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={item.shareWithAi}
                                  onChange={event =>
                                    setAiDocumentFiles(current =>
                                      current.map((doc, docIndex) =>
                                        docIndex === index
                                          ? { ...doc, shareWithAi: event.target.checked }
                                          : doc
                                      )
                                    )
                                  }
                                />
                              }
                              label="Share with AI"
                              sx={{
                                m: 0,
                                '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 800 },
                              }}
                            />
                            <Button
                              variant="text"
                              color="inherit"
                              onClick={() =>
                                setAiDocumentFiles(current =>
                                  current.filter((_, docIndex) => docIndex !== index)
                                )
                              }
                              sx={{ minHeight: 34, minWidth: 72 }}
                            >
                              Remove
                            </Button>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                  {createProductWithAI.data && (
                    <Alert severity={createProductWithAI.data.aiApplied ? 'success' : 'info'}>
                      {createProductWithAI.data.aiApplied
                        ? 'AI created the product profile and attached your project documents.'
                        : 'Product created with deterministic fallback because AI did not return the expected creation contract.'}
                    </Alert>
                  )}
                </Stack>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid #e4e9f3',
                    bgcolor: '#fff',
                    boxShadow: '0 20px 48px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1,
                        bgcolor: '#f0efff',
                        color: appleColors.purple,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <AutoAwesomeOutlined />
                    </Box>
                    <Box>
                      <Typography variant="h4">Create from conversation</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
                        ProdUS stores the product profile and keeps uploaded documents private. Only
                        selected files receive short-lived AI access for this creation run.
                      </Typography>
                    </Box>
                    <Divider />
                    <Stack spacing={0.8}>
                      <DotLabel
                        label={`${aiDocumentFiles.length} private attachments`}
                        color={appleColors.blue}
                      />
                      <DotLabel
                        label={`${selectedAiDocumentCount} temporary AI shares`}
                        color={selectedAiDocumentCount ? appleColors.purple : appleColors.muted}
                      />
                      <DotLabel label="No document indexing" color={appleColors.green} />
                    </Stack>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<AutoAwesomeOutlined />}
                      disabled={!aiBrief.trim() || createProductWithAI.isPending}
                      onClick={() => createProductWithAI.mutate()}
                      sx={{ minHeight: 48, mt: 0.5 }}
                    >
                      {createProductWithAI.isPending
                        ? 'Creating with AI...'
                        : 'Create Product with AI'}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Stack>
          </Surface>

          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f7fbff)' }}>
            <Stack spacing={2}>
              <SectionTitle
                title="Guided Setup"
                action={<DotLabel label="Owner first" color={appleColors.purple} />}
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 1.5,
                }}
              >
                {setupSteps.map((step, index) => {
                  const Icon = step.icon;
                  const palette =
                    categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
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
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1,
                            display: 'grid',
                            placeItems: 'center',
                            color: step.accent,
                            bgcolor: `${step.accent}14`,
                          }}
                        >
                          <Icon />
                        </Box>
                        <Box>
                          <Typography variant="h4">{step.title}</Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.75, lineHeight: 1.55 }}
                          >
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
                <SectionTitle
                  title="Product Profile"
                  action={<Inventory2Outlined sx={{ color: appleColors.purple }} />}
                />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
                    gap: 2,
                  }}
                >
                  <TextInput
                    label="Product name"
                    value={form.values.name}
                    onChange={name => form.setValue('name', name)}
                  />
                  <TextField
                    select
                    fullWidth
                    label="Business stage"
                    value={form.values.businessStage}
                    onChange={event =>
                      form.setValue(
                        'businessStage',
                        event.target.value as ProductProfile['businessStage']
                      )
                    }
                  >
                    {stages.map(stage => (
                      <MenuItem key={stage} value={stage}>
                        {formatLabel(stage)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <TextInput
                  label="Product outcome"
                  value={form.values.summary}
                  onChange={summary => form.setValue('summary', summary)}
                  multiline
                />
                <TextInput
                  label="Tech stack"
                  value={form.values.techStack}
                  onChange={techStack => form.setValue('techStack', techStack)}
                />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <TextInput
                    label="Product URL"
                    value={form.values.productUrl}
                    onChange={productUrl => form.setValue('productUrl', productUrl)}
                  />
                  <TextInput
                    label="Repository URL"
                    value={form.values.repositoryUrl}
                    onChange={repositoryUrl => form.setValue('repositoryUrl', repositoryUrl)}
                  />
                </Box>
                <TextInput
                  label="Known risks or constraints"
                  value={form.values.riskProfile}
                  onChange={riskProfile => form.setValue('riskProfile', riskProfile)}
                  multiline
                />
                <SaveButton
                  disabled={!form.values.name || !form.values.summary || createProduct.isPending}
                  label={
                    createProduct.isPending
                      ? 'Creating product...'
                      : 'Create product'
                  }
                  endIcon={<ArrowForwardOutlined />}
                />
              </Stack>
            </Box>
          </Surface>
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle
              title="What Happens Next"
              action={<PsychologyAltOutlined sx={{ color: appleColors.purple }} />}
            />
            <Stack spacing={1.5}>
              {[
                'The product becomes the selected owner context.',
                'Private documents remain attached to that product.',
                'AI-selected document access expires after a short window.',
                'You can edit the product normally after creation.',
              ].map(item => (
                <Stack key={item} direction="row" spacing={1.2} alignItems="flex-start">
                  <CheckCircleOutlineOutlined
                    sx={{ color: appleColors.green, fontSize: 20, mt: 0.2 }}
                  />
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
              Owners should not hunt across scattered pages. Each route should answer where the
              product is, what needs to happen next, and which decisions are ready.
            </Typography>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
