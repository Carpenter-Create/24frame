// Social profile Professions bank (internal: roles_* / crafts).
// Persist ordered slugs on profiles.crafts. primary_role stays the
// first selected slug. UI label is Professions — not Topics, not
// Category, not crafts. Public header is a house-chip scroll rail
// of every selected label in crafts order. Omit when empty. Edit
// max 5. Not on SocialPersonRow.

export const SOCIAL_PROFILE_ROLES_MAX = 5;
export const SOCIAL_PROFILE_ROLES_COUNT = "{n} / {max}";

export const SOCIAL_PROFILE_ROLE_GROUPS = [
  {
    id: "cast",
    label: "Cast",
    roles: [
      { slug: "actor", label: "Actor" },
      { slug: "voice_actor", label: "Voice Actor" },
      { slug: "host", label: "Host / Presenter" },
      { slug: "comedian", label: "Comedian" },
      { slug: "stunt_performer", label: "Stunt Performer" },
      { slug: "background", label: "Background / Extra" },
      { slug: "model", label: "Model" },
      { slug: "dancer", label: "Dancer" },
      { slug: "musician", label: "Musician / Performing Artist" },
    ],
  },
  {
    id: "writing",
    label: "Writing",
    roles: [
      { slug: "screenwriter", label: "Screenwriter" },
      { slug: "tv_writer", label: "TV Writer" },
      { slug: "playwright", label: "Playwright" },
      { slug: "story_editor", label: "Story Editor" },
      { slug: "script_consultant", label: "Script Consultant" },
      { slug: "showrunner", label: "Showrunner" },
      { slug: "author", label: "Author / Novelist" },
      { slug: "journalist", label: "Journalist / Critic" },
    ],
  },
  {
    id: "directing",
    label: "Directing",
    roles: [
      { slug: "director", label: "Director" },
      { slug: "second_unit_director", label: "Second Unit Director" },
      { slug: "assistant_director", label: "Assistant Director" },
      { slug: "script_supervisor", label: "Script Supervisor" },
    ],
  },
  {
    id: "producing",
    label: "Producing",
    roles: [
      { slug: "producer", label: "Producer" },
      { slug: "executive_producer", label: "Executive Producer" },
      { slug: "co_executive_producer", label: "Co-Executive Producer" },
      { slug: "co_producer", label: "Co-Producer" },
      { slug: "line_producer", label: "Line Producer" },
      { slug: "supervising_producer", label: "Supervising Producer" },
      { slug: "associate_producer", label: "Associate Producer" },
      { slug: "segment_producer", label: "Segment / Field / Story Producer" },
      { slug: "consulting_producer", label: "Consulting Producer" },
      { slug: "creative_producer", label: "Creative Producer" },
    ],
  },
  {
    id: "camera",
    label: "Camera",
    roles: [
      { slug: "cinematographer", label: "Cinematographer / DP" },
      { slug: "camera_operator", label: "Camera Operator" },
      { slug: "steadicam", label: "Steadicam" },
      { slug: "gaffer", label: "Gaffer" },
      { slug: "key_grip", label: "Key Grip" },
      { slug: "dit", label: "DIT" },
    ],
  },
  {
    id: "editorial",
    label: "Editorial",
    roles: [
      { slug: "editor", label: "Editor" },
      { slug: "assistant_editor", label: "Assistant Editor" },
      { slug: "post_producer", label: "Post Producer / Supervisor" },
      { slug: "colorist", label: "Colorist" },
      { slug: "vfx_editor", label: "VFX Editor" },
    ],
  },
  {
    id: "design",
    label: "Design",
    roles: [
      { slug: "production_designer", label: "Production Designer" },
      { slug: "art_director", label: "Art Director" },
      { slug: "set_decorator", label: "Set Decorator" },
      { slug: "prop_master", label: "Prop Master" },
      { slug: "costume_designer", label: "Costume Designer" },
      { slug: "wardrobe", label: "Wardrobe" },
      { slug: "makeup_artist", label: "Makeup Artist" },
      { slug: "hair_stylist", label: "Hair Stylist" },
      { slug: "sfx_makeup", label: "Special Effects Makeup" },
    ],
  },
  {
    id: "sound_music",
    label: "Sound & music",
    roles: [
      { slug: "sound_designer", label: "Sound Designer" },
      { slug: "production_sound", label: "Production Sound Mixer" },
      { slug: "boom_operator", label: "Boom Operator" },
      { slug: "re_recording_mixer", label: "Re-recording Mixer" },
      { slug: "composer", label: "Composer" },
      { slug: "music_supervisor", label: "Music Supervisor" },
      { slug: "soundtrack_artist", label: "Soundtrack Artist" },
    ],
  },
  {
    id: "vfx_animation",
    label: "VFX & animation",
    roles: [
      { slug: "vfx_supervisor", label: "VFX Supervisor / Artist" },
      { slug: "animator", label: "Animator" },
      { slug: "motion_designer", label: "Motion Designer" },
      { slug: "special_effects", label: "Special Effects Technician" },
      { slug: "previs", label: "PrefViz Artist" },
    ],
  },
  {
    id: "production_ops",
    label: "Production",
    roles: [
      { slug: "location_manager", label: "Location Manager" },
      { slug: "production_manager", label: "Production Manager / UPM" },
      { slug: "production_coordinator", label: "Production Coordinator" },
      { slug: "production_assistant", label: "Production Assistant" },
      { slug: "cast_coordinator", label: "Cast Coordinator" },
      { slug: "intimacy_coordinator", label: "Intimacy Coordinator" },
    ],
  },
  {
    id: "casting",
    label: "Casting",
    roles: [
      { slug: "casting_director", label: "Casting Director" },
      { slug: "casting_associate", label: "Casting Associate" },
    ],
  },
  {
    id: "business_capital_rep",
    label: "Business",
    roles: [
      { slug: "investor", label: "Investor" },
      { slug: "financier", label: "Financier / Fund Manager" },
      { slug: "studio_executive", label: "Executive / Studio Executive" },
      { slug: "distributor", label: "Distributor" },
      { slug: "sales_agent", label: "Sales Agent" },
      { slug: "agent", label: "Agent" },
      { slug: "manager", label: "Manager" },
      { slug: "lawyer", label: "Lawyer / Entertainment Attorney" },
      { slug: "business_affairs", label: "Business Affairs" },
      { slug: "publicist", label: "Publicist / Publicity" },
      { slug: "marketing", label: "Marketing / Distribution Marketing" },
      { slug: "accountant", label: "Accountant / Production Accountant" },
    ],
  },
  {
    id: "adjacent",
    label: "Adjacent",
    roles: [
      { slug: "creator", label: "Creator / Influencer" },
      { slug: "educator", label: "Educator / Instructor" },
      { slug: "student", label: "Student" },
      { slug: "consultant", label: "Consultant" },
      { slug: "recruiter", label: "Recruiter / Talent Scout" },
      { slug: "other", label: "Other" },
    ],
  },
] as const;

