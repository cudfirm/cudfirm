-- CUDFIRM Phase 5.2 — Subscriber Management
-- Safe, additive migration. Existing subscribers and public signup remain intact.

alter table public.subscribers
  add column if not exists status text,
  add column if not exists source text,
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists archived_at timestamptz;

update public.subscribers
set status = case when coalesce(is_active, true) then 'active' else 'unsubscribed' end
where status is null;

update public.subscribers
set source = 'footer'
where source is null or btrim(source) = '';

alter table public.subscribers
  alter column status set default 'active',
  alter column status set not null,
  alter column source set default 'footer',
  alter column source set not null;

alter table public.subscribers
  drop constraint if exists subscribers_status_check;

alter table public.subscribers
  add constraint subscribers_status_check
  check (status in ('active', 'unsubscribed', 'bounced', 'archived'));

create index if not exists subscribers_status_idx on public.subscribers(status);
create index if not exists subscribers_created_at_idx on public.subscribers(created_at desc);

-- Keep the legacy is_active flag synchronized for backward compatibility.
create or replace function public.sync_subscriber_status_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is null then
    new.status := case when coalesce(new.is_active, true) then 'active' else 'unsubscribed' end;
  end if;

  new.is_active := (new.status = 'active');

  if new.status = 'unsubscribed' and new.unsubscribed_at is null then
    new.unsubscribed_at := now();
  elsif new.status <> 'unsubscribed' then
    new.unsubscribed_at := null;
  end if;

  if new.status = 'bounced' and new.bounced_at is null then
    new.bounced_at := now();
  elsif new.status <> 'bounced' then
    new.bounced_at := null;
  end if;

  if new.status = 'archived' and new.archived_at is null then
    new.archived_at := now();
  elsif new.status <> 'archived' then
    new.archived_at := null;
  end if;

  if new.source is null or btrim(new.source) = '' then
    new.source := 'footer';
  end if;

  return new;
end;
$$;

drop trigger if exists subscribers_sync_status_fields on public.subscribers;
create trigger subscribers_sync_status_fields
before insert or update on public.subscribers
for each row execute function public.sync_subscriber_status_fields();

-- Preserve public newsletter signup and allow authenticated admins to manage records.
alter table public.subscribers enable row level security;

drop policy if exists "public subscribe" on public.subscribers;
create policy "public subscribe" on public.subscribers
  for insert to anon, authenticated
  with check (
    status = 'active'
    and is_active = true
    and coalesce(source, 'footer') = 'footer'
  );

drop policy if exists "authenticated read subscribers" on public.subscribers;
create policy "authenticated read subscribers" on public.subscribers
  for select to authenticated
  using (auth.uid() is not null);

drop policy if exists "authenticated update subscribers" on public.subscribers;
create policy "authenticated update subscribers" on public.subscribers
  for update to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "authenticated delete subscribers" on public.subscribers;
create policy "authenticated delete subscribers" on public.subscribers
  for delete to authenticated
  using (auth.uid() is not null);
