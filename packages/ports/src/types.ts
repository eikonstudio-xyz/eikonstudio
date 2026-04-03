export type PortProtocol = "tcp4" | "tcp6";

export interface OpenPort {
  pid: number;
  port: number;
  process: string;
  protocol: PortProtocol;
  endpoint: string;
}

export interface NamedPort extends OpenPort {
  name: string;
  assignedAt: string;
}

export interface StoredPortName {
  pid: number;
  port: number;
  process: string;
  protocol: PortProtocol;
  endpoint: string;
  assignedAt: string;
}

export interface PortsStore {
  version: 1;
  names: Record<string, StoredPortName>;
}

export interface StoreOptions {
  storePath?: string;
}

export interface NamePortsOptions extends StoreOptions {
  wordPool?: readonly string[];
}

export interface KillByNameOptions extends StoreOptions {
  force?: boolean;
}

export interface CleanStoreResult {
  removedNames: string[];
  store: PortsStore;
}

export interface KillByNameResult {
  name: string;
  pid: number;
  port: number;
  process: string;
  signal: "SIGTERM" | "SIGKILL";
}
