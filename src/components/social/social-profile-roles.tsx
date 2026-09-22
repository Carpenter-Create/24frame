"use client";

import { useState } from "react";

import { SocialProfileEditFace } from "@/components/social/social-profile-edit-face";
import { SocialProfileChipSelectFace } from "@/components/social/social-profile-chip-select";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_PROFILE_LINKS_MORE_CLASS,
  SOCIAL_PROFILE_ROLE_PILL_CLASS,
  SOCIAL_PROFILE_ROLES_ROW_CLASS,
} from "@/lib/social-chrome";
import {
  SOCIAL_PROFILE_ROLES_MAX,
  filterSocialProfileRoleGroups,
  moveSocialProfileRole,
  parseSocialProfileRoles,
  socialProfileRoleChips,
  socialProfileRoleLabel,
  socialProfileRolesCountLabel,
  socialProfileRolesFace,
  socialProfileRolesMoreLabel,
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
      selected={selected.map((slug) => ({ id: slug, label: socialProfileRoleLabel(slug) }))}
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

/** Public identity pills. ~3 on the face; +N reveals the rest in the same wrap. */
export function SocialProfileRolesRow({ roles }: { roles: readonly string[] | null | undefined }) {
  const [expanded, setExpanded] = useState(false);
  const all = socialProfileRoleChips(roles);
  if (all.length === 0) return null;
  const { face, overflow } = socialProfileRolesFace(roles);
  const shown = expanded ? all : face;

  return (
    <div data-social-profile-roles="" className={SOCIAL_PROFILE_ROLES_ROW_CLASS}>
      {shown.map((item) => (
        <span
          key={item.slug}
          data-social-profile-role={item.slug}
          className={SOCIAL_PROFILE_ROLE_PILL_CLASS}
        >
          {item.label}
        </span>
      ))}
      {!expanded && overflow > 0 ? (
        <button
          type="button"
          data-social-profile-roles-more=""
          aria-label={SOCIAL.profile.roles}
          className={SOCIAL_PROFILE_LINKS_MORE_CLASS}
          onClick={() => setExpanded(true)}
        >
          {socialProfileRolesMoreLabel(overflow)}
        </button>
      ) : null}
    </div>
  );
}
