import type { NanoErrorCode } from "./types";

export class NanoError extends Error {
  readonly cause?: unknown;
  readonly code: NanoErrorCode;

  constructor(code: NanoErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "NanoError";
    this.code = code;
    this.cause = options?.cause;
  }
}
