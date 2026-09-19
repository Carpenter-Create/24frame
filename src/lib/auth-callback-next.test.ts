import { describe, expect, it } from "vitest";

import { safeAuthCallbackNext } from "./auth-callback-next";

describe("safeAuthCallbackNext (P0-1)", () => {
  it("allows same-origin path-relative URLs and defaults to /", () => {
    expect(safeAuthCallbackNext(null)).toBe("/");
    expect(safeAuthCallbackNext(undefined)).toBe("/");
    expect(safeAuthCallbackNext("")).toBe("/");
    expect(safeAuthCallbackNext("/")).toBe("/");
    expect(safeAuthCallbackNext("/aggregation/queue")).toBe("/aggregation/queue");
    expect(safeAuthCallbackNext("/home?ai=1")).toBe("/home?ai=1");
    expect(safeAuthCallbackNext("/settings/profile")).toBe("/settings/profile");
  });

  it("rejects protocol-relative, backslash, @, and schemes", () => {
    expect(safeAuthCallbackNext("//evil.example")).toBe("/");
    expect(safeAuthCallbackNext("//evil.example/phish")).toBe("/");
    expect(safeAuthCallbackNext("https://evil.example")).toBe("/");
    expect(safeAuthCallbackNext("http://evil.example")).toBe("/");
    expect(safeAuthCallbackNext("javascript:alert(1)")).toBe("/");
    expect(safeAuthCallbackNext("\\\\evil.example")).toBe("/");
    expect(safeAuthCallbackNext("/\\evil.example")).toBe("/");
    expect(safeAuthCallbackNext("/foo\\bar")).toBe("/");
    expect(safeAuthCallbackNext("/@attacker")).toBe("/");
    expect(safeAuthCallbackNext("/queue@evil.example")).toBe("/");
    expect(safeAuthCallbackNext("queue")).toBe("/");
    expect(safeAuthCallbackNext("aggregation/queue")).toBe("/");
  });

  it("rejects encoded and control-character bypasses", () => {
    expect(safeAuthCallbackNext("/%2F%2Fevil.example")).toBe("/");
    expect(safeAuthCallbackNext("/%5Cevil.example")).toBe("/");
    expect(safeAuthCallbackNext("/%40attacker")).toBe("/");
    expect(safeAuthCallbackNext("/queue%0d%0aLocation:%20https://evil.example")).toBe("/");
    expect(safeAuthCallbackNext("/que\nue")).toBe("/");
  });
});
