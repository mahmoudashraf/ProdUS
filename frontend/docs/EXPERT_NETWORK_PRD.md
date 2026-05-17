# ProdUS Expert Network BRD, PRD, and Implementation Plan

## Document Status

- Product: ProdUS Platform
- Product domains: ProdUS Studio for productization, ProdUS Network for expert community and team formation
- Feature area: Expert Network, team formation, contextual messaging, expert community
- Implementation model: One complete production release with sequenced build tracks
- Primary database: PostgreSQL
- Auth/user source: Supabase Auth users mapped to platform users through a server-managed platform session
- Session model: secure HTTP-only cookie scoped to `.produs.com` for cross-subdomain authentication
- Backend: current ProdUS backend API
- Frontend: current ProdUS frontend stack and component library

## Executive Summary

ProdUS needs a mature communication and formation system for solo experts, team leaders, team members, and platform administrators. The system must help experts discover each other, evaluate fit, communicate with context, request team membership, invite teammates, trial collaboration on real productization work, and formalize into teams.

The system is not a generic social network, chat app, or public content feed. It is a **team formation and trust system**. Communication exists to help delivery capacity form around verified skills, platform service categories, production workspaces, and accepted milestones.

ProdUS should be presented as two connected product areas:

- **ProdUS Studio** at `studio.produs.com`: owner-facing productization, product briefs, lifecycle services, draft carts, service plans, team comparison, project workspaces, milestone review, evidence, and delivery governance.
- **ProdUS Network** at `network.produs.com`: expert community, solo expert profiles, team profiles, team formation, join requests, service-category discussion, and collaboration trust signals.

Both domains share one identity, one platform user model, one backend, and one permission system. Users should not feel they are signing into two unrelated products.

The completed product will introduce:

- ProdUS Network home
- Expert directory
- Expert profile presentation and editing
- Team profile presentation and editing
- Team openings
- Expert "looking for team" posts
- Structured join requests
- Contextual conversations
- Service-category discussion channels
- Introductions channel
- Trial collaboration spaces
- Team creation from successful collaboration
- Notifications
- Moderation and safety tooling
- Matching signals for AI and platform recommendation logic

## Product Thesis

Solo experts are valuable but hard to evaluate in isolation. Teams are more useful to owners, but teams need trust before they form. ProdUS should make team formation safer by collecting credible signals:

- verified service capabilities
- accepted delivery history
- workspace behavior
- profile completeness
- contextual conversations
- join-request decisions
- trial collaboration outcomes
- community contributions tied to service categories

ProdUS Network converts isolated experts into reliable delivery capacity for Studio productization work.

## Product Goals

1. Help solo experts present themselves clearly.
2. Help solo experts find complementary experts and teams.
3. Help team leaders recruit experts through structured openings.
4. Help experts ask to join teams with context, evidence, and conversation history.
5. Help experts communicate without becoming a noisy general chat tool.
6. Help teams evaluate experts using service fit, delivery evidence, and structured discussion.
7. Help platform admins moderate communication and protect owners, experts, and teams.
8. Feed verified collaboration signals into team matching and Studio productization recommendations.
9. Keep Studio owner-facing productization flows separate from Network expert/team formation chatter.

## Product Non-Goals

ProdUS Network must not become:

- a generic social feed
- a follower-based social graph
- a Discord or Slack clone
- an external job board
- a public marketplace for off-platform work
- a vanity reputation system
- a place to expose confidential owner or workspace information

## User Types

### Solo Expert

A verified or pending expert who can deliver one or more service modules but is not currently operating as part of a team.

Primary needs:

- build a credible profile
- show availability and skills
- discover teams
- post team-formation intent
- message teams and experts
- request to join a team
- create a new team
- invite others to a new team
- participate in trial collaboration

### Team Lead

A team manager or lead responsible for maintaining a team profile, accepting members, publishing openings, and evaluating join requests.

Primary needs:

- manage team profile
- publish openings
- review expert requests
- message candidates
- invite experts
- run trial collaboration
- convert successful collaboration into membership
- keep team reputation and capability evidence clean

### Team Member

An expert who belongs to a team but may still participate in expert discussions and team workspaces.

Primary needs:

- participate in team conversations
- represent capabilities
- help review candidates if permitted
- participate in trial collaboration
- maintain individual expert profile

### Product Owner

An owner productizing a product. Owners should see verified experts and teams but should not see private expert/team formation chatter.

Primary needs:

- browse verified teams and experts
- shortlist teams or experts into the Studio productization cart
- compare delivery fit
- message only in project or proposal contexts

### Platform Admin

An operator responsible for moderation, verification, safety, and marketplace quality.

Primary needs:

- review reports
- resolve moderation incidents
- verify profiles and capabilities
- view audit trails
- suspend abusive accounts
- tune matching signals

### AI Assistant

ProdUS AI or LoomAI-backed assistant that supports matching, summaries, suggestions, moderation triage, and profile improvement.

Primary needs:

- access structured, permission-safe signals
- summarize long conversations for authorized participants
- suggest complementary collaborators
- flag safety and spam risk
- never expose private conversation content to unauthorized users

## Experience Principles

1. **Context before chat**  
   Every conversation should start from a real context: profile, team opening, join request, trial collaboration, channel post, service category, or workspace.

2. **Formation before engagement**  
   The product rewards team formation and reliable delivery, not raw message volume.

3. **Verified signals over opinions**  
   Delivery stats, accepted milestones, verified skills, and service capabilities matter more than self-promotion.

4. **Async-first communication**  
   Experts are busy. The system should support thoughtful replies, clear summaries, and low notification pressure.

5. **Owner safety**  
   Internal expert/team discussions must not leak owner-sensitive work, workspace data, or off-platform solicitation.

