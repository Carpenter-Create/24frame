import "server-only";
import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendAuthSesEmail } from "@/lib/auth-ses";
import {
  buildMagicLinkEmail,
  buildOtpEmail,
  buildSignInWithCodeEmail,
  escapeEmailHtml,
} from "@/lib/email-auth-templates";
import { EMAIL_BODY, housePrimaryLink, wrapHouseEmail } from "@/lib/email-house";
import { PRODUCT_NAME } from "@/lib/product";
import type { Database } from "@/lib/supabase/database.types";

export { buildMagicLinkEmail, buildOtpEmail, buildSignInWithCodeEmail } from "@/lib/email-auth-templates";

// Auth transactional mail (magic link / OTP / verification) sends via SES us-west-2
// on the verified 24frame.co identity. From-address is PORTAL_EMAIL_FROM /
// auth@24frame.co — never noreply. See auth-ses.ts. No Cognito.
//
// Residual Resend: GC-Support / asset notification mail only, from the dedicated
// assets identity (founder: "anything asset related should come from
// assets@globalcontent.co"). Override via ASSETS_EMAIL_FROM. Auth send functions
// must not use this path.
const EMAIL_FROM = process.env.ASSETS_EMAIL_FROM ?? `${PRODUCT_NAME} <assets@globalcontent.co>`;

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const { subject, text, html } = buildOtpEmail(code);
  await sendAuthSesEmail({ to, subject, text, html });
}

export async function sendMagicLinkEmail(to: string, signInUrl: string): Promise<void> {
  const { subject, text, html } = buildMagicLinkEmail(signInUrl);
  await sendAuthSesEmail({ to, subject, text, html });
}

export async function sendSignInWithCodeEmail(
  to: string,
  signInUrl: string,
  code: string,
): Promise<void> {
  const { subject, text, html } = buildSignInWithCodeEmail(signInUrl, code);
  await sendAuthSesEmail({ to, subject, text, html });
}

// GC-Support notification email (§20). Body is the same voice-approved line shown in-app;
// this frames it with a CTA back into the dashboard and the sign-off. Copy lives in
// lib/notifications.ts (subject/CTA per kind) — this is just the template. body is escaped
// because it carries user content (title, rejection reason).
export function buildNotificationEmail(args: {
  subject: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): { subject: string; text: string; html: string } {
  const { subject, body, ctaLabel, ctaUrl } = args;
  const text = `${body}\n\n${ctaLabel}: ${ctaUrl}\n\n${PRODUCT_NAME}`;
  const html = wrapHouseEmail(
    `<p style="margin:0 0 16px;color:${EMAIL_BODY}">${escapeEmailHtml(body)}</p>` +
      housePrimaryLink(ctaUrl, escapeEmailHtml(ctaLabel)),
  );
  return { subject, text, html };
}

// Residual Resend path — GC-Support / asset notification only. Not Auth.
async function sendNotificationEmail(
  to: string,
  msg: { subject: string; text: string; html: string },
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject: msg.subject, text: msg.text, html: msg.html });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}

// Send a GC-Support notification email to every active member of an org. Recipients come from
// the GC-gated org_notification_recipients RPC (called with the operator's JWT — no service-role
// here). Best-effort: a missing config or a failed send logs and is swallowed, so it can never
// break the GC action that triggered it (the in-app notification already committed).
export async function sendOrgNotificationEmail(
  supabase: SupabaseClient<Database>,
  orgId: string,
  msg: { subject: string; body: string; ctaLabel: string; ctaPath: string },
): Promise<void> {
  const { data: recipients, error } = await supabase.rpc("org_notification_recipients", { p_org_id: orgId });
  if (error || !recipients || recipients.length === 0) return;
  const base = process.env.PORTAL_BASE_URL?.replace(/\/+$/, "") ?? "";
  const email = buildNotificationEmail({
    subject: msg.subject,
    body: msg.body,
    ctaLabel: msg.ctaLabel,
    ctaUrl: `${base}${msg.ctaPath}`,
  });
  await Promise.all(
    recipients.map((to) =>
      sendNotificationEmail(to, email).catch((e) =>
        console.error("[notifications] email send failed", e instanceof Error ? e.message : e),
      ),
    ),
  );
}
