import { describe, expect, it } from "vitest";

import {
  SOCIAL_PROFILE_ROLES,
  SOCIAL_PROFILE_ROLES_MAX,
  SOCIAL_PROFILE_ROLES_PUBLIC_CAP,
  SOCIAL_PROFILE_ROLE_GROUPS,
  filterSocialProfileRoleGroups,
  parseSocialProfileRoles,
  socialProfileRoleLabel,
  socialProfileRolesLine,
  socialProfileRolesWrite,
  toggleSocialProfileRole,
} from "./social-profile-roles";

describe("social profile roles", () => {
  it("keeps one bank: unique slugs, gender-neutral Actor, investor included", () => {
    const slugs = SOCIAL_PROFILE_ROLES.map((role) => role.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toHaveLength(89);
    expect(SOCIAL_PROFILE_ROLE_GROUPS).toHaveLength(13);
    expect(socialProfileRoleLabel("actor")).toBe("Actor");
    expect(slugs).not.toContain("actress");
    expect(SOCIAL_PROFILE_ROLES.map((role) => role.label).join(" ")).not.toContain("Actress");
    expect(socialProfileRoleLabel("investor")).toBe("Investor");
    expect(socialProfileRoleLabel("previs")).toBe("PrefViz Artist");
    expect(SOCIAL_PROFILE_ROLES_MAX).toBe(5);
    expect(SOCIAL_PROFILE_ROLES_PUBLIC_CAP).toBe(3);
  });

  it("parses ordered unique known slugs and drops unknown or extra", () => {
    expect(parseSocialProfileRoles(["producer", "actor", "producer", "nope"])).toEqual([
      "producer",
      "actor",
    ]);
    expect(
      parseSocialProfileRoles(["actor", "producer", "writer", "director", "editor", "investor"]),
    ).toEqual(["actor", "producer", "director", "editor", "investor"]);
    expect(parseSocialProfileRoles('["screenwriter","investor"]')).toEqual([
      "screenwriter",
      "investor",
    ]);
    expect(parseSocialProfileRoles("")).toEqual([]);
    expect(parseSocialProfileRoles(null)).toEqual([]);
  });

  it("writes crafts plus primary_role as the first selected slug", () => {
    expect(socialProfileRolesWrite(["director", "producer"])).toEqual({
      crafts: ["director", "producer"],
      primary_role: "director",
    });
    expect(socialProfileRolesWrite([])).toEqual({ crafts: [], primary_role: null });
  });

  it("toggles in selection order and refuses a sixth", () => {
    expect(toggleSocialProfileRole([], "actor")).toEqual(["actor"]);
    expect(toggleSocialProfileRole(["actor"], "actor")).toEqual([]);
    expect(toggleSocialProfileRole(["actor"], "producer")).toEqual(["actor", "producer"]);
    expect(
      toggleSocialProfileRole(
        ["actor", "producer", "director", "editor", "investor"],
        "screenwriter",
      ),
    ).toEqual(["actor", "producer", "director", "editor", "investor"]);
    expect(toggleSocialProfileRole(["actor"], "nope")).toEqual(["actor"]);
  });

  it("omits the public line when empty and caps at 3 +N", () => {
    expect(socialProfileRolesLine([])).toBeNull();
    expect(socialProfileRolesLine(["actor"])).toBe("Actor");
    expect(socialProfileRolesLine(["actor", "producer", "screenwriter"])).toBe(
      "Actor · Producer · Screenwriter",
    );
    expect(socialProfileRolesLine(["actor", "producer", "screenwriter", "investor", "director"])).toBe(
      "Actor · Producer · Screenwriter +2",
    );
    expect(socialProfileRolesLine(["actor", "producer", "screenwriter", "investor", "director"])).not.toContain(
      "Roles:",
    );
  });

  it("filters groups by label or slug and hides empty groups", () => {
    const hits = filterSocialProfileRoleGroups("invest");
    expect(hits.map((group) => group.id)).toEqual(["business_capital_rep"]);
    expect(hits[0]?.roles.map((role) => role.slug)).toEqual(["investor"]);
    expect(filterSocialProfileRoleGroups("cast").map((group) => group.id)).toEqual([
      "cast",
      "production_ops",
      "casting",
    ]);
    expect(filterSocialProfileRoleGroups("zzzz")).toEqual([]);
  });
});
