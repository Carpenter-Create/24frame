"use client";

import { useState } from "react";

import { SocialProfileEditFace } from "@/components/social/social-profile-edit-face";
import { SocialProfileChipSelectFace } from "@/components/social/social-profile-chip-select";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_PROFILE_ROLES_MAX,
  filterSocialProfileRoleGroups,
  moveSocialProfileRole,
  parseSocialProfileRoles,
  socialProfileRoleChips,
  socialProfileRolesCountLabel,
  toggleSocialProfileRole,
} from "@/lib/social-profile-roles";

const ROLE_DRAG_TYPE = "text/social-profile-role";

export function SocialProfileRolesField({
  value,
  onChange,
}: {
  value: readonly string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = parseSocialProfileRoles(value);
  const chips = socialProfileRoleChips(selected);
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
    <SocialProfileChipSelectFace
      selected={chips.map((role) => ({ id: role.slug, label: role.label }))}
      countLabel={socialProfileRolesCountLabel(selected.length)}
      helper={notice}
      searchId="social-edit-roles-search"
      searchValue={query}
      searchPlaceholder={SOCIAL.profile.rolesSearch}
      groups={groups.map((group) => ({
        id: group.id,
        label: group.label,
        options: group.roles.map((role) => ({ id: role.slug, label: role.label })),
      }))}
      blocked={atMax}
      dataPrefix="social-profile-role"
      hostAttr="data-social-profile-edit-roles"
      selectedAttr="data-social-profile-edit-roles-selected"
      countAttr="data-social-profile-edit-roles-count"
      noticeAttr="data-social-profile-edit-roles-notice"
      reorderable
      dragType={ROLE_DRAG_TYPE}
      onSearch={setQuery}
      onToggle={toggle}
      onReorder={reorder}
    />
  );
}

export function SocialProfileRolesEditor({
  value,
  onChange,
  onBack,
}: {
  value: readonly string[];
  onChange: (next: string[]) => void;
  onBack: () => void;
}) {
  return (
    <SocialProfileEditFace face="roles" title={SOCIAL.profile.roles} onBack={onBack}>
      <SocialProfileRolesField value={value} onChange={onChange} />
    </SocialProfileEditFace>
  );
}
