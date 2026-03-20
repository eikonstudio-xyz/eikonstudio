import { createClient } from "./client";
import type {
  EditImageInput,
  GeminiGenerateImageOptions,
  GeminiImageModel,
  GenerateImageResult,
  ImagenGenerateImageOptions,
  ImagenModel,
  NanoImageChat,
} from "./types";

/**
 * Generate an image from a text prompt. Model prefix selects the API:
 *
 * - `gemini-*` → `generateContent` (native Gemini image)
 * - `imagen-*` → `generateImages` (Imagen)
 *
 * Each call constructs a short-lived {@linkcode NanoClient}. For many requests, use
 * {@linkcode createClient} once and call {@linkcode NanoClient.generateImage}.
 *
 * @param model - Gemini or Imagen model id
 * @param prompt - Natural-language image description
 * @param options - Merged into client options and branch-specific config (overload narrows by model)
 * @returns Normalized {@linkcode GenerateImageResult} with `images`, `parts`, and `raw`
 * @throws Failures surface as `NanoError` with a stable `code` (see exported `NanoErrorCode`).
 *
 * @example
 * ```ts
 * import { generateImage } from "@eikonstudio/nano";
 *
 * const result = await generateImage(
 *   "gemini-3.1-flash-image-preview",
 *   "A nano banana plated like fine dining",
 * );
 * ```
 */
export function generateImage(
  model: GeminiImageModel,
  prompt: string,
  options?: GeminiGenerateImageOptions,
): Promise<GenerateImageResult>;
export function generateImage(
  model: ImagenModel,
  prompt: string,
  options?: ImagenGenerateImageOptions,
): Promise<GenerateImageResult>;
export function generateImage(
  model: GeminiImageModel | ImagenModel,
  prompt: string,
  options?: GeminiGenerateImageOptions | ImagenGenerateImageOptions,
): Promise<GenerateImageResult> {
  return createClient(options).generateImage(model as never, prompt, options as never);
}

/**
 * Same as {@linkcode generateImage} but requires a `gemini-*` model for stricter typings.
 *
 * @param model - Gemini image model (e.g. `gemini-2.5-flash-image`)
 * @param prompt - Image description
 * @param options - {@linkcode GeminiGenerateImageOptions}: aspect ratio, image size, grounding,
 *   thinking, `responseModalities`, and optional {@linkcode GeminiSdkConfig}
 * @returns {@linkcode GenerateImageResult} with `provider: "gemini"`
 *
 * @example
 * ```ts
 * import { generateGeminiImage } from "@eikonstudio/nano";
 *
 * const result = await generateGeminiImage("gemini-2.5-flash-image", "A banana robot", {
 *   aspectRatio: "16:9",
 *   googleSearch: true,
 * });
 * ```
 */
export function generateGeminiImage(
  model: GeminiImageModel,
  prompt: string,
  options?: GeminiGenerateImageOptions,
): Promise<GenerateImageResult> {
  return createClient(options).generateImage(model, prompt, options);
}

/**
 * Same as {@linkcode generateImage} but requires an `imagen-*` model for stricter typings.
 *
 * @param model - Imagen model id
 * @param prompt - Image description
 * @param options - {@linkcode ImagenGenerateImageOptions}: batch size, negative prompt, output
 *   MIME type, safety, etc., plus optional {@linkcode ImagenSdkConfig}
 * @returns {@linkcode GenerateImageResult} with `provider: "imagen"`
 *
 * @example
 * ```ts
 * import { generateImagenImage } from "@eikonstudio/nano";
 *
 * const result = await generateImagenImage("imagen-4.0-generate-001", "A banana perfume ad", {
 *   numberOfImages: 2,
 *   negativePrompt: "blurry",
 * });
 * ```
 */
export function generateImagenImage(
  model: ImagenModel,
  prompt: string,
  options?: ImagenGenerateImageOptions,
): Promise<GenerateImageResult> {
  return createClient(options).generateImage(model, prompt, options);
}

/**
 * Send one or more reference images plus an instruction to a Gemini image model.
 *
 * @param model - Gemini image model
 * @param input - `images` (non-empty) and editing `prompt`
 * @param options - Same as {@linkcode generateGeminiImage}
 * @returns Normalized result; final pixels in `images`
 * @throws `NanoError` if the API returns no image or input is invalid
 *
 * @example
 * ```ts
 * import { editImage } from "@eikonstudio/nano";
 *
 * const result = await editImage("gemini-3.1-flash-image-preview", {
 *   images: [{ data: imageBuffer, mimeType: "image/png" }],
 *   prompt: "Turn this into a retro travel poster.",
 * });
 * ```
 */
export function editImage(
  model: GeminiImageModel,
  input: EditImageInput,
  options?: GeminiGenerateImageOptions,
): Promise<GenerateImageResult> {
  return createClient(options).editImage(model, input, options);
}

/**
 * Combine multiple reference images into one output (e.g. product + model). Same transport as
 * {@linkcode editImage}; naming reflects intent only.
 *
 * @param model - Gemini image model
 * @param input - Multiple `images` and a composition `prompt`
 * @param options - Gemini generation options
 *
 * @example
 * ```ts
 * import { composeImages } from "@eikonstudio/nano";
 *
 * const result = await composeImages("gemini-3.1-flash-image-preview", {
 *   images: [
 *     { data: dressBuffer, mimeType: "image/png" },
 *     { data: modelBuffer, mimeType: "image/png" },
 *   ],
 *   prompt: "Place the dress onto the model in a polished catalog shot.",
 * });
 * ```
 */
export function composeImages(
  model: GeminiImageModel,
  input: EditImageInput,
  options?: GeminiGenerateImageOptions,
): Promise<GenerateImageResult> {
  return createClient(options).composeImages(model, input, options);
}

/**
 * Start a multi-turn chat (`chats.create` + `sendMessage`) for iterative image generation or edits.
 *
 * @param model - Gemini image model
 * @param options - Session defaults (modalities, tools, `imageConfig`, thinking)
 * @returns {@linkcode NanoImageChat} with `send(input, options?)` per turn
 *
 * @remarks
 * Per-request `config` in `send()` does not inherit the chat's initial `config` in the SDK.
 * Repeat needed fields on each `send` when required.
 *
 * @example
 * ```ts
 * import { startImageChat } from "@eikonstudio/nano";
 *
 * const chat = startImageChat("gemini-3.1-flash-image-preview", {
 *   responseModalities: ["TEXT", "IMAGE"],
 *   googleSearch: { webSearch: true, imageSearch: true },
 * });
 *
 * await chat.send("Create an infographic about photosynthesis.");
 * ```
 */
export function startImageChat(
  model: GeminiImageModel,
  options?: GeminiGenerateImageOptions,
): NanoImageChat {
  return createClient(options).startImageChat(model, options);
}
