// Social profile Professions bank (internal: roles_* / crafts).
// Labels follow IMDbPro New & Updated Professions names by
// department, plus Writer credit-style compounds (Category:
// Attribute). Persist ordered slugs on profiles.crafts.
// primary_role stays the first selected slug. UI label is
// Professions — not Topics, not Category, not crafts. Public
// header is a house-chip scroll rail of every selected label
// in crafts order. Omit when empty. Edit max 5. Not on
// SocialPersonRow. Investor is a Business add.

export const SOCIAL_PROFILE_ROLES_MAX = 5;
export const SOCIAL_PROFILE_ROLES_COUNT = "{n} / {max}";

export const SOCIAL_PROFILE_ROLE_GROUPS = [
  {
    id: "actor",
    label: "Actor",
    roles: [{ slug: "actor", label: "Actor" }],
  },
  {
    id: "actress",
    label: "Actress",
    roles: [{ slug: "actress", label: "Actress" }],
  },
  {
    id: "voice_actor",
    label: "Voice Actor",
    roles: [{ slug: "voice_actor", label: "Voice Actor" }],
  },
  {
    id: "writer",
    label: "Writer",
    roles: [
      { slug: "writer", label: "Writer" },
      { slug: "screenwriter", label: "Screenwriter" },
      { slug: "head_writer", label: "Head Writer" },
      { slug: "story_editor", label: "Story Editor" },
      { slug: "executive_story_editor", label: "Executive Story Editor" },
      { slug: "staff_writer", label: "Staff Writer" },
      { slug: "script_writer", label: "Script Writer" },
      { slug: "supervising_writer", label: "Supervising Writer" },
      { slug: "creator", label: "Creator" },
      { slug: "dramaturge", label: "Dramaturge" },
      { slug: "script_editor", label: "Script Editor" },
      { slug: "story_coordinator", label: "Story Coordinator" },
      { slug: "writer_written_by", label: "Writer: Written by" },
      { slug: "writer_screenplay", label: "Writer: Screenplay" },
      { slug: "writer_story", label: "Writer: Story" },
      { slug: "writer_teleplay", label: "Writer: Teleplay" },
      { slug: "writer_screen_story", label: "Writer: Screen Story" },
    ],
  },
  {
    id: "director",
    label: "Director",
    roles: [
      { slug: "director", label: "Director" },
      { slug: "supervising_director", label: "Supervising Director" },
      { slug: "executive_director", label: "Executive Director" },
    ],
  },
  {
    id: "second_unit_or_ad",
    label: "Second Unit or Assistant Director",
    roles: [
      { slug: "second_unit_director", label: "Second Unit Director" },
      { slug: "assistant_director", label: "Assistant Director" },
    ],
  },
  {
    id: "producer",
    label: "Producer",
    roles: [
      { slug: "producer", label: "Producer" },
      { slug: "executive_producer", label: "Executive Producer" },
      { slug: "coordinating_producer", label: "Coordinating Producer" },
      { slug: "line_producer", label: "Line Producer" },
      { slug: "supervising_producer", label: "Supervising Producer" },
      { slug: "associate_producer", label: "Associate Producer" },
      { slug: "field_producer", label: "Field Producer" },
      { slug: "story_producer", label: "Story Producer" },
      { slug: "development_producer", label: "Development Producer" },
      { slug: "post_production_producer", label: "Post Production Producer" },
    ],
  },
  {
    id: "showrunner",
    label: "Showrunner",
    roles: [{ slug: "showrunner", label: "Showrunner" }],
  },
  {
    id: "cinematographer",
    label: "Cinematographer",
    roles: [
      { slug: "cinematographer", label: "Cinematographer" },
      { slug: "director_of_photography", label: "Director of Photography" },
    ],
  },
  {
    id: "camera_electrical",
    label: "Camera and Electrical Department",
    roles: [
      { slug: "camera_operator", label: "Camera Operator" },
      { slug: "steadicam_operator", label: "Steadicam Operator" },
      { slug: "gaffer", label: "Gaffer" },
      { slug: "grip", label: "Grip" },
      { slug: "first_assistant_camera", label: "First Assistant Camera" },
    ],
  },
  {
    id: "editor",
    label: "Editor",
    roles: [
      { slug: "editor", label: "Editor" },
      { slug: "supervising_editor", label: "Supervising Editor" },
    ],
  },
  {
    id: "editorial",
    label: "Editorial Department",
    roles: [
      { slug: "assistant_editor", label: "Assistant Editor" },
      { slug: "post_producer", label: "Post Producer" },
      { slug: "post_production_supervisor", label: "Post-Production Supervisor" },
    ],
  },
  {
    id: "color",
    label: "Color Department",
    roles: [
      { slug: "colorist", label: "Colorist" },
      { slug: "digital_colorist", label: "Digital Colorist" },
    ],
  },
  {
    id: "art_director",
    label: "Art Director",
    roles: [
      { slug: "art_director", label: "Art Director" },
      { slug: "creative_director", label: "Creative Director" },
    ],
  },
  {
    id: "production_designer",
    label: "Production Designer",
    roles: [{ slug: "production_designer", label: "Production Designer" }],
  },
  {
    id: "art_department",
    label: "Art Department",
    roles: [
      { slug: "storyboard_artist", label: "Storyboard Artist" },
      { slug: "set_designer", label: "Set Designer" },
    ],
  },
  {
    id: "set_decorator",
    label: "Set Decorator",
    roles: [{ slug: "set_decorator", label: "Set Decorator" }],
  },
  {
    id: "costume",
    label: "Costume Designer",
    roles: [
      { slug: "costume_designer", label: "Costume Designer" },
      { slug: "costume_supervisor", label: "Costume Supervisor" },
    ],
  },
  {
    id: "makeup",
    label: "Make-up Department",
    roles: [
      { slug: "makeup_artist", label: "Makeup Artist" },
      { slug: "hairdresser", label: "Hairdresser" },
      { slug: "hair_and_makeup_artist", label: "Hair and Makeup Artist" },
    ],
  },
  {
    id: "property_master",
    label: "Property Master",
    roles: [{ slug: "property_master", label: "Property Master" }],
  },
  {
    id: "sound",
    label: "Sound Department",
    roles: [
      { slug: "sound_mixer", label: "Sound Mixer" },
      { slug: "boom_operator", label: "Boom Operator" },
      { slug: "re_recording_mixer", label: "Re-Recording Mixer" },
      { slug: "sound_editor", label: "Sound Editor" },
      { slug: "sound_supervisor", label: "Sound Supervisor" },
    ],
  },
  {
    id: "composer",
    label: "Composer",
    roles: [
      { slug: "composer", label: "Composer" },
      { slug: "music_director", label: "Music Director" },
    ],
  },
  {
    id: "music_department",
    label: "Music Department",
    roles: [{ slug: "musician", label: "Musician" }],
  },
  {
    id: "music_supervisor",
    label: "Music Supervisor",
    roles: [{ slug: "music_supervisor", label: "Music Supervisor" }],
  },
  {
    id: "soundtrack",
    label: "Soundtrack",
    roles: [{ slug: "soundtrack", label: "Soundtrack" }],
  },
  {
    id: "visual_effects",
    label: "Visual Effects",
    roles: [
      { slug: "visual_effects_supervisor", label: "Visual Effects Supervisor" },
      { slug: "visual_effects_artist", label: "Visual Effects Artist" },
      { slug: "visual_effects_editor", label: "Visual Effects Editor" },
      { slug: "motion_graphics_artist", label: "Motion Graphics Artist" },
    ],
  },
  {
    id: "animation",
    label: "Animation Department",
    roles: [
      { slug: "animator", label: "Animator" },
      { slug: "animation_director", label: "Animation Director" },
    ],
  },
  {
    id: "special_effects",
    label: "Special Effects",
    roles: [
      { slug: "special_effects_technician", label: "Special Effects Technician" },
      { slug: "special_effects_supervisor", label: "Special Effects Supervisor" },
    ],
  },
  {
    id: "stunts",
    label: "Stunts",
    roles: [{ slug: "stunt_performer", label: "Stunt Performer" }],
  },
  {
    id: "casting_director",
    label: "Casting Director",
    roles: [{ slug: "casting_director", label: "Casting Director" }],
  },
  {
    id: "casting_department",
    label: "Casting Department",
    roles: [{ slug: "casting_associate", label: "Casting Associate" }],
  },
  {
    id: "production_department",
    label: "Production Department",
    roles: [
      { slug: "production_coordinator", label: "Production Coordinator" },
      { slug: "production_assistant", label: "Production Assistant" },
    ],
  },
  {
    id: "production_manager",
    label: "Production Manager",
    roles: [{ slug: "production_manager", label: "Production Manager" }],
  },
  {
    id: "location",
    label: "Location Management",
    roles: [{ slug: "location_manager", label: "Location Manager" }],
  },
  {
    id: "intimacy",
    label: "Intimacy Coordination",
    roles: [{ slug: "intimacy_coordinator", label: "Intimacy Coordinator" }],
  },
  {
    id: "script_supervisor",
    label: "Script Supervisor",
    roles: [{ slug: "script_supervisor", label: "Script Supervisor" }],
  },
  {
    id: "script_continuity",
    label: "Script and Continuity Department",
    roles: [{ slug: "script_consultant", label: "Script Consultant" }],
  },
  {
    id: "choreography",
    label: "Choreography",
    roles: [{ slug: "choreographer", label: "Choreographer" }],
  },
  {
    id: "digital_creator",
    label: "Digital Creator",
    roles: [
      { slug: "digital_creator", label: "Digital Creator" },
      { slug: "influencer", label: "Influencer" },
    ],
  },
  {
    id: "podcaster",
    label: "Podcaster",
    roles: [{ slug: "podcaster", label: "Podcaster" }],
  },
  {
    id: "music_artist",
    label: "Music Artist",
    roles: [{ slug: "music_artist", label: "Music Artist" }],
  },
  {
    id: "additional_crew",
    label: "Additional Crew",
    roles: [{ slug: "talent_coordinator", label: "Talent Coordinator" }],
  },
  {
    id: "executive",
    label: "Executive",
    roles: [{ slug: "executive", label: "Executive" }],
  },
  {
    id: "legal",
    label: "Legal Department",
    roles: [
      { slug: "lawyer", label: "Lawyer" },
      { slug: "attorney", label: "Attorney" },
    ],
  },
  {
    id: "publicity",
    label: "Publicity",
    roles: [{ slug: "publicist", label: "Publicist" }],
  },
  {
    id: "talent_agent",
    label: "Talent Agent",
    roles: [{ slug: "talent_agent", label: "Talent Agent" }],
  },
  {
    id: "manager",
    label: "Manager",
    roles: [{ slug: "manager", label: "Manager" }],
  },
  {
    id: "accountant",
    label: "Accountant",
    roles: [
      { slug: "accountant", label: "Accountant" },
      { slug: "production_accountant", label: "Production Accountant" },
    ],
  },
  {
    id: "business",
    label: "Business",
    roles: [{ slug: "investor", label: "Investor" }],
  },
] as const;

