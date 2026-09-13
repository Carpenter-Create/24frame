// Proposed 24Frame Aurora PostgreSQL SoT. Auth stays Supabase Auth.
// Do not fall back to survivor pooler URLs, title AWS_*, or any Royalogic host.
// Cluster is not created in this slice — CoS/Adam apply.

export const AURORA_ENV = ["AURORA_DATABASE_URL"] as const;

export const AURORA_CLUSTER_PROPOSAL = {
  account: "405912452061",
  region: "us-west-2",
  engine: "aurora-postgresql",
  engineVersion: "15",
  preferAuroraOverRds:
    "Aurora PostgreSQL keeps existing RLS/SQL portable, adds a reader endpoint, and autoscales storage. No RDS-only reason.",
  regionReason:
    "Survivor Postgres already lives in us-west-2. Title-asset S3/MediaConvert stay us-east-1 — that split already exists.",
  dev: "24frame-aurora-dev",
  prod: "24frame-aurora-prod",
} as const;

const FORBIDDEN_AURORA_HOST_MARKERS = [
  "supabase.co",
  "pooler.supabase",
  "royalogic",
  "watershed",
] as const;

export function isForbiddenAuroraDatabaseUrl(url: string): boolean {
  const value = url.trim().toLowerCase();
  if (!value) return true;
  if (!value.startsWith("postgres://") && !value.startsWith("postgresql://")) return true;
  return FORBIDDEN_AURORA_HOST_MARKERS.some((marker) => value.includes(marker));
}

export function assertAuroraDatabaseUrl(url: string): string {
  if (!url) throw new Error("AURORA_DATABASE_URL environment variable is not set");
  if (isForbiddenAuroraDatabaseUrl(url)) {
    throw new Error("AURORA_DATABASE_URL must be the dedicated 24Frame Aurora cluster");
  }
  return url;
}

export function isAuroraConfigured(): boolean {
  return !!process.env.AURORA_DATABASE_URL;
}

export function auroraDatabaseUrl(): string {
  return assertAuroraDatabaseUrl(process.env.AURORA_DATABASE_URL ?? "");
}
