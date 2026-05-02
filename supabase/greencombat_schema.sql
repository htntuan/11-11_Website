-- Green Combat database foundation for Supabase
-- Run this in the Supabase SQL editor after your base auth/profiles/plants schema exists.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint teams_name_not_blank check (btrim(name) <> ''),
  constraint teams_code_not_blank check (btrim(code) <> '')
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint team_members_unique unique (team_id, user_id),
  constraint team_members_role_check check (role in ('owner', 'captain', 'member'))
);

create table if not exists public.combat_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  action_type text not null,
  points_reward integer not null default 0,
  verification_type text not null default 'manual',
  mode text not null default 'both',
  proof_requirement text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint combat_missions_title_not_blank check (btrim(title) <> ''),
  constraint combat_missions_action_type_not_blank check (btrim(action_type) <> ''),
  constraint combat_missions_points_non_negative check (points_reward >= 0),
  constraint combat_missions_verification_check check (verification_type in ('manual', 'hybrid', 'automatic')),
  constraint combat_missions_mode_check check (mode in ('solo', 'team', 'both')),
  constraint combat_missions_window_check check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table if not exists public.combat_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint combat_admins_user_unique unique (user_id)
);

create table if not exists public.combat_submissions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.combat_missions (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  plant_id uuid references public.plants (id) on delete set null,
  submission_type text not null,
  proof_image_url text,
  note text,
  quantity numeric(10,2),
  status text not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint combat_submissions_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint combat_submissions_quantity_non_negative check (quantity is null or quantity >= 0),
  constraint combat_submissions_type_not_blank check (btrim(submission_type) <> '')
);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  submission_id uuid not null references public.combat_submissions (id) on delete cascade,
  mission_id uuid references public.combat_missions (id) on delete set null,
  points integer not null,
  reason text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint point_transactions_one_reward_per_submission unique (submission_id),
  constraint point_transactions_non_negative check (points >= 0)
);

create or replace function public.ensure_point_transaction_is_reviewed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matching_submission record;
begin
  select id, user_id, team_id, mission_id, status, reviewed_by
  into matching_submission
  from public.combat_submissions
  where id = new.submission_id;

  if matching_submission.id is null then
    raise exception 'Submission % does not exist', new.submission_id;
  end if;

  if matching_submission.status <> 'approved' or matching_submission.reviewed_by is null then
    raise exception 'Points can only be awarded after reviewer approval for submission %', new.submission_id;
  end if;

  if new.user_id is distinct from matching_submission.user_id then
    raise exception 'Point transaction user does not match submission user';
  end if;

  if new.team_id is distinct from matching_submission.team_id then
    raise exception 'Point transaction team does not match submission team';
  end if;

  if new.mission_id is distinct from matching_submission.mission_id then
    raise exception 'Point transaction mission does not match submission mission';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_point_transaction_is_reviewed on public.point_transactions;
create trigger ensure_point_transaction_is_reviewed
before insert or update on public.point_transactions
for each row
execute function public.ensure_point_transaction_is_reviewed();

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  badge_key text not null unique,
  name text not null,
  description text,
  icon_name text,
  threshold_value integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint badges_key_not_blank check (btrim(badge_key) <> ''),
  constraint badges_name_not_blank check (btrim(name) <> ''),
  constraint badges_threshold_non_negative check (threshold_value is null or threshold_value >= 0)
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default timezone('utc', now()),
  source_submission_id uuid references public.combat_submissions (id) on delete set null,
  note text,
  constraint user_badges_unique unique (user_id, badge_id)
);

create index if not exists idx_team_members_user_id on public.team_members (user_id);
create index if not exists idx_team_members_team_id on public.team_members (team_id);
create index if not exists idx_combat_missions_is_active on public.combat_missions (is_active);
create index if not exists idx_combat_admins_user_id on public.combat_admins (user_id);
create index if not exists idx_combat_submissions_user_id on public.combat_submissions (user_id);
create index if not exists idx_combat_submissions_team_id on public.combat_submissions (team_id);
create index if not exists idx_combat_submissions_status on public.combat_submissions (status);
create index if not exists idx_point_transactions_user_id on public.point_transactions (user_id);
create index if not exists idx_point_transactions_team_id on public.point_transactions (team_id);

drop trigger if exists set_teams_updated_at on public.teams;
create trigger set_teams_updated_at
before update on public.teams
for each row
execute function public.set_updated_at();

