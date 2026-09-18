# 24Frame News ingest worker

Isolated AWS compute for Industry News RSS ingest.

- Account `405912452061` / `us-west-2`. Do not reuse title, media, finance, or education credentials.
- Proposed table: `24frame-news-dev` / `24frame-news-prod` (not created — founder apply).
- Credentials: `NEWS_AWS_REGION` + `NEWS_DDB_TABLE`. Static `NEWS_AWS_*` keys optional when the Lambda role is attached.
- EventBridge rule `24frame-news-ingest` `rate(30 minutes)` → this handler. DLQ `24frame-news-ingest-dlq`.
- Not Supabase. Not Vercel cron. Not Aurora.

Entry: `workers/news/handler.ts` calls `ingestNewsFeeds` in `src/lib/news-ingest.ts`. Fail-soft per source. RSS image first; OG-scrape the article when `image_url` is null (4s, fail-soft). Throws only when every live source failed so EventBridge can retry / DLQ.

Founder-executed apply: [`docs/infra/news-aws-setup.md`](../../docs/infra/news-aws-setup.md). Do not create AWS from CI.

## Env (server-only)

Never `NEXT_PUBLIC_`. Never fall back to `AWS_*`, `FINANCE_AWS_*`, `MEDIA_AWS_*`, `SES_AWS_*`, or `EDUCATION_AWS_*`. Values stay out of the repo.

```
NEWS_AWS_REGION=us-west-2
NEWS_DDB_TABLE=24frame-news-dev
NEWS_AWS_ACCESS_KEY_ID=          # optional when the Lambda role is attached
NEWS_AWS_SECRET_ACCESS_KEY=      # optional when the Lambda role is attached
```

## Local invoke (after founder apply)

```
pnpm exec tsx workers/news/handler.ts
```
