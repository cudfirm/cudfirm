-- ============================================================
-- CUDFIRM CMS — Migration 016
-- Shared extension-module permission foundation
-- Run after 015_about_contact_content.sql.
-- Do not rewrite after execution; use a later corrective migration.
-- ============================================================

begin;

create table if not exists public.module_permissions (
  module_id text not null,
  permission_id text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (module_id, permission_id),
  constraint module_permissions_module_id_check
    check (module_id ~ '^[a-z0-9-]+$'),
  constraint module_permissions_permission_id_check
    check (permission_id ~ '^[a-z][a-z0-9_]*$'),
  constraint module_permissions_description_length_check
    check (char_length(description) <= 500)
);

create table if not exists public.module_role_permissions (
  module_id text not null,
  role text not null,
  permission_id text not null,
  created_at timestamptz not null default now(),
  primary key (module_id, role, permission_id),
  constraint module_role_permissions_role_check
    check (role in ('super_admin','admin','editor','viewer')),
  constraint module_role_permissions_permission_fk
    foreign key (module_id, permission_id)
    references public.module_permissions(module_id, permission_id)
    on update cascade on delete cascade
);

create index if not exists module_permissions_module_idx
  on public.module_permissions(module_id);
create index if not exists module_role_permissions_role_idx
  on public.module_role_permissions(role, module_id);

create or replace function public.set_module_permission_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_module_permission_updated_at()
from public, anon, authenticated;

drop trigger if exists module_permissions_updated_at on public.module_permissions;
create trigger module_permissions_updated_at
before update on public.module_permissions
for each row execute function public.set_module_permission_updated_at();

-- Additive module permission helper. This intentionally does not modify
-- current_app_role() or has_permission(...), which remain protected core helpers.
create or replace function public.has_module_permission(
  p_module_id text,
  p_permission_id text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case
    when public.current_app_role() is null then false
    when not exists (
      select 1
      from public.module_permissions mp
      where mp.module_id = p_module_id
        and mp.permission_id = p_permission_id
    ) then false
    when public.current_app_role() = 'super_admin' then true
    else exists (
      select 1
      from public.module_role_permissions mrp
      where mrp.module_id = p_module_id
        and mrp.permission_id = p_permission_id
        and mrp.role = public.current_app_role()
    )
  end;
$$;

revoke all on function public.has_module_permission(text, text)
from public, anon;
grant execute on function public.has_module_permission(text, text)
to authenticated;

alter table public.module_permissions enable row level security;
alter table public.module_permissions force row level security;
alter table public.module_role_permissions enable row level security;
alter table public.module_role_permissions force row level security;

-- Active CMS users may read the declared permission catalogue. Only Super Admin
-- may alter module permission declarations or role mappings.
drop policy if exists "active cms users read module permissions" on public.module_permissions;
create policy "active cms users read module permissions"
on public.module_permissions for select to authenticated
using (public.current_app_role() is not null);

drop policy if exists "super admin manages module permissions" on public.module_permissions;
create policy "super admin manages module permissions"
on public.module_permissions for all to authenticated
using (public.has_permission('manage_users'))
with check (public.has_permission('manage_users'));

drop policy if exists "active cms users read module role permissions" on public.module_role_permissions;
create policy "active cms users read module role permissions"
on public.module_role_permissions for select to authenticated
using (public.current_app_role() is not null);

drop policy if exists "super admin manages module role permissions" on public.module_role_permissions;
create policy "super admin manages module role permissions"
on public.module_role_permissions for all to authenticated
using (public.has_permission('manage_users'))
with check (public.has_permission('manage_users'));

revoke all on table public.module_permissions, public.module_role_permissions
from anon, authenticated;
grant select, insert, update, delete
on public.module_permissions, public.module_role_permissions
to authenticated;

commit;
