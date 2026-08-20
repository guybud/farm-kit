-- Password-reset emails are audited in farm_team_invites alongside invites
-- (same rate-limit window queries). Extend the status vocabulary.

-- Reset rows carry no role; invites still always set one.
alter table public.farm_team_invites
  alter column role_id drop not null;

alter table public.farm_team_invites
  drop constraint if exists farm_team_invites_status_check;

alter table public.farm_team_invites
  add constraint farm_team_invites_status_check
  check (status in ('sent', 'accepted', 'revoked', 'failed', 'reset_sent', 'reset_failed'));
