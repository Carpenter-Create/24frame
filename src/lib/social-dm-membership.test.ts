import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  DM_COMPOSE_CTA_CLASS,
  DM_COMPOSE_SEARCH_CLASS,
  DM_MEMBERSHIP_CAP,
  dmComposeCta,
  dmDirectComposeCta,
  dmGroupComposeCta,
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
    expect(dmDirectComposeCta(0)).toBeNull();
    expect(dmDirectComposeCta(1)).toBe("chat");
    expect(dmDirectComposeCta(2)).toBeNull();
    expect(dmGroupComposeCta(0)).toBeNull();
    expect(dmGroupComposeCta(1)).toBeNull();
    expect(dmGroupComposeCta(2)).toBe("chat");
    expect(dmGroupComposeCta(15)).toBe("chat");
    expect(dmGroupComposeCta(16)).toBeNull();
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
    const picker = readFileSync("src/components/social/social-dm-compose-picker.tsx", "utf8");
    const direct = readFileSync("src/app/(app)/social/dms/new/page.tsx", "utf8");
    const group = readFileSync("src/app/(app)/social/dms/new/group/page.tsx", "utf8");
    expect(picker).toContain("SOCIAL.dms.chat");
    expect(picker).toContain("SOCIAL.dms.groupChat");
    expect(picker).toContain("SOCIAL.dms.groupChatHint");
    expect(picker).toContain("dmDirectComposeCta");
    expect(picker).toContain("dmGroupComposeCta");
    expect(picker).toContain("dmMembershipHelper");
    expect(picker).not.toContain("createGroup");
    expect(picker).not.toContain("Create group");
    expect(picker).not.toContain("Channel");
    expect(picker).not.toContain("AI chats");
    expect(direct).toContain('mode="direct"');
    expect(direct).not.toContain("PageHeader");
    expect(group).toContain('mode="group"');
    expect(group).toContain("loadDmComposeRoster");
    expect(actions).toContain("set_group_conversation_title");
    expect(actions).toContain("open_or_get_direct_conversation");
  });
});
