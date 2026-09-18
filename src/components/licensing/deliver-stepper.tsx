"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { cn } from "@/lib/cn";
import {
  DELIVER_OPTION_CLASS,
  DELIVER_OPTION_SELECTED_CLASS,
  DELIVER_PROGRESS_SEG_OFF_CLASS,
  DELIVER_PROGRESS_SEG_ON_CLASS,
  DELIVER_PROGRESS_TRACK_CLASS,
  DELIVER_STEPPER,
  DELIVER_STEPPER_STEPS,
  deliverProgressFilled,
  grantChoiceLabel,
  grantTerritoryChoices,
  grantTerritoryUsesCards,
  type DeliverStepperStep,
  type GrantChoice,
} from "@/lib/deliver-stepper";
export type CreateDeliveriesFn = (input: {
  vendorId: string;
  items: { titleId: string; grantId: string; territory: string }[];
}) => Promise<{ ids?: string[]; error?: string }>;

export type DeliverStepperTitle = { id: string; title: string };
export type DeliverStepperVendor = { id: string; name: string };

function Progress({ step }: { step: DeliverStepperStep }) {
  const filled = deliverProgressFilled(step);
  return (
    <div data-deliver-progress="" className="flex flex-col gap-[6px] md:items-end">
      <p className="t-label text-ink-3">{DELIVER_STEPPER.progressCaption}</p>
      <div className={DELIVER_PROGRESS_TRACK_CLASS} data-deliver-progress-track="">
        {DELIVER_STEPPER_STEPS.map((row, index) => (
          <span
            key={row.key}
            data-deliver-progress-seg={index < filled ? "filled" : "empty"}
            className={index < filled ? DELIVER_PROGRESS_SEG_ON_CLASS : DELIVER_PROGRESS_SEG_OFF_CLASS}
          />
        ))}
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  label,
  onSelect,
  hint,
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-deliver-option=""
      data-deliver-option-selected={selected ? "" : undefined}
      onClick={onSelect}
      className={selected ? DELIVER_OPTION_SELECTED_CLASS : DELIVER_OPTION_CLASS}
    >
      <span className="flex items-center justify-between gap-[var(--space-3)]">
        <span className={cn("t-body font-medium", selected ? "text-accent" : "text-ink")}>
          {label}
        </span>
        {selected ? (
          <span className="t-body font-bold text-accent" aria-hidden>
            ✓
          </span>
        ) : (
          <span
            className="size-5 shrink-0 rounded-full border border-hairline"
            aria-hidden
          />
        )}
      </span>
      {hint ? <span className="t-body-sm text-ink-3">{hint}</span> : null}
    </button>
  );
}

function StepFooter({
  onBack,
  onContinue,
  continueLabel,
  continueDisabled,
  busy,
}: {
  onBack: () => void;
  onContinue: () => void;
  continueLabel: string;
  continueDisabled?: boolean;
  busy?: boolean;
}) {
  return (
    <div
      data-deliver-footer=""
      className="flex w-full flex-col gap-[var(--space-3)] md:flex-row md:items-center md:justify-between"
    >
      <button
        type="button"
        data-deliver-back=""
        onClick={onBack}
        className="self-start py-[var(--space-2)] t-body-sm font-medium text-accent"
      >
        {DELIVER_STEPPER.back}
      </button>
      <Button
        type="button"
        data-deliver-continue=""
        className="max-md:w-full"
        disabled={continueDisabled || busy}
        onClick={onContinue}
      >
        {busy ? "Creating…" : continueLabel}
      </Button>
    </div>
  );
}

