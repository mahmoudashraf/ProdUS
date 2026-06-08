'use client';

import NextLink from 'next/link';
import { useMemo, useState } from 'react';
import {
  AddLinkOutlined,
  ContentCopyOutlined,
  LockOutlined,
  PublicOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteJson, getJson, postJson } from './api';
import {
  EmptyState,
  PastelChip,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type {
  ProductProfile,
  ProductShareAudience,
  ProductShareLink,
  ProductShareLinkRequest,
  ProductShareSection,
} from './types';
import type { ShareJourneyView } from './ownerWorkspaceJourneyConfig';
import type { WorkspaceTab } from './ownerWorkspaceModel';

const shareSectionOptions: Array<{
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
    detail: 'High-level delivery/team status only.',
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

export default function OwnerWorkspaceShareArea({
  detailOpen,
  selectedProduct,
  view,
  workspaceTab,
}: {
  detailOpen: boolean;
  selectedProduct?: ProductProfile | undefined;
  view: ShareJourneyView;
  workspaceTab: WorkspaceTab;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [ownerNote, setOwnerNote] = useState('');
  const [visibleSections, setVisibleSections] = useState<ProductShareSection[]>(['PRODUCT_SUMMARY']);
  const [copiedToken, setCopiedToken] = useState('');
  const productId = selectedProduct?.id || '';

  const links = useQuery({
    queryKey: ['product-share-links', productId],
    enabled: !!productId && workspaceTab === 'share',
    queryFn: () => getJson<ProductShareLink[]>(`/products/${productId}/share-links`),
  });
  const createLink = useMutation({
    mutationFn: (payload: ProductShareLinkRequest) =>
      postJson<ProductShareLink, ProductShareLinkRequest>(`/products/${productId}/share-links`, payload),
    onSuccess: async () => {
      setTitle('');
      setOwnerNote('');
      setVisibleSections(['PRODUCT_SUMMARY']);
      await queryClient.invalidateQueries({ queryKey: ['product-share-links', productId] });
    },
  });
  const revokeLink = useMutation({
    mutationFn: (linkId: string) => deleteJson<ProductShareLink>(`/products/${productId}/share-links/${linkId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['product-share-links', productId] });
    },
  });

  const activeLinks = (links.data || []).filter((link) => link.active);
  const shareBaseUrl = typeof window === 'undefined' ? '' : window.location.origin;
  const publicPreviewHref = activeLinks[0] ? `/share/product/${activeLinks[0].token}` : '';
  const selectedSectionSet = useMemo(() => new Set(visibleSections), [visibleSections]);

  const toggleSection = (section: ProductShareSection, checked: boolean) => {
    if (section === 'PRODUCT_SUMMARY') return;
    setVisibleSections(current => {
      const next = new Set(current);
      if (checked) next.add(section);
      if (!checked) next.delete(section);
      next.add('PRODUCT_SUMMARY');
      return Array.from(next);
    });
  };

  if (workspaceTab !== 'share') return null;

  if (!selectedProduct) {
    return <EmptyState label="Select a product before creating share links." />;
  }

  return (
    <Stack spacing={2.5}>
      <QueryState isLoading={links.isLoading} error={links.error || createLink.error || revokeLink.error} />

      {!detailOpen && (
        <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }} justifyContent="space-between">
            <Stack spacing={1} sx={{ minWidth: 0 }}>
              <PastelChip label="Controlled disclosure" accent={appleColors.purple} />
              <Typography variant="h3">Share the product without exposing private proof</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: 760 }}>
                Create product-specific links for advisors, investors, customers, or collaborators. Public viewers get summary context first; findings and evidence remain locked unless the owner explicitly shares safe summaries.
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <PastelChip label={`${activeLinks.length} active links`} accent={activeLinks.length ? appleColors.green : appleColors.purple} bg={activeLinks.length ? '#e7f8ee' : '#f1efff'} />
                <PastelChip label="Findings locked by default" accent={appleColors.amber} bg="#fff4dc" />
                <PastelChip label="Evidence locked by default" accent={appleColors.amber} bg="#fff4dc" />
              </Stack>
            </Stack>
            {publicPreviewHref && (
              <Button component={NextLink} href={publicPreviewHref} variant="outlined" startIcon={<VisibilityOutlined />} sx={{ minHeight: 42, alignSelf: { xs: 'flex-start', lg: 'center' } }}>
                Open public preview
              </Button>
            )}
          </Stack>
        </Surface>
      )}

      {detailOpen && view === 'links' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.95fr) minmax(0, 1.05fr)' }, gap: 2.5 }}>
          <Surface>
            <SectionTitle title="Create Share Link" action={<AddLinkOutlined sx={{ color: appleColors.purple }} />} />
            <Stack spacing={1.5}>
              <TextField
                label="Link title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={`${selectedProduct.name} product summary`}
                fullWidth
              />
              <TextField
                label="Owner note"
                value={ownerNote}
                onChange={(event) => setOwnerNote(event.target.value)}
                placeholder="Optional context for the person opening this link"
                multiline
                minRows={3}
                fullWidth
              />
              <FormGroup>
                {shareSectionOptions.map((section) => (
                  <Box key={section.value} sx={{ borderTop: '1px solid', borderColor: appleColors.line, py: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSectionSet.has(section.value)}
                          disabled={section.value === 'PRODUCT_SUMMARY'}
                          onChange={(event) => toggleSection(section.value, event.target.checked)}
                        />
                      }
                      label={
                        <Box>
                          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography sx={{ fontWeight: 900 }}>{section.label}</Typography>
                            {section.sensitive && <PastelChip label="summary only" accent={appleColors.amber} bg="#fff4dc" />}
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.45 }}>
                            {section.detail}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                ))}
              </FormGroup>
              <Alert severity="info" icon={<LockOutlined />} sx={{ borderRadius: 1 }}>
                Anonymous links never expose detailed findings or evidence artifacts. This first version shares safe summaries only.
              </Alert>
              <Button
                variant="contained"
                startIcon={<PublicOutlined />}
                disabled={createLink.isPending}
                onClick={() => createLink.mutate({
                  title: title || `${selectedProduct.name} product summary`,
                  audience: 'PUBLIC_SUMMARY' as ProductShareAudience,
                  visibleSections,
                  ownerNote,
                })}
                sx={{ minHeight: 44 }}
              >
                {createLink.isPending ? 'Creating...' : 'Create public summary link'}
              </Button>
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle title="Active Share Links" action={<PastelChip label={`${activeLinks.length}`} accent={appleColors.green} bg="#e7f8ee" />} />
            {links.data?.length ? (
              <Stack spacing={1.25}>
                {links.data.map((link) => {
                  const href = `/share/product/${link.token}`;
                  const absoluteHref = shareBaseUrl ? `${shareBaseUrl}${href}` : href;
                  return (
                    <Box key={link.id} sx={{ p: 1.35, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: link.active ? '#fff' : '#f8fafc' }}>
                      <Stack spacing={1}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}>{link.title}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                              {absoluteHref}
                            </Typography>
                          </Box>
                          <StatusChip label={link.active ? 'ACTIVE' : 'REVOKED'} />
                        </Stack>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          {link.visibleSections.map((section) => (
                            <PastelChip key={section} label={formatLabel(section)} accent={appleColors.cyan} bg="#e4f9fd" />
                          ))}
                          <PastelChip label={`${link.accessCount} views`} accent={appleColors.purple} />
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <Button component={NextLink} href={href} variant="outlined" startIcon={<VisibilityOutlined />} sx={{ minHeight: 38 }}>
                            Preview
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<ContentCopyOutlined />}
                            onClick={async () => {
                              await navigator.clipboard?.writeText(absoluteHref);
                              setCopiedToken(link.token);
                            }}
                            sx={{ minHeight: 38 }}
                          >
                            {copiedToken === link.token ? 'Copied' : 'Copy link'}
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            disabled={!link.active || revokeLink.isPending}
                            onClick={() => revokeLink.mutate(link.id)}
                            sx={{ minHeight: 38 }}
                          >
                            Revoke
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <EmptyState label="No share links yet. Create a public summary link when you want to show this product externally without exposing private proof." />
            )}
          </Surface>
        </Box>
      )}

      {detailOpen && view === 'preview' && (
        <Surface sx={{ background: '#fff' }}>
          <SectionTitle title="Public Preview Rules" action={<LockOutlined sx={{ color: appleColors.amber }} />} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
            {[
              ['Anonymous first view', 'Product summary, selected public sections, and owner note only.'],
              ['Private proof stays locked', 'Findings and evidence artifacts are never included by default.'],
              ['Owner controls scope', 'Every link has its own section list and can be revoked.'],
            ].map(([titleText, detail]) => (
              <Box key={titleText} sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
                <Typography sx={{ fontWeight: 950 }}>{titleText}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                  {detail}
                </Typography>
              </Box>
            ))}
          </Box>
          {publicPreviewHref ? (
            <Button component={NextLink} href={publicPreviewHref} variant="contained" startIcon={<PublicOutlined />} sx={{ minHeight: 44, mt: 2 }}>
              Open latest public preview
            </Button>
          ) : (
            <Alert severity="warning" sx={{ borderRadius: 1, mt: 2 }}>
              Create a share link first to preview the external page.
            </Alert>
          )}
        </Surface>
      )}
    </Stack>
  );
}
