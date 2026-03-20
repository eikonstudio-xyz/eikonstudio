# @eikonstudio/nano

Strongly typed image-generation helpers for Google's Gemini and Imagen APIs.

`@eikonstudio/nano` gives you a small API with good defaults while still exposing the important image-generation features from `@google/genai`: prompt generation, image editing, multi-image composition, chat-based iteration, grounding, and Imagen config passthrough.

## Installation

```bash
bun add @eikonstudio/nano
```

Set your API key in a `.env` file:

```ini
GEMINI_API_KEY=your-api-key
```

`@google/genai` is installed transitively by `@eikonstudio/nano`, so you do not need to add it separately.

## Quick Start

```ts
import { generateImage } from "@eikonstudio/nano";

const result = await generateImage(
  "gemini-2.5-flash-image",
  "A nano banana dish in a Michelin-star restaurant",
);

console.log(result.text);
console.log(result.images[0]?.mimeType);
console.log(result.images[0]?.buffer);
```

## AI SDK Tool

`createAiSdkImageTool()` returns a plain tool object that matches the AI SDK `tools` contract
(`description`, `inputSchema`, and `execute`), so you can pass it directly to `generateText()` or
`streamText()`.

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createAiSdkImageTool } from "@eikonstudio/nano";

const result = await generateText({
  model: openai("gpt-5"),
  prompt: "Create a product image tool call for a luxury banana perfume ad.",
  tools: {
    generateProductImage: createAiSdkImageTool({
      defaultModel: "gemini-3.1-flash-image-preview",
      generationOptions: {
        apiKey: process.env.GEMINI_API_KEY,
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  },
});
```

If you omit `defaultModel`, the tool input must include both `model` and `prompt`.

The tool result is JSON-safe:

- generated images are returned as base64 + MIME type
- `buffer` fields are removed
- the raw provider response is omitted

That makes it safer to forward through AI SDK multi-step tool calls.

## API

### `generateImage()`

Use the simplest entrypoint when you want the package to auto-detect Gemini vs Imagen from the model string.

```ts
import { generateImage } from "@eikonstudio/nano";

const result = await generateImage(
  "gemini-3.1-flash-image-preview",
  "A cinematic photo of a glowing banana-shaped observatory at night",
  {
    aspectRatio: "16:9",
    imageSize: "2K",
    responseModalities: ["TEXT", "IMAGE"],
  },
);
```

### `generateGeminiImage()`

Use the Gemini-specific helper when you want stronger autocomplete for Gemini-only options.

```ts
import { generateGeminiImage } from "@eikonstudio/nano";

const result = await generateGeminiImage(
  "gemini-3.1-flash-image-preview",
  "A kids cookbook infographic explaining photosynthesis",
  {
    googleSearch: { webSearch: true, imageSearch: true },
    includeThoughts: true,
    thinkingLevel: "high",
    responseModalities: ["TEXT", "IMAGE"],
  },
);

console.log(result.groundingMetadata);
```

### `generateImagenImage()`

Use Imagen when you want the dedicated `generateImages()` flow and Imagen-specific config.

```ts
import { generateImagenImage } from "@eikonstudio/nano";

const result = await generateImagenImage(
  "imagen-4.0-generate-001",
  "A premium product photo for banana perfume",
  {
    numberOfImages: 2,
    negativePrompt: "blurry, low contrast",
    outputMimeType: "image/jpeg",
  },
);
```

### `editImage()`

Edit an existing image with Gemini image models.

```ts
import { editImage } from "@eikonstudio/nano";
import { readFileSync } from "node:fs";

const result = await editImage("gemini-3.1-flash-image-preview", {
  images: [
    {
      data: readFileSync("./living-room.png"),
      mimeType: "image/png",
    },
  ],
  prompt: "Change only the blue sofa to a vintage brown leather sofa.",
});
```

### `composeImages()`

Combine multiple images into a new composition.

```ts
import { composeImages } from "@eikonstudio/nano";
import { readFileSync } from "node:fs";

const result = await composeImages("gemini-3.1-flash-image-preview", {
  images: [
    { data: readFileSync("./dress.png"), mimeType: "image/png" },
    { data: readFileSync("./model.png"), mimeType: "image/png" },
  ],
  prompt: "Place the dress onto the model in a polished ecommerce product shot.",
});
```

### `startImageChat()`

Start a multi-turn image workflow for iterative editing.

```ts
import { startImageChat } from "@eikonstudio/nano";

const chat = startImageChat("gemini-3.1-flash-image-preview", {
  responseModalities: ["TEXT", "IMAGE"],
  googleSearch: true,
});

await chat.send("Create an infographic about photosynthesis.");
const updated = await chat.send("Translate the infographic to Spanish.");
```

### `createClient()`

Reuse a configured client across calls.

```ts
import { createClient } from "@eikonstudio/nano";

const nano = createClient({ apiKey: process.env.GEMINI_API_KEY });
const result = await nano.generateImage(
  "gemini-2.5-flash-image",
  "A futuristic banana spacecraft",
);
```

### `createAiSdkImageTool()`

Create an AI SDK-compatible tool backed by Nano's `generateImage()` helper.

```ts
import { createAiSdkImageTool } from "@eikonstudio/nano";

const generateImageTool = createAiSdkImageTool({
  defaultModel: "imagen-4.0-generate-001",
  generationOptions: {
    apiKey: process.env.GEMINI_API_KEY,
    numberOfImages: 1,
  },
});
```

## Result Shape

All generation paths return a normalized `GenerateImageResult`:

```ts
type GenerateImageResult = {
  images: Array<{
    buffer: Buffer;
    base64: string;
    mimeType: string;
    thought?: boolean;
  }>;
  texts: string[];
  thoughts: Array<{
    text?: string;
    image?: {
      buffer: Buffer;
      base64: string;
      mimeType: string;
      thought?: boolean;
    };
  }>;
  parts: Array<
    | { type: "text"; text: string; thought?: boolean }
    | {
        type: "image";
        image: {
          buffer: Buffer;
          base64: string;
          mimeType: string;
          thought?: boolean;
        };
        thought?: boolean;
      }
  >;
  text?: string;
  model: string;
  provider: "gemini" | "imagen";
  groundingMetadata?: Record<string, unknown>;
  raw: unknown;
};
```

## Real API Smoke Test

The package includes a live integration test that can hit the real API.

Create `packages/nano/.env.test`:

```ini
GEMINI_API_KEY=your-api-key
NANO_LIVE_TEST=1
```

Then run:

```bash
cd packages/nano
bun run test:live
```

Optional output file:

```ini
GEMINI_API_KEY=your-api-key
NANO_LIVE_TEST=1
NANO_LIVE_TEST_OUTPUT=./tmp/nano-live.png
```

Bun automatically loads `.env` files. For tests, prefer `.env.test`.
Note: Bun does not load `.env.local` when `NODE_ENV=test`.

The live test is skipped unless `NANO_LIVE_TEST=1` is set.

## Development

```bash
cd packages/nano
bun test
bun run lint
bun run build
```

## License

MIT
