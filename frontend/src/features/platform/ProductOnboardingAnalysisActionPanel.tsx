'use client';

import {
  ArrowForwardOutlined,
  AutoAwesomeOutlined,
  ErrorOutlineOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Divider, Stack, Typography } from '@mui/material';
import ProductOnboardingAnalysisHelpPanel from './ProductOnboardingAnalysisHelpPanel';
import ProductOnboardingValidationChecklist, {
  type ProductOnboardingValidationItem,
} from './ProductOnboardingValidationChecklist';
import { DotLabel, appleColors, errorMessageFromUnknown } from './PlatformComponents';
import type { AiAssistedProductAnalysisResponse } from './types';

const errorCodeFromUnknown = (error: unknown) => {
  const responseData =
    typeof error === 'object' && error !== null && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined;

  if (responseData && typeof responseData === 'object') {
    const value = (responseData as Record<string, unknown>).errorCode;
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return '';
};

export default function ProductOnboardingAnalysisActionPanel({
  analysis,
  actionError,
  aiBusy,
  aiOpportunityCount,
  brief,
  canCreate,
  documentProofGap,
  documentProofRequired,
  documentUsageMissing,
  fullAnalysisMode,
  isAnalyzing,
  isCreating,
  notUsedDocumentCount,
  openedDocumentCount,
  privateAttachmentCount,
  requestContext,
  selectedDocumentCount,
  selectedServiceCount,
  validationItems,
  onCreate,
  onRunAnalysis,
}: {
  analysis: AiAssistedProductAnalysisResponse;
  actionError: unknown;
  aiBusy: boolean;
  aiOpportunityCount: number;
  brief: string;
  canCreate: boolean;
  documentProofGap: boolean;
  documentProofRequired: boolean;
  documentUsageMissing: boolean;
  fullAnalysisMode: boolean;
  isAnalyzing: boolean;
  isCreating: boolean;
  notUsedDocumentCount: number;
  openedDocumentCount: number;
  privateAttachmentCount: number;
  requestContext: Record<string, unknown>;
  selectedDocumentCount: number;
  selectedServiceCount: number;
  validationItems: ProductOnboardingValidationItem[];
  onCreate: () => void;
  onRunAnalysis: () => void;
}) {
  const actionErrorMessage = actionError
    ? errorMessageFromUnknown(actionError, 'The AI product creation action was rejected.')
    : '';
  const actionErrorCode = actionError ? errorCodeFromUnknown(actionError) : '';
  const blockedValidationCount = validationItems.filter(item => item.state === 'blocked').length;
  const attentionValidationCount = validationItems.filter(
    item => item.state === 'attention'
  ).length;
  const liveAiOpportunityResult = Boolean(
    analysis.aiOpportunityReport?.live || analysis.loomaiIntegrationOverview?.live
  );

  return (
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
            ProdUS stores the product profile and keeps uploaded documents private. Only selected
            files receive short-lived AI access for this creation run.
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1.25,
            borderRadius: 1,
            border: '1px solid',
            borderColor: canCreate ? '#bbf7d0' : blockedValidationCount ? '#fecdd3' : '#fde68a',
            bgcolor: canCreate ? '#f6fff9' : blockedValidationCount ? '#fff7f8' : '#fffaf1',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 950 }}>
            {canCreate
              ? 'Ready to create the product'
              : blockedValidationCount
                ? 'Resolve required fields before creating'
                : 'Review the highlighted proof before creating'}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.45, lineHeight: 1.45 }}
          >
            {blockedValidationCount
              ? `${blockedValidationCount} required check${blockedValidationCount === 1 ? '' : 's'} still need owner input.`
              : attentionValidationCount
                ? `${attentionValidationCount} review note${attentionValidationCount === 1 ? '' : 's'} will be stored for follow-up.`
                : 'The owner-approved action can run with the current understanding.'}
          </Typography>
        </Box>
        <Divider />
        <Stack spacing={0.8}>
          <DotLabel
            label={`${privateAttachmentCount} private attachments`}
            color={appleColors.blue}
          />
          <DotLabel
            label={`${selectedDocumentCount} temporary AI shares`}
            color={selectedDocumentCount ? appleColors.purple : appleColors.muted}
          />
          <DotLabel
            label={`${openedDocumentCount} opened through temporary URL`}
            color={openedDocumentCount ? appleColors.green : appleColors.amber}
          />
          {notUsedDocumentCount > 0 && (
            <DotLabel label={`${notUsedDocumentCount} not used`} color={appleColors.red} />
          )}
          {documentUsageMissing && (
            <DotLabel label="Document proof missing" color={appleColors.red} />
          )}
          <DotLabel label="No document indexing" color={appleColors.green} />
          <DotLabel
            label={`${selectedServiceCount} services selected`}
            color={selectedServiceCount ? appleColors.green : appleColors.amber}
          />
          <DotLabel
            label={
              liveAiOpportunityResult
                ? `${aiOpportunityCount} AI opportunities`
                : analysis.aiOpportunityReport || analysis.loomaiIntegrationOverview
                  ? 'AI opportunities failed'
                  : fullAnalysisMode
                    ? 'Full product analysis'
                    : 'AI opportunities only'
            }
            color={
              liveAiOpportunityResult
                ? appleColors.green
                : analysis.aiOpportunityReport || analysis.loomaiIntegrationOverview
                  ? appleColors.red
                  : fullAnalysisMode
                    ? appleColors.purple
                    : appleColors.cyan
            }
          />
        </Stack>
        <ProductOnboardingValidationChecklist items={validationItems} />
        {actionErrorMessage && (
          <Alert severity="error" icon={<ErrorOutlineOutlined />} sx={{ borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              AI action validation failed
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.45 }}>
              {actionErrorMessage}
            </Typography>
            {actionErrorCode && (
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 0.5, fontWeight: 800, opacity: 0.8 }}
              >
                Code: {actionErrorCode}
              </Typography>
            )}
          </Alert>
        )}
        <ProductOnboardingAnalysisHelpPanel
          disabled={aiBusy}
          requestContext={requestContext}
          conversationId={`project-analysis-${analysis.intent.id}`}
        />
        {documentProofGap && (
          <Alert severity={documentProofRequired ? 'warning' : 'info'} sx={{ borderRadius: 1 }}>
            {documentProofRequired
              ? 'LoomAI did not prove it opened every AI-shared document. Re-run analysis after document access is available, or unshare the file from AI before creating this product.'
              : 'LoomAI did not return formal proof for every AI-shared document. Creation is still allowed; ProdUS will keep the file attached privately and store this proof gap for follow-up.'}
          </Alert>
        )}
        <Button
          variant="outlined"
          size="large"
          startIcon={<AutoAwesomeOutlined />}
          disabled={!brief.trim() || aiBusy}
          onClick={onRunAnalysis}
          sx={{ minHeight: 48, mt: 0.5 }}
        >
          {isAnalyzing
            ? 'Analyzing...'
            : `Re-run ${fullAnalysisMode ? 'full' : 'AI opportunities'} analysis`}
        </Button>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardOutlined />}
          disabled={!canCreate}
          onClick={onCreate}
          sx={{ minHeight: 48 }}
        >
          {isCreating
            ? 'Creating product...'
            : canCreate
              ? 'Create product'
              : 'Resolve required checks first'}
        </Button>
      </Stack>
    </Box>
  );
}
