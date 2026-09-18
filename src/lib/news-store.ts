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
  newsFeedSk,
  newsItemPk,
  newsSourcePk,
  requireNewsEnv,
  type NewsEnv,
} from "@/lib/news-aws";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";
import {
  NEWS_HOME_CAP,
  NEWS_SOURCES,
  NEWS_WINDOW_MS,
  isNewsSourceId,
  newsInWindow,
  newsWindowStart,
  overviewNewsHeadlines,
  type NewsItem,
  type NewsListResult,
  type NewsSourceId,
} from "@/lib/news";
import type { NormalizedNewsItem } from "@/lib/news-rss";

export type NewsSourceHealth = {
  source: NewsSourceId;
  enabled: boolean;
  last_success_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
};

export type NewsStore = {
  putItems: (items: readonly NormalizedNewsItem[], now?: Date) => Promise<number>;
  queryFeed: (input: { limit: number; now: Date }) => Promise<NewsItem[]>;
  getHealth: (source: NewsSourceId) => Promise<NewsSourceHealth | null>;
  putHealth: (health: NewsSourceHealth) => Promise<void>;
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

function ttlEpoch(publishedAt: string): number {
  return Math.floor((Date.parse(publishedAt) + NEWS_WINDOW_MS) / 1000);
}

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

export function newsSourceConstEnabled(source: NewsSourceId): boolean {
  return NEWS_SOURCES.find((row) => row.id === source)?.enabled === true;
}

export async function newsSourceIsLive(
  store: NewsStore,
  source: NewsSourceId,
): Promise<boolean> {
  if (!newsSourceConstEnabled(source)) return false;
  const health = await store.getHealth(source);
  return health?.enabled !== false;
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
      published_at: item.published_at,
      image_url: item.image_url,
      fetched_at: item.published_at,
      ttl: ttlEpoch(item.published_at),
    });
  }

  return {
    async putItems(rows, now = new Date()) {
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
          published_at: row.published_at,
          image_url: row.image_url,
          fetched_at: fetchedAt,
          ttl: ttlEpoch(row.published_at),
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
  };
}

function newsClient(env: NewsEnv = process.env): {
  table: string;
  doc: DynamoDBDocumentClient;
} {
  const table = assertNewsTableName(requireNewsEnv("NEWS_DDB_TABLE", env));
  const client = new DynamoDBClient({
    region: requireNewsEnv("NEWS_AWS_REGION", env),
    credentials: {
      accessKeyId: requireNewsEnv("NEWS_AWS_ACCESS_KEY_ID", env),
      secretAccessKey: requireNewsEnv("NEWS_AWS_SECRET_ACCESS_KEY", env),
    },
  });
  return { table, doc: DynamoDBDocumentClient.from(client) };
}

export function dynamoNewsStore(env: NewsEnv = process.env): NewsStore {
  if (!isNewsAwsConfigured(env)) {
    throw new Error("NEWS_AWS_* / NEWS_DDB_TABLE environment variables are not set");
  }

  return {
    async putItems(rows, now = new Date()) {
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
                published_at: row.published_at,
                image_url: row.image_url,
                fetched_at: fetchedAt,
                ttl: ttlEpoch(row.published_at),
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
  };
}

export function createNewsStore(env: NewsEnv = process.env): NewsStore {
  return dynamoNewsStore(env);
}

export async function loadNewsItems(
  input: { limit: number; now: Date; store?: NewsStore },
): Promise<NewsListResult> {
  try {
    const store = input.store ?? createNewsStore();
    const rows = await store.queryFeed({ limit: input.limit + 1, now: input.now });
    return {
      rows: rows.slice(0, input.limit),
      truncated: rows.length > input.limit,
      failed: false,
    };
  } catch (err) {
    console.error(`[news:read] ${err instanceof Error ? err.message : err}`);
    return { rows: [], truncated: false, failed: true };
  }
}

export async function loadHomeNews(
  now: Date,
  store?: NewsStore,
): Promise<NewsItem[]> {
  const loaded = await loadNewsItems({ limit: NEWS_HOME_CAP, now, store });
  return overviewNewsHeadlines(loaded.failed ? [] : loaded.rows);
}

export async function loadNewsHistory(
  now: Date,
  store?: NewsStore,
): Promise<NewsListResult> {
  return loadNewsItems({ limit: UNPAGINATED_MAX, now, store });
}
