import { describe, expect, it, vi } from "vitest";

import { SETTINGS } from "@/lib/settings";
import SettingsSocialRedirectPage from "./page";

vi.mock("next/navigation", () => ({
  permanentRedirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

describe("SettingsSocialRedirectPage", () => {
  it("permanently redirects social → preferences", () => {
    expect(() => SettingsSocialRedirectPage()).toThrow(`REDIRECT:${SETTINGS.preferencesHref}`);
  });
});
