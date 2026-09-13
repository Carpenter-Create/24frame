import { NextResponse } from "next/server";

import { getOrgContext } from "@/lib/supabase/context";
import { orgRoleCanViewFinancial, recipientMayExportPeriod } from "@/lib/finance";
import { exportStatement } from "@/lib/finance-export";
import { loadRecipientPeriod, loadRecipientStatement } from "@/lib/finance-recipient-load";

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

  const statement = await loadRecipientStatement(period, ctx.activeOrg.id);
  const file = exportStatement(
    statement,
    {
      orgName: ctx.activeOrg.name,
      periodYear: period.period_year,
      periodMonth: period.period_month,
      status: "closed",
    },
    format,
  );

  return new NextResponse(Buffer.from(file.body), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
    },
  });
}
