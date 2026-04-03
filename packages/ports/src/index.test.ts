import { rmSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { pickRandomPortName } from "./namer";
import { parseLsofOutput } from "./scanner";
import * as scanner from "./scanner";
import { getStore, pruneStore, writeStore } from "./store";

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

  test("removes all saved names when no listeners remain", () => {
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
        },
      },
      [],
    );

    expect(result.removedNames).toEqual(["breeze"]);
    expect(result.store.names).toEqual({});
  });

  test("treats process, protocol, and endpoint changes as a new listener", () => {
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
        },
      },
      [
        {
          endpoint: "127.0.0.1:3000",
          pid: 42010,
          port: 3000,
          process: "node",
          protocol: "tcp4",
        },
      ],
    );

    expect(result.removedNames).toEqual(["breeze"]);
    expect(result.store.names).toEqual({});
  });
});

describe("getStore", () => {
  const storePath = `/tmp/eikonstudio-ports-test-${process.pid}.json`;

  beforeEach(() => {
    writeStore(
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
        },
      },
      { storePath },
    );
  });

  afterEach(() => {
    rmSync(storePath, { force: true });
  });

  test("prunes stale entries even when there are zero active listeners", () => {
    expect(getStore([], { storePath })).toEqual({
      version: 1,
      names: {},
    });
  });
});

describe("killByName", () => {
  const storePath = `/tmp/eikonstudio-ports-kill-test-${process.pid}.json`;
  const originalProcessKill = process.kill;

  beforeEach(() => {
    writeStore(
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
        },
      },
      { storePath },
    );
  });

  afterEach(() => {
    mock.restore();
    process.kill = originalProcessKill;
    rmSync(storePath, { force: true });
  });

  test("refuses to kill when the saved alias no longer matches a live listener", async () => {
    mock.module("./scanner", () => ({
      listPorts: () => [
        {
          endpoint: "127.0.0.1:3000",
          pid: 42010,
          port: 3000,
          process: "node",
          protocol: "tcp4",
        },
      ],
      parseLsofOutput: scanner.parseLsofOutput,
    }));

    const killSpy = mock(() => undefined);
    process.kill = killSpy as typeof process.kill;
    const { killByName } = await import("./killer");

    expect(() => killByName("breeze", { storePath })).toThrow('No open port is named "breeze".');
    expect(killSpy).not.toHaveBeenCalled();
  });
});
