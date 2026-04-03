# @eikonstudio/ports

Name, inspect, and close open local TCP ports with memorable aliases.

Instead of remembering `PID 48291 on :3000`, just call it `bright-fox` and kill it by name.

## Install

```bash
npm install @eikonstudio/ports
# or
bun add @eikonstudio/ports
```

## CLI

The package ships a `ports` binary.

```bash
# List all listening TCP ports (assigns names to new ones automatically)
ports list

# Kill a port by its alias
ports kill bright-fox

# Force kill (SIGKILL instead of SIGTERM)
ports close bright-fox --force

# Remove stale names that no longer match active listeners
ports clean
```

Example output:

```
Name         Port  Protocol  PID    Process
-----------  ----  --------  -----  -------
bright-fox   3000  tcp4      48291  node
calm-river   5173  tcp4      51002  bun
```

## Programmatic API

```ts
import { listPorts, namePorts, killByName, getStore, cleanStore } from "@eikonstudio/ports";

// List raw open ports (no naming)
const ports = listPorts();

// List ports and assign stable memorable names
const named = namePorts();
// [{ name: "bright-fox", port: 3000, pid: 48291, process: "node", ... }]

// Kill a named port
const result = killByName("bright-fox");
// { name: "bright-fox", pid: 48291, port: 3000, signal: "SIGTERM" }

// Force kill
killByName("bright-fox", { force: true });

// Read the persisted alias store
const store = getStore();

// Prune stale entries
const cleaned = cleanStore();
```

### Custom store path

All functions accept `{ storePath }` to override where the alias JSON file is stored:

```ts
const named = namePorts({ storePath: "/tmp/my-ports.json" });
```

### Custom word pool

Provide your own word list for name generation:

```ts
const named = namePorts({ wordPool: ["alpha", "beta", "gamma", "delta"] });
```

## License

MIT