6. **Professional UX**  
   Apple-style calm UI: white canvas, clear cards, subdued depth, pastel service identity, focused actions, no noisy social mechanics.

## Information Architecture

### Product Domains

ProdUS uses subdomains to make each major product area understandable while keeping the implementation unified.

| Domain | Product name | Purpose | Primary users |
|---|---|---|---|
| `produs.com` | ProdUS public site | Marketing, public service pages, public team/expert profile previews, login entry points | Logged-out visitors, all roles |
| `studio.produs.com` | ProdUS Studio | Productization workspace, product briefs, service selection, draft cart, package/service plan, team shortlist, active delivery, evidence, milestone review | Product owners, admins, assigned delivery participants |
| `network.produs.com` | ProdUS Network | Expert community, team formation, profiles, openings, join requests, service channels, trial collaboration | Solo experts, team leads, team members, admins |
| `api.produs.com` | ProdUS API | Backend API for Studio, Network, public pages, and AI/MCP integration | Frontend clients, platform services |

`teams.produs.com` can be supported as an alias or redirect to `network.produs.com`, but the canonical community product name is **ProdUS Network**.

### Cross-Domain Navigation

- Studio header includes a clear Network entry when a user can browse experts or teams.
- Network header includes a clear Studio entry when a user has owner, admin, or assigned delivery access.
- Public header logo returns to `produs.com`.
- Authenticated Studio and Network headers show a dashboard switcher instead of forcing users through the public site.
- Deep links must preserve return URLs across auth and subdomain switches.

### Session and Auth Architecture

ProdUS should use Supabase as the identity provider, but the production platform session should be server-managed.

Required behavior:

- login can start from any domain and return the user to the requested destination
- successful auth creates a platform session cookie scoped to `.produs.com`
- the session cookie is `Secure`, `HttpOnly`, and has an explicit `SameSite` policy
- Studio and Network can read the same authenticated session through server-side checks
- localStorage tokens are not the primary production auth mechanism
- backend authorization always resolves the platform user from the server-managed session or a server-validated bearer token
- logout clears the shared `.produs.com` session for all product subdomains
- Supabase OAuth redirect allowlists include Studio, Network, and public callback URLs

Recommended production flow:

1. User clicks sign in from `studio.produs.com`, `network.produs.com`, or `produs.com`.
2. User is sent through the Supabase auth flow with a signed return URL.
3. Auth callback validates Supabase identity server-side.
4. Backend or Next server creates the ProdUS platform session.
5. Browser receives a secure HTTP-only cookie scoped to `.produs.com`.
6. User returns to the original Studio or Network route without signing in again.

### Primary Navigation

For solo experts and team users:

- Network Home
- Expert Directory
- Formation Board
- Messages
- My Expert Profile
- My Team Profile
- Join Requests
- Trial Collaborations

For owners:

- Products
- Draft Cart
- Service Catalog
- Teams and Experts
- Active Workspaces

For admins:

- Network Admin
- Moderation Queue
- Reports
- Verification Queue
- Communication Audit
- Matching Signals

### Expert Network Home

The ProdUS Network home is a role-aware command center.

Solo expert home:

- profile completeness
- availability status
- looking-for-team status
- recommended teams
- latest join requests
- messages needing response
- suggested introductions
- service channels relevant to skills

Team lead home:

- team profile completeness
- open roles
- join requests
- candidate conversations
- trial collaborations
- capability gaps based on package demand

Admin home:

- moderation queue
- flagged posts
- flagged messages
- verification pending
- suspicious activity
- inactive openings

## Core Product Capabilities

## 1. Expert Profiles

### Purpose

Expert profiles give solo experts and team members a clear, credible identity inside ProdUS.

### Profile Sections

- display name
- headline
- avatar
- cover image
- location or timezone
- availability
- solo mode status
- team membership status
- bio
- service categories
- service modules
- skills and tech stack
- preferred project size
- portfolio links
- GitHub or repository evidence
- verified delivery stats
- community participation summary
- looking-for-team statement
- profile completeness

### Profile Actions

Solo expert:

- edit profile
- update availability
- publish looking-for-team statement
- create team
- invite expert to team
- message another expert
- apply to join team

Team lead viewing expert:

- message expert
- invite to team
- start trial collaboration
- view service fit
- view delivery evidence

Admin:

- verify fields
- suspend profile
- hide profile
- review reports

### Profile Visibility

- logged-out users can view public profile summaries for teams/experts if public discovery is enabled
- logged-in experts can see richer expert network details
- owners can see delivery-relevant profile data but not private team formation conversations
- admins can see moderation and audit context

## 2. Team Profiles

### Purpose

Team profiles represent delivery capacity formed from experts.

### Team Profile Sections

- team name
- headline
- cover photo
- team avatar/logo
- bio
- location/timezone
- website/portfolio
- service categories
- service modules
- verified capabilities
- team members and roles
- availability
- typical project size
- team openings
- delivery stats
- case studies
- reputation events
- profile completeness

### Team Lead Actions

- edit team profile
- add cover/profile photo
- update capabilities
- create opening
- invite expert
- review join requests
- message candidates
- accept or decline requests
- create trial collaboration
- formalize expert membership

## 3. Expert Directory

### Purpose

The directory is a professional lookup and matching surface. It helps experts and team leads discover complementary collaborators.

### Filters

- service category
- service module
- technology
- availability
- timezone
- looking for team
- solo mode
- verified milestones threshold
- preferred project size
- profile completeness

### Sorting

- service fit
- complementary skill fit
- verified delivery strength
- availability
- recent profile update
- shared service-channel activity

### Directory Card

Each card shows:

- avatar
- name
- headline
- availability
- location/timezone
- top services
- top skills
- delivery summary
- looking-for-team indicator
- actions: view profile, message, invite, apply context when relevant

