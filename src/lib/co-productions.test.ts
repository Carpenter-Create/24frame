import { describe, expect, it } from "vitest";

import { WORKSPACE_MODES } from "@/lib/workspace";

import {
  CO_PRODUCTIONS_HREF,
  CO_PRODUCTIONS_LABEL,
  CO_PRODUCTIONS_PAGE,
  isCoProductionsPath,
} from "./co-productions";

describe("co-productions SoT", () => {
  it("locks the portal path and hyphenated Adam label", () => {
    expect(CO_PRODUCTIONS_HREF).toBe("/co-productions");
    expect(CO_PRODUCTIONS_LABEL).toBe("Co-productions");
    expect(CO_PRODUCTIONS_PAGE.title).toBe(CO_PRODUCTIONS_LABEL);
    expect(CO_PRODUCTIONS_PAGE.synopsis).toContain("co-invested originals");
    expect(CO_PRODUCTIONS_PAGE.synopsis).toContain("inquiry form");
    expect(CO_PRODUCTIONS_PAGE.synopsis).not.toMatch(
      /seamless|frictionless|elevate|amplify|unleash|supercharge|game-changing/i,
    );
    expect(WORKSPACE_MODES).not.toContain("co-productions");
  });

  it("matches only /co-productions and its children", () => {
    expect(isCoProductionsPath("/co-productions")).toBe(true);
    expect(isCoProductionsPath("/co-productions/x")).toBe(true);
    expect(isCoProductionsPath("/home")).toBe(false);
    expect(isCoProductionsPath("/education")).toBe(false);
    expect(isCoProductionsPath("/settings")).toBe(false);
    expect(isCoProductionsPath("/coproductions")).toBe(false);
    expect(isCoProductionsPath("/co-production")).toBe(false);
  });
});
