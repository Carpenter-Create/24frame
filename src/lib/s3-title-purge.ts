import "server-only";

import { purgeTitlePrefix } from "@/lib/s3";
import { probeRange, UNPAGINATED_MAX } from "@/lib/list-bounds";

// Shared deleted-title S3 purge. deleteTitle and the sweeper both call this.
// S3 list+delete lives in s3.ts (existing titles client — no fork). This file
// sequences purge → confirm → mark so a prefix is never reported clean while
// MediaConvert can still write under it. s3_purged_at stays null until then;
// the sweeper retries unmarked rows.

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

// submitted/running MediaConvert jobs still write under the title prefix after
// delete_title. Matching the mark RPC gate keeps the sweeper retrying.
export const IN_FLIGHT_TRANSCODE_STATUSES = ["submitted", "running"] as const;

export async function purgeDeletedTitleStorage(input: {
  orgId: string;
  titleId: string;
  markPurged: () => Promise<TitlePrefixMarkResult>;
  hasInFlightWrites: () => Promise<boolean>;
}): Promise<{ prefix: string; deleted: number }> {
  const first = await purgeTitlePrefix(input.orgId, input.titleId);
  if (await input.hasInFlightWrites()) {
    return first;
  }

  // First list can return empty while AWS still writes the screener. A confirm
  // pass deletes that object once the job is no longer in-flight.
  const confirm = await purgeTitlePrefix(input.orgId, input.titleId);
  const deleted = first.deleted + confirm.deleted;
  if (await input.hasInFlightWrites()) {
    return { prefix: confirm.prefix, deleted };
  }

  const marked = await input.markPurged();
  if (marked.error) {
    throw new Error(marked.error.message);
  }
  return { prefix: confirm.prefix, deleted };
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
