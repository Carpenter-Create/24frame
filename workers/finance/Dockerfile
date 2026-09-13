# 24Frame finance worker — Fargate. Isolated IAM. Do not copy title/media images.
# Build from repo root. tsconfig.json is required so tsx can resolve @/ imports.
FROM node:22-slim
WORKDIR /app
# Workspace file is required: allowBuilds.esbuild (tsx) and lockfile importers.
# Mobile package.json satisfies the workspace importer; --filter keeps Expo out.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mobile/package.json ./apps/mobile/package.json
RUN corepack enable && pnpm install --frozen-lockfile --prod=false --filter @24frame/dashboard
COPY tsconfig.json ./
COPY src/lib ./src/lib
COPY workers/finance ./workers/finance
# tsx runs TypeScript in-place. pg is the worker Postgres client.
# EventBridge rule 24frame-finance-poll stays DISABLED until founder enables it.
CMD ["node", "--import", "tsx", "workers/finance/run.ts"]
