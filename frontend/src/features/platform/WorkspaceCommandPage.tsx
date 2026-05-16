'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AddOutlined,
  CalendarMonthOutlined,
  ErrorOutlineOutlined,
  FactCheckOutlined,
  TaskAltOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, LinearProgress, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FileUpload from '@/components/ui-component/FileUpload';
import { useAdvancedForm } from '@/hooks/enterprise';
import useAuth from '@/hooks/useAuth';
import { uploadService } from '@/services/uploadService';
import { UserRole } from '@/types/auth';
import { getJson, postJson, putJson } from './api';
import { sortWorkspacesForOwner } from './displayOrder';
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
  formatLabel,
} from './PlatformComponents';
import {
  AttachmentDownloadUrl,
  AttachmentScope,
  Deliverable,
  DisputeCase,
  EvidenceAttachment,
  Milestone,
  PackageInstance,
  ProjectWorkspace,
  SupportRequest,
  Team,
  WorkspaceParticipant,
} from './types';

interface WorkspacePayload {
  packageInstanceId: string;
  name: string;
  status: ProjectWorkspace['status'];
}

interface MilestonePayload {
  title: string;
  description: string;
  dueDate: string | null;
  status: Milestone['status'];
}

interface DeliverablePayload {
  title: string;
  evidence: string;
  status: Deliverable['status'];
}

interface ParticipantPayload {
  email: string;
  role: WorkspaceParticipant['role'];
  active: boolean;
}

interface SupportRequestPayload {
  supportSubscriptionId: string | null;
  teamId: string | null;
  title: string;
  description: string;
  priority: SupportRequest['priority'];
  status: SupportRequest['status'];
  dueOn: string | null;
}

interface SupportStatusPayload {
  status: SupportRequest['status'];
  resolution: string;
}

interface DisputePayload {
  teamId: string | null;
  title: string;
  description: string;
  severity: DisputeCase['severity'];
  responseDueOn: string | null;
}

interface DisputeStatusPayload {
  status: DisputeCase['status'];
  resolution: string;
}

const participantRoles: WorkspaceParticipant['role'][] = ['COORDINATOR', 'TEAM_LEAD', 'SPECIALIST', 'ADVISOR', 'VIEWER'];
const supportPriorities: SupportRequest['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const supportStatuses: SupportRequest['status'][] = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_ON_OWNER', 'RESOLVED', 'CANCELLED'];
const disputeSeverities: DisputeCase['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const disputeStatuses: DisputeCase['status'][] = ['OPEN', 'UNDER_REVIEW', 'OWNER_RESPONSE_NEEDED', 'TEAM_RESPONSE_NEEDED', 'RESOLVED', 'CANCELLED'];

const workspaceAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('DELIVER') || status.includes('SUPPORT')) return appleColors.green;
  return appleColors.purple;
};

const attachmentKey = (scopeType: AttachmentScope, scopeId: string) => `${scopeType}:${scopeId}`;

const fileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Request failed');

