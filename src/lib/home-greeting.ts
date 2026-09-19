// Home page H1 greeting + quiet date line. Workspace pill and
// bottom-nav stay "Home" (`OVERVIEW_PAGE.title`). Session SoT is
// AuthUser.name — the same user_metadata.display_name avatar / account
// already read. Never invent a name from the email local-part. Date is
// weekday + month + day in America/Chicago — no year, no clock.

import { userMenuName } from "@/lib/user-menu";

export const HOME_GREETING_BARE = "Hi";
export const HOME_GREETING_TIME_ZONE = "America/Chicago";

function personGivenName(value: string | null | undefined): string | null {
  const name = userMenuName(value);
  if (!name) return null;
  if (name.includes("@")) return null;
  if (/^(undefined|null)$/i.test(name)) return null;
  return name;
}

/** Given name, else first token of display name. Absent stays absent. */
export function homeGreetingFirst(input: {
  firstName?: string | null;
  displayName?: string | null;
} = {}): string | null {
  const given = personGivenName(input.firstName);
  if (given) return given;
  const display = personGivenName(input.displayName);
  if (!display) return null;
  return personGivenName(display.split(/\s+/)[0] ?? null);
}

/** `Hi, {First}` (comma + space) when a first name exists; otherwise `Hi`. */
export function homeGreeting(input: {
  firstName?: string | null;
  displayName?: string | null;
} = {}): string {
  const first = homeGreetingFirst(input);
  return first ? `${HOME_GREETING_BARE}, ${first}` : HOME_GREETING_BARE;
}

/** `Friday, September 18` in product-local TZ. No year, no clock. */
export function homeGreetingDate(
  now: Date,
  timeZone: string = HOME_GREETING_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(now);
}
