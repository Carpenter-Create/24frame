import { describe, expect, it } from "vitest";

import {
  coverMenuToggleSequence,
  nextCoverPillMode,
  reduceCoverMenu,
  type CoverMenuMachine,
} from "./social-profile-cover-menu";

const idle: CoverMenuMachine = { mode: "idle", listener: "idle" };

describe("cover menu toggle", () => {
  it("opens on a pill click and ignores a same-gesture outside press", () => {
    let state = reduceCoverMenu(idle, { type: "pill-click" });
    expect(state).toEqual({ mode: "menu", listener: "idle" });
    state = reduceCoverMenu(state, { type: "document-press", inside: false });
    expect(state.mode).toBe("menu");
  });

  it("closes on an outside press only after the listener is armed", () => {
    let state = reduceCoverMenu(idle, { type: "pill-click" });
    state = reduceCoverMenu(state, { type: "arm-listener" });
    state = reduceCoverMenu(state, { type: "document-press", inside: false });
    expect(state).toEqual({ mode: "idle", listener: "idle" });
  });

  it("does not treat a press on the pill as an outside close", () => {
    let state: CoverMenuMachine = { mode: "menu", listener: "armed" };
    state = reduceCoverMenu(state, { type: "document-press", inside: true });
    expect(state.mode).toBe("menu");
    state = reduceCoverMenu(state, { type: "pill-click" });
    expect(state).toEqual({ mode: "idle", listener: "idle" });
  });

  it("reopens after an outside close", () => {
    let state: CoverMenuMachine = { mode: "menu", listener: "armed" };
    state = reduceCoverMenu(state, { type: "document-press", inside: false });
    state = reduceCoverMenu(state, { type: "pill-click" });
    expect(state.mode).toBe("menu");
    expect(state.listener).toBe("idle");
  });

  it("escape closes and the next pill click opens", () => {
    let state: CoverMenuMachine = { mode: "menu", listener: "armed" };
    state = reduceCoverMenu(state, { type: "escape" });
    expect(state).toEqual({ mode: "idle", listener: "idle" });
    state = reduceCoverMenu(state, { type: "pill-click" });
    expect(state.mode).toBe("menu");
  });

  it("toggles open and closed more than ten times without sticking", () => {
    const seen = coverMenuToggleSequence(12);
    expect(seen).toHaveLength(24);
    expect(seen.every((mode) => mode === "menu")).toBe(true);
    expect(nextCoverPillMode("menu")).toBe("idle");
    expect(nextCoverPillMode("idle")).toBe("menu");
  });
});
