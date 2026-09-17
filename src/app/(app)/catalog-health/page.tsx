import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { FindingRows } from "@/components/findings/findings-card";
import { InlineNotice } from "@/components/ui/inline-notice";
import {
  CATALOG_HEALTH_EMPTY,
  CATALOG_HEALTH_SUBTITLE,
  CATALOG_HEALTH_TITLE,
  CATALOG_HEALTH_TRUNCATED,
  catalogHealthCountLabel,
  catalogHealthTitleHref,
} from "@/lib/findings";
import { UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";
import { loadMyFindings } from "@/lib/my-lists";

// Catalog Health = findings/health overview (§19). A client org stays org-scoped.
// GC staff with no client org see the same findings UI across every org — my_findings
// already returns those rows because member_can('view') routes staff through gc_can,
// and titles/findings RLS already allow the queue's cross-org reads. Do not
// manufacture an org; do not send staff to /queue or the wizard.
export default async function CatalogHealthPage() {
  const supabase = await createClient();
  // Resolved once per request and shared with the layout above (React cache()).
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (!ctx.activeOrg && !ctx.isGcStaff) redirect("/");

  const activeOrgId = ctx.activeOrg?.id ?? null;
  const gcWide = ctx.isGcStaff && !activeOrgId;

  const loaded = await loadMyFindings(
    supabase,
    activeOrgId ? { orgId: activeOrgId } : undefined,
  );
  const findings = loaded.rows;

  const titleIds = [...new Set(findings.map((f) => f.entity_id))];
  const { data: titleRows } = titleIds.length
    ? await supabase
        .from("titles")
        .select("id, title, catalog_id, organizations(name)")
        .in("id", titleIds)
        .range(...rangeFor(UNPAGINATED_MAX))
    : { data: [] as { id: string; title: string; catalog_id: string | null; organizations: { name: string } | null }[] };
  const titleById = new Map((titleRows ?? []).map((t) => [t.id, t]));

  const byTitle: Record<string, typeof findings> = {};
  for (const f of findings) (byTitle[f.entity_id] ??= []).push(f);

  return (
    <>
      <PageHeader
        title={CATALOG_HEALTH_TITLE}
        subtitle={
          findings.length > 0 ? catalogHealthCountLabel(findings.length) : CATALOG_HEALTH_SUBTITLE
        }
      />

      {loaded.truncated ? (
        <InlineNotice tone="info" className="mb-4" data-my-list-truncated="findings">
          {CATALOG_HEALTH_TRUNCATED}
        </InlineNotice>
      ) : null}

      {findings.length === 0 ? (
        <Card>
          <CardBody>
            <p className="t-body-sm text-ink-3">{CATALOG_HEALTH_EMPTY}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-[var(--space-6)]" data-catalog-health="">
          {Object.entries(byTitle).map(([titleId, items]) => {
            const t = titleById.get(titleId);
            const orgName = t?.organizations?.name;
            const href = catalogHealthTitleHref(titleId, gcWide);
            return (
              <Card key={titleId} data-catalog-health-group="">
                <CardBody>
                  <div className="flex items-baseline justify-between gap-4 pb-2">
                    <Link href={href} className="t-body font-medium text-accent">
                      {t?.title ?? "Title"}
                    </Link>
                    <span className="t-body-sm text-ink-3">
                      {gcWide && orgName
                        ? [t?.catalog_id, orgName].filter(Boolean).join(" · ")
                        : t?.catalog_id}
                    </span>
                  </div>
                  <FindingRows findings={items} href={href} />
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
