// Founder/CoS live smoke for Auth SES transport. Mail transport only — no Cognito.
// Uses sendAuthSesEmail + the same house magic-link template as dashboard sign-in.
// Does not print secret values.
//
// Dry-run (default): checks env names and prints From/region. No send.
// Live send (needs SES_AWS_* on this machine or a Vercel env pull):
//   pnpm exec tsx scripts/email/ses-auth-smoke.ts --live --to <inbox>
//
// Verified in CI: mocked SES unit + Auth-caller tests.
// Live inbox delivery is founder-executed.

import { AUTH_SES_ENV, AUTH_SES_REGION, authEmailFrom, sendAuthSesEmail } from "../../src/lib/auth-ses";
import { buildMagicLinkEmail } from "../../src/lib/email-auth-templates";

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function envPresent(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

async function main(): Promise<void> {
  const live = process.argv.includes("--live");
  const to = argValue("--to");
  const regionSet = process.env.SES_AWS_REGION?.trim() ?? "(unset)";
  const from = (() => {
    try {
      return authEmailFrom();
    } catch (error) {
      return `unusable: ${error instanceof Error ? error.message : error}`;
    }
  })();

  console.log("24Frame Auth SES smoke");
  console.log(`region required: ${AUTH_SES_REGION}`);
  console.log(`SES_AWS_REGION: ${regionSet === AUTH_SES_REGION ? AUTH_SES_REGION : regionSet}`);
  for (const name of AUTH_SES_ENV) {
    console.log(`${name}: ${envPresent(name) ? "set" : "missing"}`);
  }
  console.log(`PORTAL_EMAIL_FROM: ${envPresent("PORTAL_EMAIL_FROM") ? "set" : "unset (defaults to auth@24frame.co)"}`);
  console.log(`PORTAL_EMAIL_REPLY_TO: ${envPresent("PORTAL_EMAIL_REPLY_TO") ? "set" : "unset (defaults to admin@globalcontent.co)"}`);
  console.log(`From: ${from}`);
  console.log("Does not read AWS_* / FINANCE_AWS_* / MEDIA_AWS_* / RESEND_API_KEY.");

  if (!live) {
    console.log("Dry-run only. Pass --live --to <inbox> to send one house magic-link template.");
    return;
  }
  if (!to) {
    throw new Error("--live requires --to <inbox>");
  }

  const { subject, text, html } = buildMagicLinkEmail(
    "https://app.24frame.co/auth/callback?token_hash=ses-auth-smoke&type=email",
  );
  const result = await sendAuthSesEmail({ to, subject, text, html });
  console.log(`sent MessageId: ${result.messageId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
