import { describe, expect, it, vi } from "vitest";

import { SETTINGS } from "@/lib/settings";
import SettingsYouRedirectPage from "./page";

vi.mock("next/navigation", () => ({
  permanentRedirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

describe("SettingsYouRedirectPage", () => {
  it("permanently redirects you → profile", () => {
    expect(() => SettingsYouRedirectPage()).toThrow(`REDIRECT:${SETTINGS.profileHref}`);
  });
});
