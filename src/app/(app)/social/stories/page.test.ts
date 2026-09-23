import { describe, expect, it, vi } from "vitest";

import { SOCIAL_ROUTES } from "@/lib/social";

const permanentRedirect = vi.hoisted(() =>
  vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
);

vi.mock("next/navigation", () => ({
  permanentRedirect,
}));

import SocialStoriesIndexPage from "./page";

describe("bare /social/stories", () => {
  it("permanently redirects to /social", () => {
    expect(() => SocialStoriesIndexPage()).toThrow(`REDIRECT:${SOCIAL_ROUTES.home}`);
    expect(permanentRedirect).toHaveBeenCalledWith(SOCIAL_ROUTES.home);
  });
});
