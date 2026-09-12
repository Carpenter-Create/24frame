// Same 24Frame product as the dashboard — Aggregation + Social+Education,
// one account. This package is the native foothold, not a second brand
// and not a Social-only app. First ship is Auth + Social home only.

export const PRODUCT_NAME = "24Frame";
export const AGGREGATION_WORKSPACE = "Aggregation";
export const SOCIAL_EDUCATION_WORKSPACE = "Social+Education";
export const PRODUCT_WORKSPACES = "Aggregation / Social+Education";

export const MOBILE_COPY = {
  signInTitle: "Sign in",
  signInBody: "We'll email you a one-time code. No password. One 24Frame account — Aggregation / Social+Education.",
  emailLabel: "Email",
  emailPlaceholder: "you@studio.com",
  sendCode: "Send code",
  sendingCode: "Sending…",
  codeLabel: "One-time code",
  codePlaceholder: "123456",
  verifyCode: "Verify code",
  verifyingCode: "Verifying…",
  useDifferentEmail: "Use a different email",
  enterEmail: "Enter your email address.",
  enterCode: "Enter the code from your email.",
  signedInHome: "Home",
  emptyFeed: "No posts yet.",
  signOut: "Sign out",
  missingEnv: "Survivor Supabase public env is not set.",
} as const;

export const BANNED_MOBILE_PRODUCT_NAMES = [
  "Globee",
  "24frame",
  "24-Frame",
  "24FRAME",
  "Global Content Dashboard",
] as const;
