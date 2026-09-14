import Link from "next/link";

import { SocialOnboardingChecklist } from "@/components/social/social-checklist";
import { SOCIAL_EMPTY_ACTION_CLASS, SOCIAL_FIRST_WIN_CLASS } from "@/lib/social-chrome";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { socialChecklistRemaining, type SocialChecklistItem } from "@/lib/social-home";

export function SocialFirstWin({ items }: { items: readonly SocialChecklistItem[] }) {
  const remaining = socialChecklistRemaining(items);
  return (
    <div data-social-first-win="" className={`${SOCIAL_FIRST_WIN_CLASS} hidden md:flex`}>
      <p className="text-[18px] font-semibold text-ink">{SOCIAL.checklist.firstPost}</p>
      <p className="t-body-sm text-ink-2">{SOCIAL.checklist.firstWinHint}</p>
      <Link href={SOCIAL_ROUTES.create} className={`${SOCIAL_EMPTY_ACTION_CLASS} rounded-[24px]`}>
        {SOCIAL.checklist.firstPostCta}
      </Link>
      {remaining > 0 ? (
        <details data-social-first-win-setup="" className="w-full">
          <summary className="cursor-pointer text-center t-label text-ink-2">
            {remaining} {SOCIAL.checklist.setupAvailable}{" "}
            <span className="font-semibold text-accent">{SOCIAL.checklist.showSetup}</span>
          </summary>
          <div className="mt-3 text-left">
            <SocialOnboardingChecklist items={items} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
