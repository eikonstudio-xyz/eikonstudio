import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { homedir } from "node:os";

import type { CleanStoreResult, OpenPort, PortsStore, StoreOptions, StoredPortName } from "./types";

const DEFAULT_STORE_FILE = ".eikonstudio-ports.json";

function createEmptyStore(): PortsStore {
  return {
    version: 1,
    names: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeStoredPortName(value: unknown): StoredPortName | null {
  if (!isRecord(value)) {
    return null;
  }

  const pid = value.pid;
  const port = value.port;
  const processName = value.process;
  const protocol = value.protocol;
  const endpoint = value.endpoint;
  const assignedAt = value.assignedAt;

  if (
    typeof pid !== "number" ||
    typeof port !== "number" ||
    typeof processName !== "string" ||
    (protocol !== "tcp4" && protocol !== "tcp6") ||
    typeof endpoint !== "string" ||
    typeof assignedAt !== "string"
  ) {
    return null;
  }

  return {
    assignedAt,
    endpoint,
    pid,
    port,
    process: processName,
    protocol,
  };
}

function normalizeStore(value: unknown): PortsStore {
  if (!isRecord(value)) {
    return createEmptyStore();
  }

  const namesValue = value.names;
  if (!isRecord(namesValue)) {
    return createEmptyStore();
  }

  const names = Object.fromEntries(
    Object.entries(namesValue)
      .map(([name, entry]) => [name, normalizeStoredPortName(entry)] as const)
      .filter((entry): entry is readonly [string, StoredPortName] => entry[1] !== null),
  );

  return {
    version: 1,
    names,
  };
}

export function resolveStorePath(options: StoreOptions = {}) {
  const configuredPath = options.storePath ?? process.env.EIKON_PORTS_STORE_PATH;
  if (configuredPath) {
    return resolve(configuredPath);
  }

  return resolve(homedir(), DEFAULT_STORE_FILE);
}

function readStoreFile(path: string): PortsStore {
  if (!existsSync(path)) {
    return createEmptyStore();
  }

  try {
    return normalizeStore(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return createEmptyStore();
  }
}

export function writeStore(store: PortsStore, options: StoreOptions = {}) {
  const path = resolveStorePath(options);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function matchesOpenPort(storedPort: StoredPortName, openPort: OpenPort) {
  return storedPort.pid === openPort.pid && storedPort.port === openPort.port;
}

export function pruneStore(store: PortsStore, openPorts: readonly OpenPort[]): CleanStoreResult {
  const nextNames = Object.fromEntries(
    Object.entries(store.names).filter(([, entry]) =>
      openPorts.some((openPort) => matchesOpenPort(entry, openPort)),
    ),
  );

  const removedNames = Object.keys(store.names).filter((name) => !(name in nextNames));
  return {
    removedNames,
    store: {
      version: 1,
      names: nextNames,
    },
  };
}

export function getStore(
  openPorts: readonly OpenPort[] = [],
  options: StoreOptions = {},
): PortsStore {
  const path = resolveStorePath(options);
  const store = readStoreFile(path);
  if (openPorts.length === 0) {
    return store;
  }

  const result = pruneStore(store, openPorts);
  if (result.removedNames.length > 0) {
    writeStore(result.store, { storePath: path });
  }

  return result.store;
}

export function cleanStore(
  openPorts: readonly OpenPort[],
  options: StoreOptions = {},
): CleanStoreResult {
  const path = resolveStorePath(options);
  const result = pruneStore(readStoreFile(path), openPorts);
  writeStore(result.store, { storePath: path });
  return result;
}