export type SocialProfileRoleSlug =
  (typeof SOCIAL_PROFILE_ROLE_GROUPS)[number]["roles"][number]["slug"];

// Old crafts slugs → official bank slugs. Unmapped leftovers stay
// on the profile and render via socialProfileRoleLabel.
export const SOCIAL_PROFILE_ROLE_SLUG_ALIASES = {
  steadicam: "steadicam_operator",
  soundtrack_artist: "soundtrack",
  vfx_supervisor: "visual_effects_supervisor",
  vfx_editor: "visual_effects_editor",
  agent: "talent_agent",
  studio_executive: "executive",
  production_sound: "sound_mixer",
  prop_master: "property_master",
  hair_stylist: "hairdresser",
  special_effects: "special_effects_technician",
  motion_designer: "motion_graphics_artist",
  tv_writer: "writer",
  segment_producer: "field_producer",
  sfx_makeup: "makeup_artist",
  wardrobe: "costume_supervisor",
  previs: "storyboard_artist",
  cast_coordinator: "talent_coordinator",
  key_grip: "grip",
} as const satisfies Record<string, SocialProfileRoleSlug>;

export const SOCIAL_PROFILE_ROLES = SOCIAL_PROFILE_ROLE_GROUPS.flatMap((group) =>
  group.roles.map((role) => ({ ...role, groupId: group.id })),
);

