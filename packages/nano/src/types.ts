import type {
  GenerateContentConfig,
  GenerateContentResponse,
  GenerateImagesConfig,
  GenerateImagesResponse,
} from "@google/genai";

/**
 * Branded string for a Gemini model id used for native image generation (`generateContent`).
 * Examples: `gemini-2.5-flash-image`, `gemini-3.1-flash-image-preview`.
 */
export type GeminiImageModel = `gemini-${string}`;

/**
 * Branded string for an Imagen model id used with `generateImages`.
 * Examples: `imagen-4.0-generate-001`.
 */
export type ImagenModel = `imagen-${string}`;

/** Union of supported model families for {@linkcode generateImage}. */
export type NanoImageModel = GeminiImageModel | ImagenModel;

/** Which backend produced the result after normalization. */
export type NanoProvider = "gemini" | "imagen";

/**
 * Output modalities requested for Gemini image responses.
 * Maps to `GenerateContentConfig.responseModalities` in `@google/genai`.
 */
export type NanoResponseModality = "TEXT" | "IMAGE";

/**
 * Thinking depth for Gemini 3.x image models.
 * Values are normalized internally; both casings are accepted for DX.
 */
export type NanoThinkingLevel = "minimal" | "high" | "Minimal" | "High";

/**
 * Stable error codes thrown by {@linkcode NanoError}.
 *
 * - `MISSING_API_KEY` — no key in options or `GEMINI_API_KEY` / `GOOGLE_API_KEY`
 * - `UNSUPPORTED_MODEL` — model string does not match Gemini or Imagen prefixes
 * - `NO_IMAGE_GENERATED` — API returned no usable image bytes
 * - `INVALID_RESPONSE` — malformed input or unexpected response shape
 */
export type NanoErrorCode =
  | "MISSING_API_KEY"
  | "UNSUPPORTED_MODEL"
  | "NO_IMAGE_GENERATED"
  | "INVALID_RESPONSE";

/**
 * Passthrough for advanced Gemini `generateContent` fields.
 * Omits fields that this package sets from ergonomic options (`imageConfig`, `thinkingConfig`,
 * `responseModalities`, `tools`) so you can merge `config` without collisions.
 */
export type GeminiSdkConfig = Omit<
  GenerateContentConfig,
  "imageConfig" | "thinkingConfig" | "responseModalities" | "tools"
>;

/**
 * Passthrough for advanced Imagen `generateImages` fields.
 * Omits fields exposed as top-level options on {@linkcode ImagenGenerateImageOptions}.
 */
export type ImagenSdkConfig = Omit<
  GenerateImagesConfig,
  | "addWatermark"
  | "aspectRatio"
  | "enhancePrompt"
  | "guidanceScale"
  | "imageSize"
  | "includeRaiReason"
  | "includeSafetyAttributes"
  | "language"
  | "negativePrompt"
  | "numberOfImages"
  | "outputCompressionQuality"
  | "outputGcsUri"
  | "outputMimeType"
  | "personGeneration"
  | "safetyFilterLevel"
  | "seed"
>;

/** Untyped union of raw SDK responses attached to {@linkcode GenerateImageResult.raw}. */
export type NanoRawResponse = GenerateContentResponse | GenerateImagesResponse;

/** Options shared by {@linkcode NanoClient} and standalone helpers. */
export interface NanoClientOptions {
  /**
   * Google AI Studio / Gemini API key.
   * If omitted, reads `process.env.GEMINI_API_KEY` or `process.env.GOOGLE_API_KEY`.
   */
  apiKey?: string;
}

/**
 * Fine-grained Google Search grounding for Gemini image calls.
 * When both are omitted but `googleSearch` is an object, behavior follows SDK defaults.
 */
export interface NanoGoogleSearchOptions {
  /** Enable standard web search grounding. */
  webSearch?: boolean;
  /** Enable image search grounding (Gemini 3.1 Flash Image and compatible models). */
  imageSearch?: boolean;
}

/** Base options for any image generation call. */
export interface BaseGenerateImageOptions extends NanoClientOptions {
  /** Optional reproducibility seed where the underlying API supports it. */
  seed?: number;
}

/**
 * Ergonomic options for Gemini native image generation.
 *
 * Top-level fields are mapped to `GenerateContentConfig` (e.g. `imageConfig`, `thinkingConfig`,
 * `tools`). Use {@linkcode GeminiSdkConfig} for any other generation parameters.
 */
export interface GeminiGenerateImageOptions extends BaseGenerateImageOptions {
  /**
   * Output aspect ratio; forwarded to `imageConfig.aspectRatio`.
   * Supported values depend on the model (see Gemini image generation docs).
   */
  aspectRatio?:
    | "1:1"
    | "1:4"
    | "1:8"
    | "2:3"
    | "3:2"
    | "3:4"
    | "4:1"
    | "4:3"
    | "4:5"
    | "5:4"
    | "8:1"
    | "9:16"
    | "16:9"
    | "21:9";
  /** Resolution tier for Gemini 3.x image models (`imageConfig.imageSize`). Use uppercase K. */
  imageSize?: "512" | "1K" | "2K" | "4K";
  /**
   * Which modalities the model may return. Defaults to `["TEXT","IMAGE"]` when omitted.
   * Use `["IMAGE"]` for image-only responses.
   */
  responseModalities?: NanoResponseModality[];
  /** When supported, include thought content in the response stream. */
  includeThoughts?: boolean;
  /** Thinking depth for compatible Gemini 3.x image models. */
  thinkingLevel?: NanoThinkingLevel;
  /**
   * Enable Google Search grounding. `true` adds a default search tool; pass an object to pick
   * `webSearch` and/or `imageSearch`.
   */
  googleSearch?: boolean | NanoGoogleSearchOptions;
  /**
   * Additional `generateContent` config merged after ergonomic fields.
   * Cannot override `imageConfig`, `thinkingConfig`, `responseModalities`, or `tools` (use
   * top-level options instead).
   */
  config?: GeminiSdkConfig;
}

