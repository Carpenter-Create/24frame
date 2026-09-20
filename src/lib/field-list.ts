import {
  HOUSE_PHONE_STACK_CLASS,
  HOUSE_PHONE_WRAP_CLASS,
} from "@/lib/house-phone-stack";

// Canonical label/value ledger (Metadata register). Phone stacks
// label above value (house gospel 2026-09-19). Desktop keeps the
// side-by-side ledger. Wrap long values. Do not squeeze the row.

export const FIELD_LIST_CLASS = "divide-y divide-hairline";

export const FIELD_LIST_ROW_CLASS =
  `${HOUSE_PHONE_STACK_CLASS} gap-[var(--space-1)] px-5 py-3 md:flex-row md:items-baseline md:justify-between md:gap-6`;

export const FIELD_LIST_LABEL_CLASS = "t-body-sm text-ink-3 md:shrink-0";

export const FIELD_LIST_VALUE_CLASS =
  `${HOUSE_PHONE_WRAP_CLASS} t-body-sm text-ink md:text-right`;