drop trigger if exists set_team_members_updated_at on public.team_members;
create trigger set_team_members_updated_at
before update on public.team_members
for each row
execute function public.set_updated_at();

drop trigger if exists set_combat_missions_updated_at on public.combat_missions;
create trigger set_combat_missions_updated_at
before update on public.combat_missions
for each row
execute function public.set_updated_at();

drop trigger if exists set_combat_admins_updated_at on public.combat_admins;
create trigger set_combat_admins_updated_at
before update on public.combat_admins
for each row
execute function public.set_updated_at();

drop trigger if exists set_combat_submissions_updated_at on public.combat_submissions;
create trigger set_combat_submissions_updated_at
before update on public.combat_submissions
for each row
execute function public.set_updated_at();

drop trigger if exists set_badges_updated_at on public.badges;
create trigger set_badges_updated_at
before update on public.badges
for each row
execute function public.set_updated_at();

create or replace function public.sync_submission_review_fields()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('approved', 'rejected') and old.status is distinct from new.status then
    if new.reviewed_at is null then
      new.reviewed_at = timezone('utc', now());
    end if;
  end if;

  if new.status = 'pending' then
    new.reviewed_at = null;
    new.reviewed_by = null;
    new.review_note = null;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_submission_review_fields on public.combat_submissions;
create trigger sync_submission_review_fields
before update on public.combat_submissions
for each row
execute function public.sync_submission_review_fields();

create or replace function public.is_combat_owner(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = check_user_id
      and lower(coalesce(p.email, '')) = 'tuantk2009@gmail.com'
  );
$$;

create or replace function public.is_combat_reviewer(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
as $$
  select public.is_combat_owner(check_user_id)
    or exists (
    select 1
    from public.combat_admins ca
    where ca.user_id = check_user_id
      and ca.is_active = true
  );
$$;

create or replace function public.approve_combat_submission(
  target_submission_id uuid,
  reviewer_note text default null
)
returns table (
  submission_id uuid,
  awarded_points integer,
  transaction_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_submission public.combat_submissions%rowtype;
  mission_points integer;
  mission_title text;
  inserted_transaction_id uuid;
begin
  if not public.is_combat_reviewer(auth.uid()) then
    raise exception 'Only Green Combat reviewers can approve submissions';
  end if;

  select * into target_submission
  from public.combat_submissions
  where id = target_submission_id
  for update;

  if target_submission.id is null then
    raise exception 'Submission % not found', target_submission_id;
  end if;

  if target_submission.status = 'rejected' then
    raise exception 'Rejected submission % cannot be approved', target_submission_id;
  end if;

  select points_reward, title into mission_points, mission_title
  from public.combat_missions
  where id = target_submission.mission_id;

  if mission_points is null then
    raise exception 'Combat mission % not found for submission %', target_submission.mission_id, target_submission.id;
  end if;

  update public.combat_submissions
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = timezone('utc', now()),
      review_note = reviewer_note
  where id = target_submission.id;

  insert into public.point_transactions (user_id, team_id, submission_id, mission_id, points, reason)
  values (
    target_submission.user_id,
    target_submission.team_id,
    target_submission.id,
    target_submission.mission_id,
    mission_points,
    'Approved submission: ' || coalesce(mission_title, target_submission.submission_type, 'Mission')
  )
  on conflict (submission_id) do update
  set user_id = excluded.user_id,
      team_id = excluded.team_id,
      mission_id = excluded.mission_id,
      points = excluded.points,
      reason = excluded.reason
  returning id into inserted_transaction_id;

  return query select target_submission.id, mission_points, inserted_transaction_id;
end;
$$;

create or replace function public.reject_combat_submission(
  target_submission_id uuid,
  reviewer_note text default null
)
returns table (
  submission_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_submission public.combat_submissions%rowtype;
begin
  if not public.is_combat_reviewer(auth.uid()) then
    raise exception 'Only Green Combat reviewers can reject submissions';
  end if;

  select * into target_submission
  from public.combat_submissions
  where id = target_submission_id
  for update;

  if target_submission.id is null then
    raise exception 'Submission % not found', target_submission_id;
  end if;

  if exists (select 1 from public.point_transactions pt where pt.submission_id = target_submission.id) then
    raise exception 'Submission % already has awarded points and cannot be rejected', target_submission_id;
  end if;

  update public.combat_submissions
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = timezone('utc', now()),
      review_note = reviewer_note
  where id = target_submission.id;

  return query select target_submission.id, 'rejected'::text;
end;
$$;

drop trigger if exists award_submission_points on public.combat_submissions;
drop trigger if exists trg_award_points_on_approval on public.combat_submissions;

grant execute on function public.approve_combat_submission(uuid, text) to authenticated;
grant execute on function public.reject_combat_submission(uuid, text) to authenticated;
revoke all on function public.approve_combat_submission(uuid, text) from public, anon;
revoke all on function public.reject_combat_submission(uuid, text) from public, anon;
revoke all on function public.ensure_point_transaction_is_reviewed() from public, anon, authenticated;
grant execute on function public.approve_combat_submission(uuid, text) to authenticated;
grant execute on function public.reject_combat_submission(uuid, text) to authenticated;

comment on function public.approve_combat_submission(uuid, text) is
'Approves a Green Combat submission and atomically creates exactly one point transaction. Submission creation never awards points.';

comment on function public.reject_combat_submission(uuid, text) is
'Rejects a Green Combat submission without creating any point transaction.';

create or replace view public.leaderboard_users as
select
  p.id as user_id,
  coalesce(p.username, split_part(p.email, '@', 1), 'Anonymous') as username,
  coalesce(sum(pt.points), 0) as total_points,
  count(distinct pt.submission_id) as approved_submissions
from public.profiles p
left join public.point_transactions pt on pt.user_id = p.id
group by p.id, p.username, p.email;

create or replace view public.leaderboard_teams as
select
  t.id as team_id,
  t.name,
  coalesce(sum(pt.points), 0) as total_points,
  count(distinct tm.user_id) as member_count
from public.teams t
left join public.team_members tm on tm.team_id = t.id
left join public.point_transactions pt on pt.team_id = t.id
where t.is_active = true
group by t.id, t.name;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.combat_missions enable row level security;
alter table public.combat_admins enable row level security;
alter table public.combat_submissions enable row level security;
alter table public.point_transactions enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "combat owner reads admin assignments" on public.combat_admins;
create policy "combat owner reads admin assignments"
on public.combat_admins
for select
to authenticated
using (
  public.is_combat_owner()
  or user_id = auth.uid()
);

drop policy if exists "combat owner manages admin assignments" on public.combat_admins;
create policy "combat owner manages admin assignments"
on public.combat_admins
for all
to authenticated
using (public.is_combat_owner())
with check (public.is_combat_owner());

drop policy if exists "teams are readable by signed in users" on public.teams;
create policy "teams are readable by signed in users"
on public.teams
for select
to authenticated
using (is_active = true);

drop policy if exists "users can create teams" on public.teams;
create policy "users can create teams"
on public.teams
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "team owners can update teams" on public.teams;
create policy "team owners can update teams"
on public.teams
for update
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.team_members tm
    where tm.team_id = teams.id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'captain')
  )
)
with check (
  created_by = auth.uid()
  or exists (
    select 1 from public.team_members tm
    where tm.team_id = teams.id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'captain')
  )
);

