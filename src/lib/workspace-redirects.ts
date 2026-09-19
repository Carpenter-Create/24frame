import {
  AGGREGATION_ROOT,
  EDUCATION_ROOT,
  HOME_ROOT,
  LEGACY_EDUCATION_PREFIX,
  aggregationPath,
} from "./workspace";

// Permanent URL IA redirects. SoT for next.config.ts — do not duplicate
// destination strings elsewhere. Leftover page.tsx stubs may also call
// redirect() for the same map; next.config is the 308 edge hop.

export type WorkspaceRedirect = {
  source: string;
  destination: string;
  permanent: true;
};

const PERMANENT = true as const;

function hop(source: string, destination: string): WorkspaceRedirect {
  return { source, destination, permanent: PERMANENT };
}

const AGGREGATION_HOME = aggregationPath("dashboard");
const REPORTS = aggregationPath("reports");
const TITLES = aggregationPath("titles");
const ATTENTION = aggregationPath("attention");
const CHANNELS = aggregationPath("channels");
const EDUCATION_MANAGE = `${EDUCATION_ROOT}/manage`;

export const WORKSPACE_REDIRECTS: readonly WorkspaceRedirect[] = [
  hop("/", AGGREGATION_HOME),
  hop(AGGREGATION_ROOT, AGGREGATION_HOME),

  hop("/dashboard", AGGREGATION_HOME),
  hop("/dashboard/:path*", `${AGGREGATION_HOME}/:path*`),
  hop("/titles", TITLES),
  hop("/titles/:path*", `${TITLES}/:path*`),
  hop("/attention", ATTENTION),
  hop("/attention/:path*", `${ATTENTION}/:path*`),
  hop("/activity", aggregationPath("activity")),
  hop("/activity/:path*", `${aggregationPath("activity")}/:path*`),
  hop("/reports", REPORTS),
  hop("/reports/:path*", `${REPORTS}/:path*`),
  hop("/messages", aggregationPath("messages")),
  hop("/messages/:path*", `${aggregationPath("messages")}/:path*`),
  hop("/queue", aggregationPath("queue")),
  hop("/queue/:path*", `${aggregationPath("queue")}/:path*`),
  hop("/avails", aggregationPath("avails")),
  hop("/avails/:path*", `${aggregationPath("avails")}/:path*`),
  hop("/channels", CHANNELS),
  hop("/channels/:path*", `${CHANNELS}/:path*`),

  hop("/analytics", REPORTS),
  hop("/analytics/:path*", `${REPORTS}/:path*`),
  hop("/earn", REPORTS),
  hop("/earn/:path*", `${REPORTS}/:path*`),
  hop("/finance", REPORTS),
  hop("/finance/:path*", `${REPORTS}/:path*`),

  hop("/catalog-health", ATTENTION),
  hop("/catalog-health/:path*", `${ATTENTION}/:path*`),
  hop("/deliveries", TITLES),
  hop("/deliveries/:path*", `${TITLES}/:path*`),
  hop("/vendors", CHANNELS),
  hop("/vendors/:path*", `${CHANNELS}/:path*`),
  hop("/overview", HOME_ROOT),
  hop("/overview/:path*", `${HOME_ROOT}/:path*`),
  hop("/news", `${HOME_ROOT}/news`),

  // Older staff CMS door. Keep before the generic /gc/:path* hop.
  hop("/gc/education", EDUCATION_MANAGE),
  hop("/gc/education/:slug", `${EDUCATION_MANAGE}/:slug`),
  hop("/gc/:path*", `${aggregationPath("gc")}/:path*`),

  hop(LEGACY_EDUCATION_PREFIX, EDUCATION_ROOT),
  hop(`${LEGACY_EDUCATION_PREFIX}/:path*`, `${EDUCATION_ROOT}/:path*`),
];
