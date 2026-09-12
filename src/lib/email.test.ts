import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { buildMagicLinkEmail, buildNotificationEmail, buildOtpEmail } from "./email";
import {
  EMAIL_ACCENT,
  EMAIL_ADDRESS,
  EMAIL_COPYRIGHT,
  EMAIL_LOGO_URL,
  EMAIL_SITE_LABEL,
  EMAIL_SITE_URL,
} from "./email-house";

const SPORTY_BLUE = "#1769FF";

const AUTH_TEMPLATE = resolve(__dirname, "../../supabase/templates/magic_link.html");
const AUTH_CONFIG = readFileSync(resolve(__dirname, "../../supabase/config.toml"), "utf8");

function productResidue(html: string): string {
  return html.replaceAll("Global Content Holdings LLC", "");
}

function assertNoFilledPill(html: string) {
  expect(html).not.toMatch(/background:\s*#1769FF/i);
  expect(html).not.toMatch(/border-radius:\s*999px/);
  expect(html).not.toMatch(/height:4px;background:#1769FF/);
}

describe("buildOtpEmail", () => {
  it("includes the code and no banned words", () => {
    const { subject, text, html } = buildOtpEmail("012345");
    expect(text).toContain("012345");
    expect(html).toContain("012345");
    expect(subject).toBe("Your 24Frame access code");
    expect(subject.toLowerCase()).not.toMatch(/seamless|frictionless|elevate|amplify/);
    expect(text).toMatch(/10 minutes/);
  });

  it("uses the rematched house shell with Sporty Blue as a link accent", () => {
    const { subject, html } = buildOtpEmail("012345");
    expect(html).toContain("24Frame");
    expect(EMAIL_ACCENT).toBe(SPORTY_BLUE);
    expect(html).toContain(EMAIL_LOGO_URL);
    expect(html).toContain(EMAIL_SITE_URL);
    expect(html).toContain(EMAIL_SITE_LABEL);
    expect(html).toContain(`color:${SPORTY_BLUE}`);
    expect(html).toContain(EMAIL_COPYRIGHT);
    expect(html).toContain(EMAIL_ADDRESS);
    assertNoFilledPill(html);
    expect(subject).not.toMatch(/Global Content|\bGC\b|globalcontent/i);
    expect(productResidue(html)).not.toMatch(/\bGC\b|globalcontent/i);
  });
});

describe("buildNotificationEmail", () => {
  it("puts Sporty Blue on the CTA link and names 24Frame in the product chrome", () => {
    const { text, html } = buildNotificationEmail({
      subject: '"North Wind" was returned for revision',
      body: "North Wind was returned for revision.",
      ctaLabel: "Review and resubmit",
      ctaUrl: "https://app.example/titles/1",
    });
    expect(text).toContain("24Frame");
    expect(text).not.toMatch(/Global Content|\bGC\b|globalcontent/i);
    expect(html).toContain("24Frame");
    expect(html).toContain(SPORTY_BLUE);
    expect(html).toContain('href="https://app.example/titles/1"');
    expect(html).toContain("Review and resubmit");
    expect(html).toContain(`style="color:${SPORTY_BLUE};text-decoration:none"`);
    expect(html).toContain(EMAIL_LOGO_URL);
    expect(html).toContain(EMAIL_SITE_LABEL);
    expect(html).toContain(EMAIL_COPYRIGHT);
    assertNoFilledPill(html);
    expect(productResidue(html)).not.toMatch(/\bGC\b|globalcontent/i);
    expect(html).toContain("North Wind was returned for revision.");
  });
});

describe("buildMagicLinkEmail", () => {
  const signInUrl =
    "https://app.24frame.co/auth/callback?token_hash=test-token&type=email";

  it("is link-only house mail: Sporty Blue text link, no OTP code", () => {
    const { subject, text, html } = buildMagicLinkEmail(signInUrl);
    expect(subject).toBe("Your 24Frame sign-in link");
    expect(text).toContain(signInUrl);
    expect(text).not.toMatch(/enter this code/i);
    expect(html).toContain("Sign in");
    expect(html).toContain("Sign in to 24Frame");
    expect(html).toContain(`href="${signInUrl.replaceAll("&", "&amp;")}"`);
    expect(html).toContain(`color:${SPORTY_BLUE}`);
    expect(html).toContain(EMAIL_LOGO_URL);
    expect(html).toContain(EMAIL_SITE_LABEL);
    expect(html).toContain(EMAIL_COPYRIGHT);
    expect(html).toContain(EMAIL_ADDRESS);
    expect(html).not.toContain("{{ .Token }}");
    expect(html).not.toMatch(/enter this code/i);
    expect(html).not.toMatch(/letter-spacing:2px/);
    assertNoFilledPill(html);
    expect(subject).not.toMatch(/Global Content|\bGC\b|globalcontent/i);
    expect(productResidue(html)).not.toMatch(/\bGC\b|globalcontent/i);
    expect(html.toLowerCase()).not.toMatch(/seamless|frictionless|elevate|amplify/);
  });
});

describe("Auth magic-link template", () => {
  it("is the house Auth mail HTML with a Sporty Blue text link, not a filled pill", () => {
    const html = readFileSync(AUTH_TEMPLATE, "utf8");
    expect(AUTH_CONFIG).toContain("[auth.email.template.magic_link]");
    expect(AUTH_CONFIG).toContain('subject = "Your 24Frame sign-in link"');
    expect(AUTH_CONFIG).toContain('content_path = "./supabase/templates/magic_link.html"');
    expect(html).toContain("24Frame");
    expect(html).toContain("Sign in");
    expect(html).toContain("Sign in to 24Frame");
    expect(html).toContain("{{ .ConfirmationURL }}");
    expect(html).toContain("{{ .Token }}");
    expect(html).toContain("Or enter this code:");
    expect(html).toContain('font-size:24px;font-weight:600;letter-spacing:2px');
    expect(html).toContain(SPORTY_BLUE);
    expect(html).toContain(`color:${SPORTY_BLUE}`);
    expect(html).toContain(EMAIL_LOGO_URL);
    expect(html).toContain('alt="24Frame"');
    expect(html).toContain("Radically different film distribution.");
    expect(html).toContain("https://24frame.co");
    expect(html).toContain("24frame.co");
    expect(html).toContain("https://24frame.co/legal");
    expect(html).toContain("© 2026 Global Content Holdings LLC. All rights reserved.");
    expect(html).toContain("3839 McKinney Ave, Suite 155 #2276, Dallas, TX 75204");
    expect(html).toContain("#FAFAFB");
    expect(html).toContain("max-width:600px");
    expect(html).toContain("border-radius:14px");
    expect(html).toContain("#E6E8EB");
    expect(html).toContain("fonts.googleapis.com/css2?family=Geist");
    assertNoFilledPill(html);
    expect(productResidue(html)).not.toMatch(/\bGC\b|globalcontent/i);
    expect(html.toLowerCase()).not.toMatch(/seamless|frictionless|elevate|amplify/);
  });
});
