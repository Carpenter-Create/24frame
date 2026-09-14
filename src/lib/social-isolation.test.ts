import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("social isolation lock", () => {
  it("does not add person-scoped tables to the B3 catalog harness", () => {
    const b3 = readFileSync("scripts/security/b3-cross-org-isolation.mjs", "utf8");
    expect(b3).toContain("Cross-org isolation");
    expect(b3).not.toContain("from(\"profiles\")");
    expect(b3).not.toContain("from(\"groups\")");
    expect(b3).not.toContain("from(\"posts\")");
    expect(b3).not.toContain("from(\"likes\")");
    expect(b3).not.toContain("from(\"leaderboard_entries\")");
    expect(b3).not.toContain("from(\"level_distribution\")");
    expect(b3).not.toContain("rebuild_leaderboards");
    expect(b3).not.toContain("get_dm_inbox");
    expect(b3).not.toContain("open_or_get_direct_conversation");
    expect(b3).not.toContain("add_conversation_participants");
    expect(b3).not.toContain("set_group_conversation_title");
    expect(b3).not.toContain("from(\"courses\")");
    expect(b3).not.toContain("from(\"modules\")");
    expect(b3).not.toContain("from(\"lessons\")");
    expect(b3).not.toContain("has_course_access");
    expect(b3).not.toContain("from(\"follows\")");
    expect(b3).not.toContain("from(\"stories\")");
    expect(b3).not.toContain("from(\"story_views\")");
  });

  it("keeps Social writes on the user-scoped client", () => {
    const actions = readFileSync("src/app/(app)/social/actions.ts", "utf8");
    expect(actions).toContain('from "@/lib/supabase/server"');
    expect(actions).not.toContain("@/lib/supabase/admin");
    expect(actions).not.toContain("SERVICE_ROLE");
    expect(actions).not.toContain("ai_conversations");
    const board = readFileSync("src/app/(app)/social/leaderboard/page.tsx", "utf8");
    expect(board).toContain('from "@/lib/supabase/server"');
    expect(board).not.toContain("@/lib/supabase/admin");
    expect(board).not.toContain("rebuild_leaderboards");
    const list = readFileSync("src/app/(app)/social/courses/page.tsx", "utf8");
    const detail = readFileSync("src/app/(app)/social/courses/[slug]/page.tsx", "utf8");
    expect(list).toContain('from "@/lib/supabase/server"');
    expect(detail).toContain('from "@/lib/supabase/server"');
    expect(list).not.toContain("@/lib/supabase/admin");
    expect(detail).not.toContain("@/lib/supabase/admin");
    expect(actions).not.toContain("from(\"courses\")");
    expect(actions).toContain('from("follows")');
    expect(actions).toContain('from("stories")');
    expect(actions).not.toContain("from(\"reels\")");
  });
});
