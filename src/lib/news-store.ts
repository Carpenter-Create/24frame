import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  NEWS_FEED_PK,
  NEWS_HEALTH_SK,
  NEWS_ITEM_SK,
  assertNewsTableName,
  isNewsAwsConfigured,
  isNewsIngestConfigured,
  newsAwsStaticCredentials,
  newsFeedSk,
  newsItemPk,
  newsSourcePk,
  requireNewsEnv,
  type NewsEnv,
} from "@/lib/news-aws";
import {
  isNewsSourceId,
  newsInWindow,
  newsItemTtlEpoch,
  newsSourceLabel,
  newsWindowStart,
  type NewsItem,
  type NewsSourceHealth,
  type NewsSourceId,
} from "@/lib/news";
import type { NormalizedNewsItem } from "@/lib/news-rss";

export type NewsPersist = {
  upsertItems: (items: readonly NormalizedNewsItem[], now: Date) => Promise<number>;
  getHealth: (source: NewsSourceId) => Promise<NewsSourceHealth | null>;
  putHealth: (row: NewsSourceHealth) => Promise<void>;
  purgeBefore: (cutoffIso: string) => Promise<number>;
};

type NewsItemRecord = {
  pk: string;
  sk: string;
  gsi1pk: string;
  gsi1sk: string;
  id: string;
  title: string;
  url: string;
  canonical_url: string;
  source: string;
  source_name: string;
  published_at: string;
  image_url: string | null;
  fetched_at: string;
  ttl: number;
};

type NewsHealthRecord = {
  pk: string;
  sk: string;
  source: string;
  enabled: boolean;
  last_success_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
};

export type NewsStore = NewsPersist & {
  queryFeed: (input: { limit: number; now: Date }) => Promise<NewsItem[]>;
};

function recordToItem(row: NewsItemRecord): NewsItem | null {
  if (!isNewsSourceId(row.source)) return null;
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    source: row.source,
    published_at: row.published_at,
    image_url: row.image_url,
  };
}

export function memoryNewsStore(seed: readonly NewsItem[] = []): NewsStore {
  const items = new Map<string, NewsItemRecord>();
  const health = new Map<NewsSourceId, NewsSourceHealth>();
  for (const item of seed) {
    items.set(item.url, {
      pk: newsItemPk(item.url),
      sk: NEWS_ITEM_SK,
      gsi1pk: NEWS_FEED_PK,
      gsi1sk: newsFeedSk(item.published_at, item.url),
      id: item.id,
      title: item.title,
      url: item.url,
      canonical_url: item.url,
      source: item.source,
      source_name: newsSourceLabel(item.source),
      published_at: item.published_at,
      image_url: item.image_url,
      fetched_at: item.published_at,
      ttl: newsItemTtlEpoch(item.published_at),
    });
  }

  return {
    async upsertItems(rows, now = new Date()) {
      const fetchedAt = now.toISOString();
      for (const row of rows) {
        items.set(row.canonical_url, {
          pk: newsItemPk(row.canonical_url),
          sk: NEWS_ITEM_SK,
          gsi1pk: NEWS_FEED_PK,
          gsi1sk: newsFeedSk(row.published_at, row.canonical_url),
          id: row.canonical_url,
          title: row.title,
          url: row.url,
          canonical_url: row.canonical_url,
          source: row.source,
          source_name: newsSourceLabel(row.source),
          published_at: row.published_at,
          image_url: row.image_url,
          fetched_at: fetchedAt,
          ttl: newsItemTtlEpoch(row.published_at),
        });
      }
      return rows.length;
    },
    async queryFeed({ limit, now }) {
      return [...items.values()]
        .filter((row) => newsInWindow(row.published_at, now))
        .sort((a, b) => b.published_at.localeCompare(a.published_at))
        .slice(0, limit)
        .map((row) => recordToItem(row))
        .filter((row): row is NewsItem => row !== null);
    },
    async getHealth(source) {
      return health.get(source) ?? null;
    },
    async putHealth(row) {
      health.set(row.source, row);
    },
    async purgeBefore(cutoffIso) {
      let removed = 0;
      for (const [key, row] of items) {
        if (row.published_at < cutoffIso) {
          items.delete(key);
          removed += 1;
        }
      }
      return removed;
    },
  };
}

