import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("@aws-sdk/client-sesv2", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/client-sesv2")>();
  return {
    ...actual,
    SESv2Client: vi.fn().mockImplementation(function SESv2ClientMock() {
      return { send: mockSend };
    }),
  };
});

import { MessageRejected, SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

import {
  AUTH_SES_CONFIGURATION_SET,
  AUTH_SES_DEFAULT_FROM,
  AUTH_SES_DEFAULT_REPLY_TO,
  AUTH_SES_ENV,
  AUTH_SES_IDENTITY_DOMAIN,
  AUTH_SES_REGION,
  AUTH_SES_SUPPRESSED_USER_MESSAGE,
  AuthSesSuppressedError,
  authEmailFrom,
  authEmailReplyTo,
  emailAddressFrom,
  isAuthSesSuppressedError,
  requireAuthSesRegion,
  sendAuthSesEmail,
} from "./auth-ses";

const SES_AWS = {
  SES_AWS_REGION: AUTH_SES_REGION,
  SES_AWS_ACCESS_KEY_ID: "ses-access-key",
  SES_AWS_SECRET_ACCESS_KEY: "ses-secret-key",
};

const TITLE_AWS = {
  AWS_ACCESS_KEY_ID: "title-access-key",
  AWS_SECRET_ACCESS_KEY: "title-secret-key",
  AWS_REGION: "us-east-1",
};

const FINANCE_AWS = {
  FINANCE_AWS_ACCESS_KEY_ID: "finance-access-key",
  FINANCE_AWS_SECRET_ACCESS_KEY: "finance-secret-key",
  FINANCE_AWS_REGION: "us-west-2",
};

const MEDIA_AWS = {
  MEDIA_AWS_ACCESS_KEY_ID: "media-access-key",
  MEDIA_AWS_SECRET_ACCESS_KEY: "media-secret-key",
  MEDIA_AWS_REGION: "us-east-1",
};

function setSesAwsEnv() {
  process.env.SES_AWS_REGION = SES_AWS.SES_AWS_REGION;
  process.env.SES_AWS_ACCESS_KEY_ID = SES_AWS.SES_AWS_ACCESS_KEY_ID;
  process.env.SES_AWS_SECRET_ACCESS_KEY = SES_AWS.SES_AWS_SECRET_ACCESS_KEY;
}

function clearSesAwsEnv() {
  delete process.env.SES_AWS_REGION;
  delete process.env.SES_AWS_ACCESS_KEY_ID;
  delete process.env.SES_AWS_SECRET_ACCESS_KEY;
  delete process.env.PORTAL_EMAIL_FROM;
  delete process.env.PORTAL_EMAIL_REPLY_TO;
}

describe("auth SES isolation", () => {
  beforeEach(() => {
    mockSend.mockReset();
    vi.mocked(SESv2Client).mockClear();
    process.env.AWS_ACCESS_KEY_ID = TITLE_AWS.AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = TITLE_AWS.AWS_SECRET_ACCESS_KEY;
    process.env.AWS_REGION = TITLE_AWS.AWS_REGION;
    process.env.FINANCE_AWS_ACCESS_KEY_ID = FINANCE_AWS.FINANCE_AWS_ACCESS_KEY_ID;
    process.env.FINANCE_AWS_SECRET_ACCESS_KEY = FINANCE_AWS.FINANCE_AWS_SECRET_ACCESS_KEY;
    process.env.FINANCE_AWS_REGION = FINANCE_AWS.FINANCE_AWS_REGION;
    process.env.MEDIA_AWS_ACCESS_KEY_ID = MEDIA_AWS.MEDIA_AWS_ACCESS_KEY_ID;
    process.env.MEDIA_AWS_SECRET_ACCESS_KEY = MEDIA_AWS.MEDIA_AWS_SECRET_ACCESS_KEY;
    process.env.MEDIA_AWS_REGION = MEDIA_AWS.MEDIA_AWS_REGION;
    process.env.RESEND_API_KEY = "re_test_unused";
    setSesAwsEnv();
    delete process.env.PORTAL_EMAIL_FROM;
    delete process.env.PORTAL_EMAIL_REPLY_TO;
  });

  afterEach(() => {
    clearSesAwsEnv();
  });

  it("pins the verified 24frame.co identity in us-west-2", () => {
    expect(AUTH_SES_REGION).toBe("us-west-2");
    expect(AUTH_SES_IDENTITY_DOMAIN).toBe("24frame.co");
    expect(AUTH_SES_DEFAULT_FROM).toBe("24Frame <auth@24frame.co>");
    expect(AUTH_SES_CONFIGURATION_SET).toBe("24frame-auth");
    expect(AUTH_SES_DEFAULT_REPLY_TO).toBe("admin@globalcontent.co");
    expect(AUTH_SES_ENV).toEqual([
      "SES_AWS_REGION",
      "SES_AWS_ACCESS_KEY_ID",
      "SES_AWS_SECRET_ACCESS_KEY",
    ]);
  });

  it("constructs SESv2Client from SES_AWS_* even when title/finance/media AWS is present", async () => {
    mockSend.mockResolvedValueOnce({ MessageId: "ses-message-1" });
    await sendAuthSesEmail({
      to: "holder@example.com",
      subject: "Your 24Frame sign-in link",
      text: "Sign in",
      html: "<p>Sign in</p>",
    });
    expect(SESv2Client).toHaveBeenCalledTimes(1);
    const config = vi.mocked(SESv2Client).mock.calls[0]?.[0];
    expect(config).toMatchObject({
      region: AUTH_SES_REGION,
      credentials: {
        accessKeyId: SES_AWS.SES_AWS_ACCESS_KEY_ID,
        secretAccessKey: SES_AWS.SES_AWS_SECRET_ACCESS_KEY,
      },
    });
    if (config?.credentials && "accessKeyId" in config.credentials) {
      expect(config.credentials.accessKeyId).not.toBe(TITLE_AWS.AWS_ACCESS_KEY_ID);
      expect(config.credentials.accessKeyId).not.toBe(FINANCE_AWS.FINANCE_AWS_ACCESS_KEY_ID);
      expect(config.credentials.accessKeyId).not.toBe(MEDIA_AWS.MEDIA_AWS_ACCESS_KEY_ID);
    }
  });

  it.each([...AUTH_SES_ENV] as const)(
    "refuses when %s is missing and does not use AWS_* / FINANCE_AWS_* / MEDIA_AWS_*",
    async (name) => {
      delete process.env[name];
      await expect(
        sendAuthSesEmail({
          to: "holder@example.com",
          subject: "x",
          text: "x",
          html: "<p>x</p>",
        }),
      ).rejects.toThrow(/SES_AWS_/);
      expect(SESv2Client).not.toHaveBeenCalled();
    },
  );

  it("does not fall back to AWS_* when every SES_AWS_* var is missing", async () => {
    clearSesAwsEnv();
    process.env.AWS_ACCESS_KEY_ID = TITLE_AWS.AWS_ACCESS_KEY_ID;
    await expect(
      sendAuthSesEmail({
        to: "holder@example.com",
        subject: "x",
        text: "x",
        html: "<p>x</p>",
      }),
    ).rejects.toThrow(/SES_AWS_/);
  });

  it("refuses a region other than us-west-2", () => {
    process.env.SES_AWS_REGION = "us-east-1";
    expect(() => requireAuthSesRegion()).toThrow(/us-west-2/);
  });

  it("defaults From to auth@24frame.co and accepts PORTAL_EMAIL_FROM on that domain", () => {
    expect(authEmailFrom()).toBe(AUTH_SES_DEFAULT_FROM);
    expect(emailAddressFrom(authEmailFrom())).toBe("auth@24frame.co");
    process.env.PORTAL_EMAIL_FROM = "24Frame <signin@24frame.co>";
    expect(authEmailFrom()).toBe("24Frame <signin@24frame.co>");
  });

  it("defaults Reply-To to admin@globalcontent.co and prefers PORTAL_EMAIL_REPLY_TO", () => {
    expect(authEmailReplyTo()).toBe(AUTH_SES_DEFAULT_REPLY_TO);
    process.env.PORTAL_EMAIL_REPLY_TO = "ops@globalcontent.co";
    expect(authEmailReplyTo()).toBe("ops@globalcontent.co");
  });

  it("refuses a From address off the verified 24frame.co identity", () => {
    process.env.PORTAL_EMAIL_FROM = "24Frame <assets@globalcontent.co>";
    expect(() => authEmailFrom()).toThrow(/24frame\.co/);
  });

  it("maps SES MessageRejected to AuthSesSuppressedError with the recipient", async () => {
    mockSend.mockRejectedValueOnce(
      new MessageRejected({
        message: "Email address is on the suppression list.",
        $metadata: { httpStatusCode: 400 },
      }),
    );
    const send = sendAuthSesEmail({
      to: "holder@example.com",
      subject: "x",
      text: "x",
      html: "<p>x</p>",
    });
    await expect(send).rejects.toBeInstanceOf(AuthSesSuppressedError);
    await expect(send).rejects.toMatchObject({
      name: "AuthSesSuppressedError",
      recipient: "holder@example.com",
      message: "Auth SES destination suppressed: holder@example.com",
    });
  });

  it("maps a MessageRejected-named Error to AuthSesSuppressedError", async () => {
    mockSend.mockRejectedValueOnce(new Error("MessageRejected"));
    await expect(
      sendAuthSesEmail({
        to: "holder@example.com",
        subject: "x",
        text: "x",
        html: "<p>x</p>",
      }),
    ).rejects.toBeInstanceOf(AuthSesSuppressedError);
  });

  it("maps account-suppressed destination text to AuthSesSuppressedError", async () => {
    mockSend.mockRejectedValueOnce(
      new Error(
        "Amazon SES did not send the message to this address because it is on the suppression list for your account.",
      ),
    );
    try {
      await sendAuthSesEmail({
        to: "blocked@example.com",
        subject: "x",
        text: "x",
        html: "<p>x</p>",
      });
      expect.unreachable();
    } catch (error) {
      expect(isAuthSesSuppressedError(error)).toBe(true);
      if (isAuthSesSuppressedError(error)) {
        expect(error.recipient).toBe("blocked@example.com");
      }
    }
  });

  it("wraps other SES send failures as generic send failures", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("Sending paused for the account."), {
        name: "AccountSendingPausedException",
      }),
    );
    const send = sendAuthSesEmail({
      to: "holder@example.com",
      subject: "x",
      text: "x",
      html: "<p>x</p>",
    });
    await expect(send).rejects.toThrow(/Email send failed: Sending paused for the account\./);
    await expect(send).rejects.not.toBeInstanceOf(AuthSesSuppressedError);
  });

  it("keeps the user-facing suppressed string free of AWS internals", () => {
    expect(AUTH_SES_SUPPRESSED_USER_MESSAGE).toBe("This address cannot receive sign-in mail.");
    expect(AUTH_SES_SUPPRESSED_USER_MESSAGE).not.toMatch(/SES|AWS|MessageRejected|suppression/i);
  });

  it("sends Simple content with house subject/text/html", async () => {
    mockSend.mockResolvedValueOnce({ MessageId: "ses-message-2" });
    const result = await sendAuthSesEmail({
      to: "holder@example.com",
      subject: "Your 24Frame access code",
      text: "Your verification code is 012345.",
      html: "<p>012345</p>",
    });
    expect(result).toEqual({ messageId: "ses-message-2" });
    expect(mockSend).toHaveBeenCalledTimes(1);
    const command = mockSend.mock.calls[0]?.[0];
    expect(command).toBeInstanceOf(SendEmailCommand);
    expect(command.input).toEqual({
      FromEmailAddress: AUTH_SES_DEFAULT_FROM,
      Destination: { ToAddresses: ["holder@example.com"] },
      ReplyToAddresses: [AUTH_SES_DEFAULT_REPLY_TO],
      ConfigurationSetName: AUTH_SES_CONFIGURATION_SET,
      EmailTags: [{ Name: "purpose", Value: "auth" }],
      Content: {
        Simple: {
          Subject: { Data: "Your 24Frame access code", Charset: "UTF-8" },
          Body: {
            Text: { Data: "Your verification code is 012345.", Charset: "UTF-8" },
            Html: { Data: "<p>012345</p>", Charset: "UTF-8" },
          },
        },
      },
    });
  });

  it("sends Reply-To from PORTAL_EMAIL_REPLY_TO when set", async () => {
    process.env.PORTAL_EMAIL_REPLY_TO = "ops@globalcontent.co";
    mockSend.mockResolvedValueOnce({ MessageId: "ses-message-3" });
    await sendAuthSesEmail({
      to: "holder@example.com",
      subject: "Your 24Frame access code",
      text: "Your verification code is 012345.",
      html: "<p>012345</p>",
    });
    const command = mockSend.mock.calls[0]?.[0];
    expect(command).toBeInstanceOf(SendEmailCommand);
    expect(command.input.ConfigurationSetName).toBe("24frame-auth");
    expect(command.input.ReplyToAddresses).toEqual(["ops@globalcontent.co"]);
    expect(command.input.EmailTags).toEqual([{ Name: "purpose", Value: "auth" }]);
  });

  it("never reads title, finance, media, or Resend secrets", () => {
    const src = readFileSync("src/lib/auth-ses.ts", "utf8");
    expect(src).not.toContain("process.env.AWS_ACCESS_KEY_ID");
    expect(src).not.toContain("process.env.AWS_SECRET_ACCESS_KEY");
    expect(src).not.toContain("process.env.FINANCE_AWS");
    expect(src).not.toContain("process.env.MEDIA_AWS");
    expect(src).not.toContain("RESEND");
    expect(src).not.toContain("from \"resend\"");
    expect(src).not.toContain("@aws-sdk/client-cognito");
    expect(src).not.toContain("noreply@");
    expect(src).not.toContain("GetSuppressedDestinationCommand");
    expect(src).toContain("AuthSesSuppressedError");
    expect(src).toContain("ConfigurationSetName: AUTH_SES_CONFIGURATION_SET");
    expect(src).toContain("ReplyToAddresses");
    expect(src).toContain('Value: "auth"');
  });

  it("smoke script prints env presence, not secret values", () => {
    const src = readFileSync("scripts/email/ses-auth-smoke.ts", "utf8");
    expect(src).toContain("envPresent");
    expect(src).not.toContain("console.log(process.env.SES_AWS_ACCESS_KEY_ID");
    expect(src).not.toContain("console.log(process.env.SES_AWS_SECRET_ACCESS_KEY");
    expect(src).toContain("buildMagicLinkEmail");
    expect(src).toContain("sendAuthSesEmail");
    expect(src).toContain("auth@24frame.co");
    expect(src).toContain("PORTAL_EMAIL_REPLY_TO");
    expect(src).not.toContain("noreply@");
  });
});
