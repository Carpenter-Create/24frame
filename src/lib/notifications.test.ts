import { describe, expect, it } from "vitest";

import { ACTIVITY_HREF } from "./activity";
import { TITLES_HREF } from "./title-public-id";
import { MESSAGES_SUBTITLE, NOTIFICATION_EMAIL } from "./notifications";

const TITLE_ID = "aaaaaaaa-1111-4111-8111-111111111111";

describe("NOTIFICATION_EMAIL.delivery_update.link (sender-facing API)", () => {
  const { link, path, subject } = NOTIFICATION_EMAIL.delivery_update;

  it("pairs title path with View title when titleId is a valid UUID", () => {
    expect(link({ titleId: TITLE_ID })).toEqual({
      path: `${TITLES_HREF}/${TITLE_ID}`,
      cta: "View title",
    });
    expect(link({ titleId: TITLE_ID.toUpperCase() })).toEqual({
      path: `${TITLES_HREF}/${TITLE_ID.toUpperCase()}`,
      cta: "View title",
    });
  });

  it("pairs /titles with View your titles when titleId is absent", () => {
    expect(link({})).toEqual({ path: TITLES_HREF, cta: "View your titles" });
    expect(link()).toEqual({ path: TITLES_HREF, cta: "View your titles" });
  });

  it("pairs /titles with View your titles for unsafe titleId values", () => {
    for (const titleId of ["../admin", "not-a-uuid", `${TITLE_ID}/extra`, ""]) {
      expect(link({ titleId })).toEqual({
        path: TITLES_HREF,
        cta: "View your titles",
      });
    }
  });

  it("keeps path() identical to link().path (Messages convenience)", () => {
    expect(path({ titleId: TITLE_ID })).toBe(link({ titleId: TITLE_ID }).path);
    expect(path({})).toBe(link({}).path);
    expect(path({ titleId: "../admin" })).toBe(link({ titleId: "../admin" }).path);
  });

  it("preserves the delivery_update subject line", () => {
    expect(subject({ title: "North Wind" })).toBe('"North Wind" — delivery update');
  });
});

describe("NOTIFICATION_EMAIL.title_rejected.link (sender-facing API)", () => {
  const { link, path, subject } = NOTIFICATION_EMAIL.title_rejected;

  it("preserves subject, CTA, and truthy-titleId deep-link behavior", () => {
    expect(subject({ title: "North Wind" })).toBe('"North Wind" was returned for revision');
    expect(link({ titleId: TITLE_ID })).toEqual({
      cta: "Review and resubmit",
      path: `${TITLES_HREF}/${TITLE_ID}`,
    });
    expect(link({})).toEqual({ cta: "Review and resubmit", path: ACTIVITY_HREF });
    expect(link()).toEqual({ cta: "Review and resubmit", path: ACTIVITY_HREF });
  });

  it("keeps the pre-existing truthy titleId contract (no UUID hardening)", () => {
    // Prior behavior: any truthy string was interpolated. Must not regress to UUID-only.
    expect(link({ titleId: "not-a-uuid" })).toEqual({
      cta: "Review and resubmit",
      path: `${TITLES_HREF}/not-a-uuid`,
    });
  });

  it("keeps path() identical to link().path", () => {
    expect(path({ titleId: TITLE_ID })).toBe(link({ titleId: TITLE_ID }).path);
    expect(path({})).toBe(link({}).path);
  });
});

describe("NOTIFICATION_EMAIL.new_follower.link", () => {
  const { link, path, subject } = NOTIFICATION_EMAIL.new_follower;

  it("pairs the follower profile with View profile for a valid handle", () => {
    expect(link({ handle: "ada" })).toEqual({
      cta: "View profile",
      path: "/social/u/ada",
    });
    expect(path({ handle: "@Ada" })).toBe("/social/u/ada");
  });

  it("falls back to Activity when the handle is missing or unsafe", () => {
    expect(link({})).toEqual({ cta: "View profile", path: ACTIVITY_HREF });
    expect(link({ handle: "../admin" })).toEqual({ cta: "View profile", path: ACTIVITY_HREF });
    expect(link({ handle: "ab" })).toEqual({ cta: "View profile", path: ACTIVITY_HREF });
  });

  it("keeps the New follower subject", () => {
    expect(subject({ title: "unused" })).toBe("New follower");
  });
});

describe("MESSAGES_SUBTITLE", () => {
  it("names 24Frame, not Global Content", () => {
    expect(MESSAGES_SUBTITLE).toBe("Updates from 24Frame.");
  });
});
