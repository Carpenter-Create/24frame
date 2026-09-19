import { afterEach, describe, expect, it } from "vitest";

import { ACCOUNT_PHOTO_HREF } from "@/lib/account-avatar";
import {
  readAccountChromeIdentity,
  rememberAccountChromeIdentity,
  resetAccountChromeIdentityForTests,
  stickyAccountChromeIdentity,
} from "./account-chrome-identity";

afterEach(() => {
  resetAccountChromeIdentityForTests();
});

describe("stickyAccountChromeIdentity", () => {
  it("keeps the last known face when the next hop has empty props", () => {
    expect(stickyAccountChromeIdentity({ email: "", photoUrl: null })).toEqual({
      email: "",
      name: undefined,
      photoUrl: null,
    });

    rememberAccountChromeIdentity({
      email: "ada@example.com",
      name: "Ada Lovelace",
      photoUrl: ACCOUNT_PHOTO_HREF,
    });

    expect(stickyAccountChromeIdentity({ email: "", photoUrl: null })).toEqual({
      email: "ada@example.com",
      name: "Ada Lovelace",
      photoUrl: ACCOUNT_PHOTO_HREF,
    });
    expect(readAccountChromeIdentity()?.photoUrl).toBe(ACCOUNT_PHOTO_HREF);
  });

  it("does not invent a name from the email", () => {
    rememberAccountChromeIdentity({
      email: "ada@example.com",
      name: null,
      photoUrl: ACCOUNT_PHOTO_HREF,
    });
    expect(stickyAccountChromeIdentity({ email: "" }).name).toBeNull();
    expect(stickyAccountChromeIdentity({ email: "" }).email).toBe("ada@example.com");
  });
});
