import { HouseLink } from "@/components/chrome/house-link";

import { HouseChipRail } from "@/components/chrome/house-chip-rail";
import { socialTopicRailChipClass, SOCIAL_TOPIC_RAIL_ROWS } from "@/lib/social-chrome";
import {
  SOCIAL_CATEGORY_ALL,
  SOCIAL_CATEGORY_LABELS,
  socialHomeLensHref,
  type SocialCategoryLabel,
} from "@/lib/social-categories";

// Adam 2026-09-22: no section label. The chip rail is the control.
export function SocialHomeTopics({
  active = SOCIAL_CATEGORY_ALL,
}: {
  active?: SocialCategoryLabel;
}) {
  return (
    <div data-social-home-topics="" className="min-w-0">
      <HouseChipRail
        data-social-home-topics-rail=""
        rows={SOCIAL_TOPIC_RAIL_ROWS}
        items={SOCIAL_CATEGORY_LABELS}
        renderItem={(label) => {
          const selected = label === active;
          return (
            <HouseLink
              key={label}
              href={socialHomeLensHref(label, active)}
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
