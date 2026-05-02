# Green Combat Build Plan

## Product Direction

Green Combat is a real-world competition system inside Green Truth.
Users earn points from verified environmental actions, compete as individuals or teams, and climb leaderboards through consistent impact instead of performative activity.

Core loop:

1. Join solo mode or a team.
2. Pick an active mission.
3. Complete the action in real life.
4. Submit proof.
5. Wait for approval.
6. Earn points and move up the leaderboard.

## Goals

- Turn Green Truth from an information platform into a participation platform.
- Reward verified action, not just claims.
- Support both personal motivation and class/team rivalry.
- Reuse the existing plant-tracking system as a first mission source.

## MVP Scope

### In Scope

- Solo leaderboard
- Team leaderboard
- Mission board
- Submission form with proof image and note
- Pending/approved/rejected review flow
- Point history
- Badge display
- Plant-based missions using existing `plants` and `plant_logs`

### Out of Scope for First Release

- Full automation for verification
- Complex anti-cheat heuristics
- Cross-school tournaments
- Seasonal pass or advanced reward economy
- Push notifications

## Existing Schema You Already Have

These tables already support important Green Combat flows:

- `profiles`: user identity, avatar, existing `coin` and `streak`
- `plants`: planted tree records
- `plant_logs`: follow-up care logs
- `plant_images`: plant photo history
- `map_points`: location-based extension point

These new combat tables suit the feature well:

- `teams`
- `team_members`
- `combat_missions`
- `combat_submissions`
- `point_transactions`
- `badges`
- `user_badges`

## Recommended Data Rules

Add or keep these rules when creating the runnable migration:

- `team_members` must have `unique (team_id, user_id)`
- `user_badges` must have `unique (user_id, badge_id)`
- `point_transactions` should prevent duplicate points for the same submission
- approved submissions should generate points automatically through a trigger
- `updated_at` should auto-refresh on mutable tables

## Feature Architecture

### 1. Competition Modes

- `Solo`: rank users directly by approved points
- `Team`: combine member activity into one shared score

### 2. Mission System

Each mission should define:

- title
- description
- action type
- point reward
- verification type
- mode: solo, team, or both
- date window
- proof requirement

Suggested MVP missions:

1. `Plant a Tree` - create a new plant record with proof
2. `Care for Your Tree` - submit a valid follow-up log
3. `Cleanup Submission` - submit trash collection proof
4. `Waste Sorting` - submit proof of correct sorting

### 3. Submission and Review

Submission fields:

- mission
- user
- optional team
- optional linked plant
- proof image
- note
- quantity when needed
- status

Review states:

- `pending`
- `approved`
- `rejected`

Admin review flow:

1. Open pending submissions.
2. Inspect proof and note.
3. Approve or reject.
4. On approval, create point transaction.

### 4. Scoring Model

Use `point_transactions` as the source of truth.

Suggested starting rewards:

- Plant a tree: `30`
- Plant care follow-up: `15`
- Cleanup submission: `20`
- Waste sorting: `15`
- Weekly challenge completion: `40`

Scoring rules:

- only approved submissions give points
- one submission should only be rewarded once
- plant care should later include time-gap validation to stop spam
- team scores should be the sum of approved member/team transactions

### 5. Badges

Suggested starter badges:

- `first_action`
- `tree_guardian`
- `cleanup_captain`
- `streak_builder`
- `team_player`

## GreenCombat.html Build Plan

The current `GreenCombat.html` is styled like a dashboard page, which is a good starting point.
Build it into these sections.

### Section 1: Hero / Season Header

Purpose:

- explain the active season
- show the user's current status
- give one primary CTA

Content:

- season title like `Green Combat: April Sprint`
- short tagline
- buttons: `Join Team`, `Submit Action`
- quick chips for rank, points, streak

### Section 2: Key Stats Row

Show:

- total participants
- total teams
- approved actions
- total points earned

### Section 3: Leaderboards

Two tabs or split panels:

- top individuals
- top teams

Each row should show:

- rank
- avatar or badge
- username or team name
- points
- movement indicator later if desired

### Section 4: Mission Board

Cards should show:

- mission title
- points reward
- mission type
- proof required or not
- status like active or ending soon
- CTA: `Submit`

### Section 5: Submission Panel

Form fields:

- mission selector
- team selector if applicable
- linked plant selector for plant missions
- image upload
- quantity input
- note textarea
- submit button

### Section 6: Submission History

Show the user's recent actions:

- mission
- date
- status
- points earned
- review note if rejected

### Section 7: Badge / Reward Panel

Show:

- unlocked badges
- next badge progress
- current streak

## Supabase Query Map

### Dashboard Data

Page load should eventually fetch:

- current user profile
- active missions
- top users leaderboard
- top teams leaderboard
- current user's recent submissions
- current user's badges
- current user's teams

### Submission Flow

When user submits an action:

1. Upload proof image to storage bucket.
2. Create `combat_submissions` row.
3. Show local status as `pending`.

### Approval Flow

When reviewer approves:

1. Update submission status to `approved`.
2. Trigger creates `point_transactions` row.
3. Leaderboard updates automatically from aggregated points.

## Suggested Implementation Phases

### Phase 1: Database Foundation

- turn the drafted schema into a runnable migration
- add constraints, triggers, and leaderboard views
- define storage bucket for proof images
- add RLS policies

### Phase 2: GreenCombat UI Shell

- refactor `GreenCombat.html` into dedicated competition sections
- keep the current visual language
- add placeholder cards and empty states

### Phase 3: Read-Only Data Integration

- connect Supabase client
- load missions, leaderboards, and user stats
- render recent submissions and badges

### Phase 4: Submission Workflow

- upload images
- create submission rows
- handle mission-specific fields
- show pending state and validation errors

### Phase 5: Review and Ranking

- build basic admin review actions
- verify automatic point awarding
- test ranking accuracy for solo and team boards

## UI-to-Table Mapping

- hero stats -> `profiles`, aggregated `point_transactions`
- mission board -> `combat_missions`
- submission form -> `combat_submissions`, optionally `plants`, `plant_logs`
- leaderboard -> aggregated `point_transactions`, `profiles`, `teams`
- badges -> `badges`, `user_badges`
- team membership -> `teams`, `team_members`

## Open Decisions

You should decide these before full implementation:

1. Should `profiles.coin` stay separate from combat points?
2. Who is allowed to review submissions: admin only, teacher, or team captain?
3. Can one user belong to multiple teams?
4. Is cleanup proof uploaded only through `GreenCombat`, or also reused from `ConfirmAction.html`?
5. Do you want weekly reset leaderboards or all-time only for MVP?

## Recommended Next Build Step

Start with this sequence:

1. Create the runnable Supabase migration for combat tables.
2. Add RLS and storage rules.
3. Rebuild `GreenCombat.html` into the planned dashboard layout.
4. Connect real leaderboard and mission data.
5. Add proof submission and approval flow.

This gets you to a believable MVP quickly while staying aligned with Green Truth's idea of verified, real-world environmental action.
