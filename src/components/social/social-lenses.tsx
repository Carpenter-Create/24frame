import Link from "next/link";

import { cn } from "@/lib/cn";
import {
  SOCIAL_CATEGORY_LABELS,
  socialHomeLensHref,
  type SocialCategoryLabel,
} from "@/lib/social-categories";

// Home-only topic row. Re-tap of the active pill returns All.
// Explore / Create / Messages / Profile must not mount this.

export function SocialLensRow({ active }: { active: SocialCategoryLabel }) {
  return (
    <div data-social-lenses="" className="-mx-[var(--content-inset)] overflow-x-auto px-[var(--content-inset)]">
      <div className="flex w-max gap-[var(--space-2)] pb-[var(--space-3)]">
        {SOCIAL_CATEGORY_LABELS.map((label) => {
          const current = label === active;
          return (
            <Link
              key={label}
              href={socialHomeLensHref(label, active)}
              data-social-lens={label}
              data-social-lens-active={current ? "" : undefined}
              className={cn(
                "rounded-full px-[var(--space-3)] py-[var(--space-2)] t-body-sm whitespace-nowrap",
                current
                  ? "bg-surface-muted font-medium text-ink"
                  : "text-ink-2 hover:bg-surface-muted hover:text-ink",
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