const ROLE_BY_SLUG = new Map<string, (typeof SOCIAL_PROFILE_ROLES)[number]>(
  SOCIAL_PROFILE_ROLES.map((role) => [role.slug, role]),
);

const ROLE_ALIAS_BY_SLUG = new Map<string, SocialProfileRoleSlug>(
  Object.entries(SOCIAL_PROFILE_ROLE_SLUG_ALIASES),
);

export function isSocialProfileRoleSlug(value: string): value is SocialProfileRoleSlug {
  return ROLE_BY_SLUG.has(value);
}

export function canonicalSocialProfileRoleSlug(value: string): string {
  return ROLE_ALIAS_BY_SLUG.get(value) ?? value;
}

function titleCaseRolePart(part: string): string {
  if (part.toLowerCase() === "dit") return "DIT";
  if (!part) return part;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

export function socialProfileRoleLabel(slug: string): string {
  const canonical = canonicalSocialProfileRoleSlug(slug);
  const known = ROLE_BY_SLUG.get(canonical) ?? ROLE_BY_SLUG.get(slug);
  if (known) return known.label;
  return slug
    .split(/[_-]+/)
    .filter(Boolean)
    .map(titleCaseRolePart)
    .join(" ");
}

function roleValues(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return [];
  const text = raw.trim();
  if (!text) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [text];
  } catch {
    return text.split(",").map((part) => part.trim());
  }
}

