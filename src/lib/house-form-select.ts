import { cn } from "@/lib/cn";
import { FORM_CONTROL_BOX_CLASS, FORM_CONTROL_TEXT_CLASS } from "@/lib/form-control";
import {
  HOUSE_PAGE_SELECT_CHEVRON_CLASS,
  HOUSE_PAGE_SELECT_OPTION_CHECK_CLASS,
  HOUSE_PAGE_SELECT_OPTION_CHECK_GUTTER_CLASS,
  HOUSE_PAGE_SELECT_OPTION_LABEL_CLASS,
  housePageSelectOptionClass,
} from "@/lib/house-page-select";

// House form Select / Listbox. Closed field is the house input box
// (same grammar as Email). Open menu is the HousePageSelect light
// surface — panel, ink type, muted hover, accent check — not a dark
// OS/<select> picker and not a Mercury fork. Settings Dialogs use
// this. Do not invent a Team-Invite twin.

export const HOUSE_FORM_SELECT_TRIGGER_CLASS = cn(
  FORM_CONTROL_TEXT_CLASS,
  FORM_CONTROL_BOX_CLASS,
  "flex items-center justify-between gap-[var(--space-2)] text-left",
);

export const HOUSE_FORM_SELECT_CHEVRON_CLASS = HOUSE_PAGE_SELECT_CHEVRON_CLASS;

export const HOUSE_FORM_SELECT_PANEL_CLASS =
  "absolute left-0 right-0 top-full z-50 mt-[var(--space-2)] flex max-h-80 flex-col overflow-y-auto rounded-[12px] border border-hairline bg-surface py-[var(--space-2)] shadow-none";

// Phone sheet sits on the viewport floor — `top-full` paints later
// Role rows off-screen. Sheet ancestor flips the Listbox up.
export const HOUSE_FORM_SELECT_SHEET_PHONE_MENU_CLASS =
  "max-md:[&_[data-house-form-select-menu]]:top-auto max-md:[&_[data-house-form-select-menu]]:bottom-full max-md:[&_[data-house-form-select-menu]]:mt-0 max-md:[&_[data-house-form-select-menu]]:mb-[var(--space-2)]";

export const HOUSE_FORM_SELECT_OPTION_HOVER_CLASS =
  "hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none";

export const HOUSE_FORM_SELECT_OPTION_LABEL_CLASS = HOUSE_PAGE_SELECT_OPTION_LABEL_CLASS;

export const HOUSE_FORM_SELECT_OPTION_CHECK_GUTTER_CLASS =
  HOUSE_PAGE_SELECT_OPTION_CHECK_GUTTER_CLASS;

export const HOUSE_FORM_SELECT_OPTION_CHECK_CLASS = HOUSE_PAGE_SELECT_OPTION_CHECK_CLASS;

export function houseFormSelectOptionClass(selected: boolean): string {
  return `${housePageSelectOptionClass(selected)} ${HOUSE_FORM_SELECT_OPTION_HOVER_CLASS}`;
}

export type HouseFormSelectOption = {
  value: string;
  label: string;
};
