import { describe, expect, it } from "vitest";

import {
  HOME_GREETING_BARE,
  HOME_GREETING_TIME_ZONE,
  homeGreeting,
  homeGreetingDate,
  homeGreetingFirst,
} from "./home-greeting";

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

describe("homeGreetingDate", () => {
  const now = new Date("2026-09-18T18:00:00.000Z");

  it("locks weekday + month + day in America/Chicago — no year, no clock", () => {
    expect(HOME_GREETING_TIME_ZONE).toBe("America/Chicago");
    expect(homeGreetingDate(now, HOME_GREETING_TIME_ZONE)).toBe("Friday, September 18");
    expect(homeGreetingDate(now)).toBe("Friday, September 18");
    expect(homeGreetingDate(now)).not.toContain("2026");
    expect(homeGreetingDate(now)).not.toMatch(/\d{1,2}:\d{2}/);
    expect(homeGreetingDate(now)).not.toMatch(/AM|PM|Good morning/i);
  });

  it("stays on the Chicago calendar day when UTC has already rolled", () => {
    const lateChicagoFriday = new Date("2026-09-19T04:00:00.000Z");
    const chicagoSaturday = new Date("2026-09-19T05:00:00.000Z");
    expect(homeGreetingDate(lateChicagoFriday, HOME_GREETING_TIME_ZONE)).toBe(
      "Friday, September 18",
    );
    expect(homeGreetingDate(chicagoSaturday, HOME_GREETING_TIME_ZONE)).toBe(
      "Saturday, September 19",
    );
    expect(homeGreetingDate(lateChicagoFriday, "UTC")).toBe("Saturday, September 19");
  });
});
