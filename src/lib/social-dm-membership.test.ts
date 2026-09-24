import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  DM_COMPOSE_CTA_CLASS,
  DM_COMPOSE_SEARCH_CLASS,
  DM_MEMBERSHIP_CAP,
  dmComposeCta,
  dmComposeVisiblePeople,
  dmMembershipCanSelectMore,
  dmMembershipHelper,
} from "@/lib/social-dm-membership";

describe("DM membership", () => {
  it("counts self in N/16 and stops at the cap", () => {
    expect(DM_MEMBERSHIP_CAP).toBe(16);
    expect(dmMembershipHelper(0)).toBe("1/16 selected");
    expect(dmMembershipHelper(1)).toBe("2/16 selected");
    expect(dmMembershipHelper(14)).toBe("15/16 selected");
    expect(dmMembershipHelper(15)).toBe("16/16 · Chat is full");
    expect(dmMembershipCanSelectMore(14)).toBe(true);
    expect(dmMembershipCanSelectMore(15)).toBe(false);
    expect(dmComposeCta(0)).toBeNull();
    expect(dmComposeCta(1)).toBe("chat");
    expect(dmComposeCta(2)).toBe("chat");
    expect(dmComposeCta(15)).toBe("chat");
    expect(dmComposeCta(16)).toBeNull();
    expect(DM_COMPOSE_SEARCH_CLASS).toContain("h-10");
    expect(DM_COMPOSE_SEARCH_CLASS).toContain("rounded-[20px]");
    expect(DM_COMPOSE_CTA_CLASS).toContain("h-12");
    expect(DM_COMPOSE_CTA_CLASS).toContain("w-full");
    expect(DM_COMPOSE_CTA_CLASS).toContain("bg-accent");
  });

  it("keeps chosen peers visible when the search list changes", () => {
    const ada = { id: "ada" };
    const bea = { id: "bea" };
    const cam = { id: "cam" };
    expect(dmComposeVisiblePeople([ada, bea], [cam])).toEqual([ada, bea, cam]);
    expect(dmComposeVisiblePeople([ada, bea], [])).toEqual([ada, bea]);
    expect(dmComposeVisiblePeople([ada], [ada, cam])).toEqual([ada, cam]);
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
    const picker = readFileSync("src/components/social/social-dm-compose-picker.tsx", "utf8");
    expect(picker).toContain("SOCIAL.dms.chat");
    expect(picker).not.toContain("createGroup");
    expect(picker).not.toContain("Create group");
  });
});
