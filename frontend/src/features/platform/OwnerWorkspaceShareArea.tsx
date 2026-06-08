'use client';

import NextLink from 'next/link';
import { useMemo, useState } from 'react';
import {
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Button,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteJson, getJson, postJson } from './api';
import {
  EmptyState,
  PastelChip,
  QueryState,
  Surface,
  appleColors,
} from './PlatformComponents';
import OwnerShareLinkCreatePanel from './OwnerShareLinkCreatePanel';
import OwnerShareLinksListPanel from './OwnerShareLinksListPanel';
import OwnerSharePreviewRulesPanel from './OwnerSharePreviewRulesPanel';
import type {
  ProductProfile,
  ProductShareAudience,
  ProductShareLink,
  ProductShareLinkRequest,
  ProductShareSection,
} from './types';
import type { ShareJourneyView } from './ownerWorkspaceJourneyConfig';
import {
  shareAudienceOptions,
  shareExpiryOptions,
  shareSectionOptions,
  type ShareExpiryMode,
} from './ownerWorkspaceShareOptions';
import type { WorkspaceTab } from './ownerWorkspaceModel';

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
  const [audience, setAudience] = useState<ProductShareAudience>('PUBLIC_SUMMARY');
  const [ownerNote, setOwnerNote] = useState('');
  const [viewerActionLabel, setViewerActionLabel] = useState('');
  const [viewerActionUrl, setViewerActionUrl] = useState('');
  const [expiryMode, setExpiryMode] = useState<ShareExpiryMode>('none');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
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
      setAudience('PUBLIC_SUMMARY');
      setOwnerNote('');
      setViewerActionLabel('');
      setViewerActionUrl('');
      setExpiryMode('none');
      setCustomExpiryDate('');
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
  const latestPublicLink = activeLinks.find((link) => link.audience !== 'INTERNAL_ONLY');
  const publicPreviewHref = latestPublicLink ? `/share/product/${latestPublicLink.token}` : '';
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

  const buildExpiresAt = () => {
    if (expiryMode === 'none') return undefined;
    if (expiryMode === 'custom') {
      if (!customExpiryDate) return undefined;
      return `${customExpiryDate}T23:59:59`;
    }
    const date = new Date();
    date.setDate(date.getDate() + Number(expiryMode));
    return toBackendDateTime(date);
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

      {detailOpen && view === 'create' && (
        <OwnerShareLinkCreatePanel
          audience={audience}
          audienceOptions={shareAudienceOptions}
          customExpiryDate={customExpiryDate}
          expiryMode={expiryMode}
          expiryOptions={shareExpiryOptions}
          isCreating={createLink.isPending}
          ownerNote={ownerNote}
          product={selectedProduct}
          sectionOptions={shareSectionOptions}
          selectedSections={selectedSectionSet}
          title={title}
          viewerActionLabel={viewerActionLabel}
          viewerActionUrl={viewerActionUrl}
          onAudienceChange={setAudience}
          onCreateLink={() => {
            const expiresAt = buildExpiresAt();
            const payload: ProductShareLinkRequest = {
              title: title || `${selectedProduct.name} product summary`,
              audience,
              visibleSections,
              ownerNote,
              viewerActionLabel,
              viewerActionUrl,
            };
            if (expiresAt) {
              payload.expiresAt = expiresAt;
            }
            createLink.mutate(payload);
          }}
          onCustomExpiryDateChange={setCustomExpiryDate}
          onExpiryModeChange={setExpiryMode}
          onOwnerNoteChange={setOwnerNote}
          onTitleChange={setTitle}
          onToggleSection={toggleSection}
          onViewerActionLabelChange={setViewerActionLabel}
          onViewerActionUrlChange={setViewerActionUrl}
        />
      )}

      {detailOpen && view === 'links' && (
        <OwnerShareLinksListPanel
          activeCount={activeLinks.length}
          copiedToken={copiedToken}
          isRevoking={revokeLink.isPending}
          links={links.data || []}
          shareBaseUrl={shareBaseUrl}
          onCopy={async (token, absoluteHref) => {
            await navigator.clipboard?.writeText(absoluteHref);
            setCopiedToken(token);
          }}
          onRevoke={(linkId) => revokeLink.mutate(linkId)}
        />
      )}

      {detailOpen && view === 'preview' && (
        <OwnerSharePreviewRulesPanel publicPreviewHref={publicPreviewHref} />
      )}
    </Stack>
  );
}

function toBackendDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
  ].join('');
}
