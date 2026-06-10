'use client';

import { useMemo } from 'react';
import { Box } from '@mui/material';
import { LoomAIMaxModeAssistant } from './LoomAIMaxModeAssistant';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import type { ProductProfile } from './types';

interface OwnerWorkspaceAiChatDockProps {
  currentAreaLabel: string;
  currentDetailLabel: string;
  launchStatus: {
    blockerCount: number;
    confidence: string;
    improvementCount: number;
    label: string;
  };
  product?: ProductProfile | undefined;
  totalChecks: number;
  completedChecks: number;
  workspaceTab: WorkspaceTab;
}

const starterPrompts = [
  'What should I do next?',
  'Explain the launch blockers',
  'Where does LoomAI fit?',
  'What proof is missing?',
];

export default function OwnerWorkspaceAiChatDock({
  completedChecks,
  currentAreaLabel,
  currentDetailLabel,
  launchStatus,
  product,
  totalChecks,
  workspaceTab,
}: OwnerWorkspaceAiChatDockProps) {
  const requestContext = useMemo(
    () => ({
      pageType: 'product-workspace-fixed-chat',
      productId: product?.id,
      productName: product?.name,
      productUrl: product?.productUrl,
      repositoryUrl: product?.repositoryUrl,
      workspaceArea: workspaceTab,
      currentAreaLabel,
      currentDetailLabel,
      launchVerdict: launchStatus.label,
      launchConfidence: launchStatus.confidence,
      launchBlockers: launchStatus.blockerCount,
      launchImprovements: launchStatus.improvementCount,
      scannerChecksCompleted: completedChecks,
      scannerChecksTotal: totalChecks,
      aiPolicy:
        'Answer from read-only ProdUS product, launch, service, scanner, workspace, and evidence context. Do not create or mutate records from chat.',
    }),
    [
      completedChecks,
      currentAreaLabel,
      currentDetailLabel,
      launchStatus.blockerCount,
      launchStatus.confidence,
      launchStatus.improvementCount,
      launchStatus.label,
      product?.id,
      product?.name,
      product?.productUrl,
      product?.repositoryUrl,
      totalChecks,
      workspaceTab,
    ]
  );

  if (!product?.id) return null;

  return (
    <Box
      data-testid="owner-workspace-ai-chat-dock"
      sx={{
        position: 'fixed',
        right: { md: 20, xl: 28 },
        bottom: { md: 84, xl: 92 },
        width: { md: 340, xl: 360 },
        display: { xs: 'none', md: 'block' },
        zIndex: theme => theme.zIndex.modal - 2,
        pointerEvents: 'auto',
      }}
    >
      <LoomAIMaxModeAssistant
        disabled={false}
        requestContext={requestContext}
        conversationId={`product-workspace-${product.id}`}
        mode="thinker"
        position="product_workspace_fixed_chat"
        title="Ask about this product"
        eyebrow="Fixed chat · read-only context"
        description="Ask ProdUS AI about this product, blockers, services, scanner proof, AI opportunities, and the next owner decision. Chat can read context but cannot update records."
        starterPrompts={starterPrompts}
      />
    </Box>
  );
}
