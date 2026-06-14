'use client';

import { useMemo, useState } from 'react';
import { LoomAIMaxModeAssistant } from './LoomAIMaxModeAssistant';
import OwnerWorkspaceFixedChatDock from './OwnerWorkspaceFixedChatDock';
import { openWidgetAssistant, type WidgetStatus } from './loomAIMaxModeWidgetRuntime';
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
  const [fullChatStatus, setFullChatStatus] = useState<WidgetStatus>('idle');
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

  const conversationId = `product-workspace-${product.id}`;

  return (
    <>
      <LoomAIMaxModeAssistant
        disabled={false}
        requestContext={requestContext}
        conversationId={conversationId}
        mode="thinker"
        position="product_workspace_fixed_chat"
        title="Ask about this product"
        eyebrow="Fixed chat · read-only context"
        description="Ask ProdUS AI about this product, blockers, services, scanner proof, AI opportunities, and the next owner decision. Chat can read context but cannot update records."
        companionDock={false}
        onStatusChange={setFullChatStatus}
        renderCard={false}
        showLauncher={false}
        starterPrompts={starterPrompts}
      />
      <OwnerWorkspaceFixedChatDock
        conversationId={conversationId}
        requestContext={requestContext}
        mode="thinker"
        position="product_workspace_fixed_chat"
        starterPrompts={starterPrompts}
        fullChatStatus={fullChatStatus}
        onOpenFullChat={openWidgetAssistant}
      />
    </>
  );
}
