import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SETTINGS } from "@/lib/settings";

describe("organization settings hosts Team", () => {
  it("renders Team on the Organization pane — not a Settings rail row", () => {
    const pane = readFileSync("src/components/settings/organization-settings.tsx", "utf8");
    const settings = readFileSync("src/lib/settings.ts", "utf8");
    expect(pane).toContain("data-settings-section=\"team\"");
    expect(pane).toContain("data-settings-section=\"entities\"");
    expect(pane).toContain("TeamInviteForm");
    expect(pane).toContain("LegalEntitiesSection");
    expect(pane).toContain("<Card className={SETTINGS_INDEX_CARD_CLASS}>");
    expect(pane).toContain("CardBody");
    const companyCard = pane.indexOf("data-settings-section=\"company\"");
    const entitiesCard = pane.indexOf("data-settings-section=\"entities\"");
    const teamCard = pane.indexOf("data-settings-section=\"team\"");
    expect(pane.slice(companyCard, entitiesCard)).toContain("<Card className={SETTINGS_INDEX_CARD_CLASS}>");
    expect(pane.slice(entitiesCard, teamCard)).toContain("<Card className={SETTINGS_INDEX_CARD_CLASS}>");
    expect(pane.slice(teamCard)).toContain("<Card className={SETTINGS_INDEX_CARD_CLASS}>");
    expect(SETTINGS.team).toBe("Team");
    expect(settings).toContain("Team invite");
    expect(settings).toContain("/gc/clients");
    expect(settings).not.toContain("organizationHref: \"/settings/team\"");
  });
});
