import { afterEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { createLandingRegistry } from "./core";
import {
  LandingPreferenceProvider,
  LandingVariantRenderer,
  LandingVariantToggle,
  useLandingPreference,
} from "./react";
import type { LandingStorageAdapter } from "./types";

function createMemoryStorage(
  initialValues: Record<string, string> = {},
): LandingStorageAdapter & { snapshot(): Record<string, string> } {
  const values = new Map(Object.entries(initialValues));

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
    snapshot() {
      return Object.fromEntries(values.entries());
    },
  };
}

const renderableRegistry = createLandingRegistry([
  {
    id: "classic",
    label: "Classic",
    component: ({ headline }: { headline: string }) => (
      <section data-variant="classic">{headline} Classic</section>
    ),
  },
  {
    id: "bold",
    label: "Bold",
    component: ({ headline }: { headline: string }) => (
      <section data-variant="bold">{headline} Bold</section>
    ),
  },
] as const);

function ActiveVariantLabel() {
  const { activeVariant } = useLandingPreference<(typeof renderableRegistry.variants)[number]>();

  return <output data-variant-label={activeVariant.id}>{activeVariant.label}</output>;
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(async () => {
  if (root) {
    await act(async () => {
      root?.unmount();
    });
  }

  root = null;

  if (container?.parentNode) {
    container.parentNode.removeChild(container);
  }

  container = null;
});

describe("LandingPreferenceProvider", () => {
  test("uses a deterministic fallback during server render", () => {
    const storage = createMemoryStorage({ landing: "bold" });

    const markup = renderToString(
      <LandingPreferenceProvider
        initialVariantId="classic"
        registry={renderableRegistry}
        storage={storage}
        storageKey="landing"
      >
        <ActiveVariantLabel />
      </LandingPreferenceProvider>,
    );

    expect(markup).toContain("Classic");
    expect(markup).not.toContain("Bold");
  });

  test("hydrates from persisted storage and swaps the whole rendered landing variant", async () => {
    const storage = createMemoryStorage({ landing: "bold" });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <LandingPreferenceProvider
          initialVariantId="classic"
          registry={renderableRegistry}
          storage={storage}
          storageKey="landing"
        >
          <ActiveVariantLabel />
          <LandingVariantRenderer componentProps={{ headline: "Launch" }} />
        </LandingPreferenceProvider>,
      );

      await Promise.resolve();
    });

    expect(container.textContent).toContain("Bold");
    expect(container.querySelector('[data-variant="bold"]')?.textContent).toBe("Launch Bold");
  });

  test("fires onVariantChange when hydration upgrades to a stored variant", async () => {
    const storage = createMemoryStorage({ landing: "bold" });
    const changes: string[] = [];
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <LandingPreferenceProvider
          initialVariantId="classic"
          onVariantChange={(variant) => changes.push(variant.id)}
          registry={renderableRegistry}
          storage={storage}
          storageKey="landing"
        >
          <LandingVariantRenderer componentProps={{ headline: "Launch" }} />
        </LandingPreferenceProvider>,
      );

      await Promise.resolve();
    });

    expect(changes).toEqual(["bold"]);
  });

  test("renders a toggle UI and persists manual selection changes", async () => {
    const storage = createMemoryStorage();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <LandingPreferenceProvider
          registry={renderableRegistry}
          storage={storage}
          storageKey="landing"
        >
          <LandingVariantToggle />
          <ActiveVariantLabel />
          <LandingVariantRenderer componentProps={{ headline: "Preview" }} />
        </LandingPreferenceProvider>,
      );

      await Promise.resolve();
    });

    expect(container.querySelectorAll("button")).toHaveLength(2);
    expect(container.querySelector('[data-variant="classic"]')?.textContent).toBe(
      "Preview Classic",
    );
    expect(storage.snapshot()).toEqual({});

    const boldButton = container.querySelectorAll("button")[1];

    await act(async () => {
      boldButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('[data-variant="bold"]')?.textContent).toBe("Preview Bold");
    expect(container.querySelector('button[data-active="true"]')?.textContent).toBe("Bold");
    expect(storage.snapshot()).toEqual({ landing: "bold" });
  });
});
