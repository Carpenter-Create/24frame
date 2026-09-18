# 24Frame Industry News AWS setup — founder-executed

Dedicated **News** namespace: DynamoDB items + per-source health,
Lambda ingest, EventBridge schedule, SQS DLQ. Not Supabase. Not
Vercel cron. Not Aurora (Vercel Secure Compute / app cutover is not
done). Not title / finance / education / media credentials.

Do **not** create these resources from CI or from this repository.
Names below are the proposed live set for Adam confirm, aligned with
finance isolation in [`finance-aws-setup.md`](finance-aws-setup.md).

Auth stays Supabase Auth. The app **reads** DynamoDB on Home (15) and
`/home/news` (90-day window; `/news` permanently redirects). Ingest
**writes** DynamoDB. Page requests never fan out RSS. RSS media /
enclosure first; when `image_url` is null, ingest OG-scrapes the
article (`og:image` / `twitter:image`, 12s timeout, desktop Chrome UA,
1.5MB HTML cap, fail-soft). Override the cap with server-only
`NEWS_OG_MAX_BYTES` (bytes, positive integer). Per-source CloudWatch
counters: `ogAttempted`, `ogFilled`, `ogMiss`.

## Proposed resources (not created)

| Item | Proposed | Notes |
| --- | --- | --- |
| Account | `405912452061` (E8) | Same account as finance / Aurora. Confirm. |
| Region | `us-west-2` | Same as finance / Aurora. Titles stay `us-east-1`. |
| Prod table | `24frame-news-prod` | Pay-per-request. TTL on `ttl`. |
| Dev table | `24frame-news-dev` | Preview / local. |
| Keys | `pk` + `sk` | Item: `ITEM#<canonical_url>` / `ITEM`. Health: `SOURCE#<id>` / `HEALTH`. |
| GSI1 | `gsi1` on `gsi1pk` + `gsi1sk` | Feed: `FEED` / `<published_at>#<canonical_url>`. Home + `/home/news` Query. |
| TTL | `ttl` epoch seconds | `published_at + 90 days`. Dynamo expires the row. |
| App IAM user | `24frame-news-app` | `NEWS_AWS_*` Query/Get on the table. Vercel Production + Preview. |
| Ingest role | `24frame-news-ingest` | Lambda trust. Put/Get/Query on the table. |
| Lambda | `24frame-news-ingest` | Node 20+. Handler `workers/news/handler.handler`. 60s timeout. |
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
NEWS_OG_MAX_BYTES=       # optional; default 1500000. Lambda only. Never NEXT_PUBLIC_.
```

Names live in `.env.example`. Agents do not set values.

App path (`createNewsAppStore`) requires every `NEWS_AWS_*` name plus
`NEWS_DDB_TABLE` so it cannot silently use the title/media/finance
default chain. Lambda (`createNewsIngestStore`) needs
`NEWS_AWS_REGION` + `NEWS_DDB_TABLE`; static keys are optional when
the execution role is attached.

## What Adam must create (console / CLI)

Resources are **not** provisioned by this PR. After names are
confirmed, founder applies in `405912452061` / `us-west-2`:

1. **DynamoDB** `24frame-news-dev` and `24frame-news-prod`.
   Pay-per-request. Attribute definitions: `pk` (S), `sk` (S),
   `gsi1pk` (S), `gsi1sk` (S). GSI `gsi1` (`gsi1pk` + `gsi1sk`).
   TTL attribute `ttl` enabled. Point-in-time recovery on. Tag as
   News. Do not reuse a finance/education/media table.
2. **IAM user** `24frame-news-app` with Query/Get (and GetItem) on
   the chosen table. Put Vercel `NEWS_AWS_*` + `NEWS_DDB_TABLE`
   (Production = prod, Preview = dev). Server-only. Never
   `NEXT_PUBLIC_`.
3. **IAM role** `24frame-news-ingest` (trust `lambda.amazonaws.com`)
   with `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:Query` on
   the table + GSI, plus CloudWatch logs. No S3. No finance/education
   tables. No `sts:AssumeRole` into other product roles.
4. **Lambda** `24frame-news-ingest`. Package
   `workers/news/handler.ts` (repo `tsx` + `@/` via a Lambda bundle,
   or a container image from repo root). Timeout 60s. Memory 256 MB
   is enough. Env: `NEWS_AWS_REGION=us-west-2`,
   `NEWS_DDB_TABLE=24frame-news-prod` (or `-dev`). Optional
   `NEWS_OG_MAX_BYTES` (default 1500000). Prefer the
   execution role over static keys on the function.
5. **SQS** `24frame-news-ingest-dlq`. Attach as the Lambda
   asynchronous invocation DLQ (or EventBridge target DLQ).
6. **EventBridge** rule `24frame-news-ingest` `rate(30 minutes)`
   targeting the function. Enable. Retry policy + DLQ on the target.

Least-privilege sketches (founder fills ARNs; do not apply from CI):

```
# 24frame-news-app — Vercel read
dynamodb:GetItem, dynamodb:Query
  arn:aws:dynamodb:us-west-2:405912452061:table/24frame-news-prod
  arn:aws:dynamodb:us-west-2:405912452061:table/24frame-news-prod/index/gsi1

