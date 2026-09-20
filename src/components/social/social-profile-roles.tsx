"use client";

import { useState } from "react";

import {
  SocialProfileChipBank,
  SocialProfileSelectChip,
} from "@/components/social/social-profile-chip-select";
import { Input } from "@/components/ui/input";
import {
  SOCIAL_PROFILE_EDIT_LABEL_CLASS,
  SOCIAL_PROFILE_EDIT_SECTION_CLASS,
  SOCIAL_TOPIC_CHIP_BANK_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_PROFILE_ROLES_MAX,
  filterSocialProfileRoleGroups,
  moveSocialProfileRole,
  parseSocialProfileRoles,
  socialProfileRoleLabel,
  socialProfileRolesCountLabel,
  toggleSocialProfileRole,
  type SocialProfileRoleSlug,
} from "@/lib/social-profile-roles";

const ROLE_DRAG_TYPE = "text/social-profile-role";

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
  const notice = atMax ? SOCIAL.profile.rolesLimit : SOCIAL.profile.rolesHint;

  function toggle(slug: string) {
    onChange(toggleSocialProfileRole(selected, slug));
  }

  function reorder(fromId: string, toId: string) {
    onChange(moveSocialProfileRole(selected, fromId, toId));
  }

  return (
    <div data-social-profile-edit-roles="" className={SOCIAL_PROFILE_EDIT_SECTION_CLASS}>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <p className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>{SOCIAL.profile.roles}</p>
          <p data-social-profile-edit-roles-count="" className="pt-0.5 t-label text-ink-2">
            {socialProfileRolesCountLabel(selected.length)}
          </p>
        </div>
        {selected.length > 0 ? (
          <div data-social-profile-edit-roles-selected="" className={SOCIAL_TOPIC_CHIP_BANK_CLASS}>
            {selected.map((slug) => (
              <SocialProfileSelectChip
                key={slug}
                option={{ id: slug, label: socialProfileRoleLabel(slug) ?? slug }}
                selected
                chip
                reorderable
                dragType={ROLE_DRAG_TYPE}
                dataPrefix="social-profile-role"
                onToggle={toggle}
                onReorder={reorder}
              />
            ))}
          </div>
        ) : null}
        <p data-social-profile-edit-roles-notice="" className="t-label text-ink-2">
          {notice}
        </p>
      </div>
      <Input
        id="social-edit-roles-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={SOCIAL.profile.rolesSearch}
        aria-label={SOCIAL.profile.rolesSearch}
        autoComplete="off"
      />
      <SocialProfileChipBank
        groups={groups.map((group) => ({
          id: group.id,
          label: group.label,
          options: group.roles.map((role) => ({ id: role.slug, label: role.label })),
        }))}
        selectedIds={selected}
        blocked={atMax}
        dataPrefix="social-profile-role"
        onToggle={toggle}
      />
    </div>
  );
}
