import { staffPath } from "@/lib/workspace";
import { isCanonicalUuid } from "@/lib/deliveries-browse";
import type { RightsType } from "@/lib/rights";
import { RIGHTS_META } from "@/lib/rights";
import type { TerritoryMode } from "@/lib/territories";
import { describeTerritory, ISO_COUNTRIES } from "@/lib/territories";

// Option B — Stripe-air stepper. Calm focused card, house Sporty Blue
// progress (Titles status-track register). No Stripe purple/logo/type.
// Step order is locked: Channel → Rights (per title) → Territory (per title)
// → Success. One decision per step. Step key stays vendor internally.

export const DELIVER_STEPPER_STEPS = [
  { key: "vendor", label: "Channel" },
  { key: "rights", label: "Rights" },
  { key: "territory", label: "Territory" },
  { key: "done", label: "Done" },
] as const;

export type DeliverStepperStep = (typeof DELIVER_STEPPER_STEPS)[number]["key"];

export const DELIVER_STEPPER = {
  progressCaption: "1 Channel · 2 Rights · 3 Territory · 4 Done",
  vendorQuestion: "Which channel for these titles?",
  vendorQuestionPhone: "Which channel?",
  vendorHint: (n: number) =>
    n === 1 ? "1 title selected · one channel per delivery" : `${n} titles selected · one channel per delivery`,
  rightsQuestion: "Which rights grant?",
  rightsHint: (title: string, index: number, total: number) =>
    total > 1 ? `${title} · ${index + 1} of ${total}` : title,
  territoryQuestion: "Which territory?",
  territoryHint: (title: string, index: number, total: number) =>
    total > 1 ? `${title} · ${index + 1} of ${total}` : title,
  continue: "Continue",
  back: "← Back",
  successTitle: "Delivery created",
  successId: (id: string) => `ID · ${id}`,
  download: "Download metadata sheet",
  done: "Done",
  doneHint: "Returns to Licensing Status",
  listHref: staffPath("gc/deliveries"),
  noVendors: "No active channels.",
  noGrants: "No active grants on this title.",
  noTitles: "Select at least one title to deliver.",
} as const;

export const DELIVER_PROGRESS_TRACK_CLASS = "flex items-center gap-[6px]";
export const DELIVER_PROGRESS_SEG_ON_CLASS =
  "h-[6px] w-8 rounded-full bg-accent md:w-8";
export const DELIVER_PROGRESS_SEG_OFF_CLASS =
  "h-[6px] w-8 rounded-full bg-surface-muted md:w-8";

export const DELIVER_OPTION_CLASS =
  "flex w-full flex-col gap-[var(--space-2)] rounded-[12px] border border-hairline bg-surface p-[var(--space-4)] text-left";
export const DELIVER_OPTION_SELECTED_CLASS =
  "flex w-full flex-col gap-[var(--space-2)] rounded-[12px] border-2 border-accent bg-surface p-[var(--space-4)] text-left";

function uniqueTitleIds(ids: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function deliverStepperHref(titleIds: readonly string[]): string {
  const ids = uniqueTitleIds(titleIds);
  if (ids.length === 0) return DELIVER_STEPPER.listHref;
  return `${staffPath("gc/deliveries")}/deliver?titles=${ids.join(",")}`;
}

export function parseDeliverTitleIds(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  return uniqueTitleIds(
    raw
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter((part) => isCanonicalUuid(part)),
  );
}

export function deliverProgressIndex(step: DeliverStepperStep): number {
  return DELIVER_STEPPER_STEPS.findIndex((row) => row.key === step);
}

export function deliverProgressFilled(step: DeliverStepperStep): number {
  return deliverProgressIndex(step) + 1;
}

export type GrantChoice = {
  id: string;
  title_id: string;
  rights_type: string;
  territory_mode: string;
  territories: string[] | null;
};

export function grantChoiceLabel(grant: GrantChoice): string {
  const rights =
    grant.rights_type in RIGHTS_META
      ? RIGHTS_META[grant.rights_type as RightsType].label
      : grant.rights_type;
  return `${rights} · ${describeTerritory(
    grant.territory_mode as TerritoryMode,
    grant.territories ?? [],
  )}`;
}

export type TerritoryChoice = { key: string; label: string };

const TERRITORY_CARD_CAP = 16;

export function grantTerritoryChoices(grant: GrantChoice): TerritoryChoice[] {
  const listed = (grant.territories ?? []).filter((code) => code in ISO_COUNTRIES);
  if (grant.territory_mode === "include" && listed.length > 0) {
    return listed.map((key) => ({ key, label: ISO_COUNTRIES[key] ?? key }));
  }
  if (grant.territory_mode === "exclude" && listed.length > 0) {
    return Object.entries(ISO_COUNTRIES)
      .filter(([key]) => !listed.includes(key))
      .map(([key, label]) => ({ key, label }));
  }
  return Object.entries(ISO_COUNTRIES).map(([key, label]) => ({ key, label }));
}

export function grantTerritoryUsesCards(choices: readonly TerritoryChoice[]): boolean {
  return choices.length > 0 && choices.length <= TERRITORY_CARD_CAP;
}
