import { describe, expect, test } from "bun:test";

import { pickRandomPortName } from "./namer";
import { parseLsofOutput } from "./scanner";
import { pruneStore } from "./store";

describe("parseLsofOutput", () => {
  test("extracts listening ports from lsof output", () => {
    const output = [
      "COMMAND   PID USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME",
      "node    42010 user   21u  IPv6 0x123456789      0t0  TCP *:3000 (LISTEN)",
      "postgres 1234 user   12u  IPv4 0x987654321      0t0  TCP 127.0.0.1:5432 (LISTEN)",
    ].join("\n");

    expect(parseLsofOutput(output)).toEqual([
      {
        endpoint: "*:3000",
        pid: 42010,
        port: 3000,
        process: "node",
        protocol: "tcp6",
      },
      {
        endpoint: "127.0.0.1:5432",
        pid: 1234,
        port: 5432,
        process: "postgres",
        protocol: "tcp4",
      },
    ]);
  });

  test("deduplicates repeated lsof rows for the same listener", () => {
    const output = [
      "COMMAND   PID USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME",
      "node    42010 user   21u  IPv6 0x123456789      0t0  TCP *:3000 (LISTEN)",
      "node    42010 user   22u  IPv6 0x123456789      0t0  TCP *:3000 (LISTEN)",
    ].join("\n");

    expect(parseLsofOutput(output)).toEqual([
      {
        endpoint: "*:3000",
        pid: 42010,
        port: 3000,
        process: "node",
        protocol: "tcp6",
      },
    ]);
  });
});

describe("pickRandomPortName", () => {
  test("falls back to a deterministic name when the pool is exhausted", () => {
    expect(pickRandomPortName(new Set(["alpha"]), 3000, ["alpha"])).toBe("alpha-3000");
  });
});

describe("pruneStore", () => {
  test("removes stale names that no longer match an active listener", () => {
    const result = pruneStore(
      {
        version: 1,
        names: {
          breeze: {
            assignedAt: "2026-04-03T00:00:00.000Z",
            endpoint: "*:3000",
            pid: 42010,
            port: 3000,
            process: "node",
            protocol: "tcp6",
          },
          canyon: {
            assignedAt: "2026-04-03T00:00:00.000Z",
            endpoint: "127.0.0.1:5432",
            pid: 1234,
            port: 5432,
            process: "postgres",
            protocol: "tcp4",
          },
        },
      },
      [
        {
          endpoint: "*:3000",
          pid: 42010,
          port: 3000,
          process: "node",
          protocol: "tcp6",
        },
      ],
    );

    expect(result.removedNames).toEqual(["canyon"]);
    expect(result.store.names).toEqual({
      breeze: {
        assignedAt: "2026-04-03T00:00:00.000Z",
        endpoint: "*:3000",
        pid: 42010,
        port: 3000,
        process: "node",
        protocol: "tcp6",
      },
    });
  });
});
