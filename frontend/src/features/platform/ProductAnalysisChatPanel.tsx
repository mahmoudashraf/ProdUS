'use client';

import { LoomAIMaxModeAssistant } from './LoomAIMaxModeAssistant';

const analysisQuickQuestions = [
  'What is the strongest productization path?',
  'Which service should I add first?',
  'What evidence is missing before I create the project?',
  'Did AI use my document and what did it learn?',
];

export function ProjectAnalysisChatPanel({
  disabled,
  requestContext,
  conversationId,
}: {
  disabled: boolean;
  requestContext: Record<string, unknown>;
  conversationId: string;
}) {
  return (
    <LoomAIMaxModeAssistant
      disabled={disabled}
      requestContext={requestContext}
      conversationId={conversationId}
      mode="thinker"
      position="product_intake_analysis"
      title="Ask about this analysis"
      eyebrow="Thinker mode with read-only context"
      description="Use the LoomAI chat dock to ask about the full project analysis, selected services, document evidence, scanner focus, and the next owner decision. Chat may use read-only ProdUS context but cannot create or mutate records."
      starterPrompts={analysisQuickQuestions}
    />
  );
}
