import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";

import { Artwork } from "./artwork";
import { cn } from "@/lib/cn";
import { catalogStatusPillClass } from "@/lib/titles-catalog";

// Title-detail hero in the house shell: leading art, title / ink status /
// quiet meta to the right, primary action under the meta. Landscape banner
// when it exists; square poster crop otherwise; muted placeholder if neither.
// House light canvas — not a full-bleed band.

export function TitleHero({
  title,
  backHref,
  backLabel = "Back",
  status,
  statusLabel,
  bannerUrl,
  posterUrl = null,
  meta = [],
  action,
  secondary,
}: {
  title: string;
  backHref: string;
  backLabel?: string;
  status: string;
  statusLabel: string;
  bannerUrl: string | null;
  posterUrl?: string | null;
  meta?: string[];
  action?: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  const artUrl = bannerUrl || posterUrl;
  const artShape = bannerUrl ? "landscape" : posterUrl ? "square" : "landscape";

  return (
    <section className="flex flex-col gap-[var(--space-4)]" data-title-hero="">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1 t-body-sm text-ink-2 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        {backLabel}
      </Link>

      <div
        className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-start"
        data-title-hero-band=""
      >
        <div
          className={cn(
            "relative w-full shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface-muted [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center",
            artShape === "square"
              ? "aspect-square md:w-56"
              : "aspect-[16/9] md:w-80",
          )}
          data-title-hero-frame=""
          data-title-hero-crop="cover"
          data-title-hero-art={artShape}
        >
          {artUrl ? (
            <Artwork
              src={artUrl}
              title={title}
              rounded="rounded-none"
              className="absolute inset-0 h-full w-full"
              sizes="(max-width: 768px) 100vw, 320px"
              priority
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center bg-surface-muted"
              data-title-hero-empty-art=""
            >
              <Camera className="h-8 w-8 text-ink-3" strokeWidth={1.5} aria-hidden />
            </div>
          )}
        </div>

        <div
          className="flex min-w-0 flex-1 flex-col gap-[var(--space-3)]"
          data-title-hero-meta=""
        >
          <div className="flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-2)]">
            <h1 className="t-title leading-tight text-ink">{title}</h1>
            <span
              className={cn(
                "inline-flex w-fit shrink-0 items-center rounded-full px-[var(--space-3)] py-[var(--space-1)] t-body-sm",
                catalogStatusPillClass(status),
              )}
              data-title-hero-status=""
            >
              {statusLabel}
            </span>
          </div>
          {meta.length > 0 ? (
            <p className="t-body-sm text-ink-3" data-title-hero-facts="">
              {meta.join(" · ")}
            </p>
          ) : null}
          {action || secondary ? (
            <div
              className="flex flex-wrap items-center gap-[var(--space-2)]"
              data-title-hero-actions=""
            >
              {action}
              {secondary}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
