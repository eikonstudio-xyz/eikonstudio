import { listPorts } from "./scanner";
import { getStore } from "./store";
import type { KillByNameOptions, KillByNameResult } from "./types";

function isMatchingListener(name: string, options: KillByNameOptions) {
  const openPorts = listPorts();
  const store = getStore(openPorts, options);
  const entry = store.names[name];

  if (!entry) {
    return null;
  }

  const match = openPorts.find((openPort) => {
    return (
      openPort.pid === entry.pid &&
      openPort.port === entry.port &&
      openPort.process === entry.process &&
      openPort.protocol === entry.protocol &&
      openPort.endpoint === entry.endpoint
    );
  });

  if (!match) {
    return null;
  }

  return {
    entry,
    match,
  };
}

export function killByName(name: string, options: KillByNameOptions = {}): KillByNameResult {
  const listener = isMatchingListener(name, options);

  if (!listener) {
    throw new Error(`No open port is named "${name}".`);
  }

  const signal = options.force ? "SIGKILL" : "SIGTERM";
  process.kill(listener.match.pid, signal);

  return {
    name,
    pid: listener.match.pid,
    port: listener.match.port,
    process: listener.match.process,
    signal,
  };
}
