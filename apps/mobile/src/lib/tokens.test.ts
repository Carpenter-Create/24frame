import { describe, expect, it } from "vitest";

import { tokens } from "./tokens";

describe("mobile house ink", () => {
  it("locks Coinbase-pop pass A light ink — entire platform, not Aggregation-only", () => {
    // Adam 2026-09-19. Same hexes as src/app/tokens.css :root.
    expect(tokens.text).toBe("#0A0B0D");
    expect(tokens.textSecondary).toBe("#3D4450");
    expect(tokens.textTertiary).toBe("#6B7280");
    expect(tokens.text).not.toBe("#14171a");
    expect(tokens.textSecondary).not.toBe("#5e646e");
    expect(tokens.textTertiary).not.toBe("#9aa0a9");
  });
});
