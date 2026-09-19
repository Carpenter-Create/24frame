import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { SETTINGS } from "@/lib/settings";

const here = dirname(fileURLToPath(import.meta.url));
const pageSrc = readFileSync(join(here, "page.tsx"), "utf8");

describe("SettingsProfilePage", () => {
  it("is the Profile door into identity — company lives on Organization", () => {
    expect(pageSrc).toContain("ProfileSettings");
    expect(pageSrc).not.toContain("CompanyProfileForm");
    expect(pageSrc).not.toContain("member_can");
    expect(pageSrc).not.toContain("SettingsRail");
    expect(SETTINGS.profileHref).toBe("/settings/profile");
    expect(SETTINGS.organizationHref).toBe("/settings/organization");
  });
});
