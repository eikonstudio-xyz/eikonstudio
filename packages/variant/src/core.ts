import { DEFAULT_STORAGE_KEY, getStoredVariant } from "./storage";
import type {
  LandingRegistryOptions,
  LandingVariantDefinition,
  LandingVariantRegistry,
  LandingVariantTuple,
  ResolveInitialVariantOptions,
} from "./types";

function ensureValidVariants<TVariant extends LandingVariantDefinition>(
  variants: readonly TVariant[],
): void {
  if (variants.length < 2) {
    throw new Error("Landing registries require at least two variants.");
  }

  const seen = new Set<string>();

  for (const variant of variants) {
    if (!variant.id) {
      throw new Error("Landing variants must include a non-empty id.");
    }

    if (seen.has(variant.id)) {
      throw new Error(`Duplicate landing variant id "${variant.id}".`);
    }

    seen.add(variant.id);
  }
}

/**
 * Creates a validated landing-variant registry with stable ids and typed lookups.
 *
 * This enforces the package rule that a switchable landing experience must expose more than one
 * design option.
 */
export function createLandingRegistry<
  const TVariants extends LandingVariantTuple<LandingVariantDefinition>,
>(
  variants: TVariants,
  options: LandingRegistryOptions<TVariants[number]> = {},
): LandingVariantRegistry<TVariants[number]> {
  ensureValidVariants(variants);

  const byId = new Map<TVariants[number]["id"], TVariants[number]>();

  for (const variant of variants) {
    byId.set(variant.id, variant);
  }

  const defaultVariantId = options.defaultVariantId ?? variants[0].id;

  if (!byId.has(defaultVariantId)) {
    throw new Error(`Unknown default landing variant "${defaultVariantId}".`);
  }

  return {
    byId,
    defaultVariantId,
    variants,
    getVariant(id: string) {
      return byId.get(id as TVariants[number]["id"]);
    },
    hasVariant(id: string): id is TVariants[number]["id"] {
      return byId.has(id as TVariants[number]["id"]);
    },
  };
}

/**
 * Resolves a variant id against a registry and falls back to the registry default when needed.
 */
export function resolveVariant<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
>(
  registry: LandingVariantRegistry<TVariant>,
  variantId: string | undefined | null,
): TVariant["id"] {
  if (variantId && registry.hasVariant(variantId)) {
    return variantId;
  }

  return registry.defaultVariantId;
}

/**
 * Resolves the starting variant for a render.
 *
 * Resolution order:
 * 1. `initialVariantId` when valid
 * 2. persisted storage value when valid
 * 3. registry default
 */
export function resolveInitialVariant<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
>({
  initialVariantId,
  registry,
  storage,
  storageKey = DEFAULT_STORAGE_KEY,
}: ResolveInitialVariantOptions<TVariant>): TVariant["id"] {
  if (initialVariantId && registry.hasVariant(initialVariantId)) {
    return initialVariantId;
  }

  return getStoredVariant({ registry, storage, storageKey }) ?? registry.defaultVariantId;
}
