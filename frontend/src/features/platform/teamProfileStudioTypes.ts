import type { ExpertProfile, Team, TeamMember } from './types';

export type TeamProfilePayload = {
  name: string;
  description: string;
  headline: string;
  bio: string;
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  websiteUrl: string;
  timezone: string;
  capabilitiesSummary: string;
  typicalProjectSize: string;
  verificationStatus: Team['verificationStatus'];
  active: boolean;
};

export type ExpertProfilePayload = {
  displayName: string;
  headline: string;
  bio: string;
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  location: string;
  timezone: string;
  websiteUrl: string;
  portfolioUrl: string;
  skills: string;
  preferredProjectSize: string;
  availability: ExpertProfile['availability'];
  soloMode: boolean;
  active: boolean;
};

export type TeamInvitationPayload = {
  email: string;
  role: TeamMember['role'];
  message: string;
};
