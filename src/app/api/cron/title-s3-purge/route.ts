import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  pendingTitlePrefixesFromRows,
  pendingTitlePurgeRange,
  purgeDeletedTitleStorage,
  sweepDeletedTitlePrefixes,
} from "@/lib/s3-title-purge";

// Compensating retry for G4: if delete_title committed and S3 purge failed,
// this tick finds titles.deleted_at IS NOT NULL with s3_purged_at IS NULL
// (those rows still have unpurged assets) and runs the same helper the
// delete action uses. Vercel production only; same CRON_SECRET pattern as
// transcode-poll. Founder lock 2026-09-17: orphans must never remain.

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

  const supabase = createAdminClient();
  const [from, to] = pendingTitlePurgeRange();
  const { data, error } = await supabase
    .from("titles")
    .select("id, org_id")
    .not("deleted_at", "is", null)
    .is("s3_purged_at", null)
    .order("deleted_at", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("[title-s3-purge] candidate select failed", error.message);
    return NextResponse.json({ error: "Select failed" }, { status: 500 });
  }

  const candidates = pendingTitlePrefixesFromRows(data);
  const summary = await sweepDeletedTitlePrefixes(candidates, (candidate) =>
    purgeDeletedTitleStorage({
      orgId: candidate.orgId,
      titleId: candidate.titleId,
      markPurged: async () => {
        const marked = await supabase.rpc("mark_deleted_title_prefix_purged", {
          p_title_id: candidate.titleId,
        });
        return { error: marked.error };
      },
    }),
  );

  const status = summary.failed > 0 ? 207 : 200;
  return NextResponse.json(summary, { status });
}
