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
    expect(
      SOCIAL_PROFILE_ROLE_GROUPS.map((group) => [
        group.id,
        group.roles.map((role) => `${role.slug} — ${role.label}`),
      ]),
    ).toEqual([
      [
        "cast",
        [
          "actor — Actor",
          "voice_actor — Voice Actor",
          "host — Host / Presenter",
          "comedian — Comedian",
          "stunt_performer — Stunt Performer",
          "background — Background / Extra",
          "model — Model",
          "dancer — Dancer",
          "musician — Musician / Performing Artist",
        ],
      ],
      [
        "writing",
        [
          "screenwriter — Screenwriter",
          "tv_writer — TV Writer",
          "playwright — Playwright",
          "story_editor — Story Editor",
          "script_consultant — Script Consultant",
          "showrunner — Showrunner",
          "author — Author / Novelist",
          "journalist — Journalist / Critic",
        ],
      ],
      [
        "directing",
        [
          "director — Director",
          "second_unit_director — Second Unit Director",
          "assistant_director — Assistant Director",
          "script_supervisor — Script Supervisor",
        ],
      ],
      [
        "producing",
        [
          "producer — Producer",
          "executive_producer — Executive Producer",
          "co_executive_producer — Co-Executive Producer",
          "co_producer — Co-Producer",
          "line_producer — Line Producer",
          "supervising_producer — Supervising Producer",
          "associate_producer — Associate Producer",
          "segment_producer — Segment / Field / Story Producer",
          "consulting_producer — Consulting Producer",
          "creative_producer — Creative Producer",
        ],
      ],
      [
        "camera",
        [
          "cinematographer — Cinematographer / DP",
          "camera_operator — Camera Operator",
          "steadicam — Steadicam",
          "gaffer — Gaffer",
          "key_grip — Key Grip",
          "dit — DIT",
        ],
      ],
      [
        "editorial",
        [
          "editor — Editor",
          "assistant_editor — Assistant Editor",
          "post_producer — Post Producer / Supervisor",
          "colorist — Colorist",
          "vfx_editor — VFX Editor",
        ],
      ],
      [
        "design",
        [
          "production_designer — Production Designer",
          "art_director — Art Director",
          "set_decorator — Set Decorator",
          "prop_master — Prop Master",
          "costume_designer — Costume Designer",
          "wardrobe — Wardrobe",
          "makeup_artist — Makeup Artist",
          "hair_stylist — Hair Stylist",
          "sfx_makeup — Special Effects Makeup",
        ],
      ],
      [
        "sound_music",
        [
          "sound_designer — Sound Designer",
          "production_sound — Production Sound Mixer",
          "boom_operator — Boom Operator",
          "re_recording_mixer — Re-recording Mixer",
          "composer — Composer",
          "music_supervisor — Music Supervisor",
          "soundtrack_artist — Soundtrack Artist",
        ],
      ],
      [
        "vfx_animation",
        [
          "vfx_supervisor — VFX Supervisor / Artist",
          "animator — Animator",
          "motion_designer — Motion Designer",
          "special_effects — Special Effects Technician",
          "previs — PrefViz Artist",
        ],
      ],
      [
        "production_ops",
        [
          "location_manager — Location Manager",
          "production_manager — Production Manager / UPM",
          "production_coordinator — Production Coordinator",
          "production_assistant — Production Assistant",
          "cast_coordinator — Cast Coordinator",
          "intimacy_coordinator — Intimacy Coordinator",
        ],
      ],
      ["casting", ["casting_director — Casting Director", "casting_associate — Casting Associate"]],
      [
        "business_capital_rep",
        [
          "investor — Investor",
          "financier — Financier / Fund Manager",
          "studio_executive — Executive / Studio Executive",
          "distributor — Distributor",
          "sales_agent — Sales Agent",
          "agent — Agent",
          "manager — Manager",
          "lawyer — Lawyer / Entertainment Attorney",
          "business_affairs — Business Affairs",
          "publicist — Publicist / Publicity",
          "marketing — Marketing / Distribution Marketing",
          "accountant — Accountant / Production Accountant",
        ],
      ],
      [
        "adjacent",
        [
          "creator — Creator / Influencer",
          "educator — Educator / Instructor",
          "student — Student",
          "consultant — Consultant",
          "recruiter — Recruiter / Talent Scout",
          "other — Other",
        ],
      ],
    ]);
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
