-- =====================================================================
-- CUDFIRM 018 — Service requests, admin request management, client portal
--
-- ADDITIVE ONLY. Does not alter any table, policy or function created by
-- migrations 001–017 or by the Member Accounts module. Run AFTER:
--   016_module_permissions_foundation.sql
--   modules/member-accounts/migrations/001 and 002
-- Back up the project first. Never rewrite this file once applied; use 019+.
--
-- Authorisation model
--   Admin access   -> public.has_permission('view_messages' / 'manage_messages')
--                     (existing permission names; no permission matrix change)
--   Client access  -> auth.uid() owns the project AND public.is_active_member()
--   Anonymous      -> NO direct table access. Public service requests are
--                     written only by the `service-request` Edge Function
--                     (service role), which validates, rate-limits and emails.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Service requests (public submissions, admin-managed)
-- ---------------------------------------------------------------------
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default ('SR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  client_token text unique,
  name text not null,
  email text not null,
  phone text,
  service_name text not null,
  requirements text not null,
  timeline text,
  budget text,
  extra text,
  status text not null default 'new',
  is_read boolean not null default false,
  member_id uuid references public.member_profiles(user_id) on delete set null,
  email_status text not null default 'pending',
  email_error text,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_requests_status_check check (status in (
    'new','under_review','awaiting_client','approved',
    'in_progress','completed','declined','cancelled')),
  constraint service_requests_email_status_check check (
    email_status in ('pending','sent','failed','not_configured')),
  constraint service_requests_name_check check (char_length(btrim(name)) between 1 and 120),
  constraint service_requests_email_check check (char_length(btrim(email)) between 5 and 320),
  constraint service_requests_phone_check check (phone is null or char_length(phone) <= 40),
  constraint service_requests_service_check check (char_length(btrim(service_name)) between 1 and 200),
  constraint service_requests_requirements_check check (char_length(btrim(requirements)) between 1 and 5000),
  constraint service_requests_timeline_check check (timeline is null or char_length(timeline) <= 200),
  constraint service_requests_budget_check check (budget is null or char_length(budget) <= 120),
  constraint service_requests_extra_check check (extra is null or char_length(extra) <= 3000)
);

create index if not exists service_requests_status_idx on public.service_requests(status);
create index if not exists service_requests_created_idx on public.service_requests(created_at desc);
create index if not exists service_requests_member_idx on public.service_requests(member_id);

create table if not exists public.service_request_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index if not exists service_request_notes_request_idx
  on public.service_request_notes(request_id, created_at desc);

create or replace function public.service_requests_before_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  if new.status is distinct from old.status then
    new.history := coalesce(old.history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'at', now(), 'by', auth.uid(), 'from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;

drop trigger if exists service_requests_before_update on public.service_requests;
create trigger service_requests_before_update
before update on public.service_requests
for each row execute function public.service_requests_before_update();

alter table public.service_requests enable row level security;
alter table public.service_request_notes enable row level security;

revoke all on public.service_requests from anon, authenticated;
revoke all on public.service_request_notes from anon, authenticated;
grant select, update, delete on public.service_requests to authenticated;
grant select, insert, delete on public.service_request_notes to authenticated;

drop policy if exists "admin read service requests" on public.service_requests;
create policy "admin read service requests" on public.service_requests
  for select to authenticated using (public.has_permission('view_messages'));

drop policy if exists "admin update service requests" on public.service_requests;
create policy "admin update service requests" on public.service_requests
  for update to authenticated
  using (public.has_permission('manage_messages'))
  with check (public.has_permission('manage_messages'));

drop policy if exists "admin delete service requests" on public.service_requests;
create policy "admin delete service requests" on public.service_requests
  for delete to authenticated using (public.has_permission('manage_messages'));

drop policy if exists "admin read request notes" on public.service_request_notes;
create policy "admin read request notes" on public.service_request_notes
  for select to authenticated using (public.has_permission('view_messages'));

drop policy if exists "admin add request notes" on public.service_request_notes;
create policy "admin add request notes" on public.service_request_notes
  for insert to authenticated
  with check (public.has_permission('manage_messages') and author_id = auth.uid());

drop policy if exists "admin delete request notes" on public.service_request_notes;
create policy "admin delete request notes" on public.service_request_notes
  for delete to authenticated using (public.has_permission('manage_messages'));

-- Clients see only safe columns of requests that were verified-linked to them.
-- (A plain table policy cannot hide columns, so a restricted view is used.)
create or replace view public.my_service_requests
with (security_barrier = true) as
  select id, reference, service_name, requirements, timeline, budget,
         status, created_at, updated_at
  from public.service_requests
  where member_id = auth.uid() and public.is_active_member();

revoke all on public.my_service_requests from anon, authenticated;
grant select on public.my_service_requests to authenticated;

-- ---------------------------------------------------------------------
-- 2. Rate limiting for the public enquiry endpoints
--    (Member Accounts' limiter uses a fixed scope whitelist and is left
--    untouched; this is a separate, minimal limiter.)
-- ---------------------------------------------------------------------
create table if not exists public.enquiry_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0
);
alter table public.enquiry_rate_limits enable row level security;
revoke all on public.enquiry_rate_limits from anon, authenticated;