/**
 * Ergonomic options for Imagen `generateImages`.
 *
 * Top-level fields mirror `GenerateImagesConfig`. Use {@linkcode ImagenSdkConfig} for
 * pass-through fields not duplicated here.
 */
export interface ImagenGenerateImageOptions extends BaseGenerateImageOptions {
  addWatermark?: GenerateImagesConfig["addWatermark"];
  aspectRatio?: GenerateImagesConfig["aspectRatio"];
  enhancePrompt?: GenerateImagesConfig["enhancePrompt"];
  guidanceScale?: GenerateImagesConfig["guidanceScale"];
  imageSize?: GenerateImagesConfig["imageSize"];
  includeRaiReason?: GenerateImagesConfig["includeRaiReason"];
  includeSafetyAttributes?: GenerateImagesConfig["includeSafetyAttributes"];
  language?: GenerateImagesConfig["language"];
  negativePrompt?: GenerateImagesConfig["negativePrompt"];
  numberOfImages?: GenerateImagesConfig["numberOfImages"];
  outputCompressionQuality?: GenerateImagesConfig["outputCompressionQuality"];
  outputGcsUri?: GenerateImagesConfig["outputGcsUri"];
  outputMimeType?: GenerateImagesConfig["outputMimeType"];
  personGeneration?: GenerateImagesConfig["personGeneration"];
  safetyFilterLevel?: GenerateImagesConfig["safetyFilterLevel"];
  /** Additional Imagen config merged after top-level options. */
  config?: ImagenSdkConfig;
}

/**
 * One input image for editing or composition, sent as inline base64 to the API.
 *
 * - `data` as `string`: raw base64, or a `data:image/...;base64,...` data URL
 * - Binary types: encoded to base64 for the request
 */
export interface NanoImageInput {
  data: ArrayBuffer | Buffer | Uint8Array | string;
  /** MIME type of the image, e.g. `image/png`, `image/jpeg`. */
  mimeType: string;
}

/** Text-only user turn (equivalent to passing a string prompt). */
export interface GenerateFromPromptInput {
  prompt: string;
}

/**
 * Multimodal user turn: one or more reference images plus an instruction prompt.
 * Maps to `contents` parts for `generateContent`.
 */
export interface EditImageInput {
  /** Reference images; at least one required for edit/compose flows. */
  images: NanoImageInput[];
  /** Instruction describing the desired change or composition. */
  prompt: string;
}

/** A single decoded image from the model, with optional thought marker for Gemini 3.x. */
export interface NanoGeneratedImage {
  /** Decoded pixel bytes suitable for `fs.writeFile` or HTTP responses. */
  buffer: Buffer;
  /** Base64 payload as returned or derived from the API. */
  base64: string;
  /** Declared MIME type, e.g. `image/png`. */
  mimeType: string;
  /** When true, this image was part of the model's thinking stream (not the final asset). */
  thought?: boolean;
}

/** Normalized text segment in order of appearance. */
export interface NanoTextPart {
  type: "text";
  text: string;
  /** True if this text belonged to a thought part. */
  thought?: boolean;
}

/** Normalized image segment in order of appearance. */
export interface NanoImagePart {
  type: "image";
  image: NanoGeneratedImage;
  thought?: boolean;
}

/** Discriminated union of normalized response segments. */
export type NanoResultPart = NanoTextPart | NanoImagePart;

/** Aggregated thought content (text and/or image) for debugging or UI. */
export interface NanoThought {
  image?: NanoGeneratedImage;
  text?: string;
}

/**
 * Normalized result for both Gemini and Imagen paths.
 *
 * - `images` — final (non-thought) images only
 * - `thoughts` — optional reasoning / draft content from Gemini 3.x when exposed
 * - `parts` — full ordered multimodal stream for advanced consumers
 * - `raw` — original SDK response for escape hatches
 */
export interface GenerateImageResult {
  /** Final output images (excludes thought-only images). */
  images: NanoGeneratedImage[];
  /** Non-thought text segments, in order. */
  texts: string[];
  /** Thought-associated snippets when the API returns them. */
  thoughts: NanoThought[];
  /** Full ordered list of text and image parts. */
  parts: NanoResultPart[];
  /** Convenience: all `texts` joined with double newlines, if any. */
  text?: string;
  model: NanoImageModel;
  provider: NanoProvider;
  /** First candidate's grounding metadata when present (e.g. search entry point HTML). */
  groundingMetadata?: Record<string, unknown>;
  raw: NanoRawResponse;
}

/**
 * Handle returned by {@linkcode NanoClient.startImageChat} / {@linkcode startImageChat}.
 *
 * @remarks
 * Per the SDK, `sendMessage` request `config` does not inherit the chat's default config.
 * Re-pass options on each `send()` when you need the same modalities, tools, or image config.
 */
export interface NanoImageChat {
  /**
   * Send a text prompt, prompt object, or images + prompt in a chat turn.
   *
   * @param input - String prompt, `{ prompt }`, or `{ images, prompt }` for multimodal turns
   * @param options - Per-request Gemini options (merged into `sendMessage` config only)
   */
  send(
    input: EditImageInput | GenerateFromPromptInput | string,
    options?: GeminiGenerateImageOptions,
  ): Promise<GenerateImageResult>;
}
