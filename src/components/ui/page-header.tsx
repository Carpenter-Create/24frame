import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import { cn } from "@/lib/cn";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";

// Ported from watershedportal PageHeader — proportions kept, rethemed: GC `.t-*`
// type (not the Watershed serif `.page-title`), token colors.
export type PageHeaderBackLinkProps = {
  href: string;
  label?: string;
  className?: string;
};

// House SoT page-lead back — News / PageHeader ArrowLeft. Not CaretLeft.
// Settings page-lead reuses this; do not fork a third back glyph.
export function PageHeaderBackLink({ href, label, className }: PageHeaderBackLinkProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-1", TEXT_ACTION_CLASS, className)}
    >
      <ArrowLeft className="h-4 w-4" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
      {label ?? "Back"}
    </Link>
  );
}

type Props = {
  title: string;
  /** Uppercase accent kicker above the title — the site's "THE PLATFORM" register. */
  eyebrow?: string;
  subtitle?: string;
  backLink?: { href: string; label?: string };
  actions?: React.ReactNode;
  className?: string;
};

// The ONE page header for every surface (layout standard). Eyebrow → title → subtitle
// on the left; actions (view toggle, buttons) on the right. No page hand-rolls its own.
export function PageHeader({ title, eyebrow, subtitle, backLink, actions, className }: Props) {
  return (
    <div className={cn("flex items-start justify-between gap-4 pb-6", className)}>
      <div className="flex flex-col gap-1">
        {backLink ? <PageHeaderBackLink href={backLink.href} label={backLink.label} /> : null}
        {eyebrow ? <span className="t-label text-accent">{eyebrow}</span> : null}
        <h1 className="t-title text-ink">{title}</h1>
        {subtitle ? <p className="t-body-sm text-ink-3">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
