import { BigQuery } from "@google-cloud/bigquery";
import type { Query } from "@google-cloud/bigquery";

import { resolveClientSetup } from "./auth";
import { BqError } from "./errors";
import type {
  BqClientDefaults,
  BqClientOptions,
  BqQueryInput,
  BqQueryOptions,
  BqQueryParams,
  BqRow,
} from "./types";

const QUERY_OPTION_KEYS = new Set<string>([
  "connectionProperties",
  "createDisposition",
  "dataset",
  "destination",
  "destinationEncryptionConfiguration",
  "destinationTableProperties",
  "dryRun",
  "jobCreationMode",
  "jobId",
  "jobPrefix",
  "jobTimeoutMs",
  "labels",
  "location",
  "maxResults",
  "maximumBillingTier",
  "maximumBytesBilled",
  "parameterMode",
  "params",
  "parseJSON",
  "priority",
  "reservation",
  "schemaUpdateOptions",
  "tableDefinitions",
  "timePartitioning",
  "types",
  "useLegacySql",
  "useQueryCache",
  "userDefinedFunctionResources",
  "writeDisposition",
  "writeIncrementalResults",
  "wrapIntegers",
]);

/**
 * Tiny query-first wrapper around `@google-cloud/bigquery`.
 *
 * `BqClient` stores auth and query defaults once, then keeps the public API focused on the three
 * most common read flows: `query`, `one`, and `value`.
 */
export class BqClient {
  /** Escape hatch to the raw SDK client for advanced BigQuery operations. */
  readonly bigquery: BigQuery;

  private readonly defaults: BqClientDefaults;

  /**
   * @param options - Optional auth and query defaults
   */
  constructor(options: BqClientOptions = {}) {
    const setup = resolveClientSetup(options);
    this.bigquery = new BigQuery(setup.bigQueryOptions);
    this.defaults = setup.defaults;
  }

  /**
   * Run a SQL query and return all rows typed as `T`.
   *
   * Pass a plain object or array as the second argument for the common parameterized-query case:
   *
   * ```ts
   * const rows = await db.query<{ id: string }>(
   *   "select id from users where id = @id",
   *   { id: "u_123" }
   * );
   * ```
   *
   * When you need per-query options like `location`, `types`, or `dryRun`, pass an options object:
   *
   * ```ts
   * const rows = await db.query<{ count: number }>(
   *   "select count(*) as count from users where created_at >= @since",
   *   {
   *     params: { since: "2026-01-01" },
   *     location: "US",
   *   }
   * );
   * ```
   *
   * @param sql - Standard SQL query text
   * @param paramsOrOptions - Query params directly, or an options object for advanced control
   * @returns Query result rows typed as `T[]`
   */
  async query<T extends BqRow = BqRow>(sql: string, paramsOrOptions?: BqQueryInput): Promise<T[]> {
    const request = this.toQueryRequest(sql, paramsOrOptions);
    const [rows] = await this.bigquery.query(request);
    return rows as T[];
  }

  /**
   * Run a SQL query and return the first row, or `null` when no rows match.
   *
   * This is ideal for `limit 1` lookups and existence checks.
   *
   * @param sql - Standard SQL query text
   * @param paramsOrOptions - Query params directly, or an options object for advanced control
   * @returns The first row typed as `T`, or `null`
   */
  async one<T extends BqRow = BqRow>(
    sql: string,
    paramsOrOptions?: BqQueryInput,
  ): Promise<T | null> {
    const rows = await this.query<T>(sql, paramsOrOptions);
    return rows[0] ?? null;
  }

  /**
   * Run a SQL query and return the first column from the first row.
   *
   * This is perfect for scalar results like `count(*)`, `sum(...)`, or a single selected field.
   *
   * @param sql - Standard SQL query text
   * @param paramsOrOptions - Query params directly, or an options object for advanced control
   * @returns The first column typed as `T`, or `null` when no rows match
   * @throws {@linkcode BqError} with code `INVALID_QUERY_VALUE` when the row has no columns
   */
  async value<T = unknown>(sql: string, paramsOrOptions?: BqQueryInput): Promise<T | null> {
    const row = await this.one(sql, paramsOrOptions);

    if (!row) {
      return null;
    }

    const firstKey = Object.keys(row)[0];
    if (!firstKey) {
      throw new BqError(
        "INVALID_QUERY_VALUE",
        "value() expected the first row to contain at least one column.",
      );
    }

    return row[firstKey] as T;
  }

  private toQueryRequest(sql: string, paramsOrOptions?: BqQueryInput): Query {
    const options = normalizeQueryInput(paramsOrOptions);
    const { dataset: datasetOverride, ...queryOptions } = options;
    const dataset = datasetOverride ?? this.defaults.dataset;

    return {
      ...queryOptions,
      defaultDataset: dataset ? toDatasetReference(dataset, this.bigquery.projectId) : undefined,
      dryRun: queryOptions.dryRun ?? this.defaults.dryRun,
      location: queryOptions.location ?? this.defaults.location,
      maximumBytesBilled: queryOptions.maximumBytesBilled ?? this.defaults.maximumBytesBilled,
      params: queryOptions.params,
      query: sql,
      useLegacySql: queryOptions.useLegacySql ?? this.defaults.useLegacySql,
    };
  }
}

/**
 * Create a `BqClient` with optional auth and query defaults.
 *
 * @example
 * ```ts
 * import { bq } from "@eikonstudio/bqquery";
 *
 * const db = bq({
 *   projectId: "my-project",
 *   dataset: "analytics",
 *   location: "US",
 * });
 * ```
 */
export function bq(options?: BqClientOptions): BqClient {
  return new BqClient(options);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQueryOptions(value: BqQueryInput): value is BqQueryOptions {
  if (!isPlainObject(value)) {
    return false;
  }

  return [...QUERY_OPTION_KEYS].some((key) => key in value);
}

function normalizeQueryInput(input: BqQueryInput): BqQueryOptions {
  if (typeof input === "undefined") {
    return {};
  }

  if (Array.isArray(input)) {
    return { params: input };
  }

  if (isQueryOptions(input)) {
    return input;
  }

  if (isPlainObject(input)) {
    return { params: input as BqQueryParams };
  }

  return { params: input };
}

function toDatasetReference(datasetId: string, projectId?: string) {
  return projectId ? { datasetId, projectId } : { datasetId };
}
