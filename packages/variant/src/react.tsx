import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import { resolveInitialVariant } from "./core";
import { DEFAULT_STORAGE_KEY, getStoredVariant, setStoredVariant } from "./storage";
import type {
  LandingPreferenceState,
  LandingStorageAdapter,
  LandingVariantDefinition,
  LandingVariantRegistry,
} from "./types";

interface LandingVariantContextValue<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
> extends LandingPreferenceState<TVariant> {
  registry: LandingVariantRegistry<TVariant>;
  setVariant: (variantId: TVariant["id"]) => void;
  storageKey: string;
}

export interface LandingPreferenceProviderProps<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
> {
  /** React subtree that should receive landing variant state. */
  children: ReactNode;
  /** SSR-safe starting id used before persisted client state is read. */
  initialVariantId?: TVariant["id"];
  /** Optional callback fired after the active variant changes through the provider. */
  onVariantChange?: (variant: TVariant) => void;
  /** Valid landing variants and default fallback. */
  registry: LandingVariantRegistry<TVariant>;
  /** Optional custom persistence adapter. Defaults to browser `localStorage` when available. */
  storage?: LandingStorageAdapter | null;
  /** Optional custom storage key for persisting the active variant id. */
  storageKey?: string;
}

/** Styling and labeling options for the unstyled landing variant toggle component. */
export interface LandingVariantToggleProps<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
> {
  activeClassName?: string;
  buttonClassName?: string;
  className?: string;
  getLabel?: (variant: TVariant) => ReactNode;
  inactiveClassName?: string;
  orientation?: "horizontal" | "vertical";
}

/** A variant definition that can render itself as a full landing page component. */
export interface LandingRenderableVariant<
  TProps extends object = Record<string, never>,
> extends LandingVariantDefinition {
  /** React component rendered when this variant is the active selection. */
  component: ComponentType<TProps>;
}

/** Props forwarded to the active landing component by `LandingVariantRenderer`. */
export interface LandingVariantRendererProps<TProps extends object = Record<string, never>> {
  /**
   * Props forwarded to the active landing component.
   *
   * Pass `{}` when your landing variants do not require any props.
   */
  componentProps: TProps;
}

const LandingVariantContext = createContext<LandingVariantContextValue | null>(null);

function getContext<
  TVariant extends LandingVariantDefinition,
>(): LandingVariantContextValue<TVariant> {
  const context = useContext(LandingVariantContext) as LandingVariantContextValue<TVariant> | null;

  if (!context) {
    throw new Error("Landing variant hooks must be used inside LandingPreferenceProvider.");
  }

  return context;
}

function getVariantOrThrow<TVariant extends LandingVariantDefinition>(
  registry: LandingVariantRegistry<TVariant>,
  variantId: TVariant["id"],
): TVariant {
  const variant = registry.getVariant(variantId);

  if (!variant) {
    throw new Error(`Unknown landing variant "${variantId}".`);
  }

  return variant;
}

function joinClassNames(...values: Array<string | undefined>): string | undefined {
  const className = values.filter(Boolean).join(" ");
  return className || undefined;
}

/**
 * React provider that stores and hydrates the active landing-page variant.
 *
 * On the server it uses `initialVariantId` or the registry default. On the client it upgrades to a
 * persisted selection, if one exists, without requiring consumers to manage storage manually.
 */
export function LandingPreferenceProvider<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
>({
  children,
  initialVariantId,
  onVariantChange,
  registry,
  storage,
  storageKey = DEFAULT_STORAGE_KEY,
}: LandingPreferenceProviderProps<TVariant>) {
  const [activeVariantId, setActiveVariantId] = useState<TVariant["id"]>(() =>
    resolveInitialVariant({
      initialVariantId,
      registry,
      storage: null,
      storageKey,
    }),
  );
  const previousVariantIdRef = useRef(activeVariantId);

  useEffect(() => {
    const resolvedVariantId =
      getStoredVariant({
        registry,
        storage,
        storageKey,
      }) ??
      resolveInitialVariant({
        initialVariantId,
        registry,
        storage: null,
        storageKey,
      });

    setActiveVariantId((currentVariantId) =>
      currentVariantId === resolvedVariantId ? currentVariantId : resolvedVariantId,
    );
  }, [initialVariantId, registry, storage, storageKey]);

  useEffect(() => {
    if (previousVariantIdRef.current === activeVariantId) {
      return;
    }

    previousVariantIdRef.current = activeVariantId;
    onVariantChange?.(getVariantOrThrow(registry, activeVariantId));
  }, [activeVariantId, onVariantChange, registry]);

  const setVariant = useCallback(
    (nextVariantId: TVariant["id"]) => {
      const resolvedVariantId = setStoredVariant(nextVariantId, {
        registry,
        storage,
        storageKey,
      });

      setActiveVariantId((currentVariantId) =>
        currentVariantId === resolvedVariantId ? currentVariantId : resolvedVariantId,
      );
    },
    [registry, storage, storageKey],
  );

  const activeVariant = getVariantOrThrow(registry, activeVariantId);

  const value = useMemo<LandingVariantContextValue<TVariant>>(
    () => ({
      activeVariant,
      activeVariantId,
      registry,
      setVariant,
      storageKey,
      variants: registry.variants,
    }),
    [activeVariant, activeVariantId, registry, setVariant, storageKey],
  );

  return (
    <LandingVariantContext.Provider value={value as unknown as LandingVariantContextValue}>
      {children}
    </LandingVariantContext.Provider>
  );
}

/** Returns the active variant, available variants, registry, and setter from context. */
export function useLandingPreference<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
>(): LandingVariantContextValue<TVariant> {
  return getContext<TVariant>();
}

/** Returns only the stable setter function for changing the active landing variant. */
export function useSetLandingPreference<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
>(): (variantId: TVariant["id"]) => void {
  return getContext<TVariant>().setVariant;
}

/**
 * Minimal unstyled toggle group for switching between registered landing variants.
 *
 * Consumers control all visual styling through class names or by rendering labels manually with
 * `getLabel`.
 */
export function LandingVariantToggle<
  TVariant extends LandingVariantDefinition = LandingVariantDefinition,
>({
  activeClassName,
  buttonClassName,
  className,
  getLabel,
  inactiveClassName,
  orientation = "horizontal",
}: LandingVariantToggleProps<TVariant>) {
  const { activeVariantId, setVariant, variants } = useLandingPreference<TVariant>();

  return (
    <div
      aria-label="Landing variant selector"
      className={className}
      data-orientation={orientation}
      role="group"
    >
      {variants.map((variant) => {
        const isActive = variant.id === activeVariantId;

        return (
          <button
            aria-pressed={isActive}
            className={joinClassNames(
              buttonClassName,
              isActive ? activeClassName : inactiveClassName,
            )}
            data-active={isActive ? "true" : "false"}
            key={variant.id}
            onClick={() => setVariant(variant.id)}
            type="button"
          >
            {getLabel ? getLabel(variant) : variant.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Renders the currently active landing component for registries that include a `component` field.
 */
export function LandingVariantRenderer<
  TProps extends object = Record<string, never>,
  TVariant extends LandingRenderableVariant<TProps> = LandingRenderableVariant<TProps>,
>({ componentProps }: LandingVariantRendererProps<TProps>) {
  const { activeVariant } = useLandingPreference<TVariant>();
  const Component = activeVariant.component;

  return <Component {...componentProps} />;
}
