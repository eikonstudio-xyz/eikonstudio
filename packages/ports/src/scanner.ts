import { spawnSync } from "node:child_process";

import type { OpenPort, PortProtocol } from "./types";

const LSOF_ARGS = ["-nP", "-iTCP", "-sTCP:LISTEN"];

function parsePort(line: string) {
  const match = line.match(/:(\d+)\s+\(LISTEN\)$/);
  const rawPort = match?.[1];
  if (!rawPort) {
    return null;
  }

  const value = Number.parseInt(rawPort, 10);
  return Number.isFinite(value) ? value : null;
}

function parseProtocol(value: string): PortProtocol | null {
  if (value === "IPv4") {
    return "tcp4";
  }

  if (value === "IPv6") {
    return "tcp6";
  }

  return null;
}

function toPortIdentity(port: OpenPort) {
  return `${port.process}:${port.pid}:${port.protocol}:${port.endpoint}`;
}

export function parseLsofOutput(output: string): OpenPort[] {
  const ports = output
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const match = line.match(/^(\S+)\s+(\d+)\s+\S+\s+\S+\s+(IPv[46])\s+\S+\s+\S+\s+\S+\s+(.+)$/);
      if (!match) {
        return [];
      }

      const [, processName, rawPid, rawProtocol, rawEndpoint] = match;
      if (!processName || !rawPid || !rawProtocol || !rawEndpoint) {
        return [];
      }

      const protocol = parseProtocol(rawProtocol);
      const port = parsePort(rawEndpoint);
      const pid = Number.parseInt(rawPid, 10);

      if (!protocol || port === null || !Number.isFinite(pid)) {
        return [];
      }

      return [
        {
          endpoint: rawEndpoint.replace(/\s+\(LISTEN\)$/, ""),
          pid,
          port,
          process: processName,
          protocol,
        } satisfies OpenPort,
      ];
    })
    .sort((left, right) => left.port - right.port || left.pid - right.pid);

  return ports.filter((port, index) => {
    return (
      ports.findIndex((candidate) => toPortIdentity(candidate) === toPortIdentity(port)) === index
    );
  });
}

export function listPorts(): OpenPort[] {
  const result = spawnSync("lsof", LSOF_ARGS, {
    encoding: "utf8",
  });

  if (result.error) {
    throw new Error(`Failed to run lsof: ${result.error.message}`);
  }

  if (result.status !== 0) {
    if (!result.stdout.trim() && !result.stderr.trim()) {
      return [];
    }

    const stderr = result.stderr.trim();
    throw new Error(
      stderr ? `lsof exited with code ${result.status}: ${stderr}` : "lsof exited unexpectedly",
    );
  }

  return parseLsofOutput(result.stdout);
}