## 4. Formation Board

### Purpose

The Formation Board is the structured place for experts and teams to find each other.

### Post Types

#### Expert Looking For Team

Fields:

- title
- expert profile
- services offered
- skills offered
- services needed
- skills needed
- availability
- timezone
- preferred team style
- desired package types
- collaboration statement
- expires on
- status

Actions:

- message expert
- invite to team
- view profile
- save candidate
- report post

#### Team Opening

Fields:

- team
- role title
- service categories needed
- service modules needed
- skills needed
- availability required
- timezone preference
- package context
- expected collaboration model
- compensation/split guidance
- application questions
- expires on
- status

Actions:

- apply to join
- message team
- view team profile
- save opening
- report post

### Board Rules

- posts expire unless refreshed
- posts must use platform service taxonomy
- external recruitment is prohibited
- posts can be paused when a candidate is selected
- posts can be closed with a reason

## 5. Join Requests

### Purpose

Join requests are the structured path for solo experts to join teams.

### Request Lifecycle

Statuses:

- DRAFT
- SUBMITTED
- UNDER_REVIEW
- NEEDS_MORE_INFO
- TRIAL_PROPOSED
- ACCEPTED
- DECLINED
- WITHDRAWN
- CANCELLED

### Request Fields

- team
- requester expert
- opening if applicable
- message
- services offered
- skills offered
- evidence links
- availability
- timezone
- desired role
- review status
- reviewer
- review note

### Required Conversation

Every submitted join request creates a scoped conversation thread:

- requester
- team lead
- team managers
- admins if escalated

The conversation remains attached to the request and is visible only to authorized participants.

### Team Lead Decisions

Team lead can:

- request more information
- propose trial collaboration
- accept into team
- decline with reason
- escalate to admin

### Expert Decisions

Expert can:

- edit draft
- submit request
- reply in thread
- accept trial invitation
- withdraw request

## 6. Contextual Messaging

### Purpose

Messaging enables direct communication without becoming an unrestricted chat system.

### Thread Scopes

- EXPERT_PROFILE
- TEAM_PROFILE
- TEAM_OPENING
- EXPERT_LOOKING_FOR_TEAM
- TEAM_JOIN_REQUEST
- TRIAL_COLLABORATION
- WORKSPACE_PARTICIPANT
- ADMIN_MODERATION

### Message Types

- plain text
- structured template
- system event
- attachment reference
- admin note
- AI summary

### Thread Rules

- every thread has a scope
- every participant has an explicit role
- read receipts are tracked
- participants can mute threads
- users can block other users
- users can report messages
- admins can review reported content
- private content is not used for AI training

### Conversation Starters

The UI can pre-fill editable message templates:

- "I saw your team opening for [service]. My profile includes [matching capability]."
- "I am building a team around [service category]. Would you be open to discussing fit?"
- "Your looking-for-team post mentions [need]. Our team has [capability]."

## 7. Service Channels

### Purpose

Service channels support professional asynchronous discussion around platform service categories.

### Channel Types

- introductions
- team formation
- service category channels
- platform updates
- delivery practices
- help and advice

### Channel Rules

- chronological by default
- no algorithmic trending
- no follower counts
- no anonymous posts
- confidential owner/workspace details prohibited
- posts can be marked helpful
- posts can be reported
- admins can hide, lock, or remove posts

### Channel Post Fields

- channel
- author
- title
- body
- service categories
- service modules
- visibility
- status
- helpful count
- reply count
- report count

## 8. Trial Collaboration

### Purpose

Trial collaboration lets experts work together on a real package or controlled platform assignment before formalizing into a team.

### Trial Lifecycle

Statuses:

- PROPOSED
- NEGOTIATING
- ACCEPTED
- ACTIVE
- MILESTONE_REVIEW
- COMPLETED
- FORM_TEAM_PROPOSED
- TEAM_FORMED
- CANCELLED

### Trial Fields

- package instance
- workspace
- initiating expert/team
- invited experts
- service scope
- milestone assignments
- payment split proposal
- acceptance criteria
- communication thread
- trial outcome

### Trial Requirements

- all participants must accept terms
- payment split must be explicit
- milestone responsibilities must be visible
- trial must connect to a package or workspace
- trial conclusion must collect private collaboration feedback

### Trial Outcome

Each participant submits:

- would work together again: yes / maybe / no
- communication quality
- delivery reliability
- scope clarity
- private note

If the collaboration is successful, ProdUS suggests team formation and pre-fills a new team profile using agreed service scope and participant roles.

## 9. Team Creation and Membership

### Team Creation Paths

- solo expert creates team directly
- solo expert invites others into a new team
- successful trial collaboration becomes a team
- team lead invites an expert to existing team
- expert joins through approved request

### Team Membership States

- INVITED
- REQUESTED
- TRIAL
- ACTIVE
- INACTIVE
- REMOVED

### Team Roles

- LEAD
- DELIVERY_MANAGER
- SPECIALIST
- ADVISOR
- QUALITY_REVIEWER

## 10. Notifications

### Notification Channels

- in-app
- email
- optional push later

### Notification Events

- new message
- join request submitted
- join request status changed
- team opening reply
- invitation received
- trial collaboration proposed
- trial collaboration accepted
- trial milestone assigned
- post reply
- moderation action
- profile verification update

### Notification Controls

- mute thread
- mute channel
- digest preference
- email preference
- focus mode
- do-not-disturb window

## 11. Moderation and Safety

### Moderation Features

- report post
- report message
- block user
- mute thread
- hide post
- lock thread
- suspend profile
- admin review queue
- moderation audit log

### Automated Checks

- spam rate detection
- external solicitation detection
- repeated DM detection
- suspicious link detection
- harassment keyword detection
- confidential owner data warning

### Admin Decisions

