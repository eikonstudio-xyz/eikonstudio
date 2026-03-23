import type {
  LandingVariantDefinition,
  LandingVariantStorageOptions,
  LandingStorageAdapter,
} from "./types";

export const DEFAULT_STORAGE_KEY = "eikonstudio.variant.preference";

function resolveStorage(storage?: LandingStorageAdapter | null): LandingStorageAdapter | null {
  if (storage !== undefined) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function resolveStorageKey(storageKey?: string): string {
  return storageKey ?? DEFAULT_STORAGE_KEY;
}

/**
 * Reads the persisted landing variant id from storage.
 *
 * Invalid stored values are treated as stale and removed automatically.
 */
export function getStoredVariant<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
>({
  registry,
  storage,
  storageKey,
}: LandingVariantStorageOptions<TVariant>): TVariant["id"] | null {
  const resolvedStorage = resolveStorage(storage);

  if (!resolvedStorage) {
    return null;
  }

  const key = resolveStorageKey(storageKey);

  try {
    const value = resolvedStorage.getItem(key);

    if (!value) {
      return null;
    }

    if (registry.hasVariant(value)) {
      return value;
    }

    resolvedStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

/**
 * Persists a landing variant id after verifying that it exists in the registry.
 *
 * Storage failures are ignored so UI state can still update in restricted environments.
 */
export function setStoredVariant<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
>(
  variantId: TVariant["id"],
  { registry, storage, storageKey }: LandingVariantStorageOptions<TVariant>,
): TVariant["id"] {
  if (!registry.hasVariant(variantId)) {
    throw new Error(`Unknown landing variant "${variantId}".`);
  }

  const resolvedStorage = resolveStorage(storage);

  if (resolvedStorage) {
    try {
      resolvedStorage.setItem(resolveStorageKey(storageKey), variantId);
    } catch {
      // Ignore storage write failures so UI state can still change in restricted environments.
    }
  }

  return variantId;
}

/** Removes any previously persisted landing preference for the configured storage key. */
export function clearStoredVariant({
  storage,
  storageKey,
}: Pick<LandingVariantStorageOptions, "storage" | "storageKey">): void {
  const resolvedStorage = resolveStorage(storage);

  if (!resolvedStorage) {
    return;
  }

  try {
    resolvedStorage.removeItem(resolveStorageKey(storageKey));
  } catch {
    // Ignore storage cleanup failures for restricted environments.
  }
}
