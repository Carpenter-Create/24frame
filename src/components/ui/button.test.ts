import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const src = readFileSync("src/components/ui/button.tsx", "utf8");
const login = readFileSync("src/app/login/login-form.tsx", "utf8");
const home = readFileSync("src/components/dashboard/dashboard-home.tsx", "utf8");

describe("product buttons", () => {
  it("stay flat — no hover lift or elevation on product/login primary", () => {
    expect(src).not.toContain("hover:-translate-y-px");
    expect(src).not.toContain("active:translate-y-0");
    expect(src).not.toContain("shadow-[");
    expect(src).not.toContain("elevation");
    expect(login).toContain("<Button");
    expect(home).not.toContain("hover:-translate-y-px");
    expect(home).not.toContain("active:translate-y-0");
  });
});