- no action
- warn user
- hide content
- lock content
- temporary mute
- suspend account
- remove profile visibility

## Functional Requirements

### Domain and Session Requirements

- FR-DOM-001: ProdUS Studio must be available as the productization domain at `studio.produs.com`.
- FR-DOM-002: ProdUS Network must be available as the expert community and team formation domain at `network.produs.com`.
- FR-DOM-003: `teams.produs.com` may redirect or alias to `network.produs.com`, but `network.produs.com` is canonical.
- FR-DOM-004: Users authenticated on Studio must remain authenticated when navigating to Network.
- FR-DOM-005: Users authenticated on Network must remain authenticated when navigating to Studio if their role permits Studio access.
- FR-DOM-006: Logout from any ProdUS product domain must end the shared platform session across all product domains.
- FR-DOM-007: Auth callbacks must preserve signed return URLs so users land back on the route they originally requested.
- FR-DOM-008: Public profile summaries, service pages, and unauthenticated Network discovery previews must remain accessible without exposing private messages, requests, or workspace data.

### Expert Profile Requirements

- FR-EP-001: Users with expert-capable roles can create and edit an expert profile.
- FR-EP-002: Expert profiles must support profile photo and cover photo.
- FR-EP-003: Expert profiles must support services, skills, availability, location/timezone, and looking-for-team intent.
- FR-EP-004: Expert profiles must display verified delivery data from platform records.
- FR-EP-005: Expert profiles must support public, logged-in, and admin-visible field variants.
- FR-EP-006: Experts can hide location while still showing timezone.

### Team Profile Requirements

- FR-TP-001: Team leads can create and edit team profiles.
- FR-TP-002: Team leads can add profile and cover photos.
- FR-TP-003: Team leads can manage capabilities, members, invitations, and openings.
- FR-TP-004: Team profiles must show service categories, verified capabilities, delivery data, and openings.
- FR-TP-005: Team membership changes must be auditable.

### Directory Requirements

- FR-DIR-001: Users can search experts by name, service, skill, availability, timezone, and team intent.
- FR-DIR-002: Results must show profile cards with meaningful actions.
- FR-DIR-003: Owners see delivery-relevant fields without internal formation details.
- FR-DIR-004: Team leads see invite and message actions.
- FR-DIR-005: Solo experts see message, apply, and collaboration actions.

### Formation Board Requirements

- FR-FB-001: Solo experts can publish looking-for-team posts.
- FR-FB-002: Team leads can publish team openings.
- FR-FB-003: Posts must include structured services and skills.
- FR-FB-004: Posts can be paused, closed, refreshed, and reported.
- FR-FB-005: AI can suggest complementary matches using profile and service data.

### Join Request Requirements

- FR-JR-001: Experts can submit join requests to teams.
- FR-JR-002: Requests can be tied to a specific team opening.
- FR-JR-003: Requests create a private scoped conversation.
- FR-JR-004: Team leads can request more info, propose trial, accept, or decline.
- FR-JR-005: Experts can withdraw requests.
- FR-JR-006: Admins can inspect escalated or reported requests.

### Messaging Requirements

- FR-MSG-001: Users can create contextual conversation threads.
- FR-MSG-002: Every thread must have a scope type and scope id.
- FR-MSG-003: Messages support read receipts.
- FR-MSG-004: Users can report messages.
- FR-MSG-005: Users can block other users.
- FR-MSG-006: Private messages must be visible only to participants and authorized admins during moderation.
- FR-MSG-007: Threads support system events.

### Channel Requirements

- FR-CH-001: Admins can create and manage channels.
- FR-CH-002: Experts and teams can post in allowed channels.
- FR-CH-003: Posts can have replies.
- FR-CH-004: Posts can be marked helpful.
- FR-CH-005: Posts can be reported and moderated.
- FR-CH-006: Confidential workspace details must be discouraged through UI warnings and moderation rules.

### Trial Collaboration Requirements

- FR-TC-001: Experts or team leads can propose trial collaboration.
- FR-TC-002: Trials must define participants, scope, responsibilities, and payment split.
- FR-TC-003: Trials must connect to a package or workspace.
- FR-TC-004: Trials have a private conversation thread.
- FR-TC-005: Trials collect private collaboration feedback.
- FR-TC-006: Successful trials can create or update a team.

### Notification Requirements

- FR-NOT-001: The platform creates notification events for all meaningful communication and formation actions.
- FR-NOT-002: Users can configure notification preferences.
- FR-NOT-003: Unread counts must be queryable by route and thread.
- FR-NOT-004: Email notifications must be template-driven.

### Moderation Requirements

- FR-MOD-001: Users can report posts, messages, profiles, and board entries.
- FR-MOD-002: Admins can review reports in a queue.
- FR-MOD-003: Admins can hide, lock, warn, mute, suspend, or dismiss reports.
- FR-MOD-004: Moderation actions must be audited.

## Backend Data Model

The following tables assume PostgreSQL with UUID primary keys, `created_at`, `updated_at`, soft-delete where appropriate, and backend-enforced RBAC.

### `expert_profiles`

Existing expert profile model should be extended if already present.

Fields:

- id
- user_id
- display_name
- headline
- bio
- profile_photo_url
- cover_photo_url
- location
- timezone
- website_url
- portfolio_url
- github_url
- skills
- preferred_project_size
- availability
- solo_mode
- looking_for_team
- looking_for_team_statement
- profile_visibility
- active

### `expert_profile_services`

- id
- expert_profile_id
- service_category_id
- service_module_id
- proficiency_level
- evidence_url
- verified
- verified_by
- verified_at

### `team_openings`

- id
- team_id
- created_by_user_id
- title
- description
- needed_service_category_ids
- needed_service_module_ids
- needed_skills
- availability_requirement
- timezone_preference
- collaboration_model
- compensation_notes
- application_questions
- status
- expires_at
- closed_reason

