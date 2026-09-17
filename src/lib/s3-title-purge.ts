import "server-only";

import { purgeTitlePrefix } from "@/lib/s3";
import { probeRange, UNPAGINATED_MAX } from "@/lib/list-bounds";

// Shared deleted-title S3 purge. deleteTitle and the sweeper both call this.
// S3 list+delete lives in s3.ts (existing titles client — no fork). This file
// sequences purge → mark so a prefix is never reported clean with live keys.

export type PendingTitlePrefix = {
  orgId: string;
  titleId: string;
};

export type TitlePrefixMarkResult = {
  error: { message: string } | null;
};

export type SweepDeletedTitlePrefixesResult = {
  attempted: number;
  purged: number;
  failed: number;
};

export async function purgeDeletedTitleStorage(input: {
  orgId: string;
  titleId: string;
  markPurged: () => Promise<TitlePrefixMarkResult>;
}): Promise<{ prefix: string; deleted: number }> {
  const result = await purgeTitlePrefix(input.orgId, input.titleId);
  const marked = await input.markPurged();
  if (marked.error) {
    throw new Error(marked.error.message);
  }
  return result;
}

export function pendingTitlePurgeRange(): [number, number] {
  return probeRange(UNPAGINATED_MAX);
}

export function pendingTitlePrefixesFromRows(
  rows: { id: string; org_id: string }[] | null,
): PendingTitlePrefix[] {
  const seen = new Set<string>();
  const out: PendingTitlePrefix[] = [];
  for (const row of rows ?? []) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push({ orgId: row.org_id, titleId: row.id });
  }
  return out;
}

export async function sweepDeletedTitlePrefixes(
  candidates: PendingTitlePrefix[],
  purgeOne: (candidate: PendingTitlePrefix) => Promise<unknown>,
): Promise<SweepDeletedTitlePrefixesResult> {
  const unique: PendingTitlePrefix[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate.titleId)) continue;
    seen.add(candidate.titleId);
    unique.push(candidate);
  }

  let purged = 0;
  let failed = 0;
  for (const candidate of unique) {
    try {
      await purgeOne(candidate);
      purged += 1;
    } catch (e) {
      failed += 1;
      console.error(
        `[title-s3-purge] sweeper failed for ${candidate.titleId}`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  return { attempted: unique.length, purged, failed };
}
