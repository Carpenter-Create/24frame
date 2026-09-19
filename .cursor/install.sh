#!/usr/bin/env bash
# Cloud Agent install step for @24frame/dashboard (+ @24frame/mobile workspace).
# Idempotent: safe to re-run. Runs after the repository is checked out.
set -euo pipefail

cd "$(dirname "$0")/.."

# Install dependencies for the root Next.js app and the Expo mobile workspace,
# using the committed lockfile so versions are deterministic.
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

# Seed a NON-SECRET placeholder .env.local so `pnpm build` and `pnpm dev` work
# without real credentials. `src/lib/s3.ts` throws at module load (failing the
# build) when AWS_REGION / S3_BUCKET are unset, and the Supabase clients read the
# NEXT_PUBLIC_* names. These are dummy values only — never real secrets. `.env*`
# is gitignored. Replace with real values for any live integration or run
# `pnpm exec supabase start` for a local backend. Only created when absent so a
# developer's own .env.local is never overwritten.
if [ ! -f .env.local ]; then
  cat > .env.local <<'EOF'
# Local Cloud Agent placeholder env — NON-SECRET dummy values only.
# Auto-created by .cursor/install.sh so the app builds/runs without real
# credentials. Never commit real secrets; `.env*` is gitignored.

# Supabase (dummy — pages render; live data/auth need a real project or `supabase start`)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key

# Cloudflare Turnstile — Cloudflare's documented always-passes TEST keys (public)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# AWS (dummy) — src/lib/s3.ts throws at module load if unset, failing `next build`.
AWS_REGION=us-east-1
S3_BUCKET=placeholder-bucket
EOF
  echo "[install] created placeholder .env.local"
else
  echo "[install] .env.local already present — left unchanged"
fi

echo "[install] done"
