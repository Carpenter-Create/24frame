import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { ingestNewsFeeds, supabaseNewsPersist } from "@/lib/news-ingest";
import { createAdminClient } from "@/lib/supabase/admin";

// United scheduler: vercel.json crons + CRON_SECRET, same as
// transcode-poll and title-s3-purge. Vercel production only.
// Service-role upsert + 30-day purge. Fail-soft per source.

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

  const persist = supabaseNewsPersist(createAdminClient());
  const summary = await ingestNewsFeeds({ persist });
  const live = summary.sources - summary.skipped;
  const allFailed = live > 0 && summary.failed === live;
  const status = allFailed ? 503 : summary.failed > 0 ? 207 : 200;

  console.log(
    JSON.stringify({
      msg: "news ingest done",
      fetched: summary.fetched,
      inserted: summary.inserted,
      failed: summary.failed,
      skipped: summary.skipped,
      purged: summary.purged,
    }),
  );

  return NextResponse.json(
    {
      fetched: summary.fetched,
      inserted: summary.inserted,
      failed: summary.failed,
      skipped: summary.skipped,
      purged: summary.purged,
    },
    { status },
  );
}
