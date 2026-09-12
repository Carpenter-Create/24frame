import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { buildNotificationEmail, buildOtpEmail } from "./email";
import { EMAIL_ACCENT } from "./email-house";

const SPORTY_BLUE = "#1769FF";

const PRODUCT_RESIDUE = /Global Content|\bGC\b|globalcontent/i;
const AUTH_TEMPLATE = resolve(__dirname, "../../supabase/templates/magic_link.html");
const AUTH_CONFIG = readFileSync(resolve(__dirname, "../../supabase/config.toml"), "utf8");

describe("buildOtpEmail", () => {
  it("includes the code and no banned words", () => {
    const { subject, text, html } = buildOtpEmail("012345");
    expect(text).toContain("012345");
    expect(html).toContain("012345");
    expect(subject).toBe("Your 24Frame access code");
    expect(subject.toLowerCase()).not.toMatch(/seamless|frictionless|elevate|amplify/);
    expect(text).toMatch(/10 minutes/);
  });

  it("uses 24Frame house chrome and Sporty Blue, not Global Content", () => {
    const { subject, html } = buildOtpEmail("012345");
    expect(html).toContain("24Frame");
    expect(EMAIL_ACCENT).toBe(SPORTY_BLUE);
    expect(html).toContain(`background:${SPORTY_BLUE}`);
    expect(subject).not.toMatch(PRODUCT_RESIDUE);
    expect(html).not.toMatch(PRODUCT_RESIDUE);
  });
});

describe("buildNotificationEmail", () => {
  it("puts Sporty Blue on the CTA and names 24Frame only", () => {
    const { text, html } = buildNotificationEmail({
      subject: '"North Wind" was returned for revision',
      body: "North Wind was returned for revision.",
      ctaLabel: "Review and resubmit",
      ctaUrl: "https://app.example/titles/1",
    });
    expect(text).toContain("24Frame");
    expect(text).not.toMatch(PRODUCT_RESIDUE);
    expect(html).toContain("24Frame");
    expect(html).toContain(SPORTY_BLUE);
    expect(html).toContain('href="https://app.example/titles/1"');
    expect(html).toContain("Review and resubmit");
    expect(html).toContain(`style="color:${SPORTY_BLUE}"`);
    expect(html).not.toMatch(PRODUCT_RESIDUE);
    expect(html).toContain("North Wind was returned for revision.");
  });
});

describe("Auth magic-link template", () => {
  it("is the local Auth mail HTML with 24Frame and Sporty Blue", () => {
    const html = readFileSync(AUTH_TEMPLATE, "utf8");
    expect(AUTH_CONFIG).toContain("[auth.email.template.magic_link]");
    expect(AUTH_CONFIG).toContain('subject = "Your 24Frame sign-in link"');
    expect(AUTH_CONFIG).toContain('content_path = "./supabase/templates/magic_link.html"');
    expect(html).toContain("24Frame");
    expect(html).toContain("Sign in");
    expect(html).toContain("{{ .ConfirmationURL }}");
    expect(html).toContain("{{ .Token }}");
    expect(html).toContain(SPORTY_BLUE);
    expect(html).toContain(`background:${SPORTY_BLUE}`);
    expect(html).not.toMatch(PRODUCT_RESIDUE);
    expect(html.toLowerCase()).not.toMatch(/seamless|frictionless|elevate|amplify/);
  });
});