# 24frame-news-ingest — Lambda write + health
dynamodb:GetItem, dynamodb:PutItem, dynamodb:Query
  arn:aws:dynamodb:us-west-2:405912452061:table/24frame-news-prod
  arn:aws:dynamodb:us-west-2:405912452061:table/24frame-news-prod/index/gsi1
```

Do **not** create these from this PR.

## What green looks like

1. EventBridge invoked Lambda in the last 30–60 minutes.
2. CloudWatch log `{ "msg": "news ingest done", "failed": 0, ... }`.
3. Home News rail shows up to 15 rows from Dynamo (not a live RSS pull).
4. `/home/news` lists dense history rows inside 90 days (`/news` → `/home/news`).
5. DLQ depth is 0.

## Ops

**Add a source.** Append one row to `NEWS_SOURCES` in `src/lib/news.ts`
(id, label, verified feed URL, `enabled: true`). Do not invent a feed.

**Kill a source.** Set `enabled: false` on that const row (deploy), or
Put `SOURCE#<id>` / `HEALTH` with `enabled=false` (no deploy). Ingest
skips it; existing rows age out via TTL / the 90-day query window.

**After merge, MUST redeploy Lambda `24frame-news-ingest`.**
Merge ≠ live for ingest. Code on `main` does not run until founder /
CoS `esbuild` + `aws lambda update-function-code`. Do not create or
mutate AWS from CI. Agents do not run this.

```
mkdir -p /tmp/news-ingest
pnpm exec esbuild workers/news/handler.ts \
  --bundle --platform=node --format=cjs --target=node20 \
  --outfile=/tmp/news-ingest/index.js \
  --alias:@=./src
(cd /tmp/news-ingest && zip function.zip index.js)
aws lambda update-function-code --region us-west-2 \
  --function-name 24frame-news-ingest \
  --zip-file fileb:///tmp/news-ingest/function.zip
```

OG per-article timeout is 12s (concurrency 4). HTML cap is 1.5MB
(`NEWS_OG_MAX_BYTES` env override on the function). Function timeout
stays 60s until founder bumps it after a CloudWatch timeout.

**Trigger ingest.** After founder apply:

```
aws lambda invoke --region us-west-2 \
  --function-name 24frame-news-ingest /tmp/news-ingest.json
```

Or from repo root (needs `NEWS_AWS_REGION` + `NEWS_DDB_TABLE`; keys
optional when using a role):

```
pnpm exec tsx workers/news/handler.ts
```

**Image backfill (one-shot).** Existing rows that ingested before OG
scrape (Hollywood Reporter grey plates) pick up `image_url` on the
next EventBridge run. Dynamo `PutItem` overwrites the item; ingest
re-parses the live feed and OG-scrapes only when RSS still has no
image. No console row edit. To run once without waiting for cron,
use the invoke above. A scrape timeout or miss leaves the grey plate
— it does not fail the source.

## Still founder-gated

1. Creating the table, Lambda, EventBridge rule, DLQ, and IAM.
2. Setting Vercel `NEWS_AWS_*` / `NEWS_DDB_TABLE`.
3. First live ingest smoke and DLQ check.

Do **not** create these from CI.
