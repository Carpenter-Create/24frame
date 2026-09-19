import {
  DASHBOARD_HOME_STACK,
  type ClientHomeFinding,
  type ClientHomeTitle,
} from "@/lib/dashboard-home";
import { titleClientPath } from "@/lib/title-public-id";
import { aggregationPath } from "@/lib/workspace";

// Company-admin `/aggregation/dashboard` Attention glance. Catalog findings now.
// Contract kinds are craft-capable later — no contract schema invent.
// Row = what + timestamp. Cap 5. View all → Attention. Not readiness buckets.

export const ATTENTION_HREF = aggregationPath("attention");
export const CATALOG_HEALTH_HREF = "/catalog-health";

export const DASHBOARD_ATTENTION = {
  title: "Attention",
  empty: "Nothing needs your attention right now.",
  viewAllHref: ATTENTION_HREF,
} as const;

export const ATTENTION_KINDS = ["catalog", "contract"] as const;
export type AttentionKind = (typeof ATTENTION_KINDS)[number];

export const DASHBOARD_ATTENTION_CAP = DASHBOARD_HOME_STACK;

export type AttentionTitle = ClientHomeTitle & {
  catalog_id?: string | null;
};

export type AttentionRow = {
  id: string;
  what: string;
  at: string;
  href: string;
  kind: AttentionKind;
};

export type AttentionSnapshot = {
  rows: AttentionRow[];
};

function findingWhat(finding: ClientHomeFinding): string | null {
  const message = finding.message?.trim();
  return message ? message : null;
}

function findingAt(finding: ClientHomeFinding): string | null {
  const at = finding.created_at?.trim();
  return at ? at : null;
}

/**
 * Dated catalog findings, newest first. Contract rows are reserved — this
 * builder never emits them. No licensing readiness buckets.
 */
export function buildAttentionGlance(input: {
  findings: readonly ClientHomeFinding[];
  titles: readonly AttentionTitle[];
}): AttentionSnapshot {
  const titleById = new Map(input.titles.map((title) => [title.id, title]));
  const rows = input.findings
    .flatMap((finding): AttentionRow[] => {
      const what = findingWhat(finding);
      const at = findingAt(finding);
      if (!what || !at) return [];
      const title = titleById.get(finding.entity_id);
      return [
        {
          id: finding.id ?? `${finding.entity_id}:${at}:${what}`,
          what,
          at,
          href: title
            ? titleClientPath(title.catalog_id)
            : `/titles/${finding.entity_id}`,
          kind: "catalog",
        },
      ];
    })
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, DASHBOARD_ATTENTION_CAP);

  return { rows };
}