export function parseSocialProfileRoles(raw: unknown): string[] {
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const value of roleValues(raw)) {
    if (typeof value !== "string") continue;
    const slug = canonicalSocialProfileRoleSlug(value.trim());
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
    if (slugs.length === SOCIAL_PROFILE_ROLES_MAX) break;
  }
  return slugs;
}

export function socialProfileRolesWrite(raw: unknown): {
  crafts: string[];
  primary_role: string | null;
} {
  const crafts = parseSocialProfileRoles(raw);
  return { crafts, primary_role: crafts[0] ?? null };
}

export function toggleSocialProfileRole(selected: readonly string[], slug: string): string[] {
  const current = parseSocialProfileRoles(selected);
  const canonical = canonicalSocialProfileRoleSlug(slug);
  if (current.includes(canonical)) return current.filter((item) => item !== canonical);
  if (current.length >= SOCIAL_PROFILE_ROLES_MAX) return current;
  if (!isSocialProfileRoleSlug(canonical)) return current;
  return [...current, canonical];
}

export function moveSocialProfileRole(
  selected: readonly string[],
  fromId: string,
  toId: string,
): string[] {
  const current = parseSocialProfileRoles(selected);
  const fromSlug = canonicalSocialProfileRoleSlug(fromId);
  const toSlug = canonicalSocialProfileRoleSlug(toId);
  const fromIndex = current.indexOf(fromSlug);
  const toIndex = current.indexOf(toSlug);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return current;
  const next = [...current];
  const [item] = next.splice(fromIndex, 1);
  if (!item) return current;
  next.splice(toIndex, 0, item);
  return next;
}

export function socialProfileRolesCountLabel(count: number): string {
  return SOCIAL_PROFILE_ROLES_COUNT.replace("{n}", String(count)).replace(
    "{max}",
    String(SOCIAL_PROFILE_ROLES_MAX),
  );
}

export function socialProfileRoleChips(raw: unknown): {
  slug: string;
  label: string;
}[] {
  return parseSocialProfileRoles(raw).map((slug) => ({
    slug,
    label: socialProfileRoleLabel(slug),
  }));
}

export function filterSocialProfileRoleGroups(query: string) {
  const needle = query.trim().toLowerCase();
  return SOCIAL_PROFILE_ROLE_GROUPS.map((group) => {
    const groupHit =
      group.id.includes(needle) || group.label.toLowerCase().includes(needle);
    return {
      id: group.id,
      label: group.label,
      roles: needle
        ? groupHit
          ? group.roles
          : group.roles.filter(
              (role) =>
                role.label.toLowerCase().includes(needle) || role.slug.includes(needle),
            )
        : group.roles,
    };
  }).filter((group) => group.roles.length > 0);
}
