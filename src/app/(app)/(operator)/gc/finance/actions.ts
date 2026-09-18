"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { financeImportObjectKey } from "@/lib/finance-aws";
import { FINANCE_HREF, LEDGER_POST_KINDS } from "@/lib/finance";
import { isFinanceAwsConfigured, putFinanceObject } from "@/lib/s3-finance";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";

function rpcError(message: string | undefined): { error: string } {
  return { error: message?.trim() || "The request failed." };
}

export async function createFinancePeriod(raw: unknown): Promise<{ error?: string; id?: string }> {
  const parsed = z
    .object({
      orgId: z.string().uuid(),
      year: z.number().int().min(2000).max(2100),
      month: z.number().int().min(1).max(12),
      thresholdCents: z.number().int().min(0).nullable(),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid period." };

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase.rpc("create_finance_period", {
    p_org_id: parsed.data.orgId,
    p_year: parsed.data.year,
    p_month: parsed.data.month,
    p_threshold_cents: parsed.data.thresholdCents,
  });
  if (error) return rpcError(error.message);
  revalidatePath(FINANCE_HREF);
  return { id: data };
}

export async function setFinancePeriodThreshold(
  raw: unknown,
): Promise<{ error?: string }> {
  const parsed = z
    .object({
      periodId: z.string().uuid(),
      thresholdCents: z.number().int().min(0).nullable(),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid threshold." };

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("set_finance_period_threshold", {
    p_period_id: parsed.data.periodId,
    p_threshold_cents: parsed.data.thresholdCents,
  });
  if (error) return rpcError(error.message);
  revalidatePath(`${FINANCE_HREF}/${parsed.data.periodId}`);
  return {};
}

export async function importSalesFile(formData: FormData): Promise<{ error?: string }> {
  const periodId = z.string().uuid().safeParse(formData.get("periodId"));
  if (!periodId.success) return { error: "Period is required." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an Excel or CSV file." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentHash = createHash("sha256").update(bytes).digest("hex");

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { data: period } = await supabase
    .from("finance_periods")
    .select("id, org_id")
    .eq("id", periodId.data)
    .maybeSingle();
  if (!period) return { error: "Period not found." };

  const s3Key = financeImportObjectKey({
    orgId: period.org_id,
    contentHash,
    filename: file.name,
  });
  if (isFinanceAwsConfigured()) {
    try {
      await putFinanceObject({
        key: s3Key,
        orgId: period.org_id,
        body: bytes,
        contentType: file.type || "application/octet-stream",
      });
    } catch (err) {
      return rpcError(err instanceof Error ? err.message : "Finance upload failed.");
    }
  }

  const { error } = await supabase.rpc("request_sales_import", {
    p_period_id: periodId.data,
    p_filename: file.name,
    p_content_hash: contentHash,
    p_s3_key: s3Key,
  });
  if (error) return rpcError(error.message);
  revalidatePath(`${FINANCE_HREF}/${periodId.data}`);
  return {};
}

export async function upsertTitleExternalId(raw: unknown): Promise<{ error?: string }> {
  const parsed = z
    .object({
      titleId: z.string().uuid(),
      endpoint: z.string().trim().min(1),
      externalId: z.string().trim().min(1),
      periodId: z.string().uuid(),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid mapping." };

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("upsert_title_external_id", {
    p_title_id: parsed.data.titleId,
    p_endpoint: parsed.data.endpoint,
    p_external_id: parsed.data.externalId,
  });
  if (error) return rpcError(error.message);
  revalidatePath(`${FINANCE_HREF}/${parsed.data.periodId}`);
  return {};
}

export async function mapSalesImport(raw: unknown): Promise<{ error?: string }> {
  const parsed = z
    .object({ importId: z.string().uuid(), periodId: z.string().uuid() })
    .safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid import." };

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("map_sales_import", { p_import_id: parsed.data.importId });
  if (error) return rpcError(error.message);
  revalidatePath(`${FINANCE_HREF}/${parsed.data.periodId}`);
  return {};
}

export async function mapSalesLine(raw: unknown): Promise<{ error?: string }> {
  const parsed = z
    .object({
      lineId: z.string().uuid(),
      titleId: z.string().uuid(),
      periodId: z.string().uuid(),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid line." };

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("map_sales_line", {
    p_line_id: parsed.data.lineId,
    p_title_id: parsed.data.titleId,
  });
  if (error) return rpcError(error.message);
  revalidatePath(`${FINANCE_HREF}/${parsed.data.periodId}`);
  return {};
}

export async function postLedgerEntry(raw: unknown): Promise<{ error?: string }> {
  const parsed = z
    .object({
      periodId: z.string().uuid(),
      kind: z.enum(LEDGER_POST_KINDS),
      amountCents: z.number().int(),
      titleId: z.string().uuid().nullable(),
      note: z.string(),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry." };

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("post_ledger_entry", {
    p_period_id: parsed.data.periodId,
    p_kind: parsed.data.kind,
    p_amount_cents: parsed.data.amountCents,
    p_title_id: parsed.data.titleId,
    p_note: parsed.data.note,
  });
  if (error) return rpcError(error.message);
  revalidatePath(`${FINANCE_HREF}/${parsed.data.periodId}`);
  return {};
}

export async function moveSalesLinesToSuspense(
  raw: unknown,
): Promise<{ error?: string }> {
  const parsed = z
    .object({
      lineIds: z.array(z.string().uuid()).min(1),
      periodId: z.string().uuid(),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Select lines." };

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("move_sales_lines_to_suspense", {
    p_line_ids: parsed.data.lineIds,
  });
  if (error) return rpcError(error.message);
  revalidatePath(FINANCE_HREF);
  revalidatePath(`${FINANCE_HREF}/${parsed.data.periodId}`);
  return {};
}

export async function assignSuspenseLinesToPeriod(
  raw: unknown,
): Promise<{ error?: string }> {
  const parsed = z
    .object({
      lineIds: z.array(z.string().uuid()).min(1),
      periodId: z.string().uuid(),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Select lines." };

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("assign_suspense_lines_to_period", {
    p_line_ids: parsed.data.lineIds,
    p_period_id: parsed.data.periodId,
  });
  if (error) return rpcError(error.message);
  revalidatePath(FINANCE_HREF);
  revalidatePath(`${FINANCE_HREF}/${parsed.data.periodId}`);
  return {};
}

export async function closeFinancePeriod(raw: unknown): Promise<{ error?: string }> {
  const parsed = z.object({ periodId: z.string().uuid() }).safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid period." };

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("close_finance_period", { p_period_id: parsed.data.periodId });
  if (error) return rpcError(error.message);
  revalidatePath(FINANCE_HREF);
  revalidatePath(`${FINANCE_HREF}/${parsed.data.periodId}`);
  return {};
}
