import { SocialOnboardingChecklist } from "@/components/social/social-checklist";
import { SocialFollowButton } from "@/components/social/social-forms";
import { SocialPersonRow } from "@/components/social/social-ui";
import {
  SOCIAL_FOR_YOU_CARD_CLASS,
  SOCIAL_FOR_YOU_RAIL_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL, socialMemberHref } from "@/lib/social";
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
              <SocialPersonRow
                handle={person.handle}
                displayName={person.display_name}
                photoUrl={faces.get(person.id)}
                href={socialMemberHref(person.handle)}
              />
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
    </aside>
  );
}
