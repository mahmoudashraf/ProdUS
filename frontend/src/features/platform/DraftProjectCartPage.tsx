'use client';

import NextLink from 'next/link';
import { useState } from 'react';
import {
  AddShoppingCartOutlined,
  ArrowForwardOutlined,
  AutoAwesomeOutlined,
  DeleteOutlineOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  OpenInNewOutlined,
  PersonSearchOutlined,
  RocketLaunchOutlined,
  ShoppingCartOutlined,
  WorkspacesOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Divider, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteJson, getJson, postJson, putJson } from './api';
import {
  DotLabel,
  EmptyState,
  MetricTile,
  PageHeader,
  PastelChip,
  ProgressRing,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  categoryPalette,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import { ProductProfile, ProductizationCart, ProductizationCartConvertResponse, ProjectWorkspace } from './types';

interface CartUpdatePayload {
  productProfileId?: string;
  title?: string;
  businessGoal?: string;
}

interface CartConvertPayload {
  projectName: string;
}

const readinessScore = (cart?: ProductizationCart) =>
  clampScore((cart?.productProfile ? 30 : 0) + (cart?.serviceItems.length || 0) * 18 + (cart?.talentItems.length || 0) * 12);

export default function DraftProjectCartPage() {
  const queryClient = useQueryClient();
  const [projectName, setProjectName] = useState('');
  const [notice, setNotice] = useState('');
  const [createdWorkspace, setCreatedWorkspace] = useState<ProjectWorkspace | null>(null);

  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const cart = useQuery({ queryKey: ['productization-cart'], queryFn: () => getJson<ProductizationCart>('/productization-cart/current') });

  const updateCart = useMutation({
    mutationFn: (payload: CartUpdatePayload) => putJson<ProductizationCart, CartUpdatePayload>('/productization-cart/current', payload),
    onSuccess: async () => {
      setCreatedWorkspace(null);
      setNotice('Draft cart product updated.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const removeService = useMutation({
    mutationFn: (itemId: string) => deleteJson<ProductizationCart>(`/productization-cart/services/${itemId}`),
    onSuccess: async () => {
      setNotice('Service removed from the draft cart.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const removeTalent = useMutation({
    mutationFn: (itemId: string) => deleteJson<ProductizationCart>(`/productization-cart/talent/${itemId}`),
    onSuccess: async () => {
      setNotice('Team or expert removed from the draft cart.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const convertCart = useMutation({
    mutationFn: () =>
      postJson<ProductizationCartConvertResponse, CartConvertPayload>('/productization-cart/convert', {
        projectName: projectName || `${cart.data?.productProfile?.name || 'Product'} productization workspace`,
      }),
    onSuccess: async (result) => {
      setNotice('Workspace created. Your draft cart became a service plan, milestones, participants, and a project workspace.');
      setCreatedWorkspace(result.workspace);
      setProjectName('');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const productList = products.data || [];
  const currentCart = cart.data;
  const product = currentCart?.productProfile;
  const serviceCount = currentCart?.serviceItems.length || 0;
  const talentCount = currentCart?.talentItems.length || 0;
  const canStartWorkspace = !!product && serviceCount > 0;
  const score = readinessScore(currentCart);

  const selectProduct = (productId: string) => {
    const selected = productList.find((item) => item.id === productId);
    if (!selected) return;
    updateCart.mutate({
      productProfileId: selected.id,
      title: `${selected.name} productization draft`,
      businessGoal: selected.summary || `Move ${selected.name} toward production-ready delivery.`,
    });
  };

  return (
    <>
      <PageHeader
        title="Draft Project Cart"
        description="This is a temporary planning cart for one product. It collects lifecycle services plus teams or solo experts, then converts them into a real project workspace."
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={NextLink} href="/services" variant="outlined" startIcon={<AddShoppingCartOutlined />} sx={{ minHeight: 44 }}>
              Add services
            </Button>
            <Button component={NextLink} href="/teams" variant="outlined" startIcon={<GroupsOutlined />} sx={{ minHeight: 44 }}>
              Add teams
            </Button>
            <Button component={NextLink} href="/solo-experts" variant="outlined" startIcon={<PersonSearchOutlined />} sx={{ minHeight: 44 }}>
              Add experts
            </Button>
          </Stack>
        }
      />
      <QueryState isLoading={products.isLoading || cart.isLoading} error={products.error || cart.error || updateCart.error || removeService.error || removeTalent.error || convertCart.error} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 360px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Surface sx={{ p: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
            <Box sx={{ p: { xs: 2.5, md: 3 }, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.75fr 1.25fr' }, gap: 3, alignItems: 'center' }}>
              <Stack spacing={2}>
                <PastelChip label="Draft only" accent={appleColors.purple} />
                <Stack direction="row" spacing={2} alignItems="center">
                  <ProgressRing value={score} size={108} color={canStartWorkspace ? appleColors.green : appleColors.purple} label="ready" />
                  <Box>
                    <Typography variant="h2">{currentCart?.title || 'Productization draft'}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
                      Nothing becomes a project until you press Start Project Workspace.
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              <Stack spacing={2}>
                {notice && (
                  <Alert severity="success" onClose={() => setNotice('')} sx={{ borderRadius: 1 }}>
                    {notice}
                  </Alert>
                )}
                <TextField
                  select
                  fullWidth
                  label="Product this draft belongs to"
                  value={product?.id || ''}
                  onChange={(event) => selectProduct(event.target.value)}
                  disabled={updateCart.isPending}
                >
                  {productList.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
                {product ? (
                  <Surface sx={{ boxShadow: 'none', background: '#fff' }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Box sx={{ width: 46, height: 46, borderRadius: 1, display: 'grid', placeItems: 'center', bgcolor: '#f1efff', color: appleColors.purple }}>
                        <Inventory2Outlined />
                      </Box>
                      <Box>
                        <Typography variant="h4">{product.name}</Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                          {product.summary || 'No product summary yet.'}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                          <PastelChip label={formatLabel(product.businessStage)} accent={appleColors.purple} />
                          {product.techStack && <PastelChip label={product.techStack} accent={appleColors.cyan} bg="#e4f9fd" />}
                        </Stack>
                      </Box>
                    </Stack>
                  </Surface>
                ) : (
                  <EmptyState label="Select or create a product before this draft can become a workspace." />
                )}
              </Stack>
            </Box>
          </Surface>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            <MetricTile label="Selected services" value={serviceCount} detail="Converted into service plan modules" accent={appleColors.purple} icon={<ShoppingCartOutlined />} sparkline />
            <MetricTile label="Teams / experts" value={talentCount} detail="Added as shortlist and participants" accent={appleColors.cyan} icon={<GroupsOutlined />} sparkline />
            <MetricTile label="Workspace status" value={canStartWorkspace ? 'Ready' : 'Needs scope'} detail={canStartWorkspace ? 'Product and services selected' : 'Product plus one service required'} accent={canStartWorkspace ? appleColors.green : appleColors.amber} icon={<WorkspacesOutlined />} sparkline />
          </Box>

          <Surface>
            <SectionTitle title="Lifecycle Services" action={<Button component={NextLink} href="/services" variant="text" endIcon={<ArrowForwardOutlined />}>Add service</Button>} />
            {currentCart?.serviceItems.length ? (
              <Stack spacing={0}>
                {currentCart.serviceItems.map((item, index) => {
                  const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr auto', md: '54px 1.3fr 1fr auto' },
                        gap: 1.5,
                        alignItems: 'center',
                        py: 1.75,
                        borderTop: index === 0 ? 0 : '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ width: 42, height: 42, borderRadius: 1, display: { xs: 'none', md: 'grid' }, placeItems: 'center', bgcolor: palette.bg, color: palette.accent, fontWeight: 900 }}>
                        {item.sequenceOrder}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900 }}>{item.serviceModule.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
                          {item.serviceModule.description || item.notes || 'Lifecycle service selected for this product.'}
                        </Typography>
                      </Box>
                      <Stack spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
                        <DotLabel label={item.serviceModule.category?.name || 'Lifecycle service'} color={palette.accent} />
                        <Typography variant="body2" color="text.secondary">{item.serviceModule.timelineRange || item.serviceModule.priceRange || 'Scoped during planning'}</Typography>
                      </Stack>
                      <IconButton
                        size="small"
                        onClick={() => removeService.mutate(item.id)}
                        disabled={removeService.isPending}
                        sx={{ width: 36, height: 36, borderRadius: 1, color: appleColors.red, bgcolor: '#fff7f8' }}
                      >
                        <DeleteOutlineOutlined fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <EmptyState label="No services yet. Add lifecycle services such as validation, security, cloud, database, launch readiness, or support." />
            )}
          </Surface>

          <Surface>
            <SectionTitle title="Teams And Experts" action={<Button component={NextLink} href="/teams" variant="text" endIcon={<ArrowForwardOutlined />}>Add talent</Button>} />
            {currentCart?.talentItems.length ? (
              <Stack spacing={0}>
                {currentCart.talentItems.map((item, index) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr auto', md: '1.2fr 1fr auto' },
                      gap: 1.5,
                      alignItems: 'center',
                      py: 1.75,
                      borderTop: index === 0 ? 0 : '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>{item.team?.name || item.expertProfile?.displayName}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
                        {item.team?.headline || item.expertProfile?.headline || item.notes || 'Selected delivery partner.'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ display: { xs: 'none', md: 'flex' } }}>
                      <PastelChip label={formatLabel(item.itemType)} accent={item.itemType === 'TEAM' ? appleColors.cyan : appleColors.green} bg={item.itemType === 'TEAM' ? '#e4f9fd' : '#e7f8ee'} />
                      {item.team?.verificationStatus && <StatusChip label={item.team.verificationStatus} />}
                      {item.expertProfile?.availability && <StatusChip label={item.expertProfile.availability} />}
                    </Stack>
                    <IconButton
                      size="small"
                      onClick={() => removeTalent.mutate(item.id)}
                      disabled={removeTalent.isPending}
                      sx={{ width: 36, height: 36, borderRadius: 1, color: appleColors.red, bgcolor: '#fff7f8' }}
                    >
                      <DeleteOutlineOutlined fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            ) : (
              <EmptyState label="No delivery talent yet. Add verified teams or solo experts now, or start with services and match talent later." />
            )}
          </Surface>
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="Start Workspace" action={<RocketLaunchOutlined sx={{ color: appleColors.purple }} />} />
            <Stack spacing={1.5}>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Starting creates a service plan, service milestones, workspace participants, and team shortlist records from this draft.
              </Typography>
              <TextField
                size="small"
                label="Workspace name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder={product ? `${product.name} productization workspace` : 'Productization workspace'}
              />
              <Button
                variant="contained"
                startIcon={<RocketLaunchOutlined />}
                disabled={!canStartWorkspace || convertCart.isPending}
                onClick={() => convertCart.mutate()}
                sx={{ minHeight: 46 }}
              >
                {convertCart.isPending ? 'Starting...' : 'Start Project Workspace'}
              </Button>
              {!product && <DotLabel label="Select a product first" color={appleColors.amber} />}
              {product && !serviceCount && <DotLabel label="Add at least one service" color={appleColors.amber} />}
              {(createdWorkspace || currentCart?.convertedWorkspace) && (
                <Button component={NextLink} href="/workspaces" variant="outlined" endIcon={<OpenInNewOutlined />} sx={{ minHeight: 42 }}>
                  Open created workspace
                </Button>
              )}
            </Stack>
          </Surface>

          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
            <SectionTitle title="What This Cart Does" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
            <Stack spacing={1.25}>
              {[
                'Services become the service plan modules and milestones.',
                'Teams become shortlist records and workspace participants.',
                'Solo experts become specialist participants.',
                'The product becomes the workspace context.',
              ].map((item) => (
                <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                  <Box sx={{ width: 7, height: 7, mt: 1, borderRadius: '50%', bgcolor: appleColors.purple, boxShadow: `0 0 0 4px ${appleColors.purple}14` }} />
                  <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {item}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              Product briefs are separate. Use them when you need to describe a specific business goal and generate a service plan from that brief.
            </Typography>
          </Surface>

          <Surface>
            <SectionTitle title="Continue Planning" />
            <Stack spacing={1}>
              <Button component={NextLink} href="/products/new" variant="outlined" sx={{ minHeight: 42 }}>
                Create another product
              </Button>
              <Button component={NextLink} href={product ? `/products/${product.id}` : '/products'} variant="outlined" sx={{ minHeight: 42 }}>
                Open product workspace
              </Button>
              <Button component={NextLink} href="/dashboard" variant="text" sx={{ minHeight: 42 }}>
                Back to command center
              </Button>
            </Stack>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
