# 24Frame finance worker

Isolated AWS compute for finance ingest, close apply, and statement export.

- Account `405912452061` / `us-west-2`. Do not reuse Royalogic or Watershed.
- Live buckets: `24frame-finance-dev`, `24frame-finance-prod`.
- Credentials: `FINANCE_AWS_*` / `S3_FINANCE_*` only. Task role `24frame-finance-worker`.
- IAM must not allow write to title, media, or avatar buckets.
- Relational SoT: prefer `AURORA_DATABASE_URL` on `frame-aurora-dev` / `frame-aurora-prod` when set and valid. Until Aurora cutover, set `FINANCE_DATABASE_URL` to the survivor Postgres URL. Never put a survivor pooler host in `AURORA_DATABASE_URL`. Auth stays Supabase Auth.

Entry: `workers/finance/run.ts` polls `finance_jobs` (`status = queued`), builds deps, and calls `processFinanceJob` in `src/lib/finance-worker-run.ts`. Idle (no jobs) exits 0.

EventBridge rule `24frame-finance-poll` is **live** and runs task-def `24frame-finance-worker:3`. Do not disable from CI or this image.

Founder-executed apply: [`docs/infra/finance-aws-setup.md`](../../docs/infra/finance-aws-setup.md).

## Env (server-only)

Never `NEXT_PUBLIC_`. Never fall back to `AWS_*` or `MEDIA_AWS_*`. Values stay out of the repo.

```
FINANCE_AWS_REGION=us-west-2
S3_FINANCE_BUCKET=24frame-finance-dev
FINANCE_AWS_ACCESS_KEY_ID=          # optional when the ECS task role is attached
FINANCE_AWS_SECRET_ACCESS_KEY=      # optional when the ECS task role is attached
FINANCE_DATABASE_URL=               # interim survivor Postgres (sslmode=require)
AURORA_DATABASE_URL=                # prefer when set; refused if it looks like survivor/RL
```

## CoS: build, push digest, register a new revision

Live schedule is already on `:3`. Do this when shipping a new image. Do not push images from an unauthenticated cloud agent.

```bash
# From repo root, after aws sso / ecr login to 405912452061 us-west-2.
# Install COPYs pnpm-workspace.yaml so pnpm 11 overrides/allowBuilds match the lockfile.
REPO=405912452061.dkr.ecr.us-west-2.amazonaws.com/24frame-finance-worker
aws ecr get-login-password --region us-west-2 \
  | docker login --username AWS --password-stdin 405912452061.dkr.ecr.us-west-2.amazonaws.com

docker build -f workers/finance/Dockerfile -t "$REPO:candidate" .
docker push "$REPO:candidate"

DIGEST=$(aws ecr describe-images --region us-west-2 \
  --repository-name 24frame-finance-worker \
  --image-ids imageTag=candidate \
  --query 'imageDetails[0].imageDigest' --output text)
echo "$REPO@$DIGEST"
```

Live task-def is `24frame-finance-worker:3` (digest image, not `:pending`). To ship a new image, register a **new** revision pinned to that digest. Cluster `24frame-finance`, worker SG `sg-001080a8a798d5cb6`, private subnets in `vpc-07f0141dafa80a408`. Log group `/ecs/24frame-finance`.

EventBridge `24frame-finance-poll` already has the RunTask target. Do not disable it from CI. Point a new revision at the same rule after founder smoke.

Do not invent a second money path. Close / export / ingest compute stays in this worker + `apply_sales_import` / `apply_finance_close` / `apply_finance_export`.
