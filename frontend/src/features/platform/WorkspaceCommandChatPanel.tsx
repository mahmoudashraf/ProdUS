'use client';

import AlternateEmailOutlined from '@mui/icons-material/AlternateEmailOutlined';
import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import { Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import {
  EmptyState,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { WorkspaceChat, WorkspaceChatMention } from './types';

interface IWorkspaceCommandChatPanelProps {
  chat?: WorkspaceChat | undefined;
  isLoading: boolean;
  isSending: boolean;
  onSendMessage: (body: string, mentionedRiskIds: string[]) => void;
}

export default function WorkspaceCommandChatPanel({
  chat,
  isLoading,
  isSending,
  onSendMessage,
}: IWorkspaceCommandChatPanelProps) {
  const [body, setBody] = useState('');
  const [selectedMentionIds, setSelectedMentionIds] = useState<string[]>([]);
  const selectedMentionSet = useMemo(() => new Set(selectedMentionIds), [selectedMentionIds]);
  const mentionableFindings = useMemo(
    () => chat?.mentionableFindings || [],
    [chat?.mentionableFindings]
  );
  const messages = useMemo(() => chat?.messages || [], [chat?.messages]);
  const mentionedServices = useMemo(
    () =>
      uniqueValues(
        messages.flatMap(
          message =>
            message.mentions.map(mention => mention.serviceName).filter(Boolean) as string[]
        )
      ),
    [messages]
  );
  const decisionMessages = useMemo(
    () =>
      messages.filter(message =>
        /\b(decision|decided|approve|approved|accept|accepted|block|blocked|owner|handoff|ship)\b/i.test(
          message.body
        )
      ),
    [messages]
  );
  const selectedMentionServices = useMemo(
    () =>
      uniqueValues(
        mentionableFindings
          .filter(mention => selectedMentionSet.has(mention.id))
          .map(mention => mention.serviceName)
          .filter(Boolean) as string[]
      ),
    [mentionableFindings, selectedMentionSet]
  );
  const canSend = body.trim().length > 0 && !isSending;

  const toggleMention = (findingId: string) => {
    setSelectedMentionIds(current =>
      current.includes(findingId) ? current.filter(id => id !== findingId) : [...current, findingId]
    );
  };

  const send = () => {
    const cleanBody = body.trim();
    if (!cleanBody || isSending) return;
    onSendMessage(cleanBody, selectedMentionIds);
    setBody('');
    setSelectedMentionIds([]);
  };

  return (
    <Stack spacing={2}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <PastelChip
                label="Workspace discussion / decisions"
                accent={appleColors.cyan}
                bg="#e4f9fd"
              />
              <PastelChip
                label={`${chat?.participants.length || 0} people`}
                accent={appleColors.purple}
                bg="#f3edff"
              />
              <PastelChip
                label={`${mentionableFindings.length} mentionable findings`}
                accent={mentionableFindings.length ? appleColors.amber : appleColors.green}
                bg={mentionableFindings.length ? '#fff4dc' : '#e7f8ee'}
              />
            </Stack>
            <Typography variant="h3" sx={{ mt: 1 }}>
              Workspace discussion / decisions
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.55, lineHeight: 1.6, maxWidth: 820 }}>
              Keep decisions attached to the current workspace. Mention findings so the related
              service, proof, or check context stays visible with the message.
            </Typography>
          </Box>
          {isLoading && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Loading chat
              </Typography>
            </Stack>
          )}
        </Stack>
      </Surface>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Surface>
          <SectionTitle
            title="Discussion log"
            action={
              <PastelChip
                label={`${messages.length} message${messages.length === 1 ? '' : 's'}`}
                accent={messages.length ? appleColors.cyan : appleColors.muted}
                bg={messages.length ? '#e4f9fd' : '#f8fafc'}
              />
            }
          />

          <Stack spacing={1.25} sx={{ mt: 1.25 }}>
            {messages.length ? (
              messages.map(message => (
                <Box
                  key={message.id}
                  sx={{
                    border: '1px solid',
                    borderColor: '#dbe5f3',
                    borderRadius: 1,
                    bgcolor: '#fff',
                    p: 1.25,
                  }}
                >
                  <Stack spacing={0.8}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={0.75}
                      justifyContent="space-between"
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                          {message.sender?.email || 'Workspace participant'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatChatTime(message.createdAt)}
                        </Typography>
                      </Box>
                      {message.mentions.length > 0 && (
                        <PastelChip
                          label={`${message.mentions.length} finding${message.mentions.length === 1 ? '' : 's'} mentioned`}
                          accent={appleColors.amber}
                          bg="#fff4dc"
                        />
                      )}
                    </Stack>
                    <Typography sx={{ lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                      {message.body}
                    </Typography>
                    {message.mentions.length > 0 && (
                      <Stack direction="row" spacing={0.65} flexWrap="wrap" useFlexGap>
                        {message.mentions.map(mention => (
                          <FindingMentionChip key={mention.id} mention={mention} />
                        ))}
                      </Stack>
                    )}
                    {message.mentions.some(mention => mention.serviceName) && (
                      <Box
                        sx={{
                          borderTop: '1px solid',
                          borderColor: appleColors.line,
                          pt: 0.75,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 850 }}
                        >
                          Related service
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={0.55}
                          flexWrap="wrap"
                          useFlexGap
                          sx={{ mt: 0.45 }}
                        >
                          {uniqueValues(
                            message.mentions
                              .map(mention => mention.serviceName)
                              .filter(Boolean) as string[]
                          ).map(serviceName => (
                            <PastelChip
                              key={serviceName}
                              label={serviceName}
                              accent={appleColors.purple}
                              bg="#f3edff"
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </Box>
              ))
            ) : (
              <EmptyState label="No workspace messages yet. Start with the next decision, blocker, or proof question." />
            )}
          </Stack>
        </Surface>

        <Stack spacing={2}>
          <Surface>
            <SectionTitle title="Decision context" />
            <Stack spacing={1} sx={{ mt: 1.15 }}>
              <DecisionFact
                label="Decision notes"
                value={`${decisionMessages.length}`}
                detail={
                  decisionMessages.length
                    ? 'Messages with decision, owner, blocker, accepted risk, ship, or handoff language.'
                    : 'No explicit decision note yet.'
                }
              />
              <DecisionFact
                label="Mentioned services"
                value={`${mentionedServices.length}`}
                detail={
                  mentionedServices.length
                    ? mentionedServices.slice(0, 3).join(' · ')
                    : 'Mention a finding to attach service context.'
                }
              />
              <DecisionFact
                label="Selected for next message"
                value={`${selectedMentionIds.length} finding${selectedMentionIds.length === 1 ? '' : 's'}`}
                detail={
                  selectedMentionServices.length
                    ? selectedMentionServices.join(' · ')
                    : 'Choose findings below to attach context.'
                }
              />
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle title="Send decision or update" />
            <Stack spacing={1.25} sx={{ mt: 1.25 }}>
              <TextField
                label="Decision or update"
                value={body}
                onChange={event => setBody(event.target.value)}
                placeholder="Record what changed, what is blocked, who owns it, or what needs review."
                multiline
                minRows={4}
              />
              {mentionableFindings.length > 0 && (
                <Box>
                  <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mb: 0.75 }}>
                    <AlternateEmailOutlined fontSize="small" sx={{ color: appleColors.amber }} />
                    <Typography variant="subtitle2">Mention findings</Typography>
                  </Stack>
                  <Stack
                    spacing={0.65}
                    sx={{
                      maxHeight: 230,
                      minWidth: 0,
                      overflowY: 'auto',
                      pr: 0.5,
                    }}
                  >
                    {mentionableFindings.slice(0, 8).map(mention => {
                      const selected = selectedMentionSet.has(mention.id);
                      return (
                        <Button
                          key={mention.id}
                          size="small"
                          variant={selected ? 'contained' : 'outlined'}
                          onClick={() => toggleMention(mention.id)}
                          sx={{
                            minHeight: 34,
                            borderColor: selected ? appleColors.amber : '#e1c777',
                            bgcolor: selected ? appleColors.amber : '#fff',
                            color: selected ? '#fff' : appleColors.ink,
                            justifyContent: 'flex-start',
                            width: '100%',
                            maxWidth: '100%',
                            minWidth: 0,
                            px: 1.1,
                            py: 0.8,
                            textTransform: 'none',
                          }}
                        >
                          <Box
                            component="span"
                            sx={{ minWidth: 0, textAlign: 'left', width: '100%' }}
                          >
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                display: 'block',
                                fontWeight: 900,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {mention.title}
                            </Typography>
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                color: selected ? 'rgba(255,255,255,0.78)' : 'text.secondary',
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {[mention.severity, mention.sourceTool, mention.serviceName]
                                .filter(Boolean)
                                .join(' · ')}
                            </Typography>
                          </Box>
                        </Button>
                      );
                    })}
                  </Stack>
                </Box>
              )}
              <Button
                variant="contained"
                endIcon={<SendOutlined />}
                disabled={!canSend}
                onClick={send}
                sx={{ minHeight: 42, alignSelf: 'flex-start' }}
              >
                {isSending ? 'Sending...' : 'Send decision/update'}
              </Button>
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle
              title="People here"
              action={
                <ChatBubbleOutlineOutlined fontSize="small" sx={{ color: appleColors.cyan }} />
              }
            />
            <Stack spacing={0.85} sx={{ mt: 1.2 }}>
              {(chat?.participants || []).map(participant => (
                <Box
                  key={`${participant.user.id}-${participant.role}`}
                  sx={{
                    border: '1px solid',
                    borderColor: '#dbe5f3',
                    borderRadius: 1,
                    p: 1,
                    bgcolor: '#fff',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                    {participant.user.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatLabel(participant.role)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Surface>
        </Stack>
      </Box>
    </Stack>
  );
}

function DecisionFact({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: '#e2e8f0',
        borderRadius: 1,
        bgcolor: '#f8fafc',
        p: 0.9,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.25 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.4 }}>
        {detail}
      </Typography>
    </Box>
  );
}

function FindingMentionChip({ mention }: { mention: WorkspaceChatMention }) {
  const accent =
    mention.severity === 'CRITICAL' || mention.severity === 'HIGH'
      ? appleColors.red
      : mention.severity === 'MEDIUM'
        ? appleColors.amber
        : appleColors.blue;
  return (
    <PastelChip
      label={`${mention.title}${mention.serviceName ? ` · ${mention.serviceName}` : ''}`}
      accent={accent}
      bg={
        accent === appleColors.red
          ? '#fff1f1'
          : accent === appleColors.amber
            ? '#fff4dc'
            : '#eaf3ff'
      }
    />
  );
}

function formatChatTime(value?: string) {
  if (!value) return 'Time not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
