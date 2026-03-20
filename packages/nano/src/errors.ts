import type { NanoErrorCode } from "./types";

/**
 * Typed error for predictable handling of API key, model, and response failures.
 *
 * @example
 * ```ts
 * import { NanoError } from "@eikonstudio/nano";
 *
 * try {
 *   await generateImage("gemini-2.5-flash-image", "A banana");
 * } catch (e) {
 *   if (e instanceof NanoError && e.code === "MISSING_API_KEY") {
 *     // handle missing key
 *   }
 * }
 * ```
 */
export class NanoError extends Error {
  /** Original error from the SDK or runtime, when available. */
  readonly cause?: unknown;
  /** Machine-readable code; see {@linkcode NanoErrorCode}. */
  readonly code: NanoErrorCode;

  /**
   * @param code - Stable error category
   * @param message - Human-readable explanation
   * @param options.cause - Optional underlying error for logging or rethrow patterns
   */
  constructor(code: NanoErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "NanoError";
    this.code = code;
    this.cause = options?.cause;
  }
}
