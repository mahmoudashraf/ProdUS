import { getJson, postJson, putJson } from '@/features/platform/api';
import type { ExpertProfile, NotificationSummary, PlatformNotification, Team, TeamInvitation, TeamJoinRequest } from '@/features/platform/types';
import type {
  Channel,
  CommunityPost,
  CommunityPostPayload,
  ConversationCreatePayload,
  ConversationThread,
  FormationPost,
  FormationPostPayload,
  NetworkSearchResponse,
  NetworkHome,
  TrialCollaboration,
  TrialPayload,
  UserAccount,
} from './types';

export const networkApi = {
  account: () => getJson<UserAccount>('/users/me'),
  updateAccount: (payload: Partial<UserAccount>) => putJson<UserAccount, Partial<UserAccount>>('/users/me', payload),
  home: () => getJson<NetworkHome>('/expert-network/home'),
  search: (query: string) => getJson<NetworkSearchResponse>(`/expert-network/search?query=${encodeURIComponent(query)}`),
  notificationSummary: () => getJson<NotificationSummary>('/notifications/summary'),
  notifications: () => getJson<PlatformNotification[]>('/notifications'),
  markNotificationRead: (id: string) => putJson<PlatformNotification, Record<string, never>>(`/notifications/${id}/read`, {}),
  markAllNotificationsRead: () => putJson<NotificationSummary, Record<string, never>>('/notifications/read-all', {}),
  experts: () => getJson<ExpertProfile[]>('/expert-profiles'),
  expert: (id: string) => getJson<ExpertProfile>(`/expert-profiles/${id}`),
  myExpertProfile: () => getJson<ExpertProfile>('/expert-profiles/me'),
  updateExpertProfile: (payload: Partial<ExpertProfile>) => putJson<ExpertProfile, Partial<ExpertProfile>>('/expert-profiles/me', payload),
  teams: () => getJson<Team[]>('/teams'),
  team: (id: string) => getJson<Team>(`/teams/${id}`),
  myTeams: () => getJson<Team[]>('/teams/mine'),
  inviteToTeam: (teamId: string, payload: { email: string; role: string; message?: string }) =>
    postJson<TeamInvitation, typeof payload>(`/teams/${teamId}/invitations`, payload),
  requestToJoinTeam: (teamId: string, payload: { message?: string }) =>
    postJson<TeamJoinRequest, typeof payload>(`/teams/${teamId}/join-requests`, payload),
  myJoinRequests: () => getJson<TeamJoinRequest[]>('/teams/join-requests/mine'),
  teamJoinRequests: (teamId: string) => getJson<TeamJoinRequest[]>(`/teams/${teamId}/join-requests`),
  reviewJoinRequest: (requestId: string, payload: { status: TeamJoinRequest['status']; reviewNote?: string }) =>
    putJson<TeamJoinRequest, typeof payload>(`/teams/join-requests/${requestId}`, payload),
  formationPosts: () => getJson<FormationPost[]>('/expert-network/formation-posts'),
  createFormationPost: (payload: FormationPostPayload) =>
    postJson<FormationPost, FormationPostPayload>('/expert-network/formation-posts', payload),
  closeFormationPost: (id: string) => postJson<FormationPost, Record<string, never>>(`/expert-network/formation-posts/${id}/close`, {}),
  channels: () => getJson<Channel[]>('/expert-network/channels'),
  channelPosts: (slug: string) => getJson<CommunityPost[]>(`/expert-network/channels/${slug}/posts`),
  createChannelPost: (slug: string, payload: CommunityPostPayload) =>
    postJson<CommunityPost, CommunityPostPayload>(`/expert-network/channels/${slug}/posts`, payload),
  getPost: (id: string) => getJson<CommunityPost>(`/expert-network/posts/${id}`),
  markHelpful: (id: string) => postJson<CommunityPost, Record<string, never>>(`/expert-network/posts/${id}/helpful`, {}),
  addComment: (id: string, payload: { body: string }) =>
    postJson<CommunityPost, { body: string }>(`/expert-network/posts/${id}/comments`, payload),
  conversations: () => getJson<ConversationThread[]>('/expert-network/conversations'),
  conversation: (id: string) => getJson<ConversationThread>(`/expert-network/conversations/${id}`),
  createConversation: (payload: ConversationCreatePayload) =>
    postJson<ConversationThread, ConversationCreatePayload>('/expert-network/conversations', payload),
  addMessage: (threadId: string, payload: { body: string }) =>
    postJson<ConversationThread, { body: string }>(`/expert-network/conversations/${threadId}/messages`, payload),
  markRead: (threadId: string) => postJson<ConversationThread, Record<string, never>>(`/expert-network/conversations/${threadId}/read`, {}),
  mute: (threadId: string) => postJson<ConversationThread, Record<string, never>>(`/expert-network/conversations/${threadId}/mute`, {}),
  trials: () => getJson<TrialCollaboration[]>('/expert-network/trials'),
  createTrial: (payload: TrialPayload) => postJson<TrialCollaboration, TrialPayload>('/expert-network/trials', payload),
  updateTrial: (id: string, action: 'accept' | 'activate' | 'complete' | 'cancel') =>
    postJson<TrialCollaboration, Record<string, never>>(`/expert-network/trials/${id}/${action}`, {}),
};
