import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { ingestNewsFeeds } from "@/lib/news-ingest";
import { createAdminClient } from "@/lib/supabase/admin";

// Scheduled News ingest. Same CRON_SECRET pattern as transcode-poll and
// title-s3-purge. Vercel production only. Fail-soft per source.

export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const provided = header.slice("Bearer ".length);

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await ingestNewsFeeds({ supabase: createAdminClient() });
  const status = summary.failed === 0 ? 200 : summary.failed === summary.sources ? 503 : 207;
  return NextResponse.json(summary, { status });
}
