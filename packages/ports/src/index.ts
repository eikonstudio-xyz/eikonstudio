/**
 * @packageDocumentation
 * Inspect local listening TCP ports, give them memorable aliases, and close them by name.
 *
 * Typical usage:
 * - {@linkcode listPorts} returns the current listening ports
 * - {@linkcode namePorts} assigns stable random names and persists them locally
 * - {@linkcode killByName} sends SIGTERM or SIGKILL using the saved alias
 * - {@linkcode getStore} returns the persisted alias map after pruning stale entries
 */
import { killByName } from "./killer";
import { pickRandomPortName } from "./namer";
import { listPorts } from "./scanner";
import { cleanStore as prunePersistedStore, getStore as readStore, writeStore } from "./store";
import type {
  KillByNameOptions,
  NamePortsOptions,
  NamedPort,
  OpenPort,
  PortsStore,
  StoreOptions,
} from "./types";

function toPortKey(port: OpenPort) {
  return `${port.pid}:${port.port}`;
}

export function namePorts(options: NamePortsOptions = {}): NamedPort[] {
  const openPorts = listPorts();
  const store = readStore(openPorts, options);
  const namesByPortKey = new Map<string, string>();

  for (const [name, entry] of Object.entries(store.names)) {
    namesByPortKey.set(`${entry.pid}:${entry.port}`, name);
  }

  const usedNames = new Set(Object.keys(store.names));
  let didChange = false;

  for (const openPort of openPorts) {
    const portKey = toPortKey(openPort);
    if (namesByPortKey.has(portKey)) {
      continue;
    }

    const nextName = pickRandomPortName(usedNames, openPort.port, options.wordPool);
    const assignedAt = new Date().toISOString();

    store.names[nextName] = {
      assignedAt,
      endpoint: openPort.endpoint,
      pid: openPort.pid,
      port: openPort.port,
      process: openPort.process,
      protocol: openPort.protocol,
    };

    namesByPortKey.set(portKey, nextName);
    usedNames.add(nextName);
    didChange = true;
  }

  if (didChange) {
    writeStore(store, options);
  }

  return openPorts.map((openPort) => {
    const name = namesByPortKey.get(toPortKey(openPort));
    if (!name) {
      throw new Error(`Missing generated name for port ${openPort.port}.`);
    }

    return {
      ...openPort,
      assignedAt: store.names[name]?.assignedAt ?? new Date().toISOString(),
      name,
    };
  });
}

export function getStore(options: StoreOptions = {}): PortsStore {
  return readStore(listPorts(), options);
}

export function cleanStore(options: StoreOptions = {}) {
  return prunePersistedStore(listPorts(), options);
}

export { killByName, listPorts };
export type {
  KillByNameOptions,
  NamePortsOptions,
  NamedPort,
  OpenPort,
  PortsStore,
  StoreOptions,
} from "./types";
