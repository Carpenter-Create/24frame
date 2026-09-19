// Founder/CoS one-shot. JoBlo apex media 404s; rewrite image_url to www.
// Does not change article canonical_url / Dynamo pk (identity stays apex).
// Dry-run default. Never run from CI. Never print NEWS_AWS_* values.
//
//   pnpm exec tsx scripts/news/backfill-joblo-image-urls.ts
//   pnpm exec tsx scripts/news/backfill-joblo-image-urls.ts --apply
//   pnpm exec tsx scripts/news/backfill-joblo-image-urls.ts --apply --fill-known
//
// Needs NEWS_AWS_REGION + NEWS_DDB_TABLE (+ static keys unless a role is attached).

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  type QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";

import {
  NEWS_FEED_PK,
  NEWS_TABLES,
  assertNewsTableName,
  isNewsIngestConfigured,
  newsAwsStaticCredentials,
  requireNewsEnv,
} from "../../src/lib/news-aws";
import { newsWindowStart } from "../../src/lib/news";
import { planJobloImageUrl } from "../../src/lib/news-rss";

type NewsItemRecord = {
  pk: string;
  sk: string;
  source?: string;
  url?: string;
  canonical_url?: string;
  image_url?: string | null;
};

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const fillKnown = process.argv.includes("--fill-known");
  if (!isNewsIngestConfigured()) {
    throw new Error("NEWS_AWS_REGION / NEWS_DDB_TABLE environment variables are not set");
  }
  const region = requireNewsEnv("NEWS_AWS_REGION");
  const table = assertNewsTableName(requireNewsEnv("NEWS_DDB_TABLE"));
  if (table !== NEWS_TABLES.prod && table !== NEWS_TABLES.dev) {
    throw new Error("NEWS_DDB_TABLE must be 24frame-news-prod or 24frame-news-dev");
  }

  const credentials = newsAwsStaticCredentials();
  const doc = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region,
      ...(credentials ? { credentials } : {}),
    }),
  );

  const now = new Date();
  const since = newsWindowStart(now).toISOString();
  const until = now.toISOString();
  const rows: NewsItemRecord[] = [];
  let startKey: QueryCommandOutput["LastEvaluatedKey"];
  do {
    const page = await doc.send(
      new QueryCommand({
        TableName: table,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :pk AND gsi1sk BETWEEN :since AND :until",
        ExpressionAttributeValues: {
          ":pk": NEWS_FEED_PK,
          ":since": `${since}#`,
          ":until": `${until}~\uFFFF`,
        },
        ExclusiveStartKey: startKey,
      }),
    );
    for (const item of page.Items ?? []) rows.push(item as NewsItemRecord);
    startKey = page.LastEvaluatedKey;
  } while (startKey);

  const joblo = rows.filter((row) => row.source === "joblo");
  let rewrite = 0;
  let filled = 0;
  let unchanged = 0;
  const stillNull: string[] = [];

  console.log("24Frame JoBlo image_url backfill");
  console.log(`table: ${table}`);
  console.log(`mode: ${apply ? "apply" : "dry-run"}`);
  console.log(`joblo rows: ${joblo.length}`);

  for (const row of joblo) {
    const url = row.url ?? row.canonical_url ?? "";
    const plan = planJobloImageUrl({
      url,
      image_url: row.image_url ?? null,
      fillKnown,
    });
    if (plan.action === "unchanged") {
      unchanged += 1;
      continue;
    }
    if (plan.action === "still-null") {
      stillNull.push(url);
      continue;
    }
    console.log(`${plan.action}: ${url}`);
    console.log(`  ${row.image_url ?? "(null)"} → ${plan.next}`);
    if (apply) {
      await doc.send(
        new PutCommand({
          TableName: table,
          Item: { ...row, image_url: plan.next },
        }),
      );
    }
    if (plan.action === "rewrite") rewrite += 1;
    if (plan.action === "fill-known") filled += 1;
  }

  console.log(`rewrite: ${rewrite}`);
  console.log(`fill-known: ${filled}`);
  console.log(`unchanged: ${unchanged}`);
  console.log(`still-null: ${stillNull.length}`);
  for (const url of stillNull) console.log(`  null: ${url}`);
  if (!apply && rewrite + filled > 0) {
    console.log("Re-run with --apply to PutItem. Then invoke 24frame-news-ingest once.");
  }
}

const isDirect = process.argv[1]?.includes("backfill-joblo-image-urls");
if (isDirect) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
