import Link from "next/link";

import { TitlesLandscapeArt } from "@/components/titles/titles-catalog";
import {
  AVAILS_EMPTY_CLASS,
  AVAILS_GRID_CLASS,
  AVAILS_PAGE,
  AVAILS_TILE_ART_CLASS,
  AVAILS_TILE_CLASS,
  AVAILS_TILE_TITLE_CLASS,
  type AvailsTile,
} from "@/lib/avails";

export function AvailsEmpty() {
  return (
    <div className={AVAILS_EMPTY_CLASS} data-avails-empty="">
      <p className="t-body-sm text-ink-3">{AVAILS_PAGE.empty}</p>
    </div>
  );
}

export function AvailsTile({ href, title, stillUrl }: AvailsTile) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={AVAILS_TILE_CLASS}
      data-avails-tile=""
    >
      <TitlesLandscapeArt
        title={title}
        stillUrl={stillUrl}
        className={AVAILS_TILE_ART_CLASS}
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <span className={AVAILS_TILE_TITLE_CLASS} data-avails-tile-title="">
        {title}
      </span>
    </Link>
  );
}

export function AvailsGrid({ tiles }: { tiles: AvailsTile[] }) {
  if (tiles.length === 0) return <AvailsEmpty />;

  return (
    <div className={AVAILS_GRID_CLASS} data-avails-grid="">
      {tiles.map((tile) => (
        <AvailsTile key={tile.id} {...tile} />
      ))}
    </div>
  );
}
