import { NextResponse } from "next/server";

import { FINANCE_CLIENT, orgRoleCanViewFinancial, recipientMayExportPeriod } from "@/lib/finance";
import { loadRecipientPeriod } from "@/lib/finance-recipient-load";
import { signedFinanceUrl } from "@/lib/s3-finance";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ periodId: string }> },
) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!ctx.activeOrg || !orgRoleCanViewFinancial(ctx.activeRole)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { periodId } = await params;
  const format = new URL(req.url).searchParams.get("format");
  if (format !== "pdf" && format !== "csv") {
    return NextResponse.json({ error: "format must be pdf or csv" }, { status: 400 });
  }

  const period = await loadRecipientPeriod(periodId, ctx.activeOrg.id);
  if (
    !recipientMayExportPeriod({
      periodOrgId: period.org_id,
      activeOrgId: ctx.activeOrg.id,
      status: period.status,
    })
  ) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: exported } = await supabase
    .from("finance_statement_exports")
    .select("s3_key, format")
    .eq("period_id", period.id)
    .eq("org_id", ctx.activeOrg.id)
    .eq("format", format)
    .maybeSingle();

  if (exported?.s3_key) {
    const url = await signedFinanceUrl(exported.s3_key, ctx.activeOrg.id);
    if (!url) {
      return NextResponse.json({ error: "Finance download is not configured." }, { status: 503 });
    }
    return NextResponse.redirect(url);
  }

  const { error } = await supabase.rpc("request_finance_export", { p_period_id: period.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ status: "queued", message: FINANCE_CLIENT.exportQueued }, { status: 202 });
}
