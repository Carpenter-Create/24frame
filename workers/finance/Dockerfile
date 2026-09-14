# 24Frame finance worker — Fargate. Isolated IAM. Do not copy title/media images.
# Build from repo root. tsconfig.json is required so tsx can resolve @/ imports.
# pnpm-workspace.yaml is required so pnpm 11 overrides/allowBuilds match the lockfile.
FROM node:22-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod=false
COPY tsconfig.json ./
COPY src/lib ./src/lib
COPY workers/finance ./workers/finance
# tsx runs TypeScript in-place. pg is the worker Postgres client.
# EventBridge rule 24frame-finance-poll is live on 24frame-finance-worker:3.
CMD ["node", "--import", "tsx", "workers/finance/run.ts"]