export type SocialProfileRoleSlug =
  (typeof SOCIAL_PROFILE_ROLE_GROUPS)[number]["roles"][number]["slug"];

export const SOCIAL_PROFILE_ROLES = SOCIAL_PROFILE_ROLE_GROUPS.flatMap((group) =>
  group.roles.map((role) => ({ ...role, groupId: group.id })),
);

const ROLE_BY_SLUG = new Map<string, (typeof SOCIAL_PROFILE_ROLES)[number]>(
  SOCIAL_PROFILE_ROLES.map((role) => [role.slug, role]),
);

export function isSocialProfileRoleSlug(value: string): value is SocialProfileRoleSlug {
  return ROLE_BY_SLUG.has(value);
}

export function socialProfileRoleLabel(slug: string): string | null {
  return ROLE_BY_SLUG.get(slug)?.label ?? null;
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

export function parseSocialProfileRoles(raw: unknown): SocialProfileRoleSlug[] {
  const seen = new Set<SocialProfileRoleSlug>();
  const slugs: SocialProfileRoleSlug[] = [];
  for (const value of roleValues(raw)) {
    if (typeof value !== "string") continue;
    const slug = value.trim();
    if (!isSocialProfileRoleSlug(slug) || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
    if (slugs.length === SOCIAL_PROFILE_ROLES_MAX) break;
  }
  return slugs;
}

export function socialProfileRolesWrite(raw: unknown): {
  crafts: SocialProfileRoleSlug[];
  primary_role: SocialProfileRoleSlug | null;
} {
  const crafts = parseSocialProfileRoles(raw);
  return { crafts, primary_role: crafts[0] ?? null };
}

export function toggleSocialProfileRole(
  selected: readonly string[],
  slug: string,
): SocialProfileRoleSlug[] {
  const current = parseSocialProfileRoles(selected);
  if (!isSocialProfileRoleSlug(slug)) return current;
  if (current.includes(slug)) return current.filter((item) => item !== slug);
  if (current.length >= SOCIAL_PROFILE_ROLES_MAX) return current;
  return [...current, slug];
}

export function moveSocialProfileRole(
  selected: readonly string[],
  fromId: string,
  toId: string,
): SocialProfileRoleSlug[] {
  const current = parseSocialProfileRoles(selected);
  const fromIndex = current.indexOf(fromId as SocialProfileRoleSlug);
  const toIndex = current.indexOf(toId as SocialProfileRoleSlug);
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
  slug: SocialProfileRoleSlug;
  label: string;
}[] {
  return parseSocialProfileRoles(raw).map((slug) => ({
    slug,
    label: ROLE_BY_SLUG.get(slug)?.label ?? slug,
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
