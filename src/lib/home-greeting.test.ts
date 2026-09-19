import { describe, expect, it } from "vitest";

import { HOME_GREETING_BARE, homeGreeting, homeGreetingFirst } from "./home-greeting";

describe("homeGreeting", () => {
  it("locks Hi, {First} from a given name, then the display-name token", () => {
    expect(HOME_GREETING_BARE).toBe("Hi");
    expect(homeGreeting({ firstName: "Ada", displayName: "Ada Lovelace" })).toBe("Hi, Ada");
    expect(homeGreeting({ displayName: "Ada Lovelace" })).toBe("Hi, Ada");
    expect(homeGreeting({ displayName: "  Mary Jane Watson  " })).toBe("Hi, Mary");
    expect(homeGreetingFirst({ firstName: "Ada", displayName: "Ignored" })).toBe("Ada");
    expect(homeGreetingFirst({ displayName: "Ada Lovelace" })).toBe("Ada");
  });

  it("falls back to Hi only — never undefined, email, or a bare Home title", () => {
    expect(homeGreeting()).toBe("Hi");
    expect(homeGreeting({ firstName: null, displayName: null })).toBe("Hi");
    expect(homeGreeting({ firstName: "   ", displayName: "" })).toBe("Hi");
    expect(homeGreeting({ firstName: "undefined", displayName: "null" })).toBe("Hi");
    expect(homeGreeting({ displayName: "ada@example.com" })).toBe("Hi");
    expect(homeGreeting({ firstName: "ada@example.com", displayName: "Ada" })).toBe("Hi, Ada");
    expect(homeGreeting({ displayName: "ada" })).toBe("Hi, ada");
    expect(homeGreeting()).not.toBe("Home");
    expect(homeGreeting({ displayName: "Ada Lovelace" })).not.toContain("undefined");
    expect(homeGreeting({ displayName: "Ada Lovelace" })).not.toContain("@");
  });
});
