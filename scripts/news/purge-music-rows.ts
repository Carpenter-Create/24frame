// Founder/CoS one-shot. Delete already-stored music / other rows that
// entered Dynamo before the ingest topic gate landed. Dry-run default;
// never run from CI. Never print NEWS_AWS_* values.
//
//   pnpm exec tsx scripts/news/purge-music-rows.ts
//   pnpm exec tsx scripts/news/purge-music-rows.ts --apply
//
// Needs NEWS_AWS_REGION + NEWS_DDB_TABLE (+ static keys unless a role
// is attached). Reads the 90-day feed window and deletes rows whose
// current classifier verdict is not film / tv. Row identity stays
// `pk = ITEM#<canonical_url>` / `sk = ITEM`, so a re-ingest of the
// same live feed reintroduces only film / tv candidates. Existing
// TTL keeps the residual grey plates aging out on their own.

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
  type QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";

import { NEWS_HOME_CAP, isNewsSourceId, newsWindowStart } from "../../src/lib/news";
import {
  NEWS_FEED_PK,
  NEWS_ITEM_SK,
  NEWS_TABLES,
  assertNewsTableName,
  isNewsIngestConfigured,
  newsAwsStaticCredentials,
  newsItemPk,
  requireNewsEnv,
} from "../../src/lib/news-aws";
import { classifyNewsTopic, isFilmOrTvTopic, type NewsTopic } from "../../src/lib/news-topic";

type NewsItemRecord = {
  pk?: string;
  sk?: string;
  source?: string;
  title?: string;
  url?: string;
  canonical_url?: string;
  topic?: string;
};

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
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

  const drop: Array<{ row: NewsItemRecord; verdict: NewsTopic }> = [];
  const kept: Record<NewsTopic, number> = { film: 0, tv: 0, music: 0, other: 0 };
  const missingIdentity: string[] = [];

  for (const row of rows) {
    const url = row.url ?? row.canonical_url ?? "";
    if (!url) {
      missingIdentity.push(row.pk ?? "(no pk)");
      continue;
    }
    const source = row.source && isNewsSourceId(row.source) ? row.source : undefined;
    const verdict = classifyNewsTopic({
      title: row.title ?? "",
      url,
      source,
    });
    kept[verdict] += 1;
    if (!isFilmOrTvTopic(verdict)) {
      drop.push({ row, verdict });
    }
  }

  console.log("24Frame music/other row purge");
  console.log(`table: ${table}`);
  console.log(`mode: ${apply ? "apply" : "dry-run"}`);
  console.log(`scanned rows: ${rows.length}`);
  console.log(`film: ${kept.film}`);
  console.log(`tv: ${kept.tv}`);
  console.log(`music: ${kept.music}`);
  console.log(`other: ${kept.other}`);
  if (missingIdentity.length > 0) {
    console.log(`missing identity (skipped): ${missingIdentity.length}`);
  }

  const preview = drop.slice(0, NEWS_HOME_CAP);
  for (const { row, verdict } of preview) {
    const url = row.url ?? row.canonical_url ?? "";
    console.log(`drop (${verdict}): ${row.source ?? "?"} — ${row.title ?? "?"} — ${url}`);
  }
  if (drop.length > preview.length) {
    console.log(`… and ${drop.length - preview.length} more.`);
  }

  if (!apply) {
    if (drop.length > 0) {
      console.log("Re-run with --apply to DeleteItem. Then invoke 24frame-news-ingest once.");
    }
    return;
  }

  let deleted = 0;
  for (const { row } of drop) {
    const url = row.url ?? row.canonical_url;
    if (!url) continue;
    await doc.send(
      new DeleteCommand({
        TableName: table,
        Key: { pk: row.pk ?? newsItemPk(url), sk: row.sk ?? NEWS_ITEM_SK },
      }),
    );
    deleted += 1;
  }
  console.log(`deleted: ${deleted}`);
}

const isDirect = process.argv[1]?.includes("purge-music-rows");
if (isDirect) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
