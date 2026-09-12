const NEXT_PUBLIC_SUPABASE_URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
const REJECTED_DONOR_PROJECT_REF = "qxribdfzkvffambaartp";

function parseDotEnvPublicSupabase(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== NEXT_PUBLIC_SUPABASE_URL_KEY && key !== NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY) {
      continue;
    }
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return {
    url: values[NEXT_PUBLIC_SUPABASE_URL_KEY] ?? "",
    anonKey: values[NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY] ?? "",
  };
}

function assertSurvivorSupabaseUrl(url) {
  if (url.includes(REJECTED_DONOR_PROJECT_REF)) {
    throw new Error("Mobile Auth uses the survivor project only. Donor project refs are rejected.");
  }
  return url;
}

function resolveSurvivorPublicEnv(input) {
  const fromFile = input.fileText
    ? parseDotEnvPublicSupabase(input.fileText)
    : { url: "", anonKey: "" };
  const url = (input.processUrl ?? "").trim() || fromFile.url;
  const anonKey = (input.processAnonKey ?? "").trim() || fromFile.anonKey;
  return {
    url: url ? assertSurvivorSupabaseUrl(url) : "",
    anonKey,
  };
}

function survivorEnvReady(env) {
  return env.url.length > 0 && env.anonKey.length > 0;
}

module.exports = {
  NEXT_PUBLIC_SUPABASE_URL_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY,
  REJECTED_DONOR_PROJECT_REF,
  parseDotEnvPublicSupabase,
  assertSurvivorSupabaseUrl,
  resolveSurvivorPublicEnv,
  survivorEnvReady,
};
