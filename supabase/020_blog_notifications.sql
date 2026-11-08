-- =====================================================================
-- CUDFIRM 020b — Blog post e-mail notifications (additive)
-- notified_at makes sure each post is e-mailed to subscribers only once.
-- ROLLBACK: alter table public.blog_posts drop column if exists notified_at;
-- =====================================================================
alter table public.blog_posts add column if not exists notified_at timestamptz;

-- Posts that are already live must NOT be mass-mailed when this goes in.
update public.blog_posts set notified_at = now() where status = 'published' and notified_at is null;
