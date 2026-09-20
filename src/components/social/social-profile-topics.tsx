"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { SOCIAL_PROFILE_EDIT_LABEL_CLASS, SOCIAL_TOPIC_CHIP_CLASS } from "@/lib/social-chrome";
import { SOCIAL } from "@/lib/social";
import {
  filterSocialProfileTopics,
  parseSocialProfileTopics,
  toggleSocialProfileTopic,
} from "@/lib/social-profile-topics";

export function SocialProfileTopicsField({
  value,
  onChange,
}: {
  value: readonly string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = parseSocialProfileTopics(value);
  const topics = filterSocialProfileTopics(query);

  return (
    <div data-social-profile-edit-topics="" className="flex flex-col gap-3 py-4">
      <div className="flex flex-col gap-2">
        <p className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>{SOCIAL.profile.topics}</p>
        {selected.length > 0 ? (
          <div data-social-profile-edit-topics-selected="" className="flex flex-wrap gap-2">
            {selected.map((topic) => (
              <button
                key={topic}
                type="button"
                data-social-profile-topic-chip={topic}
                className={SOCIAL_TOPIC_CHIP_CLASS}
                onClick={() => onChange(toggleSocialProfileTopic(selected, topic))}
              >
                {topic}
              </button>
            ))}
          </div>
        ) : null}
        <p className="t-label text-ink-2">{SOCIAL.profile.topicsHint}</p>
      </div>
      <Input
        id="social-edit-topics-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={SOCIAL.profile.topicsSearch}
        aria-label={SOCIAL.profile.topicsSearch}
        autoComplete="off"
      />
      <div className="flex flex-col gap-1">
        {topics.map((topic) => {
          const checked = selected.includes(topic);
          return (
            <label
              key={topic}
              data-social-profile-topic={topic}
              data-social-profile-topic-selected={checked ? "" : undefined}
              className="flex w-full items-start gap-3 py-2"
            >
              <input
                type="checkbox"
                className="mt-0.5 accent-ink"
                checked={checked}
                onChange={() => onChange(toggleSocialProfileTopic(selected, topic))}
              />
              <span className="min-w-0 flex-1 break-words t-body-sm text-ink">{topic}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
