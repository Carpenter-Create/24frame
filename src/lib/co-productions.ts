// Co-Productions — Home-pattern lead land (Adam lock 2026-09-19).
// Own path. Not a WorkspaceMode. Not a dest-rail workspace. Not a
// cookie. Lights only under /co-productions. Settings and other hubs
// must not light it.
//
// Chrome icon (Adam lock 2026-09-19): Phosphor Handshake (deal) —
// not camera / cameras / film / clapper. One SoT. Phone Mercury
// bar is the only iconified surface today (desktop pills stay
// labels; dest chips and Settings do not mount a Co-Productions
// glyph). Idle weight is the house register at the call site
// (phone Mercury = Regular). House Phosphor Handshake only —
// Regular keeps optical weight with House / Users / FilmStrip /
// BookOpen. SSR import so the portal RSC page can share this module.
//
// TODO: inquiry form (fields / submit / email) — not this stub.
// TODO: public marketing page on the separate 24Frame site — out of scope.
// TODO: tier gate — pill is visible to all authenticated users for now.

import { Handshake } from "@phosphor-icons/react/ssr";

import type { PhosphorIcon } from "@/lib/phosphor-icon";

export const CO_PRODUCTIONS_HREF = "/co-productions";
export const CO_PRODUCTIONS_LABEL = "Co-Productions";
export const CO_PRODUCTIONS_ICON: PhosphorIcon = Handshake;

export const CO_PRODUCTIONS_PAGE = {
  title: CO_PRODUCTIONS_LABEL,
  synopsis:
    "Qualifying plans can partner with Global Content on co-invested originals — joint ventures with filmmakers that become Global Content originals. An inquiry form is next. This page is the portal door.",
} as const;

function isPrefixed(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isCoProductionsPath(pathname: string): boolean {
  return isPrefixed(pathname, CO_PRODUCTIONS_HREF);
}