export default function WorkspaceCommandPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canCoordinate = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER]);
  const canAttachEvidence = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER, UserRole.SPECIALIST]);

  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [attachmentFilesByKey, setAttachmentFilesByKey] = useState<Record<string, File | null>>({});
  const [attachmentLabelsByKey, setAttachmentLabelsByKey] = useState<Record<string, string>>({});
  const [attachmentProgressByKey, setAttachmentProgressByKey] = useState<Record<string, number>>({});
  const [attachmentErrorsByKey, setAttachmentErrorsByKey] = useState<Record<string, string>>({});
  const [uploadingAttachmentKey, setUploadingAttachmentKey] = useState('');
  const [attachmentOpenError, setAttachmentOpenError] = useState('');
  const [supportStatusById, setSupportStatusById] = useState<Record<string, SupportRequest['status']>>({});
  const [supportResolutionById, setSupportResolutionById] = useState<Record<string, string>>({});
  const [disputeStatusById, setDisputeStatusById] = useState<Record<string, DisputeCase['status']>>({});
  const [disputeResolutionById, setDisputeResolutionById] = useState<Record<string, string>>({});

  const workspaceForm = useAdvancedForm<WorkspacePayload>({
    initialValues: { packageInstanceId: '', name: '', status: 'ACTIVE_DELIVERY' },
    validationRules: {
      packageInstanceId: [{ type: 'required', message: 'Service plan is required' }],
    },
  });
  const milestoneForm = useAdvancedForm<MilestonePayload>({
    initialValues: { title: '', description: '', dueDate: null, status: 'PLANNED' },
    validationRules: {
      title: [{ type: 'required', message: 'Milestone title is required' }],
    },
  });
  const deliverableForm = useAdvancedForm<DeliverablePayload>({
    initialValues: { title: '', evidence: '', status: 'PENDING' },
    validationRules: {
      title: [{ type: 'required', message: 'Deliverable title is required' }],
    },
  });
  const participantForm = useAdvancedForm<ParticipantPayload>({
    initialValues: { email: '', role: 'SPECIALIST', active: true },
    validationRules: {
      email: [
        { type: 'required', message: 'Participant email is required' },
        { type: 'email', message: 'Use a valid email address' },
      ],
    },
  });
  const supportForm = useAdvancedForm<SupportRequestPayload>({
    initialValues: {
      supportSubscriptionId: null,
      teamId: null,
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'OPEN',
      dueOn: null,
    },
    validationRules: {
      title: [{ type: 'required', message: 'Support title is required' }],
      description: [{ type: 'required', message: 'Support context is required' }],
    },
  });
  const disputeForm = useAdvancedForm<DisputePayload>({
    initialValues: { teamId: null, title: '', description: '', severity: 'MEDIUM', responseDueOn: null },
    validationRules: {
      title: [{ type: 'required', message: 'Risk title is required' }],
      description: [{ type: 'required', message: 'Risk context is required' }],
    },
  });

  const workspaceList = useMemo(() => sortWorkspacesForOwner(workspaces.data || []), [workspaces.data]);
  const selectedWorkspace = useMemo(
    () => workspaceList.find((workspace) => workspace.id === selectedWorkspaceId) || workspaceList[0],
    [workspaceList, selectedWorkspaceId]
  );

  useEffect(() => {
    if (!selectedWorkspaceId && workspaceList[0]) setSelectedWorkspaceId(workspaceList[0].id);
  }, [selectedWorkspaceId, workspaceList]);

  const milestones = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<Milestone[]>(`/workspaces/${selectedWorkspace?.id}/milestones`),
  });
  const milestoneList = milestones.data || [];
  const selectedMilestone = useMemo(
    () => milestoneList.find((milestone) => milestone.id === selectedMilestoneId) || milestoneList[0],
    [milestoneList, selectedMilestoneId]
  );

  useEffect(() => {
    if (!selectedMilestoneId && milestoneList[0]) setSelectedMilestoneId(milestoneList[0].id);
  }, [selectedMilestoneId, milestoneList]);

  const deliverables = useQuery({
    queryKey: ['workspaces', 'milestones', selectedMilestone?.id, 'deliverables'],
    enabled: !!selectedMilestone?.id,
    queryFn: () => getJson<Deliverable[]>(`/workspaces/milestones/${selectedMilestone?.id}/deliverables`),
  });
  const participants = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'participants'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<WorkspaceParticipant[]>(`/workspaces/${selectedWorkspace?.id}/participants`),
  });
  const supportRequests = useQuery({
    queryKey: ['commerce-support-requests', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<SupportRequest[]>(`/commerce/workspaces/${selectedWorkspace?.id}/support-requests`),
  });
  const disputes = useQuery({
    queryKey: ['commerce-disputes', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<DisputeCase[]>(`/commerce/workspaces/${selectedWorkspace?.id}/disputes`),
  });
  const attachments = useQuery({
    queryKey: ['attachments', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<EvidenceAttachment[]>(`/attachments?workspaceId=${selectedWorkspace?.id}`),
  });

  const attachmentsByScope = useMemo(
    () =>
      (attachments.data || []).reduce<Record<string, EvidenceAttachment[]>>((grouped, attachment) => {
        const key = attachmentKey(attachment.scopeType, attachment.scopeId);
        grouped[key] = [...(grouped[key] || []), attachment];
        return grouped;
      }, {}),
    [attachments.data]
  );

  const createWorkspace = useMutation({
    mutationFn: () => postJson<ProjectWorkspace, WorkspacePayload>('/workspaces', workspaceForm.values),
    onSuccess: async (workspace) => {
      workspaceForm.resetForm();
      setSelectedWorkspaceId(workspace.id);
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
  const createMilestone = useMutation({
    mutationFn: () => postJson<Milestone, MilestonePayload>(`/workspaces/${selectedWorkspace?.id}/milestones`, milestoneForm.values),
    onSuccess: async (milestone) => {
      milestoneForm.resetForm();
      setSelectedMilestoneId(milestone.id);
      await queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'] });
    },
  });
  const createDeliverable = useMutation({
    mutationFn: () => postJson<Deliverable, DeliverablePayload>(`/workspaces/milestones/${selectedMilestone?.id}/deliverables`, deliverableForm.values),
    onSuccess: async () => {
      deliverableForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['workspaces', 'milestones', selectedMilestone?.id, 'deliverables'] });
    },
  });
  const addParticipant = useMutation({
    mutationFn: () => postJson<WorkspaceParticipant, ParticipantPayload>(`/workspaces/${selectedWorkspace?.id}/participants`, participantForm.values),
    onSuccess: async () => {
      participantForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspace?.id, 'participants'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
  const createSupport = useMutation({
    mutationFn: () => postJson<SupportRequest, SupportRequestPayload>(`/commerce/workspaces/${selectedWorkspace?.id}/support-requests`, supportForm.values),
    onSuccess: async () => {
      supportForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['commerce-support-requests', selectedWorkspace?.id] });
    },
  });
  const updateSupport = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SupportStatusPayload }) =>
      putJson<SupportRequest, SupportStatusPayload>(`/commerce/support-requests/${id}/status`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['commerce-support-requests', selectedWorkspace?.id] });
    },
  });
  const createDispute = useMutation({
    mutationFn: () => postJson<DisputeCase, DisputePayload>(`/commerce/workspaces/${selectedWorkspace?.id}/disputes`, disputeForm.values),
    onSuccess: async () => {
      disputeForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['commerce-disputes', selectedWorkspace?.id] });
    },
  });
  const updateDispute = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DisputeStatusPayload }) =>
      putJson<DisputeCase, DisputeStatusPayload>(`/commerce/disputes/${id}/status`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['commerce-disputes', selectedWorkspace?.id] });
    },
  });
  const uploadAttachment = useMutation({
    mutationFn: (input: { key: string; scopeType: AttachmentScope; scopeId: string; file: File; label?: string | undefined }) => {
      setUploadingAttachmentKey(input.key);
      setAttachmentErrorsByKey((current) => ({ ...current, [input.key]: '' }));
      return uploadService.uploadEvidenceAttachment(
        { scopeType: input.scopeType, scopeId: input.scopeId, file: input.file, label: input.label },
        (progress) => setAttachmentProgressByKey((current) => ({ ...current, [input.key]: progress }))
      );
    },
    onSuccess: async (_attachment, input) => {
      setAttachmentFilesByKey((current) => ({ ...current, [input.key]: null }));
      setAttachmentLabelsByKey((current) => ({ ...current, [input.key]: '' }));
      setAttachmentProgressByKey((current) => ({ ...current, [input.key]: 0 }));
      await queryClient.invalidateQueries({ queryKey: ['attachments', selectedWorkspace?.id] });
    },
    onError: (error, input) => {
      setAttachmentErrorsByKey((current) => ({ ...current, [input.key]: errorMessage(error) }));
    },
    onSettled: () => setUploadingAttachmentKey(''),
  });

  const deliverableList = deliverables.data || [];
  const participantList = participants.data || [];
  const supportList = supportRequests.data || [];
  const disputeList = disputes.data || [];
  const activeWorkspaceCount = workspaceList.filter((workspace) => workspace.status === 'ACTIVE_DELIVERY').length;
  const completedMilestones = milestoneList.filter((milestone) => milestone.status === 'ACCEPTED').length;
  const blockedItems = workspaceList.filter((workspace) => workspace.status === 'BLOCKED').length
    + supportList.filter((request) => request.priority === 'URGENT' || request.slaStatus === 'OVERDUE' || request.slaStatus === 'ESCALATED').length
    + disputeList.filter((dispute) => dispute.status !== 'RESOLVED' && dispute.status !== 'CANCELLED').length;
  const workspaceProgress = milestoneList.length ? Math.round((completedMilestones / milestoneList.length) * 100) : 0;

  const scopedAttachments = (scopeType: AttachmentScope, scopeId: string) => attachmentsByScope[attachmentKey(scopeType, scopeId)] || [];
  const setAttachmentFile = (scopeType: AttachmentScope, scopeId: string, file: File | null) => {
    const key = attachmentKey(scopeType, scopeId);
    setAttachmentFilesByKey((current) => ({ ...current, [key]: file }));
    setAttachmentErrorsByKey((current) => ({ ...current, [key]: '' }));
  };
  const submitAttachment = (scopeType: AttachmentScope, scopeId: string) => {
    const key = attachmentKey(scopeType, scopeId);
    const file = attachmentFilesByKey[key];
    if (!file) {
      setAttachmentErrorsByKey((current) => ({ ...current, [key]: 'Choose a file before uploading evidence.' }));
      return;
    }
    uploadAttachment.mutate({ key, scopeType, scopeId, file, label: attachmentLabelsByKey[key] || undefined });
  };
  const openAttachment = async (attachment: EvidenceAttachment) => {
    setAttachmentOpenError('');
    const popup = window.open('about:blank', '_blank');
    try {
      const response = await getJson<AttachmentDownloadUrl>(`/attachments/${attachment.id}/download-url`);
      if (popup) {
        popup.opener = null;
        popup.location.href = response.downloadUrl;
      } else {
        window.location.assign(response.downloadUrl);
      }
    } catch (error) {
      popup?.close();
      setAttachmentOpenError(errorMessage(error));
    }
  };
  const evidencePanel = (scopeType: AttachmentScope, scopeId: string) => {
    const key = attachmentKey(scopeType, scopeId);
    const selectedFile = attachmentFilesByKey[key] || null;
    const isUploading = uploadingAttachmentKey === key && uploadAttachment.isPending;

    return (
      <Stack spacing={1} sx={{ mt: 1.25 }}>
        {scopedAttachments(scopeType, scopeId).map((attachment) => (
          <Box key={attachment.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, px: 1.25, py: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} justifyContent="space-between">
              <Box>
                <Link component="button" type="button" underline="hover" variant="body2" onClick={() => openAttachment(attachment)} sx={{ cursor: 'pointer', textAlign: 'left' }}>
                  {attachment.label || attachment.fileName}
                </Link>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {attachment.fileName}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">{fileSize(attachment.sizeBytes)}</Typography>
            </Stack>
          </Box>
        ))}
        {canAttachEvidence && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: selectedFile ? 'minmax(220px, 1fr) 220px auto' : 'minmax(220px, 1fr)' }, gap: 1 }}>
            <FileUpload
              label="Attach evidence"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,.json,.zip,.docx,.xlsx,.pptx"
              maxSize={10}
              selectedFile={selectedFile}
              loading={isUploading}
              error={attachmentErrorsByKey[key]}
              helperText={attachmentProgressByKey[key] ? `${attachmentProgressByKey[key]}% uploaded` : undefined}
              onFileSelect={(file) => setAttachmentFile(scopeType, scopeId, file)}
              onClear={() => setAttachmentFile(scopeType, scopeId, null)}
            />
            {selectedFile && (
              <>
                <TextField
                  size="small"
                  label="Evidence label"
                  value={attachmentLabelsByKey[key] || ''}
                  onChange={(event) => setAttachmentLabelsByKey((current) => ({ ...current, [key]: event.target.value }))}
                />
                <Button variant="contained" onClick={() => submitAttachment(scopeType, scopeId)} disabled={isUploading}>
                  Upload
                </Button>
              </>
            )}
          </Box>
        )}
      </Stack>
    );
  };

  return (
    <>
      <PageHeader
        title="Project Workspaces"
        description="One focused place to run a productization workspace: milestones, evidence, people, support, and risk."
      />
      <QueryState
        isLoading={packages.isLoading || workspaces.isLoading || teams.isLoading || milestones.isLoading || deliverables.isLoading || participants.isLoading || supportRequests.isLoading || disputes.isLoading || attachments.isLoading}
        error={packages.error || workspaces.error || teams.error || milestones.error || deliverables.error || participants.error || supportRequests.error || disputes.error || attachments.error || createWorkspace.error || createMilestone.error || createDeliverable.error || addParticipant.error || createSupport.error || updateSupport.error || createDispute.error || updateDispute.error || uploadAttachment.error}
      />
      {attachmentOpenError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAttachmentOpenError('')}>
          {attachmentOpenError}
        </Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2, mb: 2.5 }}>
        <MetricTile label="Active projects" value={activeWorkspaceCount} detail={`${workspaceList.length} total workspaces`} accent={appleColors.cyan} icon={<FactCheckOutlined />} />
        <MetricTile label="Milestones accepted" value={completedMilestones} detail={`${milestoneList.length} in selected workspace`} accent={appleColors.green} icon={<TaskAltOutlined />} />
        <MetricTile label="Open blockers" value={blockedItems} detail="Workspace, SLA, or dispute risk" accent={appleColors.red} icon={<ErrorOutlineOutlined />} />
        <MetricTile label="Dated milestones" value={milestoneList.filter((milestone) => milestone.dueDate).length} detail="Scheduled delivery checks" accent={appleColors.purple} icon={<CalendarMonthOutlined />} />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr) 320px', xl: '320px minmax(0, 1fr) 360px' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Stack spacing={2}>
          <Surface sx={{ maxHeight: { lg: 'calc(100vh - 260px)' }, overflow: { lg: 'auto' } }}>
            <SectionTitle title="Workspaces" action={<PastelChip label={`${workspaceList.length}`} accent={appleColors.cyan} bg="#e4f9fd" />} />
            {workspaceList.length ? (
              <Stack spacing={1}>
                {workspaceList.map((workspace) => (
                  <Button
                    key={workspace.id}
                    variant={selectedWorkspace?.id === workspace.id ? 'contained' : 'outlined'}
                    color={selectedWorkspace?.id === workspace.id ? 'primary' : 'inherit'}
                    onClick={() => {
                      setSelectedWorkspaceId(workspace.id);
                      setSelectedMilestoneId('');
                    }}
                    sx={{ justifyContent: 'space-between', minHeight: 56, textAlign: 'left', borderRadius: 1, gap: 1.5 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: selectedWorkspace?.id === workspace.id ? 'inherit' : 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {workspace.packageInstance?.productProfile?.name || workspace.packageInstance?.name || 'Service plan'}
                      </Typography>
                    </Box>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: workspaceAccent(workspace.status), flex: '0 0 auto' }} />
                  </Button>
                ))}
              </Stack>
            ) : (
              <EmptyState label="No workspaces have been opened yet." />
            )}
          </Surface>

          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
            <SectionTitle title="Create Workspace" action={<AddOutlined sx={{ color: appleColors.purple }} />} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
              Use this when a service plan exists and delivery needs its own workspace.
            </Typography>
            <Box component="form" onSubmit={workspaceForm.handleSubmit(() => createWorkspace.mutate())}>
              <Stack spacing={1.5}>
                <TextField select fullWidth label="Service plan" value={workspaceForm.values.packageInstanceId} onChange={(event) => workspaceForm.setValue('packageInstanceId', event.target.value)}>
                  {(packages.data || []).map((item) => (
                    <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                  ))}
                </TextField>
                <TextField fullWidth label="Workspace name" value={workspaceForm.values.name} onChange={(event) => workspaceForm.setValue('name', event.target.value)} />
                <Button type="submit" variant="contained" disabled={!workspaceForm.values.packageInstanceId || createWorkspace.isPending} sx={{ minHeight: 42 }}>
                  Create workspace
                </Button>
              </Stack>
            </Box>
          </Surface>
        </Stack>

        <Stack spacing={2}>
          {selectedWorkspace ? (
            <>
              <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
                <Stack direction={{ xs: 'column', xl: 'row' }} spacing={2.5} alignItems={{ xl: 'center' }} justifyContent="space-between">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <ProgressRing value={workspaceProgress} size={104} color={workspaceAccent(selectedWorkspace.status)} label="done" />
                    <Box>
                      <Typography variant="h2" sx={{ fontSize: { xs: 26, md: 30 }, lineHeight: 1.12 }}>{selectedWorkspace.name}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
                        {selectedWorkspace.packageInstance?.name || 'Service plan'} for {selectedWorkspace.packageInstance?.productProfile?.name || 'selected product'}.
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                        <StatusChip label={selectedWorkspace.status} />
                        <PastelChip label={`${milestoneList.length} milestones`} accent={appleColors.purple} />
                        <PastelChip label={`${participantList.length} participants`} accent={appleColors.cyan} bg="#e4f9fd" />
                      </Stack>
                    </Box>
                  </Stack>
                  <Stack direction={{ xs: 'row', xl: 'column' }} spacing={0.75} flexWrap="wrap" useFlexGap>
                    <DotLabel label={`${deliverableList.length} deliverables in focus`} color={appleColors.green} />
                    <DotLabel label={`${scopedAttachments('WORKSPACE', selectedWorkspace.id).length} workspace evidence files`} color={appleColors.purple} />
                    <DotLabel label={`${supportList.length + disputeList.length} support/risk records`} color={supportList.length + disputeList.length ? appleColors.amber : appleColors.green} />
                  </Stack>
                </Stack>
              </Surface>

              {(milestones.isFetching || deliverables.isFetching || supportRequests.isFetching || disputes.isFetching || attachments.isFetching) && <LinearProgress />}

              <Surface>
                <SectionTitle title="Milestones" action={selectedMilestone && <PastelChip label={`Selected: ${selectedMilestone.title}`} accent={workspaceAccent(selectedMilestone.status)} />} />
                <Box component="form" onSubmit={milestoneForm.handleSubmit(() => createMilestone.mutate())} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 1fr) 170px auto' }, gap: 1, mb: 2 }}>
                  <TextField size="small" label="New milestone" value={milestoneForm.values.title} onChange={(event) => milestoneForm.setValue('title', event.target.value)} />
                  <TextField size="small" type="date" label="Due" value={milestoneForm.values.dueDate || ''} onChange={(event) => milestoneForm.setValue('dueDate', event.target.value || null)} InputLabelProps={{ shrink: true }} />
                  <Button type="submit" variant="outlined" disabled={!milestoneForm.values.title || createMilestone.isPending}>Add</Button>
                </Box>
                {milestoneList.length ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                    {milestoneList.map((milestone) => (
                      <Button
                        key={milestone.id}
                        variant={selectedMilestone?.id === milestone.id ? 'contained' : 'outlined'}
                        color={selectedMilestone?.id === milestone.id ? 'primary' : 'inherit'}
                        onClick={() => setSelectedMilestoneId(milestone.id)}
                        sx={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: 92, p: 1.5, borderRadius: 1, whiteSpace: 'normal' }}
                      >
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: workspaceAccent(milestone.status) }} />
                            <Typography sx={{ fontWeight: 900 }}>{milestone.title}</Typography>
                          </Stack>
                          <Typography variant="caption" sx={{ color: selectedMilestone?.id === milestone.id ? 'inherit' : 'text.secondary', display: 'block' }}>
                            {formatLabel(milestone.status)}{milestone.dueDate ? ` · due ${milestone.dueDate}` : ''}
                          </Typography>
                          {milestone.description && (
                            <Typography variant="body2" sx={{ color: selectedMilestone?.id === milestone.id ? 'inherit' : 'text.secondary', mt: 0.5, lineHeight: 1.45 }}>
                              {milestone.description}
                            </Typography>
                          )}
                        </Box>
                      </Button>
                    ))}
                  </Box>
                ) : (
                  <EmptyState label="No milestones yet. Add the first production milestone for this workspace." />
                )}
              </Surface>

              <Surface>
                <SectionTitle title={selectedMilestone ? `${selectedMilestone.title} Deliverables` : 'Deliverables'} />
                <Box component="form" onSubmit={deliverableForm.handleSubmit(() => createDeliverable.mutate())} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(240px, 1fr) auto' }, gap: 1, mb: 2 }}>
                  <TextField size="small" label="New deliverable" value={deliverableForm.values.title} onChange={(event) => deliverableForm.setValue('title', event.target.value)} />
                  <Button type="submit" variant="outlined" disabled={!selectedMilestone?.id || !deliverableForm.values.title || createDeliverable.isPending}>Add</Button>
                </Box>
                <Stack spacing={1.5}>
                  {deliverableList.length ? (
                    deliverableList.map((deliverable) => (
                      <Box key={deliverable.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'center' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 900 }}>{deliverable.title}</Typography>
                            {deliverable.evidence && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>{deliverable.evidence}</Typography>}
                          </Box>
                          <StatusChip label={deliverable.status} />
                        </Stack>
                        {evidencePanel('DELIVERABLE', deliverable.id)}
                      </Box>
                    ))
                  ) : (
                    <EmptyState label={selectedMilestone ? 'No deliverables yet. Add evidence-backed outputs for this milestone.' : 'Select a milestone to see deliverables.'} />
                  )}
                </Stack>
              </Surface>

              <Surface>
                <SectionTitle title="Workspace Evidence" action={<PastelChip label={`${scopedAttachments('WORKSPACE', selectedWorkspace.id).length} files`} accent={appleColors.purple} />} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Attach workspace-level documents such as kickoff notes, architecture decisions, acceptance records, and operating handoff material.
                </Typography>
                {evidencePanel('WORKSPACE', selectedWorkspace.id)}
              </Surface>
            </>
          ) : (
            <Surface>
              <EmptyState label="Open or create a workspace to coordinate milestones, evidence, and delivery participants." />
            </Surface>
          )}
        </Stack>

        <Stack spacing={2}>
          <Surface>
            <SectionTitle title="Participants" action={<PastelChip label={`${participantList.length}`} accent={appleColors.cyan} bg="#e4f9fd" />} />
            {selectedWorkspace && canCoordinate && (
              <Box component="form" onSubmit={participantForm.handleSubmit(() => addParticipant.mutate())} sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1, mb: 2 }}>
                <TextField size="small" label="Email" value={participantForm.values.email} onChange={(event) => participantForm.setValue('email', event.target.value)} />
                <TextField select size="small" label="Role" value={participantForm.values.role} onChange={(event) => participantForm.setValue('role', event.target.value as WorkspaceParticipant['role'])}>
                  {participantRoles.map((role) => <MenuItem key={role} value={role}>{formatLabel(role)}</MenuItem>)}
                </TextField>
                <Button type="submit" variant="outlined" disabled={!participantForm.values.email || addParticipant.isPending}>Add participant</Button>
              </Box>
            )}
            <Stack spacing={1}>
              {participantList.length ? (
                participantList.map((participant) => (
                  <Stack key={participant.id} direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{participant.user.email}</Typography>
                      <Typography variant="caption" color="text.secondary">{participant.active ? formatLabel(participant.role) : 'Inactive'}</Typography>
                    </Box>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: participant.active ? appleColors.green : appleColors.red, flex: '0 0 auto' }} />
                  </Stack>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">Add owners, team leads, specialists, and advisors before delivery starts.</Typography>
              )}
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle title="Support" action={<PastelChip label={`${supportList.length} requests`} accent={supportList.length ? appleColors.amber : appleColors.green} />} />
            {selectedWorkspace && canCoordinate && (
              <Box component="form" onSubmit={supportForm.handleSubmit(() => createSupport.mutate())} sx={{ mb: 2 }}>
                <Stack spacing={1}>
                  <TextField select size="small" label="Team" value={supportForm.values.teamId || ''} onChange={(event) => supportForm.setValue('teamId', event.target.value || null)}>
                    {(teams.data || []).map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Request title" value={supportForm.values.title} onChange={(event) => supportForm.setValue('title', event.target.value)} />
                  <TextField select size="small" label="Priority" value={supportForm.values.priority} onChange={(event) => supportForm.setValue('priority', event.target.value as SupportRequest['priority'])}>
                    {supportPriorities.map((priority) => <MenuItem key={priority} value={priority}>{formatLabel(priority)}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Context" value={supportForm.values.description} onChange={(event) => supportForm.setValue('description', event.target.value)} multiline />
                  <Button type="submit" variant="outlined" disabled={!supportForm.values.teamId || !supportForm.values.title || !supportForm.values.description || createSupport.isPending}>
                    Open support request
                  </Button>
                </Stack>
              </Box>
            )}
            <Stack spacing={1.25}>
              {supportList.length ? supportList.map((request) => (
                <Box key={request.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Stack direction="row" spacing={1} justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{request.title}</Typography>
                    <StatusChip label={request.slaStatus} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{request.team.name} · {formatLabel(request.priority)}</Typography>
                  {request.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.5 }}>{request.description}</Typography>}
                  {canCoordinate && (
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <TextField select size="small" label="Status" value={supportStatusById[request.id] || request.status} onChange={(event) => setSupportStatusById((current) => ({ ...current, [request.id]: event.target.value as SupportRequest['status'] }))}>
                        {supportStatuses.map((status) => <MenuItem key={status} value={status}>{formatLabel(status)}</MenuItem>)}
                      </TextField>
                      <TextField size="small" label="Resolution note" value={supportResolutionById[request.id] ?? request.resolution ?? ''} onChange={(event) => setSupportResolutionById((current) => ({ ...current, [request.id]: event.target.value }))} />
                      <Button variant="outlined" onClick={() => updateSupport.mutate({ id: request.id, payload: { status: supportStatusById[request.id] || request.status, resolution: supportResolutionById[request.id] || request.resolution || '' } })} disabled={updateSupport.isPending}>
                        Update request
                      </Button>
                    </Stack>
                  )}
                </Box>
              )) : <Typography variant="body2" color="text.secondary">No support requests are open.</Typography>}
            </Stack>
          </Surface>

          <Surface sx={{ background: disputeList.length ? '#fff7f8' : '#f4fbf7' }}>
            <SectionTitle title="Risks" action={<PastelChip label={`${disputeList.length}`} accent={disputeList.length ? appleColors.red : appleColors.green} />} />
            {selectedWorkspace && canCoordinate && (
              <Box component="form" onSubmit={disputeForm.handleSubmit(() => createDispute.mutate())} sx={{ mb: 2 }}>
                <Stack spacing={1}>
                  <TextField select size="small" label="Team" value={disputeForm.values.teamId || ''} onChange={(event) => disputeForm.setValue('teamId', event.target.value || null)}>
                    <MenuItem value="">Unassigned</MenuItem>
                    {(teams.data || []).map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Issue title" value={disputeForm.values.title} onChange={(event) => disputeForm.setValue('title', event.target.value)} />
                  <TextField select size="small" label="Severity" value={disputeForm.values.severity} onChange={(event) => disputeForm.setValue('severity', event.target.value as DisputeCase['severity'])}>
                    {disputeSeverities.map((severity) => <MenuItem key={severity} value={severity}>{formatLabel(severity)}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Context" value={disputeForm.values.description} onChange={(event) => disputeForm.setValue('description', event.target.value)} multiline />
                  <Button type="submit" variant="outlined" disabled={!disputeForm.values.title || !disputeForm.values.description || createDispute.isPending}>Open risk</Button>
                </Stack>
              </Box>
            )}
            <Stack spacing={1.25}>
              {disputeList.length ? disputeList.map((dispute) => (
                <Box key={dispute.id} sx={{ border: 1, borderColor: '#fecdd3', borderRadius: 1, p: 1.25, background: '#fff' }}>
                  <Stack direction="row" spacing={1} justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{dispute.title}</Typography>
                    <StatusChip label={dispute.status} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{dispute.team?.name || 'Unassigned'} · {formatLabel(dispute.severity)}</Typography>
                  {dispute.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.5 }}>{dispute.description}</Typography>}
                  {canCoordinate && (
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <TextField select size="small" label="Status" value={disputeStatusById[dispute.id] || dispute.status} onChange={(event) => setDisputeStatusById((current) => ({ ...current, [dispute.id]: event.target.value as DisputeCase['status'] }))}>
                        {disputeStatuses.map((status) => <MenuItem key={status} value={status}>{formatLabel(status)}</MenuItem>)}
                      </TextField>
                      <TextField size="small" label="Resolution note" value={disputeResolutionById[dispute.id] ?? dispute.resolution ?? ''} onChange={(event) => setDisputeResolutionById((current) => ({ ...current, [dispute.id]: event.target.value }))} />
                      <Button variant="outlined" onClick={() => updateDispute.mutate({ id: dispute.id, payload: { status: disputeStatusById[dispute.id] || dispute.status, resolution: disputeResolutionById[dispute.id] || dispute.resolution || '' } })} disabled={updateDispute.isPending}>
                        Update risk
                      </Button>
                    </Stack>
                  )}
                  {evidencePanel('DISPUTE', dispute.id)}
                </Box>
              )) : <Typography variant="body2" color="text.secondary">No risks are open for this workspace.</Typography>}
            </Stack>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
