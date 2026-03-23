/**
 * @packageDocumentation
 * React-friendly helpers for switching between multiple landing page variants.
 *
 * The package is intentionally headless and unstyled:
 * - `createLandingRegistry` validates and types a multi-variant landing registry
 * - storage helpers persist a user's selected design
 * - `LandingPreferenceProvider` and hooks expose the active variant to React apps
 * - `LandingVariantToggle` and `LandingVariantRenderer` provide minimal UI helpers
 */
export { createLandingRegistry, resolveInitialVariant, resolveVariant } from "./core";
export {
  clearStoredVariant,
  DEFAULT_STORAGE_KEY,
  getStoredVariant,
  setStoredVariant,
} from "./storage";
export {
  LandingPreferenceProvider,
  LandingVariantRenderer,
  LandingVariantToggle,
  useLandingPreference,
  useSetLandingPreference,
} from "./react";
export type {
  LandingPreferenceState,
  LandingRegistryOptions,
  LandingVariantDefinition,
  LandingVariantId,
  LandingVariantRegistry,
  LandingVariantStorageOptions,
  LandingVariantTuple,
  LandingStorageAdapter,
  ResolveInitialVariantOptions,
} from "./types";
export type {
  LandingRenderableVariant,
  LandingPreferenceProviderProps,
  LandingVariantRendererProps,
  LandingVariantToggleProps,
} from "./react";
