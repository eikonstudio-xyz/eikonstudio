import { getStore } from "./store";
import type { KillByNameOptions, KillByNameResult } from "./types";

export function killByName(name: string, options: KillByNameOptions = {}): KillByNameResult {
  const store = getStore([], options);
  const entry = store.names[name];

  if (!entry) {
    throw new Error(`No open port is named "${name}".`);
  }

  const signal = options.force ? "SIGKILL" : "SIGTERM";
  process.kill(entry.pid, signal);

  return {
    name,
    pid: entry.pid,
    port: entry.port,
    process: entry.process,
    signal,
  };
}
