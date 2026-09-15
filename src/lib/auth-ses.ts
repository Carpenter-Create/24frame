import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

import { PRODUCT_NAME } from "@/lib/product";

// Auth transactional mail (magic link / OTP / verification) via SES us-west-2
// on the verified 24frame.co identity. Dedicated SES_AWS_* namespace — never
// AWS_* (titles), FINANCE_AWS_* (finance S3), or MEDIA_AWS_* (social).
// Never NEXT_PUBLIC_. Auth stays Supabase Auth. Leaf transport: imported from server-only
// email.ts and the founder smoke script. Do not import from a client module.

export const AUTH_SES_REGION = "us-west-2";
export const AUTH_SES_IDENTITY_DOMAIN = "24frame.co";
export const AUTH_SES_DEFAULT_FROM = `${PRODUCT_NAME} <noreply@${AUTH_SES_IDENTITY_DOMAIN}>`;

export const AUTH_SES_ENV = [
  "SES_AWS_REGION",
  "SES_AWS_ACCESS_KEY_ID",
  "SES_AWS_SECRET_ACCESS_KEY",
] as const;

export type AuthSesEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function requireSesEnv(name: (typeof AUTH_SES_ENV)[number]): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

export function requireAuthSesRegion(): string {
  const region = requireSesEnv("SES_AWS_REGION");
  if (region !== AUTH_SES_REGION) {
    throw new Error("SES_AWS_REGION must be us-west-2");
  }
  return region;
}

export function emailAddressFrom(raw: string): string {
  const angled = raw.match(/<([^>]+)>/);
  return (angled?.[1] ?? raw).trim();
}

export function authEmailFrom(): string {
  const raw = process.env.PORTAL_EMAIL_FROM?.trim() || AUTH_SES_DEFAULT_FROM;
  const address = emailAddressFrom(raw);
  if (!address.toLowerCase().endsWith(`@${AUTH_SES_IDENTITY_DOMAIN}`)) {
    throw new Error(
      "PORTAL_EMAIL_FROM must be an address on the verified 24frame.co identity",
    );
  }
  return raw;
}

function authSesClient(): SESv2Client {
  return new SESv2Client({
    region: requireAuthSesRegion(),
    credentials: {
      accessKeyId: requireSesEnv("SES_AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireSesEnv("SES_AWS_SECRET_ACCESS_KEY"),
    },
  });
}

export async function sendAuthSesEmail(msg: AuthSesEmail): Promise<{ messageId: string }> {
  const from = authEmailFrom();
  const command = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [msg.to] },
    Content: {
      Simple: {
        Subject: { Data: msg.subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: msg.text, Charset: "UTF-8" },
          Html: { Data: msg.html, Charset: "UTF-8" },
        },
      },
    },
  });
  let response;
  try {
    response = await authSesClient().send(command);
  } catch (error) {
    throw new Error(`Email send failed: ${error instanceof Error ? error.message : error}`);
  }
  const messageId = response.MessageId;
  if (!messageId) throw new Error("Email send failed: SES returned no MessageId");
  return { messageId };
}
