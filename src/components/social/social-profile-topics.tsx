"use client";

import { useState } from "react";

import { SocialProfileEditFace } from "@/components/social/social-profile-edit-face";
import { SocialProfileChipSelectFace } from "@/components/social/social-profile-chip-select";
import { SOCIAL } from "@/lib/social";
import { type SocialCategoryTopic } from "@/lib/social-categories";
import {
  filterSocialProfileTopicGroups,
  parseSocialProfileTopics,
  socialProfileTopicsAtMax,
  socialProfileTopicsCountLabel,
  toggleSocialProfileTopic,
} from "@/lib/social-profile-topics";

export function SocialProfileTopicsField({
  value,
  onChange,
}: {
  value: readonly string[];
  onChange: (next: SocialCategoryTopic[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = parseSocialProfileTopics(value);
  const atMax = socialProfileTopicsAtMax(selected);
  const groups = filterSocialProfileTopicGroups(query);
  const notice = atMax ? SOCIAL.profile.topicsLimit : SOCIAL.profile.topicsHint;

  function toggle(label: string) {
    onChange(toggleSocialProfileTopic(selected, label));
  }

  return (
    <SocialProfileChipSelectFace
      selected={selected.map((topic) => ({ id: topic, label: topic }))}
      countLabel={socialProfileTopicsCountLabel(selected.length)}
      helper={notice}
      searchId="social-edit-topics-search"
      searchValue={query}
      searchPlaceholder={SOCIAL.profile.topicsSearch}
      groups={groups}
      blocked={atMax}
      dataPrefix="social-profile-topic"
      hostAttr="data-social-profile-edit-topics"
      selectedAttr="data-social-profile-edit-topics-selected"
      countAttr="data-social-profile-edit-topics-count"
      noticeAttr="data-social-profile-edit-topics-notice"
      onSearch={setQuery}
      onToggle={toggle}
    />
  );
}

export function SocialProfileTopicsEditor({
  value,
  onChange,
  onBack,
}: {
  value: readonly string[];
  onChange: (next: SocialCategoryTopic[]) => void;
  onBack: () => void;
}) {
  return (
    <SocialProfileEditFace face="topics" title={SOCIAL.profile.topics} onBack={onBack}>
      <SocialProfileTopicsField value={value} onChange={onChange} />
    </SocialProfileEditFace>
  );
}