drop policy if exists "team memberships are readable by members" on public.team_members;
create policy "team memberships are readable by members"
on public.team_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.team_members mine
    where mine.team_id = team_members.team_id
      and mine.user_id = auth.uid()
  )
);

drop policy if exists "users can join themselves to a team" on public.team_members;
create policy "users can join themselves to a team"
on public.team_members
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "captains can manage memberships" on public.team_members;
create policy "captains can manage memberships"
on public.team_members
for update
to authenticated
using (
  exists (
    select 1 from public.team_members captain
    where captain.team_id = team_members.team_id
      and captain.user_id = auth.uid()
      and captain.role in ('owner', 'captain')
  )
)
with check (
  exists (
    select 1 from public.team_members captain
    where captain.team_id = team_members.team_id
      and captain.user_id = auth.uid()
      and captain.role in ('owner', 'captain')
  )
);

drop policy if exists "active missions are readable by signed in users" on public.combat_missions;
create policy "active missions are readable by signed in users"
on public.combat_missions
for select
to authenticated
using (is_active = true);

drop policy if exists "reviewers manage missions" on public.combat_missions;
create policy "reviewers manage missions"
on public.combat_missions
for all
to authenticated
using (public.is_combat_reviewer())
with check (public.is_combat_reviewer());

drop policy if exists "users read own combat submissions" on public.combat_submissions;
create policy "users read own combat submissions"
on public.combat_submissions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_combat_reviewer()
  or (
    team_id is not null and exists (
      select 1 from public.team_members tm
      where tm.team_id = combat_submissions.team_id
        and tm.user_id = auth.uid()
    )
  )
);

