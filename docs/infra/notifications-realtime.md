# Notifications Realtime — founder Dashboard click

In-app Social alerts (`new_follower` today; any later house Social
kind that writes `recipient_user_id`) update the Notifications peek
and list over **existing** Supabase Realtime. No new paid add-on.
No email send. The app subscribes to `public.notifications` INSERT
rows where `recipient_user_id = auth.uid()`.

RLS already limits those rows to the recipient (`#555` follow
alerts). Realtime still only delivers rows the session can SELECT.

## Adam — one click if the table is not in the publication

Hosted project already has Realtime (DM `realtime.send` is live).
`postgres_changes` on `notifications` also needs the table in the
`supabase_realtime` publication. If peek does not move on a new
follow, this toggle is the missing step.

1. Supabase Dashboard → **Table Editor** → `notifications`.
2. Enable **Realtime** on that table (the table-level switch).
3. Confirm under **Database → Publications → `supabase_realtime`**
   that `public.notifications` is listed.

Local Studio (`supabase start`): same publication. `[realtime]` is
already `enabled = true` in `supabase/config.toml`.

INSERT-only. Default replica identity is enough. Do not set
REPLICA IDENTITY FULL for this slice.

## Equivalent SQL (founder-applied only)

Do **not** apply from CI or from an agent. Same effect as the
Dashboard toggle:

```sql
do $$
begin
  if to_regclass('public.notifications') is null then
    raise exception 'notifications missing';
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
```

Rollback: `alter publication supabase_realtime drop table public.notifications;`

## What the app does

- SoT: `src/lib/notifications-realtime.ts`
- Channel: `notifications:recipient:{auth.uid()}`
- Filter: `recipient_user_id=eq.{auth.uid()}`
- Prefs: write path (`notify_new_follower`) skips when in-app is
  off. Client accepts only Social house kinds.
- Peek + list share one ref-counted channel. Unsubscribe on unmount.
- No `create_notification` / Resend / SES from this path.
