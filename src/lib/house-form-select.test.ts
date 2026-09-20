import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { FORM_CONTROL_BOX_CLASS, FORM_CONTROL_TEXT_CLASS } from "./form-control";
import {
  HOUSE_FORM_SELECT_CHEVRON_CLASS,
  HOUSE_FORM_SELECT_OPTION_CHECK_CLASS,
  HOUSE_FORM_SELECT_OPTION_HOVER_CLASS,
  HOUSE_FORM_SELECT_PANEL_CLASS,
  HOUSE_FORM_SELECT_TRIGGER_CLASS,
  houseFormSelectOptionClass,
} from "./house-form-select";
import {
  HOUSE_PAGE_SELECT_CHEVRON_CLASS,
  HOUSE_PAGE_SELECT_OPTION_CHECK_CLASS,
  HOUSE_PAGE_SELECT_PANEL_CLASS,
} from "./house-page-select";

const invite = readFileSync("src/components/settings/team-invite-form.tsx", "utf8");
const entities = readFileSync("src/components/settings/legal-entity-editor.tsx", "utf8");
const selectSrc = readFileSync("src/components/ui/select.tsx", "utf8");

describe("house form Select SoT", () => {
  it("keeps the closed field on the house input box", () => {
    expect(HOUSE_FORM_SELECT_TRIGGER_CLASS).toContain(FORM_CONTROL_TEXT_CLASS);
    expect(HOUSE_FORM_SELECT_TRIGGER_CLASS).toContain(FORM_CONTROL_BOX_CLASS);
    expect(HOUSE_FORM_SELECT_TRIGGER_CLASS).toContain("focus:border-ink-3");
    expect(HOUSE_FORM_SELECT_TRIGGER_CLASS).not.toContain("focus:border-accent");
    expect(HOUSE_FORM_SELECT_TRIGGER_CLASS).not.toContain("bg-ink");
    expect(HOUSE_FORM_SELECT_CHEVRON_CLASS).toBe(HOUSE_PAGE_SELECT_CHEVRON_CLASS);
  });

  it("opens a light Listbox — same surface as HousePageSelect, not a dark picker", () => {
    expect(HOUSE_FORM_SELECT_PANEL_CLASS).toContain("bg-surface");
    expect(HOUSE_FORM_SELECT_PANEL_CLASS).toContain("border-hairline");
    expect(HOUSE_FORM_SELECT_PANEL_CLASS).toContain("shadow-none");
    expect(HOUSE_FORM_SELECT_PANEL_CLASS).not.toContain("bg-ink");
    expect(HOUSE_FORM_SELECT_PANEL_CLASS).not.toContain("text-surface");
    expect(HOUSE_PAGE_SELECT_PANEL_CLASS).toContain("bg-surface");
    expect(HOUSE_PAGE_SELECT_PANEL_CLASS).not.toContain("bg-ink");
    expect(houseFormSelectOptionClass(false)).toContain("text-ink");
    expect(houseFormSelectOptionClass(false)).toContain(HOUSE_FORM_SELECT_OPTION_HOVER_CLASS);
    expect(houseFormSelectOptionClass(true)).toContain("bg-surface-muted");
    expect(HOUSE_FORM_SELECT_OPTION_CHECK_CLASS).toBe(HOUSE_PAGE_SELECT_OPTION_CHECK_CLASS);
    expect(HOUSE_FORM_SELECT_OPTION_CHECK_CLASS).toBe("text-accent");
  });

  it("is the one Settings Dialog select — Invite and Legal Entities share it", () => {
    expect(selectSrc).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(selectSrc).toContain("AppearanceCheck");
    expect(selectSrc).not.toContain("createPortal");
    expect(selectSrc).not.toContain("<select");
    expect(invite).toContain('import { Select } from "@/components/ui/select"');
    expect(invite).toContain('id="team-invite-role"');
    expect(invite).not.toContain("<select");
    expect(invite).not.toContain("formControlClass");
    expect(entities).toContain('import { Select } from "@/components/ui/select"');
    expect(entities).toContain('id="entity-type"');
    expect(entities).not.toContain("<select");
    expect(entities).not.toContain("formControlClass");
  });
});
