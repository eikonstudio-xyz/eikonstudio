#!/usr/bin/env node

import { cleanStore, killByName, namePorts } from "./index";
import type { NamedPort } from "./types";

function pad(value: string | number, width: number) {
  return String(value).padEnd(width, " ");
}

function renderPortsTable(ports: readonly NamedPort[]) {
  if (ports.length === 0) {
    return "No listening TCP ports found.";
  }

  const rows = ports.map((port) => ({
    name: port.name,
    pid: String(port.pid),
    port: String(port.port),
    process: port.process,
    protocol: port.protocol,
  }));

  const widths = {
    name: Math.max("Name".length, ...rows.map((row) => row.name.length)),
    pid: Math.max("PID".length, ...rows.map((row) => row.pid.length)),
    port: Math.max("Port".length, ...rows.map((row) => row.port.length)),
    process: Math.max("Process".length, ...rows.map((row) => row.process.length)),
    protocol: Math.max("Protocol".length, ...rows.map((row) => row.protocol.length)),
  };

  const header = [
    pad("Name", widths.name),
    pad("Port", widths.port),
    pad("Protocol", widths.protocol),
    pad("PID", widths.pid),
    pad("Process", widths.process),
  ].join("  ");

  const separator = [
    "-".repeat(widths.name),
    "-".repeat(widths.port),
    "-".repeat(widths.protocol),
    "-".repeat(widths.pid),
    "-".repeat(widths.process),
  ].join("  ");

  const body = rows
    .map((row) =>
      [
        pad(row.name, widths.name),
        pad(row.port, widths.port),
        pad(row.protocol, widths.protocol),
        pad(row.pid, widths.pid),
        pad(row.process, widths.process),
      ].join("  "),
    )
    .join("\n");

  return `${header}\n${separator}\n${body}`;
}

function renderHelp() {
  return [
    "Usage:",
    "  ports list",
    "  ports kill <name> [--force]",
    "  ports close <name> [--force]",
    "  ports clean",
    "",
    "Commands:",
    "  list           Show open listening TCP ports and assign names to new ones",
    "  kill <name>    Send SIGTERM to the named port process",
    "  close <name>   Alias for kill",
    "  clean          Remove stale names from the local store",
  ].join("\n");
}

function main() {
  const [, , command = "list", ...rest] = process.argv;

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(renderHelp());
    return;
  }

  if (command === "list") {
    console.log(renderPortsTable(namePorts()));
    return;
  }

  if (command === "clean") {
    const result = cleanStore();
    if (result.removedNames.length === 0) {
      console.log("Nothing to clean. All saved port names still match active listeners.");
      return;
    }

    console.log(
      `Removed ${result.removedNames.length} stale port name(s): ${result.removedNames.join(", ")}`,
    );
    return;
  }

  if (command === "kill" || command === "close") {
    const name = rest.find((value) => !value.startsWith("-"));
    if (!name) {
      throw new Error("Please provide the port name to close.");
    }

    const force = rest.includes("--force");
    const result = killByName(name, { force });
    const action = force ? "Killed" : "Sent SIGTERM to";

    console.log(
      `${action} ${result.process} (PID ${result.pid}) on port ${result.port} via "${result.name}".`,
    );
    return;
  }

  throw new Error(`Unknown command "${command}".\n\n${renderHelp()}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
