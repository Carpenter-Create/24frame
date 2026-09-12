import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  AGGREGATION_WORKSPACE,
  BANNED_MOBILE_PRODUCT_NAMES,
  MOBILE_COPY,
  PRODUCT_NAME,
  PRODUCT_WORKSPACES,
  SOCIAL_EDUCATION_WORKSPACE,
} from "./product";

describe("mobile product chrome", () => {
  it("locks 24Frame and Social+Education without a second brand", () => {
    expect(PRODUCT_NAME).toBe("24Frame");
    expect(PRODUCT_NAME).not.toBe("24frame");
    expect(SOCIAL_EDUCATION_WORKSPACE).toBe("Social+Education");
    expect(AGGREGATION_WORKSPACE).toBe("Aggregation");
    expect(PRODUCT_WORKSPACES).toBe("Aggregation / Social+Education");
    expect(MOBILE_COPY.signInBody).toContain("No password");
    expect(MOBILE_COPY.signInBody).toContain("one-time code");
    expect(MOBILE_COPY.signInBody).toContain("Aggregation / Social+Education");
    for (const banned of BANNED_MOBILE_PRODUCT_NAMES) {
      expect(PRODUCT_NAME).not.toBe(banned);
    }
  });

  it("does not invent password auth or member course publish", () => {
    const auth = readFileSync(new URL("./auth.ts", import.meta.url), "utf8");
    const feed = readFileSync(new URL("./feed.ts", import.meta.url), "utf8");
    expect(auth).toContain("signInWithOtp");
    expect(auth).toContain('type: "email"');
    expect(auth).not.toContain("signInWithPassword");
    expect(feed).toContain('from("posts")');
    expect(feed).toContain('from("profiles")');
    expect(feed).not.toContain('from("courses")');
    expect(feed).not.toContain(".insert");
  });
});
