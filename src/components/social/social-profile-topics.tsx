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
import { type SocialCategoryTopic } from "@/lib/social-categories";
import {
  filterSocialProfileTopics,
  parseSocialProfileTopics,
  socialProfileTopicsAtMax,
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
  const topics = filterSocialProfileTopics(query);
  const notice = atMax ? SOCIAL.profile.topicsLimit : SOCIAL.profile.topicsHint;

  function toggle(label: string) {
    onChange(toggleSocialProfileTopic(selected, label));
  }

  return (
    <div data-social-profile-edit-topics="" className={SOCIAL_PROFILE_EDIT_SECTION_CLASS}>
      <div className="flex flex-col gap-2">
        <p className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>{SOCIAL.profile.topics}</p>
        {selected.length > 0 ? (
          <div data-social-profile-edit-topics-selected="" className={SOCIAL_TOPIC_CHIP_BANK_CLASS}>
            {selected.map((topic) => (
              <SocialProfileSelectChip
                key={topic}
                option={{ id: topic, label: topic }}
                selected
                chip
                dataPrefix="social-profile-topic"
                onToggle={toggle}
              />
            ))}
          </div>
        ) : null}
        <p data-social-profile-edit-topics-notice="" className="t-label text-ink-2">
          {notice}
        </p>
      </div>
      <Input
        id="social-edit-topics-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={SOCIAL.profile.topicsSearch}
        aria-label={SOCIAL.profile.topicsSearch}
        autoComplete="off"
      />
      <SocialProfileChipBank
        groups={[{ id: "topics", options: topics.map((topic) => ({ id: topic, label: topic })) }]}
        selectedIds={selected}
        blocked={atMax}
        dataPrefix="social-profile-topic"
        onToggle={toggle}
      />
    </div>
  );
}
