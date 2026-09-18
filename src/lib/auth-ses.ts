import { MessageRejected, SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

import { PRODUCT_NAME } from "@/lib/product";

// Auth transactional mail (magic link / OTP / verification) via SES us-west-2
// on the verified 24frame.co identity. Dedicated SES_AWS_* namespace — never
// AWS_* (titles), FINANCE_AWS_* (finance S3), or MEDIA_AWS_* (social).
// Never NEXT_PUBLIC_. Auth stays Supabase Auth. Leaf transport: imported from server-only
// email.ts and the founder smoke script. Do not import from a client module.
// From lock: auth@24frame.co — never noreply. Every SendEmailCommand sets
// ConfigurationSetName 24frame-auth, Reply-To, and purpose=auth.

export const AUTH_SES_REGION = "us-west-2";
export const AUTH_SES_IDENTITY_DOMAIN = "24frame.co";
export const AUTH_SES_CONFIGURATION_SET = "24frame-auth";
export const AUTH_SES_DEFAULT_FROM = `${PRODUCT_NAME} <auth@${AUTH_SES_IDENTITY_DOMAIN}>`;
export const AUTH_SES_DEFAULT_REPLY_TO = "admin@globalcontent.co";

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

// SES account-level suppression (BOUNCE + COMPLAINT) is already on in AWS.
// SendEmail to a suppressed destination fails as MessageRejected (or a
// suppression-shaped SES error). Map that to a typed failure so Auth callers
// do not treat it as a generic mail outage. No pre-send suppression lookup
// (extra IAM + latency). No SNS→DB webhook.
export class AuthSesSuppressedError extends Error {
  readonly recipient: string;

  constructor(recipient: string) {
    super(`Auth SES destination suppressed: ${recipient}`);
    this.name = "AuthSesSuppressedError";
    this.recipient = recipient;
  }
}

export const AUTH_SES_SUPPRESSED_USER_MESSAGE =
  "This address cannot receive sign-in mail.";

export function isAuthSesSuppressedError(error: unknown): error is AuthSesSuppressedError {
  return error instanceof AuthSesSuppressedError;
}

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

export function authEmailReplyTo(): string {
  return process.env.PORTAL_EMAIL_REPLY_TO?.trim() || AUTH_SES_DEFAULT_REPLY_TO;
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

function sesFailureText(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return `${error.name} ${error.message}`;
  if (error && typeof error === "object") {
    const name = "name" in error && typeof error.name === "string" ? error.name : "";
    const code = "Code" in error && typeof error.Code === "string" ? error.Code : "";
    const message = "message" in error && typeof error.message === "string" ? error.message : "";
    return `${name} ${code} ${message}`;
  }
  return String(error);
}

// Verified against SES / SDK shapes: SESv2 SendEmail throws MessageRejected
// (name/Code MessageRejected; SDK class MessageRejected). Account-suppressed
// destinations also surface "suppression list" / "suppressed destination" in
// the message. Other SES faults (throttles, paused sending, missing MessageId)
// stay generic send failures.
function isSesSuppressedFailure(error: unknown): boolean {
  if (error instanceof MessageRejected) return true;
  return /MessageRejected|suppression list|suppressed destination|account-level suppression/i.test(
    sesFailureText(error),
  );
}

export async function sendAuthSesEmail(msg: AuthSesEmail): Promise<{ messageId: string }> {
  const from = authEmailFrom();
  const command = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [msg.to] },
    ReplyToAddresses: [authEmailReplyTo()],
    ConfigurationSetName: AUTH_SES_CONFIGURATION_SET,
    EmailTags: [{ Name: "purpose", Value: "auth" }],
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
    if (isSesSuppressedFailure(error)) {
      throw new AuthSesSuppressedError(msg.to);
    }
    throw new Error(`Email send failed: ${error instanceof Error ? error.message : error}`);
  }
  const messageId = response.MessageId;
  if (!messageId) throw new Error("Email send failed: SES returned no MessageId");
  return { messageId };
}
