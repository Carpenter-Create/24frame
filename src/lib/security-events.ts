// Security event types, UA parsing, and copy for Settings → Security.
//
// UA parsing produces source labels like the reference screenshot:
//   "Chrome (macOS, 10.15.7)" or "iOS App (iOS, 26.6.2)"
// Never invent a device or platform that isn't in the raw user-agent.

export const SECURITY_EVENT_KINDS = [
  "sign_in",
  "sign_out",
  "failed_sign_in",
  "invite_sent",
  "invite_accepted",
  "invite_withdrawn",
  "role_change",
] as const;

export type SecurityEventKind = (typeof SECURITY_EVENT_KINDS)[number];

export const SECURITY_EVENT_LABELS: Record<SecurityEventKind, string> = {
  sign_in: "Log in",
  sign_out: "Log out",
  failed_sign_in: "Failed sign-in",
  invite_sent: "Invite sent",
  invite_accepted: "Invite accepted",
  invite_withdrawn: "Invite withdrawn",
  role_change: "Role change",
} as const;

export const SECURITY_HISTORY_COLUMNS = [
  "Date and time",
  "Team member",
  "Event",
  "Source",
  "IP Address",
] as const;

export const SECURITY_PAGE = {
  title: "Security",
  href: "/settings/security",
  subtitle: "Activity history for your organization.",
  historyHeading: "Activity history from all users",
  emptyState: "No security events recorded yet.",
} as const;

// ---------------------------------------------------------------------------
// UA → source label
// ---------------------------------------------------------------------------

const BROWSER_PATTERNS: [RegExp, string][] = [
  [/Edg(?:e|A)?\/[\d.]+/, "Edge"],
  [/OPR\/[\d.]+|Opera\/[\d.]+/, "Opera"],
  [/Chrome\/[\d.]+/, "Chrome"],
  [/Safari\/[\d.]+/, "Safari"],
  [/Firefox\/[\d.]+/, "Firefox"],
];

const OS_PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/Mac OS X ([\d_.]+)/, (m) => `macOS, ${m[1].replace(/_/g, ".")}`],
  [/Windows NT ([\d.]+)/, (m) => `Windows, ${m[1]}`],
  [/Android ([\d.]+)/, (m) => `Android, ${m[1]}`],
  [/iPhone OS ([\d_]+)/, (m) => `iOS, ${m[1].replace(/_/g, ".")}`],
  [/iPad.*OS ([\d_]+)/, (m) => `iPadOS, ${m[1].replace(/_/g, ".")}`],
  [/CrOS/, () => "ChromeOS"],
  [/Linux/, () => "Linux"],
];

/** Parse a raw user-agent into a browser+OS source label.
 *  Returns null for empty/unparseable strings. */
export function parseSourceLabel(ua: string | null | undefined): string | null {
  if (!ua) return null;

  let browser: string | null = null;
  for (const [re, name] of BROWSER_PATTERNS) {
    if (re.test(ua)) {
      browser = name;
      break;
    }
  }

  let os: string | null = null;
  for (const [re, fmt] of OS_PATTERNS) {
    const match = ua.match(re);
    if (match) {
      os = fmt(match);
      break;
    }
  }

  if (browser && os) return `${browser} (${os})`;
  if (browser) return browser;
  if (os) return os;
  return null;
}

// ---------------------------------------------------------------------------
// Event icon class — plain inline icon next to the label (reference grammar).
// No pill. No colored background. Icon inherits text color.
// ---------------------------------------------------------------------------
export const SECURITY_EVENT_ICON_CLASS = "size-4 shrink-0";
