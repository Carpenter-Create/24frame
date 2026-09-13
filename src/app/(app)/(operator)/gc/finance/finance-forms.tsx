"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/inline-notice";
import { FINANCE_HREF, FINANCE_PAGE, LEDGER_POST_KINDS } from "@/lib/finance";
import {
  closeFinancePeriod,
  createFinancePeriod,
  importSalesFile,
  mapSalesImport,
  mapSalesLine,
  postLedgerEntry,
  setFinancePeriodThreshold,
  upsertTitleExternalId,
} from "./actions";

const field = "flex flex-col gap-1";
const label = "t-body-sm text-ink-2";
const selectClass =
  "rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 t-body-sm text-ink";

export function CreatePeriodForm({
  orgs,
  now,
}: {
  orgs: { id: string; name: string }[];
  now: { year: number; month: number };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const thresholdRaw = String(form.get("thresholdCents") ?? "").trim();
    setSaving(true);
    setError("");
    const res = await createFinancePeriod({
      orgId: String(form.get("orgId") ?? ""),
      year: Number(form.get("year")),
      month: Number(form.get("month")),
      thresholdCents: thresholdRaw === "" ? null : Number(thresholdRaw),
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    if (res.id) {
      router.push(`${FINANCE_HREF}/${res.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <label className={field}>
        <span className={label}>{FINANCE_PAGE.org}</span>
        <select name="orgId" required className={selectClass} defaultValue={orgs[0]?.id ?? ""}>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={field}>
          <span className={label}>{FINANCE_PAGE.year}</span>
          <Input name="year" type="number" required defaultValue={now.year} />
        </label>
        <label className={field}>
          <span className={label}>{FINANCE_PAGE.month}</span>
          <Input name="month" type="number" min={1} max={12} required defaultValue={now.month} />
        </label>
      </div>
      <label className={field}>
        <span className={label}>{FINANCE_PAGE.threshold}</span>
        <Input name="thresholdCents" type="number" min={0} />
        <span className="t-body-sm text-ink-3">{FINANCE_PAGE.thresholdHint}</span>
      </label>
      <Button type="submit" disabled={saving || orgs.length === 0}>
        {FINANCE_PAGE.create}
      </Button>
    </form>
  );
}

export function ImportSalesForm({ periodId }: { periodId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await importSalesFile(new FormData(e.currentTarget));
    setSaving(false);
    if (res.error) return setError(res.error);
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <input type="hidden" name="periodId" value={periodId} />
      <p className="t-body-sm text-ink-3">{FINANCE_PAGE.importHint}</p>
      <Input name="file" type="file" accept=".csv,.xlsx,.xls" required />
      <Button type="submit" disabled={saving}>
        {FINANCE_PAGE.import}
      </Button>
    </form>
  );
}

export function MapImportForm({ importId, periodId }: { importId: string; periodId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await mapSalesImport({ importId, periodId });
    setSaving(false);
    if (res.error) return setError(res.error);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <Button type="submit" variant="secondary" disabled={saving}>
        {FINANCE_PAGE.mapImport}
      </Button>
    </form>
  );
}

export function MapLineForm({
  lineId,
  periodId,
  titles,
}: {
  lineId: string;
  periodId: string;
  titles: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const titleId = String(new FormData(e.currentTarget).get("titleId") ?? "");
    setSaving(true);
    setError("");
    const res = await mapSalesLine({ lineId, titleId, periodId });
    setSaving(false);
    if (res.error) return setError(res.error);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <select name="titleId" required className={selectClass} defaultValue={titles[0]?.id ?? ""}>
        {titles.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
      <Button type="submit" variant="secondary" disabled={saving || titles.length === 0}>
        Map
      </Button>
    </form>
  );
}

export function ExternalIdForm({
  periodId,
  titles,
}: {
  periodId: string;
  titles: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    const res = await upsertTitleExternalId({
      periodId,
      titleId: String(form.get("titleId") ?? ""),
      endpoint: String(form.get("endpoint") ?? ""),
      externalId: String(form.get("externalId") ?? ""),
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <p className="t-body-sm text-ink-3">{FINANCE_PAGE.mapHint}</p>
      <label className={field}>
        <span className={label}>Title</span>
        <select name="titleId" required className={selectClass} defaultValue={titles[0]?.id ?? ""}>
          {titles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <label className={field}>
        <span className={label}>Endpoint</span>
        <Input name="endpoint" required />
      </label>
      <label className={field}>
        <span className={label}>External id</span>
        <Input name="externalId" required />
      </label>
      <Button type="submit" variant="secondary" disabled={saving || titles.length === 0}>
        Save mapping
      </Button>
    </form>
  );
}

export function PostLedgerForm({
  periodId,
  titles,
}: {
  periodId: string;
  titles: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const titleRaw = String(form.get("titleId") ?? "");
    setSaving(true);
    setError("");
    const res = await postLedgerEntry({
      periodId,
      kind: String(form.get("kind") ?? ""),
      amountCents: Number(form.get("amountCents")),
      titleId: titleRaw === "" ? null : titleRaw,
      note: String(form.get("note") ?? ""),
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <p className="t-body-sm text-ink-3">{FINANCE_PAGE.postHint}</p>
      <label className={field}>
        <span className={label}>Kind</span>
        <select name="kind" required className={selectClass} defaultValue="sale">
          {LEDGER_POST_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
      </label>
      <label className={field}>
        <span className={label}>Amount (cents)</span>
        <Input name="amountCents" type="number" required />
      </label>
      <label className={field}>
        <span className={label}>Title (optional)</span>
        <select name="titleId" className={selectClass} defaultValue="">
          <option value="">Organization rollup</option>
          {titles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <label className={field}>
        <span className={label}>Note</span>
        <Input name="note" />
      </label>
      <Button type="submit" disabled={saving}>
        {FINANCE_PAGE.post}
      </Button>
    </form>
  );
}

export function ThresholdForm({
  periodId,
  thresholdCents,
}: {
  periodId: string;
  thresholdCents: number | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = String(new FormData(e.currentTarget).get("thresholdCents") ?? "").trim();
    setSaving(true);
    setError("");
    const res = await setFinancePeriodThreshold({
      periodId,
      thresholdCents: raw === "" ? null : Number(raw),
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <label className={field}>
        <span className={label}>{FINANCE_PAGE.threshold}</span>
        <Input
          name="thresholdCents"
          type="number"
          min={0}
          defaultValue={thresholdCents ?? ""}
        />
        <span className="t-body-sm text-ink-3">{FINANCE_PAGE.thresholdHint}</span>
      </label>
      <Button type="submit" variant="secondary" disabled={saving}>
        Save threshold
      </Button>
    </form>
  );
}

export function ClosePeriodForm({ periodId }: { periodId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await closeFinancePeriod({ periodId });
    setSaving(false);
    if (res.error) return setError(res.error);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <p className="t-body-sm text-ink-3">{FINANCE_PAGE.closeHint}</p>
      <Button type="submit" disabled={saving}>
        {FINANCE_PAGE.close}
      </Button>
    </form>
  );
}
