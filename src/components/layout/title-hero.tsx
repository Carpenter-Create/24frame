import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";

import { Artwork } from "./artwork";
import { cn } from "@/lib/cn";
import { catalogStatusPillClass } from "@/lib/titles-catalog";

// Title-detail landscape hero in the house shell. Banner (horizontal) fills a
// ~16:9 frame; missing art is a muted placeholder — a poster is not
// force-cropped. Title, ink status, and facts sit below on the light canvas.

export function TitleHero({
  title,
  backHref,
  backLabel = "Back",
  status,
  statusLabel,
  bannerUrl,
  facts = [],
  action,
}: {
  title: string;
  backHref: string;
  backLabel?: string;
  status: string;
  statusLabel: string;
  bannerUrl: string | null;
  facts?: { label: string; value: React.ReactNode }[];
  action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[var(--space-6)]" data-title-hero="">
      <div
        className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface-muted [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center"
        data-title-hero-frame=""
        data-title-hero-crop="cover"
      >
        {bannerUrl ? (
          <Artwork
            src={bannerUrl}
            title={title}
            rounded="rounded-none"
            className="absolute inset-0 h-full w-full"
            sizes="(max-width: 768px) 100vw, 960px"
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

      <div className="flex flex-col gap-[var(--space-4)]">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1 t-body-sm text-ink-2 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          {backLabel}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-[var(--space-4)]">
          <div className="flex min-w-0 flex-col gap-[var(--space-2)]">
            <h1 className="t-section leading-tight text-ink">{title}</h1>
            {facts.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-[var(--space-4)] gap-y-[var(--space-1)]">
                {facts.map((f, i) => (
                  <span key={i} className="t-body-sm text-ink-2">
                    <span className="text-ink-3">{f.label}: </span>
                    <span className="t-data text-ink">{f.value}</span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
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
        {action ? <div>{action}</div> : null}
      </div>
    </section>
  );
}
