import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const rail = readFileSync("src/lib/nav.ts", "utf8");
const settingsRail = readFileSync("src/components/chrome/settings-rail.tsx", "utf8");
const settingsBack = readFileSync("src/components/chrome/settings-header-back.tsx", "utf8");
const collapse = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
const account = readFileSync("src/components/chrome/account-sheet.tsx", "utf8");
const house = readFileSync("src/components/chrome/house.tsx", "utf8");
const mobile = readFileSync("src/components/chrome/mobile-nav.tsx", "utf8");
const messages = readFileSync("src/components/chrome/messages-app-header.tsx", "utf8");
const socialDock = readFileSync("src/components/social/social-mobile-dock.tsx", "utf8");

describe("Aggregation chrome Phosphor lock + Design miss list", () => {
  it("ships measured Phosphor glyphs only; leaves unmeasured chrome on Lucide", () => {
    expect(rail).toContain('family: "phosphor"');
    expect(rail).toContain("SquaresFour");
    expect(rail).toContain("FilmSlate");
    expect(rail).toContain("PaperPlaneTilt");
    expect(settingsRail).toContain("CaretLeft");
    expect(settingsBack).toContain("CaretLeft");
    expect(settingsRail).not.toContain("lucide-react");
    expect(settingsBack).not.toContain("lucide-react");

    expect(collapse).toContain('from "@phosphor-icons/react"');
    expect(collapse).toContain("CaretDoubleLeft");
    expect(collapse).toContain("CaretDoubleRight");
    expect(collapse).toContain("RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT");
    expect(collapse).not.toContain("lucide-react");
    expect(collapse).not.toContain("ChevronsLeft");
    expect(collapse).not.toContain("ChevronsRight");

    expect(account).toContain("CaretLeft");
    expect(account).toContain("CaretRight");
    expect(account).toContain("SignOut");
    expect(account).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(account).not.toContain("lucide-react");
    expect(account).not.toContain("ChevronLeft");
    expect(account).not.toContain("ChevronRight");
    expect(account).not.toContain("<LogOut");

    expect(house).toContain('from "@phosphor-icons/react"');
    expect(house).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(house).toContain('<X className="size-4" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />');
    expect(house).not.toContain("lucide-react");
    expect(house).not.toContain("strokeWidth={1.33}");

    expect(mobile).toContain('import { List } from "@phosphor-icons/react"');
    expect(mobile).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(mobile).not.toContain("lucide-react");
    expect(mobile).not.toContain("import { Menu }");

    expect(messages).toContain('from "lucide-react"');
  });

  it("leaves Social interiors on Social V1 SocialIcon; SOCIAL_NAV family stays Lucide fallback", () => {
    expect(socialDock).toContain("SocialIcon");
    expect(socialDock).not.toContain('from "lucide-react"');
    expect(rail).toContain('family: "lucide"');
    expect(rail).toContain("SOCIAL_NAV");
  });
});
