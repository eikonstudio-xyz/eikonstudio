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
 * Generate an image from a prompt with either a Gemini image model or an Imagen model.
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
 * Generate an image with a Gemini image model and Gemini-specific options.
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
 * Generate an image with an Imagen model and Imagen-specific options.
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
 * Edit an existing image with a Gemini image model.
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
 * Compose a new image from multiple input images with a Gemini image model.
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
 * Start a multi-turn image chat session for iterative editing and grounded image workflows.
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
