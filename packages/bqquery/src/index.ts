/**
 * @packageDocumentation
 * Tiny, type-safe BigQuery helpers built on top of `@google-cloud/bigquery`.
 *
 * The package is intentionally small:
 * - {@linkcode bq} creates a client
 * - {@linkcode BqClient.query} returns typed rows
 * - {@linkcode BqClient.one} returns the first row or `null`
 * - {@linkcode BqClient.value} returns the first column from the first row
 *
 * Authentication is simple:
 * - pass nothing to use Application Default Credentials (ADC)
 * - pass `credentials`, `credentialsJson`, or `credentialsBase64` for explicit service-account auth
 *
 * @example ADC
 * ```ts
 * import { bq } from "@eikonstudio/bqquery";
 *
 * const db = bq({ dataset: "analytics" });
 * const rows = await db.query<{ id: string }>("select id from users limit 10");
 * ```
 *
 * @example Explicit service-account credentials
 * ```ts
 * import { bq } from "@eikonstudio/bqquery";
 *
 * const db = bq({
 *   credentialsBase64: process.env.GCP_CREDENTIALS_BASE64,
 *   dataset: "analytics",
 * });
 * ```
 */
export { decodeBase64Credentials, parseServiceAccountCredentials } from "./auth";
export { bq, BqClient } from "./client";
export { BqError } from "./errors";
export type { BqErrorCode } from "./errors";
export type {
  BqClientDefaults,
  BqClientOptions,
  BqQueryInput,
  BqQueryOptions,
  BqQueryParams,
  BqQueryParamTypes,
  BqRow,
  GoogleServiceAccountCredentials,
} from "./types";
