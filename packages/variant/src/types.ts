/** String id used to identify one landing-page design option. */
export type LandingVariantId = string;

/**
 * Metadata for one selectable landing-page variant.
 *
 * Apps can extend this shape with extra fields like a React component, analytics id, or theme
 * token while keeping the `id` and `label` contract stable.
 */
export interface LandingVariantDefinition<TId extends LandingVariantId = LandingVariantId> {
  /** Stable machine-readable id used for persistence and lookups. */
  id: TId;
  /** Human-readable label for toggles, tabs, or other variant pickers. */
  label: string;
  /** Optional helper text for menus or onboarding UIs. */
  description?: string;
}

/** Tuple type that guarantees at least two landing variants are available. */
export type LandingVariantTuple<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
> = readonly [TVariant, TVariant, ...TVariant[]];

/** Optional configuration when creating a validated landing registry. */
export interface LandingRegistryOptions<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
> {
  /** Which registered variant should be used as the default fallback. */
  defaultVariantId?: TVariant["id"];
}

/**
 * Read-only registry of allowed landing variants.
 *
 * This is the shared source of truth used by storage helpers and React bindings.
 */
export interface LandingVariantRegistry<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
> {
  /** Fast lookup map keyed by variant id. */
  readonly byId: ReadonlyMap<TVariant["id"], TVariant>;
  /** Default variant used when an invalid or missing selection is encountered. */
  readonly defaultVariantId: TVariant["id"];
  /** Ordered list of variants, typically used to render selection controls. */
  readonly variants: LandingVariantTuple<TVariant>;
  /** Returns a registered variant by id, if it exists. */
  getVariant(id: string): TVariant | undefined;
  /** Type-safe guard for checking whether an id belongs to this registry. */
  hasVariant(id: string): id is TVariant["id"];
}

/** Minimal storage contract used for persistence, compatible with `localStorage`. */
export interface LandingStorageAdapter {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

/** Shared persistence options for reading and writing the active variant. */
export interface LandingVariantStorageOptions<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
> {
  /** Registry that defines the valid variant ids. */
  registry: LandingVariantRegistry<TVariant>;
  /** Optional custom storage implementation. Defaults to browser `localStorage` when available. */
  storage?: LandingStorageAdapter | null;
  /** Optional custom key used to persist the selected variant. */
  storageKey?: string;
}

/** Inputs for resolving the starting variant for an app session or request. */
export interface ResolveInitialVariantOptions<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
> extends LandingVariantStorageOptions<TVariant> {
  /** Optional SSR-safe fallback id to use before client storage is read. */
  initialVariantId?: TVariant["id"];
}

/** Current landing preference exposed by the React hooks and provider. */
export interface LandingPreferenceState<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
> {
  /** Full active variant object. */
  activeVariant: TVariant;
  /** Id of the active variant. */
  activeVariantId: TVariant["id"];
  /** All variants in registry order, suitable for rendering toggles. */
  variants: readonly TVariant[];
}
