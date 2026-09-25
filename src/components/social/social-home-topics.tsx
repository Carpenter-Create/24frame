"use client";

import { HouseLink } from "@/components/chrome/house-link";

import { HouseChipRail } from "@/components/chrome/house-chip-rail";
import {
  SOCIAL_HOME_TOPICS_CLASS,
  socialTopicRailChipClass,
  SOCIAL_TOPIC_RAIL_ROWS,
} from "@/lib/social-chrome";
import {
  SOCIAL_CATEGORY_ALL,
  SOCIAL_CATEGORY_LABELS,
  socialHomeLensHref,
  type SocialCategoryLabel,
} from "@/lib/social-categories";

import { useSocialHomeLive } from "./social-home-live";

// Adam 2026-09-22: no section label. The chip rail is the control.
// Selected chip follows the owned href, same as profile tabs.
export function SocialHomeTopics({
  active = SOCIAL_CATEGORY_ALL,
}: {
  active?: SocialCategoryLabel;
}) {
  const topic = useSocialHomeLive("following", active).topic;
  return (
    <div data-social-home-topics="" className={SOCIAL_HOME_TOPICS_CLASS}>
      <HouseChipRail
        data-social-home-topics-rail=""
        rows={SOCIAL_TOPIC_RAIL_ROWS}
        items={SOCIAL_CATEGORY_LABELS}
        renderItem={(label) => {
          const selected = label === topic;
          return (
            <HouseLink
              key={label}
              href={socialHomeLensHref(label, topic)}
              data-social-home-topic={label}
              data-social-home-topic-active={selected ? "" : undefined}
              aria-current={selected ? "page" : undefined}
              className={socialTopicRailChipClass(selected)}
            >
              {label}
            </HouseLink>
          );
        }}
      />
    </div>
  );
}
