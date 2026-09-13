# 24Frame finance worker — Fargate. Isolated IAM. Do not copy title/media images.
# Build from repo root after Adam applies the finance bucket + OIDC role.
FROM node:22-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod=false
COPY src/lib/finance*.ts src/lib/s3-finance.ts src/lib/finance-cloudfront.ts src/lib/product.ts src/lib/signing-window.ts ./src/lib/
COPY workers/finance ./workers/finance
# Live poll is not started here. Wire EventBridge → this image after IAM exists.
CMD ["node", "--import", "tsx", "workers/finance/run.ts"]
