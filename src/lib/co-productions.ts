// Co-Productions — Home-pattern lead land (Adam lock 2026-09-19).
// Own path. Not a WorkspaceMode. Not a dest-rail workspace. Not a
// cookie. Lights only under /co-productions. Settings and other hubs
// must not light it.
//
// TODO: inquiry form (fields / submit / email) — not this stub.
// TODO: public marketing page on the separate 24Frame site — out of scope.
// TODO: tier gate — pill is visible to all authenticated users for now.

export const CO_PRODUCTIONS_HREF = "/co-productions";
export const CO_PRODUCTIONS_LABEL = "Co-Productions";

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
