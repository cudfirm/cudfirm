-- CUDFIRM Phase 5.1 — Message Management
-- Safe, additive migration. Keeps legacy is_read/is_archived columns.

alter table messages
  add column if not exists status text not null default 'unread',
  add column if not exists is_important boolean not null default false,
  add column if not exists replied_at timestamptz,
  add column if not exists archived_at timestamptz;

-- Preserve existing message state.
update messages
set status = case
  when is_archived then 'archived'
  when is_read then 'read'
  else 'unread'
end
where status is null
   or status not in ('unread', 'read', 'important', 'replied', 'archived', 'spam');

-- Existing rows receive the correct state even when the new column was
-- added with its default before this migration reached the UPDATE above.
update messages set status = 'archived' where is_archived = true and status = 'unread';
update messages set status = 'read' where is_read = true and is_archived = false and status = 'unread';

alter table messages drop constraint if exists messages_status_check;
alter table messages
  add constraint messages_status_check
  check (status in ('unread', 'read', 'important', 'replied', 'archived', 'spam'));

create index if not exists messages_status_idx on messages(status);
create index if not exists messages_created_at_idx on messages(created_at desc);

-- Keep the legacy booleans synchronized so older dashboard/layout code
-- remains compatible during the transition.
create or replace function sync_message_workflow_fields()
returns trigger
language plpgsql
as $$
begin
  new.is_read := new.status <> 'unread';
  new.is_archived := new.status in ('archived', 'spam');
  new.is_important := new.status = 'important';

  if new.status = 'replied' and new.replied_at is null then
    new.replied_at := now();
  elsif new.status <> 'replied' then
    new.replied_at := null;
  end if;

  if new.status = 'archived' and new.archived_at is null then
    new.archived_at := now();
  elsif new.status <> 'archived' then
    new.archived_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists messages_sync_workflow_fields on messages;
create trigger messages_sync_workflow_fields
before insert or update of status on messages
for each row execute function sync_message_workflow_fields();

-- Normalize all rows through the trigger once.
update messages set status = status;