function newsClient(env: NewsEnv): { table: string; doc: DynamoDBDocumentClient } {
  const table = assertNewsTableName(requireNewsEnv("NEWS_DDB_TABLE", env));
  const credentials = newsAwsStaticCredentials(env);
  const client = new DynamoDBClient({
    region: requireNewsEnv("NEWS_AWS_REGION", env),
    ...(credentials ? { credentials } : {}),
  });
  return { table, doc: DynamoDBDocumentClient.from(client) };
}

export function dynamoNewsStore(env: NewsEnv = process.env): NewsStore {
  if (!isNewsIngestConfigured(env) && !isNewsAwsConfigured(env)) {
    throw new Error("NEWS_AWS_REGION / NEWS_DDB_TABLE environment variables are not set");
  }

  return {
    async upsertItems(rows, now = new Date()) {
      if (rows.length === 0) return 0;
      const { table, doc } = newsClient(env);
      const fetchedAt = now.toISOString();
      await Promise.all(
        rows.map((row) =>
          doc.send(
            new PutCommand({
              TableName: table,
              Item: {
                pk: newsItemPk(row.canonical_url),
                sk: NEWS_ITEM_SK,
                gsi1pk: NEWS_FEED_PK,
                gsi1sk: newsFeedSk(row.published_at, row.canonical_url),
                id: row.canonical_url,
                title: row.title,
                url: row.url,
                canonical_url: row.canonical_url,
                source: row.source,
                source_name: newsSourceLabel(row.source),
                published_at: row.published_at,
                image_url: row.image_url,
                fetched_at: fetchedAt,
                ttl: newsItemTtlEpoch(row.published_at),
              } satisfies NewsItemRecord,
            }),
          ),
        ),
      );
      return rows.length;
    },
    async queryFeed({ limit, now }) {
      const { table, doc } = newsClient(env);
      const since = newsWindowStart(now).toISOString();
      const until = now.toISOString();
      const { Items } = await doc.send(
        new QueryCommand({
          TableName: table,
          IndexName: "gsi1",
          KeyConditionExpression: "gsi1pk = :pk AND gsi1sk BETWEEN :since AND :until",
          ExpressionAttributeValues: {
            ":pk": NEWS_FEED_PK,
            ":since": `${since}#`,
            ":until": `${until}~\uFFFF`,
          },
          ScanIndexForward: false,
          Limit: limit,
        }),
      );
      return (Items ?? [])
        .map((row) => recordToItem(row as NewsItemRecord))
        .filter((row): row is NewsItem => row !== null);
    },
    async getHealth(source) {
      const { table, doc } = newsClient(env);
      const { Item } = await doc.send(
        new GetCommand({
          TableName: table,
          Key: { pk: newsSourcePk(source), sk: NEWS_HEALTH_SK },
        }),
      );
      if (!Item) return null;
      const row = Item as NewsHealthRecord;
      if (!isNewsSourceId(row.source)) return null;
      return {
        source: row.source,
        enabled: row.enabled !== false,
        last_success_at: row.last_success_at ?? null,
        last_error: row.last_error ?? null,
        last_error_at: row.last_error_at ?? null,
      };
    },
    async putHealth(row) {
      const { table, doc } = newsClient(env);
      await doc.send(
        new PutCommand({
          TableName: table,
          Item: {
            pk: newsSourcePk(row.source),
            sk: NEWS_HEALTH_SK,
            source: row.source,
            enabled: row.enabled,
            last_success_at: row.last_success_at,
            last_error: row.last_error,
            last_error_at: row.last_error_at,
          } satisfies NewsHealthRecord,
        }),
      );
    },
    async purgeBefore() {
      // Retention is Dynamo TTL (published_at + 30d). Query window also hides older rows.
      return 0;
    },
  };
}

export function createNewsAppStore(env: NewsEnv = process.env): NewsStore {
  if (!isNewsAwsConfigured(env)) {
    throw new Error("NEWS_AWS_* / NEWS_DDB_TABLE environment variables are not set");
  }
  return dynamoNewsStore(env);
}

export function createNewsIngestStore(env: NewsEnv = process.env): NewsStore {
  if (!isNewsIngestConfigured(env)) {
    throw new Error("NEWS_AWS_REGION / NEWS_DDB_TABLE environment variables are not set");
  }
  return dynamoNewsStore(env);
}