### `expert_formation_posts`

- id
- author_expert_profile_id
- post_type
- title
- body
- offered_service_category_ids
- offered_service_module_ids
- needed_service_category_ids
- needed_service_module_ids
- skills_offered
- skills_needed
- availability
- timezone
- collaboration_goal
- status
- expires_at

### `team_join_requests`

- id
- team_id
- requester_expert_profile_id
- team_opening_id
- desired_role
- message
- offered_service_category_ids
- offered_service_module_ids
- offered_skills
- evidence_links
- availability
- timezone
- status
- reviewed_by_user_id
- review_note
- reviewed_at

### `conversation_threads`

- id
- scope_type
- scope_id
- title
- status
- created_by_user_id
- last_message_at
- locked_by_admin
- locked_reason

### `conversation_participants`

- id
- thread_id
- user_id
- participant_role
- muted
- last_read_at
- archived

### `messages`

- id
- thread_id
- sender_user_id
- message_type
- body
- metadata_json
- edited_at
- deleted_at
- deleted_by_user_id

### `message_attachments`

- id
- message_id
- attachment_id
- label

### `message_read_receipts`

- id
- message_id
- user_id
- read_at

### `community_channels`

- id
- slug
- name
- description
- channel_type
- service_category_id
- visibility
- posting_role_policy
- active
- sort_order

### `community_posts`

- id
- channel_id
- author_user_id
- title
- body
- service_category_id
- service_module_id
- status
- helpful_count
- reply_count
- last_reply_at

### `community_comments`

- id
- post_id
- author_user_id
- body
- parent_comment_id
- status

### `community_helpful_marks`

- id
- post_id
- comment_id
- user_id
- created_at

### `trial_collaborations`

- id
- package_instance_id
- workspace_id
- initiated_by_user_id
- title
- scope
- status
- payment_split_json
- acceptance_criteria
- proposed_start_date
- proposed_end_date
- completed_at

### `trial_collaboration_participants`

- id
- trial_collaboration_id
- expert_profile_id
- team_id
- role
- responsibilities
- split_percentage
- status
- accepted_at

### `trial_milestone_assignments`

- id
- trial_collaboration_id
- milestone_id
- assignee_expert_profile_id
- responsibility_notes

### `trial_feedback`

- id
- trial_collaboration_id
- reviewer_expert_profile_id
- reviewed_expert_profile_id
- would_work_again
- communication_score
- reliability_score
- scope_clarity_score
- private_note

### `moderation_reports`

- id
- reporter_user_id
- target_type
- target_id
- reason
- description
- status
- reviewed_by_user_id
- resolution
- reviewed_at

### `moderation_actions`

- id
- report_id
- admin_user_id
- action_type
- target_type
- target_id
- note
- expires_at

### `blocked_users`

- id
- blocker_user_id
- blocked_user_id
- reason
- created_at

### `notification_events`

- id
- recipient_user_id
- actor_user_id
- event_type
- scope_type
- scope_id
- title
- body
- read_at
- delivered_email_at
- metadata_json

### `notification_preferences`

- id
- user_id
- event_type
- in_app_enabled
- email_enabled
- digest_frequency
- muted_until

## API Surface

All endpoints require authenticated users unless marked public. Authorization must be enforced in backend services. Public, Studio, and Network frontend domains should call the same backend API origin in production.

Production API origin:

- `https://api.produs.com`

Primary frontend origins:

- `https://produs.com`
- `https://studio.produs.com`
- `https://network.produs.com`

The route paths below remain stable even when the frontend experience is served from a subdomain.

### Expert Profiles

- `GET /expert-network/profiles`
- `GET /expert-network/profiles/{id}`
- `GET /expert-network/profiles/me`
- `POST /expert-network/profiles`
- `PUT /expert-network/profiles/me`
- `POST /expert-network/profiles/me/services`
- `DELETE /expert-network/profiles/me/services/{id}`
- `POST /expert-network/profiles/me/photo`
- `POST /expert-network/profiles/me/cover`

### Directory

- `GET /expert-network/directory`
- `GET /expert-network/directory/suggestions`
- `GET /expert-network/directory/complementary`

### Formation Board

- `GET /expert-network/formation-posts`
- `POST /expert-network/formation-posts`
- `PUT /expert-network/formation-posts/{id}`
- `POST /expert-network/formation-posts/{id}/refresh`
- `POST /expert-network/formation-posts/{id}/close`
- `DELETE /expert-network/formation-posts/{id}`

### Team Openings

- `GET /expert-network/team-openings`
- `POST /expert-network/teams/{teamId}/openings`
- `PUT /expert-network/team-openings/{id}`
- `POST /expert-network/team-openings/{id}/close`
- `POST /expert-network/team-openings/{id}/pause`

### Join Requests

- `GET /expert-network/team-join-requests`
- `GET /expert-network/team-join-requests/{id}`
- `POST /expert-network/teams/{teamId}/join-requests`
- `PUT /expert-network/team-join-requests/{id}`
- `POST /expert-network/team-join-requests/{id}/submit`
- `POST /expert-network/team-join-requests/{id}/withdraw`
- `POST /expert-network/team-join-requests/{id}/request-info`
- `POST /expert-network/team-join-requests/{id}/accept`
- `POST /expert-network/team-join-requests/{id}/decline`
- `POST /expert-network/team-join-requests/{id}/propose-trial`

### Conversations

- `GET /expert-network/conversations`
- `GET /expert-network/conversations/{threadId}`
- `POST /expert-network/conversations`
- `POST /expert-network/conversations/{threadId}/messages`
- `POST /expert-network/conversations/{threadId}/read`
- `POST /expert-network/conversations/{threadId}/mute`
- `POST /expert-network/conversations/{threadId}/archive`
- `POST /expert-network/messages/{messageId}/report`

