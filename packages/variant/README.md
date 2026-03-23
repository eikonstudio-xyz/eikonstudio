# `@eikonstudio/variant`

React-friendly helpers for switching between multiple landing page variants.

`@eikonstudio/variant` is built for the case where one website has multiple full landing-page
designs and the user can choose which one they prefer from a toggle or switcher UI. The selected
variant is persisted, and the whole landing experience can swap seamlessly through one active
variant state.

## Install

```bash
bun add @eikonstudio/variant
```

`react` is a peer dependency, so install it in your app if it is not already present.

## What this package gives you

- `createLandingRegistry()` to define the available landing variants
- `LandingPreferenceProvider` to manage the active variant in React
- `useLandingPreference()` and `useSetLandingPreference()` hooks
- `LandingVariantToggle` for a minimal unstyled toggle UI
- `LandingVariantRenderer` for swapping the whole landing-page component
- `getStoredVariant()` / `setStoredVariant()` helpers for persistence

## Quick Start

```tsx
import {
  createLandingRegistry,
  LandingPreferenceProvider,
  LandingVariantRenderer,
  LandingVariantToggle,
  type LandingRenderableVariant,
} from "@eikonstudio/variant";

function MinimalLanding({ headline }: { headline: string }) {
  return <section>{headline} Minimal landing</section>;
}

function BoldLanding({ headline }: { headline: string }) {
  return <section>{headline} Bold landing</section>;
}

const registry = createLandingRegistry([
  {
    id: "minimal",
    label: "Minimal",
    description: "Clean and simple",
    component: MinimalLanding,
  },
  {
    id: "bold",
    label: "Bold",
    description: "High contrast and punchy",
    component: BoldLanding,
  },
] as const satisfies readonly [
  LandingRenderableVariant<{ headline: string }>,
  LandingRenderableVariant<{ headline: string }>,
]);

export function LandingPage() {
  return (
    <LandingPreferenceProvider registry={registry} initialVariantId="minimal">
      <LandingVariantToggle />
      <LandingVariantRenderer componentProps={{ headline: "Welcome" }} />
    </LandingPreferenceProvider>
  );
}
```

## How it works

1. Create a registry with 2 or more variants.
2. Wrap your landing page area in `LandingPreferenceProvider`.
3. Render `LandingVariantToggle` so the user can choose a design.
4. Render `LandingVariantRenderer` to swap the full active landing component.
5. The selected variant id is saved to `localStorage` by default.

## Full-page variant switching

Use `LandingVariantRenderer` when each variant represents a different complete landing-page design:

```tsx
const registry = createLandingRegistry([
  { id: "classic", label: "Classic", component: ClassicLanding },
  { id: "modern", label: "Modern", component: ModernLanding },
  { id: "editorial", label: "Editorial", component: EditorialLanding },
] as const);

export function MarketingSite() {
  return (
    <LandingPreferenceProvider registry={registry}>
      <header>
        <h1>Choose your preferred design</h1>
        <LandingVariantToggle />
      </header>

      <main>
        <LandingVariantRenderer componentProps={{}} />
      </main>
    </LandingPreferenceProvider>
  );
}
```

When the active variant changes, the rendered landing component changes with it.

## Hooks

### `useLandingPreference()`

Use this when you want full access to the active variant, the full variant list, and the setter:

```tsx
import { useLandingPreference } from "@eikonstudio/variant";

function VariantBadge() {
  const { activeVariant, variants, setVariant } = useLandingPreference();

  return (
    <div>
      <p>Current: {activeVariant.label}</p>
      {variants.map((variant) => (
        <button key={variant.id} onClick={() => setVariant(variant.id)}>
          {variant.label}
        </button>
      ))}
    </div>
  );
}
```

### `useSetLandingPreference()`

Use this when you only need to change the variant:

```tsx
import { useSetLandingPreference } from "@eikonstudio/variant";

function ChooseBoldButton() {
  const setVariant = useSetLandingPreference<{
    id: "minimal" | "bold";
    label: string;
  }>();

  return <button onClick={() => setVariant("bold")}>Use bold design</button>;
}
```

## Persistence

By default, the package uses:

- storage key: `eikonstudio.variant.preference`
- storage adapter: browser `localStorage` when available

You can override both:

```tsx
<LandingPreferenceProvider
  registry={registry}
  storageKey="my-site.landing-variant"
  storage={window.localStorage}
>
  <LandingVariantRenderer componentProps={{}} />
</LandingPreferenceProvider>
```

You can also use the low-level storage helpers directly:

```ts
import {
  clearStoredVariant,
  getStoredVariant,
  setStoredVariant,
} from "@eikonstudio/variant";

const current = getStoredVariant({ registry });
setStoredVariant("modern", { registry });
clearStoredVariant({});
```

## SSR behavior

The package is SSR-safe:

- it does not read `window` during module evaluation
- it uses `initialVariantId` or the registry default during the initial render
- it upgrades to the persisted client-side value after mount when one exists

That makes it suitable for React apps that render on the server and then hydrate on the client.

## Development

```bash
cd packages/variant
bun run test
bun run lint
bun run build
```

## License

MIT
