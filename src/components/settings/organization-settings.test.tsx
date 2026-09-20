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
    expect(pane).toContain("SETTINGS_CONTENT_MEASURE_CLASS");
    expect(pane).not.toContain("<Card>");
    expect(pane).not.toContain("CardBody");
    expect(pane).not.toContain("card-surface");
    expect(SETTINGS.team).toBe("Team");
    expect(settings).toContain("Team invite");
    expect(settings).toContain("/gc/clients");
    expect(settings).not.toContain("organizationHref: \"/settings/team\"");
  });
});
