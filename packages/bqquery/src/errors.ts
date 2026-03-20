/**
 * Stable machine-readable error codes thrown by `@eikonstudio/bqquery`.
 */
export type BqErrorCode =
  | "INVALID_CREDENTIALS"
  | "INVALID_CREDENTIALS_BASE64"
  | "INVALID_CREDENTIALS_JSON"
  | "INVALID_QUERY_VALUE";

/**
 * Typed package error for predictable handling of auth and query-helper failures.
 *
 * @example
 * ```ts
 * import { BqError, bq } from "@eikonstudio/bqquery";
 *
 * try {
 *   await bq({ credentialsBase64: "bad-value" }).query("select 1");
 * } catch (error) {
 *   if (error instanceof BqError && error.code === "INVALID_CREDENTIALS_BASE64") {
 *     // handle invalid base64
 *   }
 * }
 * ```
 */
export class BqError extends Error {
  /** Original error when the failure was caused by the runtime or underlying SDK. */
  readonly cause?: unknown;
  /** Stable error code for branching in app code. */
  readonly code: BqErrorCode;

  constructor(code: BqErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "BqError";
    this.code = code;
    this.cause = options?.cause;
  }
}
