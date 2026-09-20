import Link from "next/link";

import { HouseChipRail } from "@/components/chrome/house-chip-rail";
import { SOCIAL_TOPIC_RAIL_CHIP_CLASS } from "@/lib/social-chrome";
import { socialHomeLensHref } from "@/lib/social-categories";
import { SOCIAL } from "@/lib/social";
import { socialInterestTopics } from "@/lib/social-role-affinity";

export function SocialHomeTopics({
  topics = [],
  crafts = [],
}: {
  topics?: readonly string[];
  crafts?: readonly string[];
}) {
  const labels = socialInterestTopics({ topics, crafts });
  if (labels.length === 0) return null;

  return (
    <section data-social-home-topics="" className="flex min-w-0 flex-col gap-2">
      <p className="t-body-sm font-semibold text-ink">{SOCIAL.forYou.topics}</p>
      <HouseChipRail
        data-social-home-topics-rail=""
        items={labels}
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
