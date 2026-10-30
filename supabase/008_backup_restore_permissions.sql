-- CUDFIRM Phase 6.1 — Backup & Restore permissions
-- Adds only the authenticated write permissions required by the
-- dashboard restore tool. Safe to re-run.

-- Subscriber restore may insert archived/unsubscribed/bounced rows.
-- The existing public signup policy remains restricted to active/footer.
drop policy if exists "authenticated insert subscribers" on public.subscribers;
create policy "authenticated insert subscribers" on public.subscribers
  for insert to authenticated
  with check (auth.uid() is not null);

-- Activity Log is normally append-only, but restoring a selected
-- Activity Log backup in Replace mode must be able to clear old rows.
drop policy if exists "authenticated delete activity_log" on public.activity_log;
create policy "authenticated delete activity_log" on public.activity_log
  for delete to authenticated
  using (auth.uid() is not null);
