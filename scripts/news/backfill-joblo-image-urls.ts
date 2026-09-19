// Founder/CoS one-shot. Rewrite JoBlo apex → www, then mirror remote
// thumbs to S3_BUCKET/news-thumbs/ and persist the CloudFront URL.
// Dry-run default. Never run from CI. Never print NEWS_AWS_* / AWS_* values.
//
//   pnpm exec tsx scripts/news/backfill-joblo-image-urls.ts
//   pnpm exec tsx scripts/news/backfill-joblo-image-urls.ts --apply
//   pnpm exec tsx scripts/news/backfill-joblo-image-urls.ts --apply --fill-known
//   pnpm exec tsx scripts/news/backfill-joblo-image-urls.ts --all-sources
//
// Dynamo: NEWS_AWS_REGION + NEWS_DDB_TABLE (+ static keys unless a role).
// Mirror: title S3_BUCKET + AWS_REGION + CLOUDFRONT_DOMAIN (house putObjectBytes).

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
import { backfillNewsThumbUrls } from "../../src/lib/news-thumbs";

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
  const allSources = process.argv.includes("--all-sources");
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

  const selected = allSources ? rows : rows.filter((row) => row.source === "joblo");

  console.log("24Frame news thumb backfill");
  console.log(`table: ${table}`);
  console.log(`mode: ${apply ? "apply" : "dry-run"}`);
  console.log(`scope: ${allSources ? "all sources with remote thumbs" : "joblo"}`);
  console.log(`rows: ${selected.length}`);

  const summary = await backfillNewsThumbUrls({
    apply,
    fillKnown,
    allSources,
    rows: selected,
    writeItem: async (row) => {
      const prior = selected.find((item) => item.pk && item.canonical_url === row.canonical_url) ?? row;
      await doc.send(
        new PutCommand({
          TableName: table,
          Item: { ...prior, ...row },
        }),
      );
    },
  });

  console.log(`rewrite: ${summary.rewrite}`);
  console.log(`fill-known: ${summary.filled}`);
  console.log(`mirror: ${summary.mirrored}`);
  console.log(`unchanged: ${summary.unchanged}`);
  console.log(`still-null: ${summary.stillNull}`);
  console.log(`wrote: ${summary.wrote}`);
  if (!apply && summary.rewrite + summary.filled + summary.mirrored > 0) {
    console.log("Re-run with --apply to PutObject + PutItem. Then invoke 24frame-news-ingest once.");
  }
}

const isDirect = process.argv[1]?.includes("backfill-joblo-image-urls");
if (isDirect) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