drop policy if exists "users create own combat submissions" on public.combat_submissions;
create policy "users create own combat submissions"
on public.combat_submissions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and review_note is null
  and (
    team_id is null or exists (
      select 1 from public.team_members tm
      where tm.team_id = combat_submissions.team_id
        and tm.user_id = auth.uid()
    )
  )
);

drop policy if exists "reviewers update combat submissions" on public.combat_submissions;
create policy "reviewers update combat submissions"
on public.combat_submissions
for update
to authenticated
using (public.is_combat_reviewer())
with check (public.is_combat_reviewer());

drop policy if exists "users read own point transactions" on public.point_transactions;
create policy "users read own point transactions"
on public.point_transactions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_combat_reviewer()
  or (
    team_id is not null and exists (
      select 1 from public.team_members tm
      where tm.team_id = point_transactions.team_id
        and tm.user_id = auth.uid()
    )
  )
);

drop policy if exists "reviewers manage point transactions" on public.point_transactions;
drop policy if exists "reviewers insert point transactions" on public.point_transactions;
drop policy if exists "reviewers update point transactions" on public.point_transactions;
drop policy if exists "reviewers delete point transactions" on public.point_transactions;

drop policy if exists "badges are readable by signed in users" on public.badges;
create policy "badges are readable by signed in users"
on public.badges
for select
to authenticated
using (true);

drop policy if exists "reviewers manage badges" on public.badges;
create policy "reviewers manage badges"
on public.badges
for all
to authenticated
using (public.is_combat_reviewer())
with check (public.is_combat_reviewer());

drop policy if exists "users read own badge awards" on public.user_badges;
create policy "users read own badge awards"
on public.user_badges
for select
to authenticated
using (user_id = auth.uid() or public.is_combat_reviewer());

drop policy if exists "reviewers manage badge awards" on public.user_badges;
create policy "reviewers manage badge awards"
on public.user_badges
for all
to authenticated
using (public.is_combat_reviewer())
with check (public.is_combat_reviewer());

grant select on public.leaderboard_users to authenticated;
grant select on public.leaderboard_teams to authenticated;

insert into public.badges (badge_key, name, description, threshold_value)
values
  ('first_action', 'First Action', 'Duyet thanh cong bai gui dau tien.', 1),
  ('tree_guardian', 'Tree Guardian', 'Duy tri cham cay qua nhieu lan cap nhat.', 5),
  ('cleanup_captain', 'Cleanup Captain', 'Dong gop nhieu bai cleanup duoc duyet.', 5),
  ('streak_builder', 'Streak Builder', 'Duy tri dong gop xanh deu dan.', 7),
  ('team_player', 'Team Player', 'Dong gop diem cho team mode.', 3)
on conflict (badge_key) do update
set
  name = excluded.name,
  description = excluded.description,
  threshold_value = excluded.threshold_value,
  updated_at = timezone('utc', now());

insert into public.combat_missions (
  title,
  description,
  action_type,
  points_reward,
  verification_type,
  mode,
  proof_requirement,
  is_active
)
values
  (
    'Plant a Tree',
    'Tao ho so cay moi voi minh chung trong va nguoi chiu trach nhiem.',
    'plant_tree',
    30,
    'manual',
    'both',
    'Anh cay moi trong va ghi chu dia diem.',
    true
  ),
  (
    'Care for Your Tree',
    'Gui nhat ky theo doi cay de chung minh viec cham soc lau dai.',
    'plant_care',
    15,
    'manual',
    'both',
    'Anh cap nhat, tinh trang cay va ghi chu thoi gian.',
    true
  ),
  (
    'Cleanup Submission',
    'Nop bang chung nhat rac hoac don dep co the kiem tra lai.',
    'cleanup_submission',
    20,
    'manual',
    'both',
    'Anh minh chung so luong rac va dia diem.',
    true
  ),
  (
    'Waste Sorting',
    'Gui bang chung phan loai rac dung cach.',
    'waste_sorting',
    15,
    'manual',
    'both',
    'Anh hoac video cho thay phan loai ro rang.',
    true
  )
on conflict do nothing;

comment on function public.is_combat_reviewer(uuid) is
'Returns true for users who can review or manage Green Combat resources. Strict admin model uses the owner email and explicit combat_admins assignments.';

comment on function public.is_combat_owner(uuid) is
'Returns true only for the single Green Combat owner account identified by email tuantk2009@gmail.com.';