### Channels

- `GET /expert-network/channels`
- `GET /expert-network/channels/{slug}/posts`
- `POST /expert-network/channels/{slug}/posts`
- `GET /expert-network/posts/{postId}`
- `POST /expert-network/posts/{postId}/comments`
- `POST /expert-network/posts/{postId}/helpful`
- `POST /expert-network/posts/{postId}/report`

### Trial Collaborations

- `GET /expert-network/trials`
- `GET /expert-network/trials/{id}`
- `POST /expert-network/trials`
- `PUT /expert-network/trials/{id}`
- `POST /expert-network/trials/{id}/accept`
- `POST /expert-network/trials/{id}/cancel`
- `POST /expert-network/trials/{id}/complete`
- `POST /expert-network/trials/{id}/feedback`
- `POST /expert-network/trials/{id}/form-team`

### Notifications

- `GET /notifications`
- `POST /notifications/{id}/read`
- `POST /notifications/read-all`
- `GET /notification-preferences`
- `PUT /notification-preferences`

### Moderation

- `GET /admin/moderation/reports`
- `GET /admin/moderation/reports/{id}`
- `POST /admin/moderation/reports/{id}/resolve`
- `POST /admin/moderation/actions`
- `POST /admin/moderation/targets/{targetType}/{targetId}/hide`
- `POST /admin/moderation/targets/{targetType}/{targetId}/lock`

## Permission Model

### Roles

- ADMIN
- PRODUCT_OWNER
- TEAM_MANAGER
- SPECIALIST
- ADVISOR

### Permission Matrix

| Capability | Admin | Owner | Team Manager | Specialist | Advisor |
|---|---:|---:|---:|---:|---:|
| View public expert profiles | Yes | Yes | Yes | Yes | Yes |
| View expert network details | Yes | Limited | Yes | Yes | Yes |
| Edit own expert profile | Yes | No | Yes | Yes | Yes |
| Create team profile | Yes | No | Yes | Yes | Yes |
| Edit managed team profile | Yes | No | Yes | Limited | Limited |
| Create team opening | Yes | No | Yes | No | No |
| Submit join request | Yes | No | Yes | Yes | Yes |
| Review join request | Yes | No | Yes | No | No |
| Create formation post | Yes | No | Yes | Yes | Yes |
| Message from profile | Yes | Limited | Yes | Yes | Yes |
| View private thread | Participants | Participants only | Participants | Participants | Participants |
| Moderate content | Yes | No | No | No | No |
| View owner workspace data in community | Yes | Own only | Assigned only | Assigned only | Assigned only |

## Frontend Pages

Frontend implementation should remain one Next.js application with domain-aware routing. The canonical route group for the community remains `/expert-network`, while the production host `network.produs.com` presents those routes as the Network product. Studio productization routes remain under the Studio domain.

Subdomain routing requirements:

- `network.produs.com/` serves the Network command center.
- `network.produs.com/directory` serves expert and team discovery.
- `network.produs.com/formation` serves the formation board.
- `network.produs.com/messages` serves scoped Network conversations.
- `studio.produs.com/` serves the Studio productization dashboard.
- `studio.produs.com/project-cart` serves the owner productization cart.
- `studio.produs.com/workspaces` serves active delivery workspaces.
- unauthenticated public pages remain accessible from `produs.com`.
- canonical links and redirects must avoid bouncing users between product domains unnecessarily.

### `/expert-network`

Network role-aware command center:

- profile completion
- messages
- join requests
- openings
- recommendations
- channel activity
- moderation summary for admins

### `/expert-network/directory`

Searchable experts and teams:

- filters
- suggested matches
- expert cards
- profile preview drawer
- invite/message actions

### `/expert-network/formation`

Formation board:

- looking-for-team posts
- team openings
- filters
- AI fit suggestions
- apply/message actions

### `/expert-network/messages`

Inbox:

- thread list
- scoped conversation panel
- context card
- message composer
- report/mute/block controls

### `/expert-network/channels`

Async channels:

- channel list
- post list
- post detail
- replies
- helpful marks
- reporting

### `/expert-network/join-requests`

Join request management:

- sent requests
- received requests
- request detail
- private thread
- decision panel

### `/expert-network/trials`

Trial collaboration:

- trial list
- trial detail
- participant responsibilities
- payment split
- milestone assignments
- conversation
- feedback
- form-team action

### `/expert-network/profile`

Own expert profile:

- profile edit
- photo/cover upload
- services
- skills
- availability
- looking-for-team status
- preview public profile

### `/teams/profile`

Team-side management inside Network:

- team profile
- openings
- invitations
- join requests
- members
- capabilities
- verification

### `/admin/expert-network`

Admin Network management:

- reports
- moderation actions
- verification queue
- communication audit
- suspicious activity

## UI and Interaction Requirements

### Visual Direction

- Apple-like SaaS design
- restrained white surfaces
- soft shadows
- 8px card radius
- pastel service-category identity
- clear typography
- no nested card clutter
- no noisy feed mechanics
- icon-first actions where obvious
- direct verbs on buttons

### Mobile Direction

Mobile uses compact navigation:

- Directory
- Board
- Messages
- Channels
- Profile

Messages and join-request threads must feel native:

- thread list
- detail view
- sticky composer
- visible context header
- no horizontal overflow

### Empty States

Empty states must explain what to do next:

- no profile: complete expert profile
- no openings: create team opening
- no messages: message from profile, board, or request
- no requests: apply to team or publish looking-for-team post
- no channels: follow service categories

## AI Integration

### AI Use Cases

