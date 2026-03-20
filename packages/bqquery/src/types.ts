import type { BigQueryOptions, Query } from "@google-cloud/bigquery";

/**
 * Service-account credentials accepted by `@google-cloud/bigquery`.
 *
 * Only the fields required for explicit auth are mandatory here. Additional fields from the
 * service-account JSON are preserved for compatibility with the underlying SDK.
 */
export interface GoogleServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id: string;
  type?: string;
  client_id?: string;
  private_key_id?: string;
  token_uri?: string;
  auth_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  universe_domain?: string;
  [key: string]: unknown;
}

/** Generic row shape returned by BigQuery queries. */
export type BqRow = Record<string, unknown>;

/** Named or positional BigQuery query parameters. */
export type BqQueryParams = Exclude<Query["params"], undefined>;

/** Optional BigQuery parameter type hints for ambiguous values like `null`. */
export type BqQueryParamTypes = Exclude<Query["types"], undefined>;

/**
 * Client-level defaults applied to every query unless overridden.
 *
 * Authentication works in this order:
 * 1. `credentials`
 * 2. `credentialsJson`
 * 3. `credentialsBase64`
 * 4. Application Default Credentials (ADC)
 */
export interface BqClientOptions {
  /** Project id for the BigQuery client. Inferred from service-account credentials when possible. */
  projectId?: string;
  /** Default dataset id used to resolve unqualified table names in queries. */
  dataset?: string;
  /** Default job location applied to queries. */
  location?: string;
  /** Default `maximumBytesBilled` guardrail for queries. */
  maximumBytesBilled?: Query["maximumBytesBilled"];
  /** When `true`, validate the query without running it. */
  dryRun?: boolean;
  /** Defaults to `false` for modern Standard SQL. */
  useLegacySql?: boolean;
  /** Raw parsed service-account credentials. */
  credentials?: GoogleServiceAccountCredentials;
  /** Service-account JSON as a string. */
  credentialsJson?: string;
  /** Base64-encoded service-account JSON string. */
  credentialsBase64?: string;
  /** Optional SDK passthrough fields for advanced client configuration. */
  apiEndpoint?: BigQueryOptions["apiEndpoint"];
  autoRetry?: BigQueryOptions["autoRetry"];
  defaultJobCreationMode?: BigQueryOptions["defaultJobCreationMode"];
  maxRetries?: BigQueryOptions["maxRetries"];
  retryOptions?: BigQueryOptions["retryOptions"];
  universeDomain?: BigQueryOptions["universeDomain"];
  userAgent?: BigQueryOptions["userAgent"];
}

/**
 * Per-query options.
 *
 * Pass a plain object like `{ id: "123" }` for the common named-parameter case, or use this
 * object form when you need query options such as `location`, `types`, or `dryRun`.
 */
export interface BqQueryOptions extends Omit<
  Query,
  | "defaultDataset"
  | "dryRun"
  | "location"
  | "maximumBytesBilled"
  | "params"
  | "query"
  | "useLegacySql"
> {
  /** Named or positional SQL parameters. */
  params?: BqQueryParams;
  /** Optional type hints for parameterized queries. */
  types?: BqQueryParamTypes;
  /** Override the client's default dataset for this query. */
  dataset?: string;
  /** Override the client's default location for this query. */
  location?: string;
  /** Override the client's default `maximumBytesBilled` for this query. */
  maximumBytesBilled?: Query["maximumBytesBilled"];
  /** Override the client's default `dryRun` setting for this query. */
  dryRun?: boolean;
  /** Override the client's default SQL dialect. */
  useLegacySql?: boolean;
}

/** Convenience input for the second argument of `query`, `one`, and `value`. */
export type BqQueryInput = BqQueryOptions | BqQueryParams | undefined;

/** Internal resolved defaults stored on the client. */
export interface BqClientDefaults {
  dataset?: string;
  dryRun?: boolean;
  location?: string;
  maximumBytesBilled?: Query["maximumBytesBilled"];
  useLegacySql: boolean;
}
