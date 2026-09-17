// Client Aggregation catalog ID. Same titles.catalog_no as ops `GC-#######`,
// different public prefix. UUID stays the primary key and never belongs in a
// client title URL. Stored catalog_id is the generated ops form (GC- + digits).

export const CLIENT_CATALOG_PREFIX = "24F";
export const OPS_CATALOG_PREFIX = "GC";

/** Canonical 8-4-4-4-12 hex UUID. Stored lowercase; match is case-insensitive. */
const CANONICAL_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CATALOG_REF_RE = /^(24F|GC)-([0-9]+)$/i;
const DIGITS_RE = /^[0-9]+$/;

export type TitleRouteLookup =
  | { field: "id"; value: string }
  | { field: "catalog_id"; value: string }
  | { field: "catalog_no"; value: number };

export function isCanonicalUuid(value: string): boolean {
  return CANONICAL_UUID_RE.test(value);
}

/** Ops catalog_id (`GC-0001234`) from a stored or pasted catalog ref. */
export function opsCatalogId(storedCatalogId: string | null | undefined): string | null {
  const match = CATALOG_REF_RE.exec((storedCatalogId ?? "").trim());
  return match ? `${OPS_CATALOG_PREFIX}-${match[2]}` : null;
}

/** Public catalog id (`24F-0001234`) from a stored or pasted catalog ref. */
export function publicCatalogId(storedCatalogId: string | null | undefined): string | null {
  const match = CATALOG_REF_RE.exec((storedCatalogId ?? "").trim());
  return match ? `${CLIENT_CATALOG_PREFIX}-${match[2]}` : null;
}

export function titleClientPath(
  storedCatalogId: string | null | undefined,
  extra = "",
): string {
  const pub = publicCatalogId(storedCatalogId);
  if (!pub) return extra ? `/titles${extra}` : "/titles";
  return `/titles/${pub}${extra}`;
}

export function isCanonicalTitleSlug(
  slug: string,
  storedCatalogId: string | null | undefined,
): boolean {
  const pub = publicCatalogId(storedCatalogId);
  return !!pub && slug === pub;
}

/**
 * Normalize-on-input lookups, in order. Prefixed and bare-digit slugs try the
 * generated ops catalog_id first, then catalog_no so `1234` still resolves
 * when the stored id is `GC-0012347` (zero-pad + check digit).
 */
export function titleRouteLookups(param: string): TitleRouteLookup[] | null {
  const raw = param.trim();
  if (!raw) return null;
  if (isCanonicalUuid(raw)) return [{ field: "id", value: raw.toLowerCase() }];

  const prefixed = CATALOG_REF_RE.exec(raw);
  if (prefixed) {
    const suffix = prefixed[2];
    return catalogLookups(suffix);
  }
  if (DIGITS_RE.test(raw)) return catalogLookups(raw);
  return null;
}

function catalogLookups(digits: string): TitleRouteLookup[] {
  const lookups: TitleRouteLookup[] = [{ field: "catalog_id", value: `${OPS_CATALOG_PREFIX}-${digits}` }];
  const catalogNo = Number(digits);
  if (Number.isInteger(catalogNo) && catalogNo >= 0) {
    lookups.push({ field: "catalog_no", value: catalogNo });
  }
  return lookups;
}

/** First successful lookup. Stops after a hit so a UUID never falls through. */
export async function firstTitleMatch<Row>(
  lookup: (filter: TitleRouteLookup) => Promise<Row | null>,
  param: string,
): Promise<Row | null> {
  const filters = titleRouteLookups(param);
  if (!filters) return null;
  for (const filter of filters) {
    const row = await lookup(filter);
    if (row) return row;
  }
  return null;
}
