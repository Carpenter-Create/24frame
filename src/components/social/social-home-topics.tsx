import Link from "next/link";

import { HouseChipRail } from "@/components/chrome/house-chip-rail";
import { SOCIAL_TOPIC_RAIL_CHIP_CLASS, SOCIAL_TOPIC_RAIL_ROWS } from "@/lib/social-chrome";
import { SOCIAL_CATEGORY_TOPICS, socialHomeLensHref } from "@/lib/social-categories";
import { SOCIAL } from "@/lib/social";

export function SocialHomeTopics() {
  return (
    <section data-social-home-topics="" className="flex min-w-0 flex-col gap-2">
      <p className="t-body-sm font-semibold text-ink">{SOCIAL.forYou.topics}</p>
      <HouseChipRail
        data-social-home-topics-rail=""
        rows={SOCIAL_TOPIC_RAIL_ROWS}
        items={SOCIAL_CATEGORY_TOPICS}
        renderItem={(label) => (
          <Link
            key={label}
            href={socialHomeLensHref(label, "All")}
            data-social-home-topic={label}
            className={SOCIAL_TOPIC_RAIL_CHIP_CLASS}
          >
            {label}
          </Link>
        )}
      />
    </section>
  );
}
