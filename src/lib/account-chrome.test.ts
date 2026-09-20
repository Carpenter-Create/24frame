import { describe, expect, it } from "vitest";

import { isAccountChromeNoRailPath } from "./account-chrome";

describe("account chrome no-rail SoT", () => {
  it("treats Get Help and Activity as header-plus-column only", () => {
    expect(isAccountChromeNoRailPath("/help")).toBe(true);
    expect(isAccountChromeNoRailPath("/help/center")).toBe(true);
    expect(isAccountChromeNoRailPath("/activity")).toBe(true);
    expect(isAccountChromeNoRailPath("/activity/x")).toBe(true);
    expect(isAccountChromeNoRailPath("/settings")).toBe(false);
    expect(isAccountChromeNoRailPath("/settings/profile")).toBe(false);
    expect(isAccountChromeNoRailPath("/aggregation/dashboard")).toBe(false);
    expect(isAccountChromeNoRailPath("/social")).toBe(false);
    expect(isAccountChromeNoRailPath("/education")).toBe(false);
    expect(isAccountChromeNoRailPath("/home")).toBe(false);
  });
});
