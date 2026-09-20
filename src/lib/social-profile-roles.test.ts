import { describe, expect, it } from "vitest";

import {
  SOCIAL_PROFILE_ROLES,
  SOCIAL_PROFILE_ROLES_COUNT,
  SOCIAL_PROFILE_ROLES_MAX,
  SOCIAL_PROFILE_ROLE_GROUPS,
  SOCIAL_PROFILE_ROLE_SLUG_ALIASES,
  canonicalSocialProfileRoleSlug,
  filterSocialProfileRoleGroups,
  moveSocialProfileRole,
  parseSocialProfileRoles,
  socialProfileRoleChips,
  socialProfileRoleLabel,
  socialProfileRolesCountLabel,
  socialProfileRolesWrite,
  toggleSocialProfileRole,
} from "./social-profile-roles";

describe("social profile roles", () => {
  it("locks an IMDb-shaped bank with Writer credit compounds and Investor", () => {
    const slugs = SOCIAL_PROFILE_ROLES.map((role) => role.slug);
    const labels = SOCIAL_PROFILE_ROLES.map((role) => role.label);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toHaveLength(105);
    expect(SOCIAL_PROFILE_ROLE_GROUPS).toHaveLength(49);
    expect(socialProfileRoleLabel("actor")).toBe("Actor");
    expect(socialProfileRoleLabel("actress")).toBe("Actress");
    expect(socialProfileRoleLabel("writer")).toBe("Writer");
    expect(socialProfileRoleLabel("screenwriter")).toBe("Screenwriter");
    expect(socialProfileRoleLabel("head_writer")).toBe("Head Writer");
    expect(socialProfileRoleLabel("story_editor")).toBe("Story Editor");
    expect(socialProfileRoleLabel("writer_screenplay")).toBe("Writer: Screenplay");
    expect(socialProfileRoleLabel("writer_story")).toBe("Writer: Story");
    expect(socialProfileRoleLabel("writer_written_by")).toBe("Writer: Written by");
    expect(socialProfileRoleLabel("writer_teleplay")).toBe("Writer: Teleplay");
    expect(socialProfileRoleLabel("writer_screen_story")).toBe("Writer: Screen Story");
    expect(socialProfileRoleLabel("cinematographer")).toBe("Cinematographer");
    expect(socialProfileRoleLabel("executive_producer")).toBe("Executive Producer");
    expect(socialProfileRoleLabel("investor")).toBe("Investor");
    expect(labels).toContain("Actress");
    expect(labels.join(" ")).not.toContain("Cinematographer / DP");
    expect(labels.join(" ")).not.toContain("Host / Presenter");
    expect(labels.join(" ")).not.toContain("PrefViz");
    expect(slugs).not.toContain("previs");
    expect(SOCIAL_PROFILE_ROLES_MAX).toBe(5);
    expect(SOCIAL_PROFILE_ROLES_COUNT).toBe("{n} / {max}");
    expect(socialProfileRolesCountLabel(3)).toBe("3 / 5");
    expect(
      SOCIAL_PROFILE_ROLE_GROUPS.map((group) => [
        group.id,
        group.roles.map((role) => `${role.slug} — ${role.label}`),
      ]),
    ).toEqual([
      ["actor", ["actor — Actor"]],
      ["actress", ["actress — Actress"]],
      ["voice_actor", ["voice_actor — Voice Actor"]],
      [
        "writer",
        [
          "writer — Writer",
          "screenwriter — Screenwriter",
          "head_writer — Head Writer",
          "story_editor — Story Editor",
          "executive_story_editor — Executive Story Editor",
          "staff_writer — Staff Writer",
          "script_writer — Script Writer",
          "supervising_writer — Supervising Writer",
          "creator — Creator",
          "dramaturge — Dramaturge",
          "script_editor — Script Editor",
          "story_coordinator — Story Coordinator",
          "writer_written_by — Writer: Written by",
          "writer_screenplay — Writer: Screenplay",
          "writer_story — Writer: Story",
          "writer_teleplay — Writer: Teleplay",
          "writer_screen_story — Writer: Screen Story",
        ],
      ],
      [
        "director",
        [
          "director — Director",
          "supervising_director — Supervising Director",
          "executive_director — Executive Director",
        ],
      ],
      [
        "second_unit_or_ad",
        [
          "second_unit_director — Second Unit Director",
          "assistant_director — Assistant Director",
        ],
      ],
      [
        "producer",
        [
          "producer — Producer",
          "executive_producer — Executive Producer",
          "coordinating_producer — Coordinating Producer",
          "line_producer — Line Producer",
          "supervising_producer — Supervising Producer",
          "associate_producer — Associate Producer",
          "field_producer — Field Producer",
          "story_producer — Story Producer",
          "development_producer — Development Producer",
          "post_production_producer — Post Production Producer",
        ],
      ],
      ["showrunner", ["showrunner — Showrunner"]],
      [
        "cinematographer",
        [
          "cinematographer — Cinematographer",
          "director_of_photography — Director of Photography",
        ],
      ],
      [
        "camera_electrical",
        [
          "camera_operator — Camera Operator",
          "steadicam_operator — Steadicam Operator",
          "gaffer — Gaffer",
          "grip — Grip",
          "first_assistant_camera — First Assistant Camera",
        ],
      ],
      ["editor", ["editor — Editor", "supervising_editor — Supervising Editor"]],
      [
        "editorial",
        [
          "assistant_editor — Assistant Editor",
          "post_producer — Post Producer",
          "post_production_supervisor — Post-Production Supervisor",
        ],
      ],
      ["color", ["colorist — Colorist", "digital_colorist — Digital Colorist"]],
      [
        "art_director",
        ["art_director — Art Director", "creative_director — Creative Director"],
      ],
      ["production_designer", ["production_designer — Production Designer"]],
      [
        "art_department",
        ["storyboard_artist — Storyboard Artist", "set_designer — Set Designer"],
      ],
      ["set_decorator", ["set_decorator — Set Decorator"]],
      [
        "costume",
        ["costume_designer — Costume Designer", "costume_supervisor — Costume Supervisor"],
      ],
      [
        "makeup",
        [
          "makeup_artist — Makeup Artist",
          "hairdresser — Hairdresser",
          "hair_and_makeup_artist — Hair and Makeup Artist",
        ],
      ],
      ["property_master", ["property_master — Property Master"]],
      [
        "sound",
        [
          "sound_mixer — Sound Mixer",
          "boom_operator — Boom Operator",
          "re_recording_mixer — Re-Recording Mixer",
          "sound_editor — Sound Editor",
          "sound_supervisor — Sound Supervisor",
        ],
      ],
      ["composer", ["composer — Composer", "music_director — Music Director"]],
      ["music_department", ["musician — Musician"]],
      ["music_supervisor", ["music_supervisor — Music Supervisor"]],
      ["soundtrack", ["soundtrack — Soundtrack"]],
      [
        "visual_effects",
        [
          "visual_effects_supervisor — Visual Effects Supervisor",
          "visual_effects_artist — Visual Effects Artist",
          "visual_effects_editor — Visual Effects Editor",
          "motion_graphics_artist — Motion Graphics Artist",
        ],
      ],
      ["animation", ["animator — Animator", "animation_director — Animation Director"]],
      [
        "special_effects",
        [
          "special_effects_technician — Special Effects Technician",
          "special_effects_supervisor — Special Effects Supervisor",
        ],
      ],
      ["stunts", ["stunt_performer — Stunt Performer"]],
      ["casting_director", ["casting_director — Casting Director"]],
      ["casting_department", ["casting_associate — Casting Associate"]],
      [
        "production_department",
        [
          "production_coordinator — Production Coordinator",
          "production_assistant — Production Assistant",
        ],
      ],
      ["production_manager", ["production_manager — Production Manager"]],
      ["location", ["location_manager — Location Manager"]],
      ["intimacy", ["intimacy_coordinator — Intimacy Coordinator"]],
      ["script_supervisor", ["script_supervisor — Script Supervisor"]],
      ["script_continuity", ["script_consultant — Script Consultant"]],
      ["choreography", ["choreographer — Choreographer"]],
      [
        "digital_creator",
        ["digital_creator — Digital Creator", "influencer — Influencer"],
      ],
      ["podcaster", ["podcaster — Podcaster"]],
      ["music_artist", ["music_artist — Music Artist"]],
      ["additional_crew", ["talent_coordinator — Talent Coordinator"]],
      ["executive", ["executive — Executive"]],
      ["legal", ["lawyer — Lawyer", "attorney — Attorney"]],
      ["publicity", ["publicist — Publicist"]],
      ["talent_agent", ["talent_agent — Talent Agent"]],
      ["manager", ["manager — Manager"]],
      [
        "accountant",
        ["accountant — Accountant", "production_accountant — Production Accountant"],
      ],
      ["business", ["investor — Investor"]],
    ]);
  });

  it("maps renamed slugs and keeps unknown legacy slugs displayable", () => {
    expect(canonicalSocialProfileRoleSlug("steadicam")).toBe("steadicam_operator");
    expect(SOCIAL_PROFILE_ROLE_SLUG_ALIASES.previs).toBe("storyboard_artist");
    expect(parseSocialProfileRoles(["producer", "actor", "producer", "host"])).toEqual([
      "producer",
      "actor",
      "host",
    ]);
    expect(parseSocialProfileRoles(["steadicam", "vfx_supervisor", "prop_master"])).toEqual([
      "steadicam_operator",
      "visual_effects_supervisor",
      "property_master",
    ]);
    expect(
      parseSocialProfileRoles(["actor", "producer", "writer", "director", "editor", "investor"]),
    ).toEqual(["actor", "producer", "writer", "director", "editor"]);
    expect(parseSocialProfileRoles('["screenwriter","investor"]')).toEqual([
      "screenwriter",
      "investor",
    ]);
    expect(parseSocialProfileRoles("")).toEqual([]);
    expect(parseSocialProfileRoles(null)).toEqual([]);
    expect(socialProfileRoleLabel("host")).toBe("Host");
    expect(socialProfileRoleLabel("dit")).toBe("DIT");
    expect(socialProfileRoleLabel("previs")).toBe("Storyboard Artist");
    expect(socialProfileRoleLabel("co_executive_producer")).toBe("Co Executive Producer");
    expect(socialProfileRoleChips(["host", "cinematographer"])).toEqual([
      { slug: "host", label: "Host" },
      { slug: "cinematographer", label: "Cinematographer" },
    ]);
  });

  it("writes crafts plus primary_role as the first selected slug", () => {
    expect(socialProfileRolesWrite(["director", "producer"])).toEqual({
      crafts: ["director", "producer"],
      primary_role: "director",
    });
    expect(socialProfileRolesWrite(["tv_writer", "host"])).toEqual({
      crafts: ["writer", "host"],
      primary_role: "writer",
    });
    expect(socialProfileRolesWrite([])).toEqual({ crafts: [], primary_role: null });
  });

  it("toggles in selection order and refuses a sixth", () => {
    expect(toggleSocialProfileRole([], "actor")).toEqual(["actor"]);
    expect(toggleSocialProfileRole(["actor"], "actor")).toEqual([]);
    expect(toggleSocialProfileRole(["actor"], "producer")).toEqual(["actor", "producer"]);
    expect(toggleSocialProfileRole(["host"], "host")).toEqual([]);
    expect(
      toggleSocialProfileRole(
        ["actor", "producer", "director", "editor", "investor"],
        "screenwriter",
      ),
    ).toEqual(["actor", "producer", "director", "editor", "investor"]);
    expect(toggleSocialProfileRole(["actor"], "nope")).toEqual(["actor"]);
  });

  it("lists every selected Profession in crafts order and moves by id", () => {
    expect(socialProfileRoleChips([])).toEqual([]);
    expect(socialProfileRoleChips(["actor"])).toEqual([{ slug: "actor", label: "Actor" }]);
    expect(
      socialProfileRoleChips(["actor", "producer", "screenwriter", "investor", "director"]),
    ).toEqual([
      { slug: "actor", label: "Actor" },
      { slug: "producer", label: "Producer" },
      { slug: "screenwriter", label: "Screenwriter" },
      { slug: "investor", label: "Investor" },
      { slug: "director", label: "Director" },
    ]);
    expect(moveSocialProfileRole(["actor", "producer", "director"], "director", "actor")).toEqual([
      "director",
      "actor",
      "producer",
    ]);
    expect(moveSocialProfileRole(["actor", "producer"], "actor", "actor")).toEqual([
      "actor",
      "producer",
    ]);
    expect(moveSocialProfileRole(["actor"], "nope", "actor")).toEqual(["actor"]);
  });

  it("filters groups by label or slug and hides empty groups", () => {
    const hits = filterSocialProfileRoleGroups("invest");
    expect(hits.map((group) => group.id)).toEqual(["business"]);
    expect(hits[0]?.roles.map((role) => role.slug)).toEqual(["investor"]);
    expect(filterSocialProfileRoleGroups("cast").map((group) => group.id)).toEqual([
      "casting_director",
      "casting_department",
      "podcaster",
    ]);
    expect(filterSocialProfileRoleGroups("screenplay").map((group) => group.id)).toEqual(["writer"]);
    expect(
      filterSocialProfileRoleGroups("screenplay")[0]?.roles.map((role) => role.slug),
    ).toEqual(["writer_screenplay"]);
    expect(filterSocialProfileRoleGroups("zzzz")).toEqual([]);
  });
});
