import Link from "next/link";

import { SocialOnboardingChecklist } from "@/components/social/social-checklist";
import { SocialFollowButton } from "@/components/social/social-forms";
import { SocialAvatar } from "@/components/social/social-ui";
import {
  SOCIAL_FOR_YOU_CARD_CLASS,
  SOCIAL_FOR_YOU_RAIL_CLASS,
  SOCIAL_TOPIC_CHIP_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_CATEGORY_TOPICS, socialHomeLensHref } from "@/lib/social-categories";
import { displayHandle, SOCIAL, socialMemberHref } from "@/lib/social";
import { socialChecklistIncomplete, type SocialChecklistItem } from "@/lib/social-home";
import type { SocialSuggestedPerson } from "@/lib/social-feed";

export function SocialForYouRail({
  people,
  faces,
  layout = "rail",
  checklist = [],
}: {
  people: readonly SocialSuggestedPerson[];
  faces: ReadonlyMap<string, string | null>;
  layout?: "rail" | "lane";
  checklist?: readonly SocialChecklistItem[];
}) {
  const showChecklist = layout === "rail" && socialChecklistIncomplete(checklist);

  return (
    <aside
      data-social-for-you=""
      data-social-for-you-layout={layout}
      className={layout === "lane" ? "flex w-full flex-col gap-3" : SOCIAL_FOR_YOU_RAIL_CLASS}
    >
      {showChecklist ? <SocialOnboardingChecklist items={checklist} tone="nested" /> : null}
      <div className="flex items-center justify-between">
        <p className="t-body-sm font-medium text-ink-2">{SOCIAL.forYou.title}</p>
      </div>
      {people.length > 0 ? (
        <div data-social-for-you-people="" className={SOCIAL_FOR_YOU_CARD_CLASS}>
          <p className="t-body-sm font-semibold text-ink">{SOCIAL.forYou.people}</p>
          {people.map((person) => (
            <div
              key={person.id}
              data-social-for-you-person={person.id}
              className="flex items-center justify-between gap-[10px]"
            >
              <Link
                href={socialMemberHref(person.handle)}
                className="flex min-w-0 items-center gap-[10px]"
              >
                <SocialAvatar
                  name={person.display_name}
                  photoUrl={faces.get(person.id)}
                  size="sm"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-ink">
                    {person.display_name}
                  </span>
                  <span className="block truncate text-[11px] text-ink-2">
                    {displayHandle(person.handle)}
                  </span>
                </span>
              </Link>
              <SocialFollowButton
                followeeId={person.id}
                handle={person.handle}
                following={false}
                compact
              />
            </div>
          ))}
        </div>
      ) : null}
      <div data-social-for-you-topics="" className={SOCIAL_FOR_YOU_CARD_CLASS}>
        <p className="t-body-sm font-semibold text-ink">{SOCIAL.forYou.topics}</p>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_CATEGORY_TOPICS.map((label) => (
            <Link
              key={label}
              href={socialHomeLensHref(label, "All")}
              data-social-for-you-topic={label}
              className={SOCIAL_TOPIC_CHIP_CLASS}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