export function DeliverSuccess({
  deliveryId,
  vendorId,
  titleIds,
}: {
  deliveryId: string;
  vendorId: string;
  titleIds: readonly string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/gc/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ vendorId, titleIds: [...titleIds] }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Export failed.");
      setBusy(false);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "metadata.xlsx";
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  }

  return (
    <div data-deliver-success="" className="flex flex-col items-center gap-[var(--space-4)] text-center">
      <Progress step="done" />
      <div className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-contrast t-title">
        ✓
      </div>
      <h1 className="t-title text-ink">{DELIVER_STEPPER.successTitle}</h1>
      <p className="t-body-sm text-ink-3" data-deliver-id="">
        {DELIVER_STEPPER.successId(deliveryId)}
      </p>
      <Button
        type="button"
        data-deliver-download=""
        className="w-full"
        disabled={busy}
        onClick={download}
      >
        {busy ? "Preparing…" : DELIVER_STEPPER.download}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => router.push(DELIVER_STEPPER.listHref)}
      >
        {DELIVER_STEPPER.done}
      </Button>
      <p className="t-body-sm text-ink-3">{DELIVER_STEPPER.doneHint}</p>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
    </div>
  );
}

export function DeliverStepper({
  titles,
  vendors,
  grantsByTitle,
  create,
}: {
  titles: DeliverStepperTitle[];
  vendors: DeliverStepperVendor[];
  grantsByTitle: Record<string, GrantChoice[]>;
  create: CreateDeliveriesFn;
}) {
  const router = useRouter();
  const [step, setStep] = useState<DeliverStepperStep>("vendor");
  const [vendorId, setVendorId] = useState("");
  const [titleIndex, setTitleIndex] = useState(0);
  const [grants, setGrants] = useState<Record<string, string>>({});
  const [territories, setTerritories] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deliveryId, setDeliveryId] = useState("");

  const currentTitle = titles[titleIndex];
  const currentGrants = currentTitle ? (grantsByTitle[currentTitle.id] ?? []) : [];
  const selectedGrant = currentGrants.find((grant) => grant.id === grants[currentTitle?.id ?? ""]);
  const territoryChoices = selectedGrant ? grantTerritoryChoices(selectedGrant) : [];
  const territoryCards = grantTerritoryUsesCards(territoryChoices);

  const question = useMemo(() => {
    if (step === "vendor") {
      return {
        title: DELIVER_STEPPER.vendorQuestion,
        titlePhone: DELIVER_STEPPER.vendorQuestionPhone,
        hint: DELIVER_STEPPER.vendorHint(titles.length),
      };
    }
    if (step === "rights" && currentTitle) {
      return {
        title: DELIVER_STEPPER.rightsQuestion,
        titlePhone: DELIVER_STEPPER.rightsQuestion,
        hint: DELIVER_STEPPER.rightsHint(currentTitle.title, titleIndex, titles.length),
      };
    }
    if (step === "territory" && currentTitle) {
      return {
        title: DELIVER_STEPPER.territoryQuestion,
        titlePhone: DELIVER_STEPPER.territoryQuestion,
        hint: DELIVER_STEPPER.territoryHint(currentTitle.title, titleIndex, titles.length),
      };
    }
    return { title: DELIVER_STEPPER.successTitle, titlePhone: DELIVER_STEPPER.successTitle, hint: "" };
  }, [currentTitle, step, titleIndex, titles.length]);

  function goBack() {
    setError("");
    if (step === "vendor") {
      router.push(DELIVER_STEPPER.listHref);
      return;
    }
    if (step === "rights") {
      if (titleIndex > 0) {
        setTitleIndex(titleIndex - 1);
        return;
      }
      setStep("vendor");
      return;
    }
    if (step === "territory") {
      if (titleIndex > 0) {
        setTitleIndex(titleIndex - 1);
        return;
      }
      setTitleIndex(titles.length - 1);
      setStep("rights");
    }
  }

  async function goContinue() {
    setError("");
    if (step === "vendor") {
      if (!vendorId) return;
      setTitleIndex(0);
      setStep("rights");
      return;
    }
    if (step === "rights") {
      if (!currentTitle || !grants[currentTitle.id]) return;
      if (titleIndex < titles.length - 1) {
        setTitleIndex(titleIndex + 1);
        return;
      }
      setTitleIndex(0);
      setStep("territory");
      return;
    }
    if (step === "territory") {
      if (!currentTitle || !territories[currentTitle.id]) return;
      if (titleIndex < titles.length - 1) {
        setTitleIndex(titleIndex + 1);
        return;
      }
      setBusy(true);
      const res = await create({
        vendorId,
        items: titles.map((title) => ({
          titleId: title.id,
          grantId: grants[title.id],
          territory: territories[title.id],
        })),
      });
      setBusy(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      setDeliveryId(res.ids?.[0] ?? "");
      setStep("done");
    }
  }

  const continueDisabled =
    (step === "vendor" && !vendorId) ||
    (step === "rights" && (!currentTitle || !grants[currentTitle.id])) ||
    (step === "territory" && (!currentTitle || !territories[currentTitle.id]));

  if (step === "done") {
    return (
      <DeliverSuccess
        deliveryId={deliveryId}
        vendorId={vendorId}
        titleIds={titles.map((title) => title.id)}
      />
    );
  }

  return (
    <div data-deliver-stepper="" data-deliver-step={step} className="flex w-full flex-col gap-[var(--space-8)]">
      <div className="flex flex-col gap-[var(--space-3)] md:flex-row md:items-start md:justify-between">
        <p className="t-body-sm font-medium text-ink">24Frame</p>
        <Progress step={step} />
      </div>
      <div className="flex flex-col gap-[var(--space-2)]">
        <h1 className="t-title text-ink max-md:hidden">{question.title}</h1>
        <h1 className="t-title text-ink md:hidden">{question.titlePhone}</h1>
        <p className="t-body-sm text-ink-3">{question.hint}</p>
      </div>
      <div className="flex flex-col gap-[var(--space-3)]" role="radiogroup">
        {step === "vendor"
          ? vendors.map((vendor) => (
              <OptionCard
                key={vendor.id}
                selected={vendorId === vendor.id}
                label={vendor.name}
                onSelect={() => setVendorId(vendor.id)}
              />
            ))
          : null}
        {step === "vendor" && vendors.length === 0 ? (
          <p className="t-body-sm text-ink-3">{DELIVER_STEPPER.noVendors}</p>
        ) : null}
        {step === "rights"
          ? currentGrants.map((grant) => (
              <OptionCard
                key={grant.id}
                selected={grants[currentTitle.id] === grant.id}
                label={grantChoiceLabel(grant)}
                onSelect={() =>
                  setGrants((current) => ({ ...current, [currentTitle.id]: grant.id }))
                }
              />
            ))
          : null}
        {step === "rights" && currentGrants.length === 0 ? (
          <p className="t-body-sm text-ink-3">{DELIVER_STEPPER.noGrants}</p>
        ) : null}
        {step === "territory" && territoryCards
          ? territoryChoices.map((choice) => (
              <OptionCard
                key={choice.key}
                selected={territories[currentTitle.id] === choice.key}
                label={choice.label}
                onSelect={() =>
                  setTerritories((current) => ({ ...current, [currentTitle.id]: choice.key }))
                }
              />
            ))
          : null}
        {step === "territory" && !territoryCards && currentTitle ? (
          <HousePageSelect
            value={territories[currentTitle.id] ?? ""}
            label={
              territoryChoices.find((choice) => choice.key === territories[currentTitle.id])
                ?.label ?? "Select territory"
            }
            options={territoryChoices}
            ariaLabel={DELIVER_STEPPER.territoryQuestion}
            sheetTitle={DELIVER_STEPPER.territoryQuestion}
            closeLabel="Close"
            menuAlign="start"
            onPick={(key) =>
              setTerritories((current) => ({ ...current, [currentTitle.id]: key }))
            }
          />
        ) : null}
      </div>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <StepFooter
        onBack={goBack}
        onContinue={() => void goContinue()}
        continueLabel={DELIVER_STEPPER.continue}
        continueDisabled={continueDisabled}
        busy={busy}
      />
    </div>
  );
}
