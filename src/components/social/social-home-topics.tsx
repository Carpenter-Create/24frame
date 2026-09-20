import Link from "next/link";

import {
  SOCIAL_FOR_YOU_CARD_CLASS,
  SOCIAL_TOPIC_CHIP_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_CATEGORY_TOPICS, socialHomeLensHref } from "@/lib/social-categories";
import { SOCIAL } from "@/lib/social";

export function SocialHomeTopics() {
  return (
    <section data-social-home-topics="" className={SOCIAL_FOR_YOU_CARD_CLASS}>
      <p className="t-body-sm font-semibold text-ink">{SOCIAL.forYou.topics}</p>
      <div className="flex flex-wrap gap-2">
        {SOCIAL_CATEGORY_TOPICS.map((label) => (
          <Link
            key={label}
            href={socialHomeLensHref(label, "All")}
            data-social-home-topic={label}
            className={SOCIAL_TOPIC_CHIP_CLASS}
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
