# 24Frame Industry News AWS setup — founder-executed

Dedicated **News** namespace: DynamoDB items + per-source health,
Lambda ingest, EventBridge schedule, SQS DLQ. Not Supabase. Not
Vercel cron. Not Aurora (Vercel Secure Compute / app cutover is not
done). Not title / finance / education / media credentials.

Do **not** create these resources from CI or from this repository.
Names below are the proposed live set for Adam confirm, aligned with
finance isolation in [`finance-aws-setup.md`](finance-aws-setup.md).

Auth stays Supabase Auth. The app **reads** DynamoDB on Home (12) and
`/news` (30-day window). Ingest **writes** DynamoDB. Page requests
never fan out RSS.

## Proposed resources (not created)

| Item | Proposed | Notes |
| --- | --- | --- |
| Account | `405912452061` (E8) | Same account as finance / media. Confirm. |
| Region | `us-west-2` | Same as finance / media. Titles stay `us-east-1`. |
| Prod table | `24frame-news-prod` | Pay-per-request. TTL on `ttl`. |
| Dev table | `24frame-news-dev` | Preview / local. |
| Keys | `pk` + `sk` | Item: `ITEM#<canonical_url>` / `ITEM`. Health: `SOURCE#<id>` / `HEALTH`. |
| GSI1 | `gsi1` on `gsi1pk` + `gsi1sk` | Feed: `FEED` / `<published_at>#<canonical_url>`. Home + `/news` Query. |
| TTL | `ttl` epoch seconds | `published_at + 30 days`. Dynamo expires the row. |
| App IAM user | `24frame-news-app` | `NEWS_AWS_*` Query/Get on the table. Vercel Production + Preview. |
| Ingest role | `24frame-news-ingest` | Lambda trust. Put/Get/Query on the table. |
| Lambda | `24frame-news-ingest` | Node 20. Handler `workers/news/handler.handler`. 60s timeout. |
| EventBridge | `24frame-news-ingest` | `rate(30 minutes)` → Lambda. |
| DLQ | `24frame-news-ingest-dlq` | SQS. Failed invocations only (all live sources failed). |

## Env names (server-only)

Never fall back to `AWS_*` (titles), `FINANCE_AWS_*`, `MEDIA_AWS_*`,
`SES_AWS_*`, or `EDUCATION_AWS_*`. Never `NEXT_PUBLIC_`. Do not commit
secret values.

```
NEWS_AWS_REGION=us-west-2
NEWS_AWS_ACCESS_KEY_ID=
NEWS_AWS_SECRET_ACCESS_KEY=
NEWS_DDB_TABLE=          # 24frame-news-dev / 24frame-news-prod
```

Names live in `.env.example`. Agents do not set values.

## What green looks like

1. EventBridge invoked Lambda in the last 30–60 minutes.
2. CloudWatch log `{ "msg": "news ingest done", "failed": 0, ... }`.
3. Home News rail shows up to 12 rows from Dynamo (not a live RSS pull).
4. `/news` lists the same cards inside 30 days.
5. DLQ depth is 0.

## Ops

**Add a source.** Append one row to `NEWS_SOURCES` in `src/lib/news.ts`
(id, label, verified feed URL, `enabled: true`). Do not invent a feed.

**Kill a source.** Set `enabled: false` on that const row (deploy), or
Put `SOURCE#<id>` / `HEALTH` with `enabled=false` (no deploy). Ingest
skips it; existing rows age out via TTL / the 30-day query window.

**Trigger ingest.** After founder apply:

```
aws lambda invoke --region us-west-2 \
  --function-name 24frame-news-ingest /tmp/news-ingest.json
```

Or from repo root (needs `NEWS_AWS_*` + `NEWS_DDB_TABLE`):

```
pnpm exec tsx workers/news/handler.ts
```

## Founder steps (after Adam confirms names)

1. Create `24frame-news-dev` and `24frame-news-prod` in `us-west-2` in
   account `405912452061`. Pay-per-request. Attribute definitions:
   `pk` (S), `sk` (S), `gsi1pk` (S), `gsi1sk` (S). GSI `gsi1`.
   TTL attribute `ttl`. Point-in-time recovery on. Tag as News.
2. Create IAM user `24frame-news-app` with Query/Get on the table.
   Put Vercel `NEWS_AWS_*` + `NEWS_DDB_TABLE` (Production = prod,
   Preview = dev). Server-only.
3. Create Lambda role `24frame-news-ingest` (trust
   `lambda.amazonaws.com`) with Put/Get/Query + CloudWatch logs.
4. Package `workers/news/handler.ts` (repo `tsx` + `@/` via a Lambda
   bundle, or a container image from repo root). Timeout 60s.
   Env: `NEWS_AWS_REGION`, `NEWS_DDB_TABLE`. Prefer the execution
   role over static keys on the function.
5. Create SQS `24frame-news-ingest-dlq`. Attach as Lambda DLQ.
6. Create EventBridge rule `24frame-news-ingest` `rate(30 minutes)`
   targeting the function. Enable. Do not create this from CI.

Do **not** create these from this PR.