create or replace function public.enquiry_rate_limit_consume(
  p_key_hash text, p_limit integer, p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_row public.enquiry_rate_limits%rowtype;
begin
  insert into public.enquiry_rate_limits(key_hash) values (p_key_hash)
  on conflict (key_hash) do nothing;

  select * into v_row from public.enquiry_rate_limits
  where key_hash = p_key_hash for update;

  if v_row.window_started_at < now() - make_interval(secs => p_window_seconds) then
    update public.enquiry_rate_limits
    set window_started_at = now(), request_count = 1
    where key_hash = p_key_hash;
    return true;
  end if;

  if v_row.request_count >= p_limit then
    return false;
  end if;

  update public.enquiry_rate_limits
  set request_count = request_count + 1
  where key_hash = p_key_hash;
  return true;
end;
$$;

revoke all on function public.enquiry_rate_limit_consume(text, integer, integer) from public, anon, authenticated;
grant execute on function public.enquiry_rate_limit_consume(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------
-- 3. Client projects, milestones, messages, files
-- ---------------------------------------------------------------------
create table if not exists public.client_projects (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.member_profiles(user_id) on delete cascade,
  title text not null,
  service_name text,
  description text,
  status text not null default 'request_received',
  start_date date,
  expected_completion date,
  completed_at timestamptz,
  source_request_id uuid references public.service_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_projects_status_check check (status in (
    'request_received','under_review','awaiting_approval','awaiting_client_materials',
    'in_progress','in_review','completed','cancelled')),
  constraint client_projects_title_check check (char_length(btrim(title)) between 1 and 200),
  constraint client_projects_service_check check (service_name is null or char_length(service_name) <= 200),
  constraint client_projects_description_check check (description is null or char_length(description) <= 5000)
);
create index if not exists client_projects_member_idx on public.client_projects(member_id);
create unique index if not exists client_projects_source_request_uidx
  on public.client_projects(source_request_id) where source_request_id is not null;

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.client_projects(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text check (description is null or char_length(description) <= 1000),
  due_date date,
  completed_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists project_milestones_project_idx on public.project_milestones(project_id, position);

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.client_projects(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('client','admin')),
  kind text not null default 'message' check (kind in ('message','update')),
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  read_by_client_at timestamptz,
  read_by_admin_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists project_messages_project_idx on public.project_messages(project_id, created_at);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.client_projects(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(btrim(file_name)) between 1 and 255),
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes between 0 and 10485760),
  uploader_id uuid not null references auth.users(id) on delete cascade,
  uploader_role text not null check (uploader_role in ('client','admin')),
  created_at timestamptz not null default now(),
  constraint project_files_path_prefix_check check (storage_path like (project_id::text || '/%'))
);
create index if not exists project_files_project_idx on public.project_files(project_id, created_at desc);

create or replace function public.client_projects_before_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  if new.status = 'completed' and old.status is distinct from 'completed' and new.completed_at is null then
    new.completed_at := now();
  end if;
  if new.status <> 'completed' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists client_projects_before_update on public.client_projects;
create trigger client_projects_before_update
before update on public.client_projects
for each row execute function public.client_projects_before_update();

-- Ownership helper used by policies (definer so policies on child tables do
-- not depend on the caller's direct access to client_projects).
create or replace function public.owns_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    public.is_active_member() and exists (
      select 1 from public.client_projects cp
      where cp.id = p_project_id and cp.member_id = auth.uid()),
    false);
$$;
revoke all on function public.owns_project(uuid) from public, anon;
grant execute on function public.owns_project(uuid) to authenticated;

alter table public.client_projects enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_messages enable row level security;
alter table public.project_files enable row level security;

revoke all on public.client_projects, public.project_milestones,
  public.project_messages, public.project_files from anon, authenticated;
grant select, insert, update, delete on public.client_projects to authenticated;
grant select, insert, update, delete on public.project_milestones to authenticated;
grant select, insert, update on public.project_messages to authenticated;
grant select, insert, delete on public.project_files to authenticated;

-- client_projects
drop policy if exists "client read own projects" on public.client_projects;
create policy "client read own projects" on public.client_projects
  for select to authenticated using (member_id = auth.uid() and public.is_active_member());
drop policy if exists "admin read projects" on public.client_projects;
create policy "admin read projects" on public.client_projects
  for select to authenticated using (public.has_permission('view_messages'));
drop policy if exists "admin insert projects" on public.client_projects;
create policy "admin insert projects" on public.client_projects
  for insert to authenticated with check (public.has_permission('manage_messages'));
drop policy if exists "admin update projects" on public.client_projects;
create policy "admin update projects" on public.client_projects
  for update to authenticated
  using (public.has_permission('manage_messages'))
  with check (public.has_permission('manage_messages'));
drop policy if exists "admin delete projects" on public.client_projects;
create policy "admin delete projects" on public.client_projects
  for delete to authenticated using (public.has_permission('manage_messages'));

-- project_milestones
drop policy if exists "client read own milestones" on public.project_milestones;
create policy "client read own milestones" on public.project_milestones
  for select to authenticated using (public.owns_project(project_id));
drop policy if exists "admin read milestones" on public.project_milestones;
create policy "admin read milestones" on public.project_milestones
  for select to authenticated using (public.has_permission('view_messages'));
drop policy if exists "admin write milestones" on public.project_milestones;
create policy "admin write milestones" on public.project_milestones
  for all to authenticated
  using (public.has_permission('manage_messages'))
  with check (public.has_permission('manage_messages'));

-- project_messages
drop policy if exists "client read own messages" on public.project_messages;
create policy "client read own messages" on public.project_messages
  for select to authenticated using (public.owns_project(project_id));
drop policy if exists "client send message" on public.project_messages;
create policy "client send message" on public.project_messages
  for insert to authenticated
  with check (
    public.owns_project(project_id)
    and sender_role = 'client' and kind = 'message'
    and sender_id = auth.uid()
    and read_by_client_at is null and read_by_admin_at is null);
drop policy if exists "admin read messages" on public.project_messages;
create policy "admin read messages" on public.project_messages
  for select to authenticated using (public.has_permission('view_messages'));
drop policy if exists "admin send message" on public.project_messages;
create policy "admin send message" on public.project_messages
  for insert to authenticated
  with check (
    public.has_permission('manage_messages')
    and sender_role = 'admin' and sender_id = auth.uid());
drop policy if exists "admin update messages" on public.project_messages;
create policy "admin update messages" on public.project_messages
  for update to authenticated
  using (public.has_permission('manage_messages'))
  with check (public.has_permission('manage_messages'));

-- project_files
drop policy if exists "client read own files" on public.project_files;
create policy "client read own files" on public.project_files
  for select to authenticated using (public.owns_project(project_id));
drop policy if exists "client add own files" on public.project_files;
create policy "client add own files" on public.project_files
  for insert to authenticated
  with check (public.owns_project(project_id)
    and uploader_role = 'client' and uploader_id = auth.uid());
drop policy if exists "client delete own uploads" on public.project_files;
create policy "client delete own uploads" on public.project_files
  for delete to authenticated
  using (public.owns_project(project_id)
    and uploader_role = 'client' and uploader_id = auth.uid());
drop policy if exists "admin read files" on public.project_files;
create policy "admin read files" on public.project_files
  for select to authenticated using (public.has_permission('view_messages'));
drop policy if exists "admin add files" on public.project_files;
create policy "admin add files" on public.project_files
  for insert to authenticated
  with check (public.has_permission('manage_messages')
    and uploader_role = 'admin' and uploader_id = auth.uid());
drop policy if exists "admin delete files" on public.project_files;
create policy "admin delete files" on public.project_files
  for delete to authenticated using (public.has_permission('manage_messages'));

-- Clients mark admin messages as read through a narrow function (no direct UPDATE).
create or replace function public.mark_project_messages_read(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.owns_project(p_project_id) then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;
  update public.project_messages
  set read_by_client_at = now()
  where project_id = p_project_id and sender_role = 'admin' and read_by_client_at is null;
end;
$$;
revoke all on function public.mark_project_messages_read(uuid) from public, anon;
grant execute on function public.mark_project_messages_read(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Private storage bucket for project files
--    Object path convention: <project_id>/<random>-<file name>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files', 'project-files', false, 10485760,
  array['application/pdf','image/png','image/jpeg','image/webp','text/plain','text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project files client read" on storage.objects;
create policy "project files client read" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-files'
    and public.owns_project(((storage.foldername(name))[1])::uuid));

drop policy if exists "project files client upload" on storage.objects;
create policy "project files client upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-files'
    and public.owns_project(((storage.foldername(name))[1])::uuid));

drop policy if exists "project files client delete own" on storage.objects;
create policy "project files client delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-files'
    and owner_id = auth.uid()::text
    and public.owns_project(((storage.foldername(name))[1])::uuid));

drop policy if exists "project files admin all" on storage.objects;
create policy "project files admin all" on storage.objects
  for all to authenticated
  using (bucket_id = 'project-files' and public.has_permission('manage_messages'))
  with check (bucket_id = 'project-files' and public.has_permission('manage_messages'));

-- ---------------------------------------------------------------------
-- 5. Secure claim of an anonymous request by a verified, active member.
--    The admin creates an expiring single-use token; only its SHA-256 hash
--    is stored. Matching e-mail addresses are never used to link records.
-- ---------------------------------------------------------------------
create table if not exists public.request_claims (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  token_hash bytea not null unique,
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.request_claims enable row level security;
revoke all on public.request_claims from anon, authenticated;

create or replace function public.create_request_claim(p_request_id uuid, p_ttl_hours integer default 72)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_token text;
begin
  if not public.has_permission('manage_messages') then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;
  if p_ttl_hours is null or p_ttl_hours < 1 or p_ttl_hours > 168 then
    raise exception 'Invalid expiry.';
  end if;
  if not exists (select 1 from public.service_requests where id = p_request_id and member_id is null) then
    raise exception 'Request not found or already linked.';
  end if;

  delete from public.request_claims where request_id = p_request_id and claimed_at is null;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.request_claims(request_id, token_hash, created_by, expires_at)
  values (p_request_id, extensions.digest(convert_to(v_token, 'utf8'), 'sha256'),
          auth.uid(), now() + make_interval(hours => p_ttl_hours));
  return v_token;
end;
$$;
revoke all on function public.create_request_claim(uuid, integer) from public, anon;
grant execute on function public.create_request_claim(uuid, integer) to authenticated;

create or replace function public.redeem_request_claim(p_token text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_claim public.request_claims%rowtype;
  v_req public.service_requests%rowtype;
  v_project uuid;
begin
  if auth.uid() is null or not public.is_active_member() then
    raise exception 'An active, verified account is required.' using errcode = '42501';
  end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid or expired link.';
  end if;

  select * into v_claim from public.request_claims
  where token_hash = extensions.digest(convert_to(p_token, 'utf8'), 'sha256')
    and claimed_at is null and expires_at > now()
  for update;
  if not found then
    raise exception 'Invalid or expired link.';
  end if;

  select * into v_req from public.service_requests where id = v_claim.request_id for update;
  if not found or v_req.member_id is not null then
    raise exception 'Invalid or expired link.';
  end if;

  update public.request_claims set claimed_by = auth.uid(), claimed_at = now() where id = v_claim.id;
  update public.service_requests
  set member_id = auth.uid(),
      history = history || jsonb_build_array(jsonb_build_object(
        'at', now(), 'by', auth.uid(), 'event', 'linked_to_member_account'))
  where id = v_req.id;

  insert into public.client_projects(member_id, title, service_name, description, status, source_request_id)
  values (auth.uid(), v_req.service_name, v_req.service_name, v_req.requirements,
          'request_received', v_req.id)
  on conflict (source_request_id) where source_request_id is not null do nothing
  returning id into v_project;

  if v_project is null then
    select id into v_project from public.client_projects where source_request_id = v_req.id;
  end if;
  return v_project;
end;
$$;
revoke all on function public.redeem_request_claim(text) from public, anon;
grant execute on function public.redeem_request_claim(text) to authenticated;
