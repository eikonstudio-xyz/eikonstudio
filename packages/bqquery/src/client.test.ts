import { describe, expect, mock, test } from "bun:test";
import type { Query } from "@google-cloud/bigquery";

import { BqClient } from "./client";
import { BqError } from "./errors";

function createClientWithMockQuery(queryImpl: (request: Query) => Promise<[unknown[]]>) {
  const query = mock(queryImpl);
  const client = Object.create(BqClient.prototype) as BqClient;

  Object.defineProperty(client, "bigquery", {
    value: {
      projectId: "demo-project",
      query,
    },
  });

  Object.defineProperty(client, "defaults", {
    value: {
      dataset: "analytics",
      dryRun: false,
      location: "US",
      maximumBytesBilled: "5000",
      useLegacySql: false,
    },
  });

  return { client, query };
}

describe("BqClient.query", () => {
  test("treats a plain object as named params in the common case", async () => {
    const { client, query } = createClientWithMockQuery(async () => [[{ id: "u_1" }]]);

    const rows = await client.query<{ id: string }>("select id from users where id = @id", {
      id: "u_1",
    });

    expect(rows).toEqual([{ id: "u_1" }]);
    expect(query).toHaveBeenCalledWith({
      defaultDataset: {
        datasetId: "analytics",
        projectId: "demo-project",
      },
      dryRun: false,
      location: "US",
      maximumBytesBilled: "5000",
      params: { id: "u_1" },
      query: "select id from users where id = @id",
      useLegacySql: false,
    });
  });

  test("supports positional params arrays", async () => {
    const { client, query } = createClientWithMockQuery(async () => [[{ id: "u_1" }]]);

    await client.query("select id from users where id = ?", ["u_1"]);

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        params: ["u_1"],
      }),
    );
  });

  test("merges per-query options over client defaults", async () => {
    const { client, query } = createClientWithMockQuery(async () => [[{ total: 7 }]]);

    await client.query("select count(*) as total from users", {
      dataset: "warehouse",
      dryRun: true,
      location: "EU",
      maximumBytesBilled: "100",
      params: { active: true },
      types: { active: "BOOL" },
      useLegacySql: true,
    });

    expect(query).toHaveBeenCalledWith({
      defaultDataset: {
        datasetId: "warehouse",
        projectId: "demo-project",
      },
      dryRun: true,
      location: "EU",
      maximumBytesBilled: "100",
      params: { active: true },
      query: "select count(*) as total from users",
      types: { active: "BOOL" },
      useLegacySql: true,
    });
  });
});

describe("BqClient.one", () => {
  test("returns the first row when present", async () => {
    const { client } = createClientWithMockQuery(async () => [[{ id: "u_1" }, { id: "u_2" }]]);

    await expect(client.one<{ id: string }>("select id from users limit 1")).resolves.toEqual({
      id: "u_1",
    });
  });

  test("returns null when there are no rows", async () => {
    const { client } = createClientWithMockQuery(async () => [[]]);
    await expect(client.one("select id from users where false")).resolves.toBeNull();
  });
});

describe("BqClient.value", () => {
  test("returns the first column from the first row", async () => {
    const { client } = createClientWithMockQuery(async () => [[{ total: 42, ignored: "x" }]]);
    await expect(client.value<number>("select count(*) as total from users")).resolves.toBe(42);
  });

  test("returns null when the query has no rows", async () => {
    const { client } = createClientWithMockQuery(async () => [[]]);
    await expect(
      client.value("select count(*) as total from users where false"),
    ).resolves.toBeNull();
  });

  test("throws when the first row has no columns", async () => {
    const { client } = createClientWithMockQuery(async () => [[{}]]);

    try {
      await client.value("select 1");
      throw new Error("Expected value() to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BqError);
      expect((error as BqError).code).toBe("INVALID_QUERY_VALUE");
    }
  });
});