- recommend complementary experts
- recommend teams for solo expert
- suggest team openings for expert
- suggest experts for team openings
- summarize long join-request threads
- summarize trial collaboration status
- generate profile improvement suggestions
- flag spam or off-platform solicitation
- suggest service capabilities from profile text and delivery history

### AI Safety Rules

- private messages are not used for training
- AI summaries only visible to authorized thread participants
- AI matching can use structured metadata and permitted activity signals
- AI should cite why a recommendation exists
- AI cannot make final accept/decline decisions
- AI moderation flags require admin review for severe actions

### LoomAI Consideration

LoomAI can be integrated as an assistant layer:

- "summarize this join request"
- "suggest questions to ask this candidate"
- "find experts who complement this team"
- "draft a team opening"
- "identify missing evidence in this expert profile"

The platform must still operate without LoomAI. LoomAI is assistive, not required for core workflows.

## Matching Signals

### Expert-to-Team Fit

- service category overlap
- service module overlap
- complementary skills
- timezone compatibility
- availability compatibility
- verified milestones
- acceptance rate
- profile completeness
- previous conversation quality
- trial feedback
- team opening requirements

### Expert-to-Expert Fit

- complementary service gaps
- shared availability
- similar collaboration style
- matching package interests
- compatible timezones
- prior positive interactions
- trial outcome

### Team-to-Package Fit

- existing package matching signals
- team openings and capacity
- team member capabilities
- trial collaboration success
- channel service activity where permitted

## Security Requirements

- all endpoints require authentication unless explicitly public
- production authentication uses a server-managed session cookie scoped to `.produs.com`
- shared session cookies must be `Secure`, `HttpOnly`, and protected by backend session validation
- mutating requests from browser clients require CSRF protection or equivalent same-origin/origin-token enforcement
- backend CORS allowlists include only approved ProdUS origins, including `produs.com`, `studio.produs.com`, and `network.produs.com`
- Supabase redirect URLs must be explicitly allowlisted for public, Studio, and Network callback routes
- production frontend code must not rely on browser localStorage as the source of truth for cross-subdomain authentication
- logout must invalidate the server session and clear the `.produs.com` cookie across Studio and Network
- backend must verify participant access for every thread and message
- owners cannot access private expert/team formation threads
- blocked users cannot start new conversations with blocker
- deleted messages remain in moderation audit if reported
- file attachments must use existing secure attachment service
- rate limits for message creation, thread creation, posts, reports, and invites
- audit logs for team membership, moderation, and join-request decisions
- email content must not leak confidential message text if user disables previews

## Data Retention

- active messages retained while accounts remain active
- deleted user content anonymized where legally required
- moderation evidence retained according to admin policy
- audit logs retained for security and dispute handling
- trial collaboration records retained because they affect team formation and payment history

## Production Readiness Requirements

- custom domains configured for `produs.com`, `studio.produs.com`, `network.produs.com`, and `api.produs.com`
- shared `.produs.com` session cookie validated across Studio and Network
- Supabase auth callback and OAuth provider redirects verified for every supported product domain
- backend CORS and origin checks verified against public, Studio, Network, and API domains
- database migrations with rollback strategy
- seeded local demo data for all user types
- API authorization tests
- UI route guards
- cross-subdomain login, logout, and return-url tests
- CSRF/origin enforcement tests for mutating actions
- report/block safety tests
- message access control tests
- notification delivery tests
- mobile screenshots for key routes
- rate-limit tests
- admin moderation test path
- privacy review before enabling AI summaries

## Implementation Tracks

### Track 0: Domain, Session, and Routing Foundation

Deliverables:

- canonical product domain map for public site, Studio, Network, and API
- Next.js host-aware routing for `studio.produs.com` and `network.produs.com`
- public fallback and unauthenticated discovery routes
- shared server-managed session cookie scoped to `.produs.com`
- Supabase callback handling with signed return URLs
- logout flow that clears the shared platform session
- environment variables for public, Studio, Network, and API origins
- CORS, origin validation, and CSRF protection for browser clients
- cross-subdomain auth regression tests

### Track 1: Data Foundation

Deliverables:

- migrations for all Expert Network tables
- enum definitions
- repository interfaces
- service-layer permission helpers
- seed data for experts, teams, openings, conversations, posts, and trials
- audit event helpers

### Track 2: Backend Domain Services

Deliverables:

- expert profile service
- directory search service
- formation board service
- team opening service
- join request service
- conversation service
- message service
- community channel service
- trial collaboration service
- notification event service
- moderation service

### Track 3: API Controllers

Deliverables:

- REST controllers listed in API Surface
- request/response DTOs
- validation rules
- role and participant checks
- pagination
- filtering
- sorting
- structured error responses

### Track 4: Frontend App Surfaces

Deliverables:

- ProdUS Network route group
- ProdUS Studio links into Network discovery and team shortlist flows
- host-aware redirects and canonical URL helpers
- directory page
- formation board page
- messages/inbox page
- channels page
- join requests page
- trial collaborations page
- expert profile editor
- team profile integration
- admin moderation UI
- responsive mobile layouts

### Track 5: Notifications

Deliverables:

- notification event generation
- unread counts
- in-app notification center
- email templates
- user notification preferences
- thread mute and channel mute

### Track 6: Moderation and Safety

Deliverables:

- report flows
- admin review queue
- content hide/lock actions
- user block
- rate limiting
- audit log views
- safety copy in public channel composer

### Track 7: AI Assistance

Deliverables:

- matching explanation DTOs
- profile improvement suggestions
- team composition suggestions
- join-request summary endpoint
- moderation risk suggestions
- LoomAI adapter boundary
- fallback behavior when AI provider is unavailable

### Track 8: Testing and Verification

Deliverables:

- backend unit tests
- backend integration tests
- frontend component tests
- end-to-end flows
- authorization regression tests
- mobile screenshot verification
- production build verification
- local seed verification

