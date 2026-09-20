import Link from "next/link";

import {
  SOCIAL_TOPIC_CHIP_ROW_CLASS,
  SOCIAL_TOPIC_RAIL_CHIP_CLASS,
  SOCIAL_TOPIC_RAIL_CLASS,
} from "@/lib/social-chrome";
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
      <div data-social-home-topics-rail="" className={SOCIAL_TOPIC_RAIL_CLASS}>
        <div className={SOCIAL_TOPIC_CHIP_ROW_CLASS}>
          {labels.map((label) => (
            <Link
              key={label}
              href={socialHomeLensHref(label, "All")}
              data-social-home-topic={label}
              className={SOCIAL_TOPIC_RAIL_CHIP_CLASS}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
