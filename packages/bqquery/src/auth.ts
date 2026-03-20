import type { BigQueryOptions } from "@google-cloud/bigquery";

import { BqError } from "./errors";
import type {
  BqClientDefaults,
  BqClientOptions,
  GoogleServiceAccountCredentials,
} from "./types";

const REQUIRED_SERVICE_ACCOUNT_FIELDS = ["client_email", "private_key", "project_id"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parse service-account credentials from an object or JSON string.
 *
 * @param input - Parsed JSON object or raw JSON string
 * @returns Validated credentials object ready for `new BigQuery({ credentials })`
 * @throws {@linkcode BqError} when the value is not valid service-account JSON
 */
export function parseServiceAccountCredentials(input: unknown): GoogleServiceAccountCredentials {
  const value = parseCredentialsInput(input);

  for (const field of REQUIRED_SERVICE_ACCOUNT_FIELDS) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      throw new BqError(
        "INVALID_CREDENTIALS",
        `Invalid Google service-account credentials. Missing required field "${field}".`,
      );
    }
  }

  return value as GoogleServiceAccountCredentials;
}

/**
 * Decode and parse base64-encoded service-account JSON credentials.
 *
 * @param base64Credentials - Base64-encoded JSON string
 * @returns Validated service-account credentials
 * @throws {@linkcode BqError} when the value is not valid base64 or JSON
 */
export function decodeBase64Credentials(
  base64Credentials: string,
): GoogleServiceAccountCredentials {
  try {
    const decodedJson = Buffer.from(base64Credentials, "base64").toString("utf-8");

    if (!decodedJson.trim()) {
      throw new BqError(
        "INVALID_CREDENTIALS_BASE64",
        "Invalid base64 credentials. The decoded value was empty.",
      );
    }

    return parseServiceAccountCredentials(decodedJson);
  } catch (error) {
    throw new BqError(
      "INVALID_CREDENTIALS_BASE64",
      "Invalid base64 credentials. Pass a base64-encoded Google service-account JSON string.",
      { cause: error },
    );
  }
}

/**
 * Resolve explicit credentials from client options.
 *
 * Returns `undefined` when the client should fall back to Application Default Credentials.
 */
export function resolveCredentials(
  options: Pick<BqClientOptions, "credentials" | "credentialsBase64" | "credentialsJson">,
): GoogleServiceAccountCredentials | undefined {
  if (options.credentials) {
    return parseServiceAccountCredentials(options.credentials);
  }

  if (options.credentialsJson) {
    try {
      return parseServiceAccountCredentials(options.credentialsJson);
    } catch (error) {
      if (error instanceof BqError && error.code === "INVALID_CREDENTIALS") {
        throw new BqError(
          "INVALID_CREDENTIALS_JSON",
          "Invalid credentialsJson. Pass a valid Google service-account JSON string.",
          { cause: error },
        );
      }

      throw error;
    }
  }

  if (options.credentialsBase64) {
    return decodeBase64Credentials(options.credentialsBase64);
  }

  return undefined;
}

/**
 * Normalize user-friendly client options into BigQuery constructor options and query defaults.
 */
export function resolveClientSetup(options: BqClientOptions = {}): {
  bigQueryOptions: BigQueryOptions;
  defaults: BqClientDefaults;
} {
  const credentials = resolveCredentials(options);
  const projectId = options.projectId ?? credentials?.project_id;

  const bigQueryOptions: BigQueryOptions = {
    apiEndpoint: options.apiEndpoint,
    autoRetry: options.autoRetry,
    credentials,
    defaultJobCreationMode: options.defaultJobCreationMode,
    location: options.location,
    maxRetries: options.maxRetries,
    projectId,
    retryOptions: options.retryOptions,
    universeDomain: options.universeDomain,
    userAgent: options.userAgent,
  };

  return {
    bigQueryOptions,
    defaults: {
      dataset: options.dataset,
      dryRun: options.dryRun,
      location: options.location,
      maximumBytesBilled: options.maximumBytesBilled,
      useLegacySql: options.useLegacySql ?? false,
    },
  };
}

function parseCredentialsInput(input: unknown): Record<string, unknown> {
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input) as unknown;

      if (!isRecord(parsed)) {
        throw new BqError(
          "INVALID_CREDENTIALS_JSON",
          "Invalid credentials JSON. Expected a JSON object.",
        );
      }

      return parsed;
    } catch (error) {
      if (error instanceof BqError) {
        throw error;
      }

      throw new BqError(
        "INVALID_CREDENTIALS_JSON",
        "Invalid credentials JSON. Pass a valid Google service-account JSON string.",
        { cause: error },
      );
    }
  }

  if (!isRecord(input)) {
    throw new BqError(
      "INVALID_CREDENTIALS",
      "Invalid Google service-account credentials. Expected an object or JSON string.",
    );
  }

  return input;
}
