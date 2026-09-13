# 24Frame finance worker

Isolated AWS compute for finance ingest, close apply, and statement export.

- Account `405912452061` / `us-west-2`. Do not reuse Royalogic or Watershed.
- Live buckets: `24frame-finance-dev`, `24frame-finance-prod`.
- Credentials: `FINANCE_AWS_*` / `S3_FINANCE_*` only. Task role `24frame-finance-worker`.
- IAM must not allow write to title, media, or avatar buckets.
- Relational SoT: prefer `AURORA_DATABASE_URL` on `frame-aurora-dev` / `frame-aurora-prod` when set and valid. Until Aurora cutover, set `FINANCE_DATABASE_URL` to the survivor Postgres URL. Never put a survivor pooler host in `AURORA_DATABASE_URL`. Auth stays Supabase Auth.

Entry: `workers/finance/run.ts` polls `finance_jobs` (`status = queued`), builds deps, and calls `processFinanceJob` in `src/lib/finance-worker-run.ts`. Idle (no jobs) exits 0.

EventBridge rule `24frame-finance-poll` exists and stays **DISABLED** until founder enables it. Do not enable from CI or this image.

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

## CoS: build, push digest, smoke on **dev**

Do this after merge. Do not push images from an unauthenticated cloud agent.

```bash
# From repo root, after aws sso / ecr login to 405912452061 us-west-2
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

Register a **new** task-definition revision of `24frame-finance-worker` whose image is that digest (not `:pending`). First smoke: `S3_FINANCE_BUCKET=24frame-finance-dev` + `FINANCE_DATABASE_URL` (survivor). Cluster `24frame-finance`, worker SG `sg-001080a8a798d5cb6`, private subnets in `vpc-07f0141dafa80a408`. Log group `/ecs/24frame-finance`.

EventBridge target: add an ECS RunTask target on `24frame-finance-poll` with a role that can `ecs:RunTask` + `iam:PassRole` for `24frame-finance-worker` and `24frame-finance-worker-execution`. **Leave the rule disabled** until the digest task runs clean on **dev**. Founder enables the schedule after that smoke.

Do not invent a second money path. Close / export / ingest compute stays in this worker + `apply_sales_import` / `apply_finance_close` / `apply_finance_export`.
