export type EmailAuthClient = {
  auth: {
    signInWithOtp: (args: {
      email: string;
      options: { shouldCreateUser: boolean };
    }) => Promise<{ error: { message: string } | null }>;
    verifyOtp: (args: {
      email: string;
      token: string;
      type: "email";
    }) => Promise<{ error: { message: string } | null }>;
    signOut: () => Promise<{ error: { message: string } | null }>;
  };
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

export async function requestEmailCode(
  client: EmailAuthClient,
  rawEmail: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { ok: false, message: "Enter your email address." };
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
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
