export type EmailAuthClient = {
  auth: {
    verifyOtp: (args: {
      email: string;
      token: string;
      type: "email";
    }) => Promise<{ error: { message: string } | null }>;
    signOut: () => Promise<{ error: { message: string } | null }>;
  };
};

export type SignInRequestTransport = {
  requestSignInCode: (email: string) => Promise<{ ok: true } | { ok: false; message: string }>;
};

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) return null;
  return email;
}

export function normalizeEmailCode(raw: string): string | null {
  const token = raw.trim().replace(/\s+/g, "");
  if (token.length < 6) return null;
  return token;
}

function stripSlash(raw: string): string {
  return raw.replace(/\/+$/, "");
}

// House pipe: POST the dashboard mint/send route. Never call the client OTP
// send that fires GoTrue/hosted Auth magic_link mail.
export async function requestEmailCodeViaHousePipe(
  appOrigin: string,
  rawEmail: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { ok: false, message: "Enter your email address." };
  const origin = stripSlash(appOrigin);
  if (!origin) return { ok: false, message: "Could not send the sign-in code. Please try again." };

  let response: Response;
  try {
    response = await fetchImpl(`${origin}/api/mobile/request-sign-in`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
  } catch {
    return { ok: false, message: "Could not send the sign-in code. Please try again." };
  }

  if (response.ok) return { ok: true };

  let message = "Could not send the sign-in code. Please try again.";
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) message = body.error;
  } catch {
    // keep default
  }
  return { ok: false, message };
}

export async function requestEmailCode(
  transport: SignInRequestTransport,
  rawEmail: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { ok: false, message: "Enter your email address." };
  return transport.requestSignInCode(email);
}

export async function verifyEmailCode(
  client: EmailAuthClient,
  rawEmail: string,
  rawToken: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const email = normalizeEmail(rawEmail);
  const token = normalizeEmailCode(rawToken);
  if (!email) return { ok: false, message: "Enter your email address." };
  if (!token) return { ok: false, message: "Enter the code from your email." };
  const { error } = await client.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function signOutSession(
  client: EmailAuthClient,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await client.auth.signOut();
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
