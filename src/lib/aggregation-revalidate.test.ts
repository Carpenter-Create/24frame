import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { ACTIVITY_HREF } from "./activity";
import { AVAILS_HREF } from "./avails";
import { CHANNELS_HREF } from "./channel-card";
import { GC_DELIVERIES_HREF } from "./gc-deliveries";
import { QUEUE_HREF } from "./queue";
import { titleOpsPath } from "./title-public-id";

// P1-3 — cache keys after first-segment IA. Stale pre-#459 paths
// miss next.config staleTimes.dynamic: 30.

const ACTION_FILES = [
  "src/app/(app)/aggregation/messages/ask-globee-actions.ts",
  "src/app/(app)/aggregation/messages/actions.ts",
  "src/app/(app)/(operator)/aggregation/channels/actions.ts",
  "src/app/(app)/(operator)/aggregation/gc/deliveries/actions.ts",
  "src/app/(app)/(operator)/aggregation/gc/review/actions.ts",
  "src/app/(app)/(operator)/aggregation/gc/titles/[id]/actions.ts",
] as const;

const STALE_REVALIDATE = [
  'revalidatePath("/messages")',
  'revalidatePath("/channels")',
  'revalidatePath("/gc/deliveries")',
  'revalidatePath("/gc/review")',
  'revalidatePath("/queue")',
  'revalidatePath("/avails")',
  "revalidatePath(`/gc/titles/",
  'revalidatePath(aggregationPath("messages"))',
] as const;

describe("aggregation revalidatePath SoT (P1-3)", () => {
  it("points staff/client mutations at live *_HREF / aggregationPath", () => {
    for (const file of ACTION_FILES) {
      const src = readFileSync(file, "utf8");
      for (const stale of STALE_REVALIDATE) {
        expect(src, `${file} still has ${stale}`).not.toContain(stale);
      }
    }
    expect(ACTIVITY_HREF).toBe("/aggregation/activity");
    expect(CHANNELS_HREF).toBe("/aggregation/channels");
    expect(GC_DELIVERIES_HREF).toBe("/aggregation/gc/deliveries");
    expect(QUEUE_HREF).toBe("/aggregation/queue");
    expect(AVAILS_HREF).toBe("/aggregation/avails");
    expect(titleOpsPath("t1")).toBe("/aggregation/gc/titles/t1");
    expect(readFileSync(ACTION_FILES[0], "utf8")).toContain('revalidatePath("/", "layout")');
    expect(readFileSync(ACTION_FILES[1], "utf8")).toContain("ACTIVITY_HREF");
    expect(readFileSync(ACTION_FILES[2], "utf8")).toContain("CHANNELS_HREF");
    expect(readFileSync(ACTION_FILES[3], "utf8")).toContain("GC_DELIVERIES_HREF");
    expect(readFileSync(ACTION_FILES[4], "utf8")).toContain("QUEUE_HREF");
    expect(readFileSync(ACTION_FILES[4], "utf8")).toContain("titleOpsPath");
    expect(readFileSync(ACTION_FILES[5], "utf8")).toContain("titleOpsPath");
    expect(readFileSync(ACTION_FILES[5], "utf8")).toContain("QUEUE_HREF");
    expect(readFileSync(ACTION_FILES[5], "utf8")).toContain("AVAILS_HREF");
  });
});
