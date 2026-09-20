"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { SOCIAL_PROFILE_EDIT_LABEL_CLASS, SOCIAL_TOPIC_CHIP_CLASS } from "@/lib/social-chrome";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_PROFILE_ROLES_MAX,
  filterSocialProfileRoleGroups,
  parseSocialProfileRoles,
  socialProfileRoleLabel,
  toggleSocialProfileRole,
  type SocialProfileRoleSlug,
} from "@/lib/social-profile-roles";

export function SocialProfileRolesField({
  value,
  onChange,
}: {
  value: readonly string[];
  onChange: (next: SocialProfileRoleSlug[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = parseSocialProfileRoles(value);
  const atMax = selected.length >= SOCIAL_PROFILE_ROLES_MAX;
  const groups = filterSocialProfileRoleGroups(query);

  return (
    <div data-social-profile-edit-roles="" className="flex flex-col gap-3 py-4">
      <div className="flex flex-col gap-2">
        <p className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>{SOCIAL.profile.roles}</p>
        {selected.length > 0 ? (
          <div data-social-profile-edit-roles-selected="" className="flex flex-wrap gap-2">
            {selected.map((slug) => (
              <button
                key={slug}
                type="button"
                data-social-profile-role-chip={slug}
                className={SOCIAL_TOPIC_CHIP_CLASS}
                onClick={() => onChange(toggleSocialProfileRole(selected, slug))}
              >
                {socialProfileRoleLabel(slug)}
              </button>
            ))}
          </div>
        ) : null}
        <p className="t-label text-ink-2">{SOCIAL.profile.rolesHint}</p>
      </div>
      <Input
        id="social-edit-roles-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={SOCIAL.profile.rolesSearch}
        aria-label={SOCIAL.profile.rolesSearch}
        autoComplete="off"
      />
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.id} data-social-profile-role-group={group.id} className="flex flex-col gap-1">
            <p className="t-label text-ink-2">{group.label}</p>
            {group.roles.map((role) => {
              const checked = selected.includes(role.slug);
              const blocked = atMax && !checked;
              return (
                <label
                  key={role.slug}
                  data-social-profile-role={role.slug}
                  data-social-profile-role-selected={checked ? "" : undefined}
                  className="flex w-full items-start gap-3 py-2"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-ink"
                    checked={checked}
                    disabled={blocked}
                    onChange={() => onChange(toggleSocialProfileRole(selected, role.slug))}
                  />
                  <span className="min-w-0 flex-1 break-words t-body-sm text-ink">{role.label}</span>
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
