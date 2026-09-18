# News ingest — Vercel cron

United scheduler: the same `vercel.json` `crons` array as
`/api/cron/transcode-poll` and `/api/cron/title-s3-purge`. Not EventBridge.
Not a second clock.

| | |
| --- | --- |
| Route | `GET /api/cron/news-ingest` |
| Schedule | `*/30 * * * *` (every 30 minutes) |
| Auth | `Authorization: Bearer $CRON_SECRET` — refuse if unset |
| Writes | service role → `news_items` upsert + 30-day purge; `news_source_health` |
| Reads | signed-in user client, authenticated SELECT (courses-shaped RLS) |
| Production only | Vercel invokes crons against Production. Preview is silent. |

Allowlist SoT: `NEWS_SOURCES` in `src/lib/news.ts` (verified 2026-09-18).
No HTML body scrape. Title, link, published time, optional feed
media/enclosure image.

## Add a source

1. Confirm the feed URL yourself. Do not invent one.
2. Append one row to `NEWS_SOURCES` (`id`, `label`, `feedUrl`, `enabled: true`).
3. Insert a `news_source_health` row for that `source` (or let the next
   successful ingest upsert it).
4. Deploy. Do not add a parallel scheduler.

## Kill a source

- Deploy: set `enabled: false` on that const row.
- No deploy: `update news_source_health set enabled = false where source = '<id>'`.
  Ingest skips it. Existing rows age out via the 30-day purge / query window.

## Trigger ingest

Vercel production cron, or:

```
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://<production-host>/api/cron/news-ingest
```

Unset `CRON_SECRET` is 401. Wrong secret is 401. The route never fails open.

## What green looks like

1. Production cron invoked in the last 30–60 minutes.
2. JSON `{ "failed": 0, "skipped": 0, ... }` and HTTP 200.
3. `news_source_health.last_success_at` is fresh; `last_error` is null.
4. Home News rail shows up to 12 rows from `news_items` (not a live RSS pull).
5. `/news` lists the same cards inside 30 days. Older rows are purged.

## Founder apply

`supabase/migrations/20260918180000_news_items.sql` is written, not applied.
Founder applies after merge. This PR does not run SQL.

`CRON_SECRET` is the existing Production secret used by the other crons.
Do not invent a News-specific secret.
