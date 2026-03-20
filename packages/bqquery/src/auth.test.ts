import { describe, expect, test } from "bun:test";

import {
  decodeBase64Credentials,
  parseServiceAccountCredentials,
  resolveClientSetup,
  resolveCredentials,
} from "./auth";
import { BqError } from "./errors";

const credentials = {
  client_email: "bq@example.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
  project_id: "demo-project",
  type: "service_account",
} as const;

describe("parseServiceAccountCredentials", () => {
  test("accepts a parsed credentials object", () => {
    expect(parseServiceAccountCredentials(credentials)).toEqual(credentials);
  });

  test("accepts a JSON string", () => {
    expect(parseServiceAccountCredentials(JSON.stringify(credentials))).toEqual(credentials);
  });

  test("rejects missing required fields", () => {
    expect(() =>
      parseServiceAccountCredentials({
        client_email: credentials.client_email,
        project_id: credentials.project_id,
      }),
    ).toThrow(BqError);
  });
});

describe("decodeBase64Credentials", () => {
  test("decodes valid base64 credentials", () => {
    const base64 = Buffer.from(JSON.stringify(credentials)).toString("base64");
    expect(decodeBase64Credentials(base64)).toEqual(credentials);
  });

  test("preserves typed JSON parsing errors for malformed decoded content", () => {
    try {
      decodeBase64Credentials("not-valid-base64");
      throw new Error("Expected decodeBase64Credentials to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BqError);
      expect((error as BqError).code).toBe("INVALID_CREDENTIALS_JSON");
    }
  });

  test("preserves the empty decoded value error message", () => {
    const emptyBase64 = Buffer.from("").toString("base64");

    expect(() => decodeBase64Credentials(emptyBase64)).toThrow(
      "Invalid base64 credentials. The decoded value was empty.",
    );
  });

  test("preserves missing required field validation details", () => {
    const invalidCredentials = Buffer.from(
      JSON.stringify({
        client_email: credentials.client_email,
        project_id: credentials.project_id,
      }),
    ).toString("base64");

    expect(() => decodeBase64Credentials(invalidCredentials)).toThrow(
      'Invalid Google service-account credentials. Missing required field "private_key".',
    );
  });
});

describe("resolveCredentials", () => {
  test("prefers explicit credentials objects", () => {
    expect(
      resolveCredentials({
        credentials,
        credentialsBase64: Buffer.from(
          JSON.stringify({ ...credentials, project_id: "ignored" }),
        ).toString("base64"),
      }),
    ).toEqual(credentials);
  });
});

describe("resolveClientSetup", () => {
  test("infers projectId from service-account credentials", () => {
    const setup = resolveClientSetup({ credentials });

    expect(setup.bigQueryOptions.projectId).toBe("demo-project");
    expect(setup.bigQueryOptions.credentials).toEqual(credentials);
  });

  test("keeps ADC when no explicit credentials are provided", () => {
    const setup = resolveClientSetup({ dataset: "analytics", location: "US" });

    expect(setup.bigQueryOptions.credentials).toBeUndefined();
    expect(setup.defaults).toEqual({
      dataset: "analytics",
      dryRun: undefined,
      location: "US",
      maximumBytesBilled: undefined,
      useLegacySql: false,
    });
  });
});