## Delivery Sequence

1. Configure product domains, route helpers, and environment variables for public site, Studio, Network, and API.
2. Implement server-managed `.produs.com` platform session flow backed by Supabase identity.
3. Add cross-subdomain login, logout, callback, and return-url tests.
4. Add database schema and seed data.
5. Build backend permission model for scoped threads and team membership.
6. Implement expert profile and team opening APIs.
7. Implement conversation and messaging APIs.
8. Implement join-request APIs and state transitions.
9. Implement formation board APIs.
10. Implement trial collaboration APIs.
11. Implement notification events and preferences.
12. Implement moderation APIs.
13. Build ProdUS Network frontend shell and navigation.
14. Build Studio-to-Network discovery, shortlist, and team/expert profile entry points.
15. Build expert profile editor and directory.
16. Build formation board and team openings.
17. Build join request detail with conversation thread.
18. Build messages inbox and scoped thread UI.
19. Build channels and post/reply UI.
20. Build trial collaboration UI.
21. Build admin moderation UI.
22. Add AI suggestion and summary panels.
23. Run full test, build, and live-server verification.
24. Update development guide and route documentation.

## Acceptance Criteria

The implementation is complete when:

- solo experts can create and maintain full profiles
- solo experts can browse teams and experts
- team leads can publish openings
- solo experts can apply to teams
- join requests create private conversation threads
- team leads can request more information, propose trial, accept, or decline
- experts and teams can message through scoped contexts
- users can view an inbox with unread state
- service channels support posts, replies, helpful marks, and reports
- trial collaboration can be proposed, accepted, completed, reviewed, and converted into team formation
- notifications appear for all communication and decision events
- admins can moderate reports and audit actions
- owners can browse verified public team/expert data without seeing private formation threads
- AI assistance provides explainable suggestions and summaries only to authorized users
- all key routes pass desktop and mobile visual checks
- all backend permission tests pass
- production build passes

## Test Users

Use deterministic local credentials and seeded records:

- `owner@produs.com`: product owner landing in Studio, browsing verified teams and experts from Network discovery surfaces
- `team@produs.com`: team lead landing in Network, managing team profile, openings, requests
- `specialist@produs.com`: solo expert landing in Network, applying to teams and joining conversations
- `advisor@produs.com`: expert/advisor landing in Network, participating in channels and trials
- `admin@produs.com`: administrator with Studio and Network access for moderation, verification, and platform controls

Local and staging tests must verify that each user can sign in once, move between `studio.produs.com` and `network.produs.com`, and remain authenticated through the shared `.produs.com` session cookie.

## Example End-to-End Scenarios

### Scenario 1: Solo Expert Joins a Team

1. Specialist logs in.
2. Specialist completes expert profile.
3. Specialist browses formation board.
4. Specialist opens a team opening.
5. Specialist submits join request.
6. Private thread is created.
7. Team lead asks follow-up question.
8. Specialist replies with evidence.
9. Team lead proposes trial.
10. Specialist accepts.
11. Trial completes successfully.
12. Team lead formalizes membership.

### Scenario 2: Team Lead Recruits Expert

1. Team lead updates team profile.
2. Team lead creates team opening for frontend specialist.
3. AI suggests complementary experts.
4. Team lead messages expert from profile context.
5. Expert responds.
6. Team lead invites expert to trial collaboration.
7. Expert accepts.
8. Trial result updates team fit signals.

### Scenario 3: Community Discussion Builds Trust

1. Expert posts in security channel.
2. Other experts reply.
3. A reply is marked helpful.
4. Profile shows service-channel contribution summary.
5. Matching system uses permitted structured signal to improve service fit.

### Scenario 4: Admin Moderates Abuse

1. User reports a message.
2. Admin sees report in moderation queue.
3. Admin reviews target content and thread context.
4. Admin hides message and warns sender.
5. Audit event is stored.
6. Reporter receives resolution notification.

## Open Product Decisions

These decisions must be resolved before coding starts:

1. Should owners be allowed to message solo experts outside a package/project context?
2. Should expert channel posts be visible to logged-out visitors?
3. Should delivery stats be mandatory public data on expert profiles?
4. Should trial collaboration require a real package, or can admins create internal trial assignments?
5. Should AI summaries be stored or generated on demand?
6. What is the exact retention policy for deleted private messages?
7. Should `teams.produs.com` be a permanent alias, a redirect, or not launched publicly?
8. Should the central login entry point live on `produs.com/login` or `studio.produs.com/login`?

## Recommended Decisions

1. Owners should message experts only through Studio productization context.
2. Logged-out visitors should see only public profile summaries and service pages.
3. Verified delivery stats should be visible, because trust is core to the marketplace.
4. Trial collaboration should connect to real package/workspace records by default, with admin-created internal trials allowed for verification.
5. AI summaries should be generated on demand and cached with permission metadata.
6. Deleted private messages should be hidden from participants but retained in audit when reported or involved in moderation.
7. `network.produs.com` should be canonical; `teams.produs.com` should redirect to Network if acquired and configured.
8. Central login should support entry from every domain, but the production session should be issued as a secure `.produs.com` cookie so users move between Studio and Network without re-authenticating.

## Final Product Definition

The completed ProdUS Network is a production-grade formation system where solo experts and teams can:

- present credible professional profiles
- discover complementary collaborators
- communicate through scoped conversations
- request and review team membership
- form teams through structured openings and invitations
- trial collaboration before permanent membership
- build trust through verified delivery and useful contribution
- remain protected by moderation, privacy, and clear permission boundaries

ProdUS Studio is the owner-facing productization workspace. ProdUS Network is the communication and trust layer that turns individual expert supply into dependable ProdUS delivery teams.
