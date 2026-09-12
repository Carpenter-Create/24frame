const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const { resolveSurvivorPublicEnv } = require("./src/lib/survivor-env.cjs");

function readRepoPublicEnvFile() {
  const candidates = [
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env.local"),
    resolve(process.cwd(), "../../.env"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return readFileSync(path, "utf8");
  }
  return "";
}

const survivor = resolveSurvivorPublicEnv({
  processUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  processAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  fileText: readRepoPublicEnvFile(),
});

module.exports = {
  name: "24Frame",
  slug: "24Frame",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  platforms: ["ios"],
  ios: {
    supportsTablet: true,
  },
  extra: {
    productName: "24Frame",
    supabaseUrl: survivor.url,
    supabaseAnonKey: survivor.anonKey,
  },
};
