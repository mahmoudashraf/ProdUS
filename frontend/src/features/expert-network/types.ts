import type { CurrentUserSummary, ExpertProfile, Team, TeamJoinRequest } from '@/features/platform/types';

export type FormationPostType = 'LOOKING_FOR_TEAM' | 'TEAM_OPENING';
export type FormationPostStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type ChannelType = 'INTRODUCTIONS' | 'TEAM_FORMATION' | 'SERVICE' | 'DELIVERY_PRACTICES' | 'PLATFORM';
export type PostStatus = 'ACTIVE' | 'HIDDEN' | 'LOCKED';
export type CommentStatus = 'ACTIVE' | 'HIDDEN';
export type ScopeType =
  | 'DIRECT'
  | 'EXPERT_PROFILE'
  | 'TEAM_PROFILE'
  | 'TEAM_OPENING'
  | 'FORMATION_POST'
  | 'TEAM_JOIN_REQUEST'
  | 'TRIAL_COLLABORATION';
export type ThreadStatus = 'OPEN' | 'ARCHIVED' | 'LOCKED';
export type MessageType = 'TEXT' | 'SYSTEM';
export type TrialStatus =
  | 'PROPOSED'
  | 'NEGOTIATING'
  | 'ACCEPTED'
  | 'ACTIVE'
  | 'MILESTONE_REVIEW'
  | 'COMPLETED'
  | 'FORM_TEAM_PROPOSED'
  | 'TEAM_FORMED'
  | 'CANCELLED';

export interface FormationPost {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  author?: CurrentUserSummary;
  team?: Team;
  postType: FormationPostType;
  title: string;
  body?: string;
  offeredServices?: string;
  neededServices?: string;
  workingStyle?: string;
  timezone?: string;
  packageSize?: string;
  status: FormationPostStatus;
  expiresOn?: string;
}

export interface Channel {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  slug: string;
  name: string;
  description?: string;
  channelType: ChannelType;
  color?: string;
  sortOrder: number;
  active: boolean;
}

export interface CommunityComment {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  author?: CurrentUserSummary;
  body: string;
  status: CommentStatus;
}

export interface CommunityPost {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  channel: Channel;
  author?: CurrentUserSummary;
  title: string;
  body?: string;
  serviceTags?: string;
  status: PostStatus;
  helpfulCount: number;
  replyCount: number;
  lastReplyAt?: string;
  comments: CommunityComment[];
}

export interface ConversationParticipant {
  id: string;
  user?: CurrentUserSummary;
  participantRole: string;
  muted: boolean;
  archived: boolean;
  lastReadAt?: string;
}

export interface ConversationMessage {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  sender?: CurrentUserSummary;
  messageType: MessageType;
  body: string;
}

export interface ConversationThread {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  scopeType: ScopeType;
  scopeId?: string;
  title: string;
  status: ThreadStatus;
  createdBy?: CurrentUserSummary;
  lastMessageAt?: string;
  participants: ConversationParticipant[];
  messages: ConversationMessage[];
}

export interface TrialCollaboration {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  initiatedBy?: CurrentUserSummary;
  team?: Team;
  title: string;
  scope?: string;
  status: TrialStatus;
  proposedStartDate?: string;
  proposedEndDate?: string;
}

export interface NetworkHome {
  expertProfile?: ExpertProfile;
  myTeams: Team[];
  myJoinRequests: TeamJoinRequest[];
  formationPosts: FormationPost[];
  channels: Channel[];
  conversations: ConversationThread[];
  trials: TrialCollaboration[];
}

export interface UserAccount {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'ADMIN' | 'PRODUCT_OWNER' | 'TEAM_MANAGER' | 'SPECIALIST' | 'ADVISOR';
  supabaseId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NetworkSearchResult {
  id: string;
  resultType: 'EXPERT' | 'TEAM' | 'FORMATION_POST' | 'CHANNEL_POST' | 'CHANNEL';
  title: string;
  description?: string;
  href: string;
  meta?: string;
  accent?: string;
}

export interface NetworkSearchResponse {
  query: string;
  results: NetworkSearchResult[];
}

export interface FormationPostPayload {
  postType: FormationPostType;
  teamId?: string | undefined;
  title: string;
  body?: string;
  offeredServices?: string;
  neededServices?: string;
  workingStyle?: string;
  timezone?: string;
  packageSize?: string;
  status?: FormationPostStatus | undefined;
  expiresOn?: string | undefined;
}

export interface CommunityPostPayload {
  title: string;
  body: string;
  serviceTags?: string;
}

export interface ConversationCreatePayload {
  scopeType: ScopeType;
  scopeId?: string | undefined;
  targetUserId?: string | undefined;
  title?: string | undefined;
  initialMessage?: string | undefined;
}

export interface TrialPayload {
  teamId?: string | undefined;
  title: string;
  scope?: string | undefined;
  proposedStartDate?: string | undefined;
  proposedEndDate?: string | undefined;
}
