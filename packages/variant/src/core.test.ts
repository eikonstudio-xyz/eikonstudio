import { describe, expect, test } from "bun:test";

import { createLandingRegistry, resolveInitialVariant, resolveVariant } from "./core";
import { clearStoredVariant, getStoredVariant, setStoredVariant } from "./storage";
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

const registry = createLandingRegistry([
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Minimal" },
  { id: "bold", label: "Bold" },
] as const);

describe("createLandingRegistry", () => {
  test("creates a typed multi-variant registry", () => {
    expect(registry.defaultVariantId).toBe("classic");
    expect(registry.variants.map((variant) => variant.id)).toEqual(["classic", "minimal", "bold"]);
    expect(registry.getVariant("minimal")?.label).toBe("Minimal");
    expect(registry.hasVariant("missing")).toBe(false);
  });

  test("throws when fewer than two variants are provided", () => {
    expect(() => createLandingRegistry([{ id: "only", label: "Only" }] as const as never)).toThrow(
      "Landing registries require at least two variants.",
    );
  });

  test("throws when ids are duplicated", () => {
    expect(() =>
      createLandingRegistry([
        { id: "classic", label: "Classic" },
        { id: "classic", label: "Duplicate" },
      ] as const),
    ).toThrow('Duplicate landing variant id "classic".');
  });
});

describe("storage helpers", () => {
  test("reads and writes persisted variants", () => {
    const storage = createMemoryStorage();

    expect(getStoredVariant({ registry, storage, storageKey: "landing" })).toBeNull();

    setStoredVariant("bold", { registry, storage, storageKey: "landing" });

    expect(getStoredVariant({ registry, storage, storageKey: "landing" })).toBe("bold");
    expect(storage.snapshot()).toEqual({ landing: "bold" });
  });

  test("clears invalid persisted variants", () => {
    const storage = createMemoryStorage({ landing: "missing" });

    expect(getStoredVariant({ registry, storage, storageKey: "landing" })).toBeNull();
    expect(storage.snapshot()).toEqual({});
  });

  test("throws when persisting an unknown variant id", () => {
    const storage = createMemoryStorage();

    expect(() =>
      setStoredVariant("missing" as never, { registry, storage, storageKey: "landing" }),
    ).toThrow('Unknown landing variant "missing".');
  });

  test("removes stored preferences explicitly", () => {
    const storage = createMemoryStorage({ landing: "minimal" });

    clearStoredVariant({ storage, storageKey: "landing" });

    expect(storage.snapshot()).toEqual({});
  });
});

describe("resolveInitialVariant", () => {
  test("prefers a valid explicit initial variant", () => {
    const storage = createMemoryStorage({ landing: "bold" });

    expect(
      resolveInitialVariant({
        initialVariantId: "minimal",
        registry,
        storage,
        storageKey: "landing",
      }),
    ).toBe("minimal");
  });

  test("falls back to stored values and then the registry default", () => {
    const storage = createMemoryStorage({ landing: "bold" });

    expect(resolveInitialVariant({ registry, storage, storageKey: "landing" })).toBe("bold");
    expect(
      resolveInitialVariant({ registry, storage: createMemoryStorage(), storageKey: "landing" }),
    ).toBe("classic");
  });
});

describe("resolveVariant", () => {
  test("returns the default variant when the requested id is missing", () => {
    expect(resolveVariant(registry, "unknown")).toBe("classic");
    expect(resolveVariant(registry, undefined)).toBe("classic");
  });
});
