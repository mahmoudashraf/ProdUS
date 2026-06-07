'use client';

import {
  ArrowForwardOutlined,
  AutoAwesomeOutlined,
  ErrorOutlineOutlined,
  RuleOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Divider, Stack, Typography } from '@mui/material';
import {
  ProjectAnalysisChatPanel,
  ValidationRow,
  type ValidationState,
} from './ProductOnboardingAiPanels';
import { DotLabel, appleColors, errorMessageFromUnknown } from './PlatformComponents';
import type { AiAssistedProductAnalysisResponse } from './types';

export interface ProductOnboardingValidationItem {
  title: string;
  detail: string;
  state: ValidationState;
}

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
  const blockedValidationCount = validationItems.filter(item => item.state === 'blocked').length;
  const attentionValidationCount = validationItems.filter(item => item.state === 'attention').length;
  const actionErrorMessage = actionError
    ? errorMessageFromUnknown(actionError, 'The AI project creation action was rejected.')
    : '';
  const actionErrorCode = actionError ? errorCodeFromUnknown(actionError) : '';

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
        <Divider />
        <Stack spacing={0.8}>
          <DotLabel label={`${privateAttachmentCount} private attachments`} color={appleColors.blue} />
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
            <DotLabel label="Document evidence missing" color={appleColors.red} />
          )}
          <DotLabel label="No document indexing" color={appleColors.green} />
          <DotLabel
            label={`${selectedServiceCount} service modules selected`}
            color={selectedServiceCount ? appleColors.green : appleColors.amber}
          />
          <DotLabel
            label={
              analysis.aiOpportunityReport
                ? `${aiOpportunityCount} AI opportunities`
                : fullAnalysisMode
                  ? 'Full analysis + AI'
                  : 'AI integration only'
            }
            color={
              analysis.aiOpportunityReport
                ? appleColors.green
                : fullAnalysisMode
                  ? appleColors.purple
                  : appleColors.cyan
            }
          />
        </Stack>
        <Box
          sx={{
            borderRadius: 1,
            border: '1px solid #dfe7f5',
            bgcolor: '#fbfdff',
            p: 1.25,
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={0.8} alignItems="center">
                <RuleOutlined sx={{ color: appleColors.purple, fontSize: 19 }} />
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  AI journey validation
                </Typography>
              </Stack>
              <DotLabel
                label={
                  blockedValidationCount
                    ? `${blockedValidationCount} blocked`
                    : attentionValidationCount
                      ? `${attentionValidationCount} review`
                      : 'Ready'
                }
                color={
                  blockedValidationCount
                    ? appleColors.red
                    : attentionValidationCount
                      ? appleColors.amber
                      : appleColors.green
                }
              />
            </Stack>
            <Stack spacing={0.75}>
              {validationItems.map(item => (
                <ValidationRow
                  key={item.title}
                  title={item.title}
                  detail={item.detail}
                  state={item.state}
                />
              ))}
            </Stack>
          </Stack>
        </Box>
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
        <ProjectAnalysisChatPanel
          disabled={aiBusy}
          requestContext={requestContext}
          conversationId={`project-analysis-${analysis.intent.id}`}
        />
        {documentProofGap && (
          <Alert severity={documentProofRequired ? 'warning' : 'info'} sx={{ borderRadius: 1 }}>
            {documentProofRequired
              ? 'LoomAI did not prove it opened every AI-shared document. Re-run analysis after document access is available, or unshare the file from AI before creating this project.'
              : 'LoomAI did not return formal proof for every AI-shared document. Creation is still allowed; ProdUS will keep the file attached privately and store this evidence gap for follow-up.'}
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
            : `Re-run ${fullAnalysisMode ? 'Full' : 'AI Integration'} Analysis`}
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
            ? 'Creating project...'
            : canCreate
              ? 'Create Project with AI Action'
              : 'Resolve Validation First'}
        </Button>
      </Stack>
    </Box>
  );
}
