import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  DM_COMPOSE_CTA_CLASS,
  DM_COMPOSE_SEARCH_CLASS,
  DM_MEMBERSHIP_CAP,
  dmComposeCta,
  dmMembershipCanSelectMore,
  dmMembershipHelper,
} from "@/lib/social-dm-membership";

describe("DM membership", () => {
  it("counts self in N/32 and stops at the cap", () => {
    expect(DM_MEMBERSHIP_CAP).toBe(32);
    expect(dmMembershipHelper(0)).toBe("1/32 selected");
    expect(dmMembershipHelper(1)).toBe("2/32 selected");
    expect(dmMembershipHelper(30)).toBe("31/32 selected");
    expect(dmMembershipHelper(31)).toBe("32/32 · Group is full");
    expect(dmMembershipCanSelectMore(30)).toBe(true);
    expect(dmMembershipCanSelectMore(31)).toBe(false);
    expect(dmComposeCta(0)).toBeNull();
    expect(dmComposeCta(1)).toBe("chat");
    expect(dmComposeCta(2)).toBe("group");
    expect(dmComposeCta(31)).toBe("group");
    expect(dmComposeCta(32)).toBeNull();
    expect(DM_COMPOSE_SEARCH_CLASS).toContain("h-10");
    expect(DM_COMPOSE_SEARCH_CLASS).toContain("rounded-[20px]");
    expect(DM_COMPOSE_CTA_CLASS).toContain("h-12");
    expect(DM_COMPOSE_CTA_CLASS).toContain("w-full");
    expect(DM_COMPOSE_CTA_CLASS).toContain("bg-accent");
  });

  it("keeps add-people off the thread and creates a fresh group", () => {
    const thread = readFileSync("src/app/(app)/social/dms/[id]/page.tsx", "utf8");
    const actions = readFileSync("src/app/(app)/social/actions.ts", "utf8");
    const inbox = readFileSync("src/app/(app)/social/dms/page.tsx", "utf8");
    expect(thread).not.toContain("SocialAddPeopleForm");
    expect(thread).not.toContain("addSocialDmPeople");
    expect(actions).toContain("membershipSealed");
    expect(actions).not.toContain("add_conversation_participants");
    expect(actions).toContain("create_group_conversation");
    expect(actions).toContain("open_or_get_direct_conversation");
    expect(inbox).toContain("${SOCIAL_ROUTES.dms}/new");
    expect(inbox).not.toContain("data-social-add-people");
  });
});
