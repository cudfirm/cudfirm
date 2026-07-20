-- ============================================================================
-- CUDFIRM — Promote First Administrator If Needed
-- Run only when 03_verify_fresh_install.sql shows zero active Super Admins.
-- Replace CHANGE_ME_ADMIN_EMAIL with the existing Auth user's exact email.
-- ============================================================================

do $$
declare
  v_admin_email text := 'CHANGE_ME_ADMIN_EMAIL';
  v_user_id uuid;
begin
  if position('CHANGE_ME' in v_admin_email) > 0 or position('@' in v_admin_email) = 0 then
    raise exception 'Replace CHANGE_ME_ADMIN_EMAIL before running this file.';
  end if;

  if exists (
    select 1 from public.user_profiles
    where role = 'super_admin' and is_active = true
  ) then
    raise exception 'An active Super Admin already exists. No change was made.';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(v_admin_email)
  limit 1;

  if v_user_id is null then
    raise exception 'No Auth user exists with email %.', v_admin_email;
  end if;

  insert into public.user_profiles (
    id, email, full_name, role, is_active, created_at, updated_at
  )
  select u.id,
         u.email,
         coalesce(u.raw_user_meta_data->>'full_name', ''),
         'super_admin',
         true,
         coalesce(u.created_at, now()),
         now()
  from auth.users u
  where u.id = v_user_id
  on conflict (id) do update
    set email = excluded.email,
        role = 'super_admin',
        is_active = true,
        updated_at = now();
end $$;

select id, email, full_name, role, is_active, created_at
from public.user_profiles
where role = 'super_admin' and is_active = true
order by created_at;
