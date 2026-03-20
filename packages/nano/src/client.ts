import { GoogleGenAI } from "@google/genai";

import type {
  EditImageInput,
  GeminiGenerateImageOptions,
  GeminiImageModel,
  GenerateFromPromptInput,
  GenerateImageResult,
  ImagenGenerateImageOptions,
  ImagenModel,
  NanoClientOptions,
  NanoImageChat,
  NanoImageModel,
} from "./types";
import {
  assertGeminiModel,
  buildGeminiConfig,
  buildImagenConfig,
  createGoogleGenAI,
  isGeminiModel,
  isImagenModel,
  normalizeGeminiResponse,
  normalizeImagenResponse,
  toGeminiContents,
} from "./utils";
import { NanoError } from "./errors";

/**
 * Stateful client around `@google/genai` for image-focused workflows.
 *
 * Prefer a single instance when making many calls to avoid repeated client construction.
 * The underlying {@linkcode GoogleGenAI} instance is exposed as {@linkcode NanoClient.ai} for
 * advanced use cases not wrapped by this package.
 */
export class NanoClient {
  /** Direct SDK client; same API key resolution as constructor options. */
  readonly ai: GoogleGenAI;

  /**
   * @param options - Optional `apiKey`; falls back to `GEMINI_API_KEY` / `GOOGLE_API_KEY`
   * @throws {@linkcode NanoError} with code `MISSING_API_KEY` when no key is available
   */
  constructor(options: NanoClientOptions = {}) {
    this.ai = createGoogleGenAI(options);
  }

  /**
   * Generate an image from a text prompt.
   *
   * - Models starting with `gemini-` use `models.generateContent`.
   * - Models starting with `imagen-` use `models.generateImages`.
   *
   * @param model - Gemini or Imagen model id
   * @param prompt - Text description of the desired image
   * @param options - Branch-specific options (Gemini vs Imagen overloads)
   * @returns Normalized {@linkcode GenerateImageResult}
   * @throws {@linkcode NanoError} on missing key, unsupported model, or empty image response
   */
  generateImage(
    model: GeminiImageModel,
    prompt: string,
    options?: GeminiGenerateImageOptions,
  ): Promise<GenerateImageResult>;
  generateImage(
    model: ImagenModel,
    prompt: string,
    options?: ImagenGenerateImageOptions,
  ): Promise<GenerateImageResult>;
  async generateImage(
    model: NanoImageModel,
    prompt: string,
    options?: GeminiGenerateImageOptions | ImagenGenerateImageOptions,
  ): Promise<GenerateImageResult> {
    if (isGeminiModel(model)) {
      return this.generateGemini(
        model,
        { prompt },
        options as GeminiGenerateImageOptions | undefined,
      );
    }

    if (isImagenModel(model)) {
      const response = await this.ai.models.generateImages({
        model,
        prompt,
        config: buildImagenConfig(options as ImagenGenerateImageOptions | undefined),
      });

      return normalizeImagenResponse(model, response);
    }

    throw new NanoError("UNSUPPORTED_MODEL", `Unsupported model "${model}".`);
  }

  /**
   * Edit or transform one or more input images using a Gemini image model.
   *
   * @param model - Must be a `gemini-*` image-capable model
   * @param input - At least one image in `images` plus an instruction `prompt`
   * @param options - Gemini generation options (aspect ratio, grounding, thinking, etc.)
   */
  async editImage(
    model: GeminiImageModel,
    input: EditImageInput,
    options?: GeminiGenerateImageOptions,
  ): Promise<GenerateImageResult> {
    return this.generateGemini(model, input, options);
  }

  /**
   * Combine multiple reference images into a new scene (same API shape as {@linkcode editImage}).
   *
   * @param model - Must be a `gemini-*` image-capable model
   * @param input - Multiple `images` and a composition `prompt`
   * @param options - Gemini generation options
   */
  async composeImages(
    model: GeminiImageModel,
    input: EditImageInput,
    options?: GeminiGenerateImageOptions,
  ): Promise<GenerateImageResult> {
    return this.generateGemini(model, input, options);
  }

  /**
   * Create a multi-turn chat for iterative image work (recommended for editing in steps).
   *
   * @param model - Gemini image model id
   * @param options - Default config for the chat session (modalities, tools, imageConfig, etc.)
   * @returns Object with `send()` for each user turn
   *
   * @remarks
   * Each `send()` can pass `options` again; per the SDK, that per-request `config` does not
   * automatically inherit the chat-level `config`. Copy fields you need on each call.
   */
  startImageChat(model: GeminiImageModel, options?: GeminiGenerateImageOptions): NanoImageChat {
    const chat = this.ai.chats.create({
      model,
      config: buildGeminiConfig(options),
    });

    return {
      /**
       * @param input - Prompt string, `{ prompt }`, or `{ images, prompt }`
       * @param sendOptions - Per-message config (not merged from chat creation defaults)
       */
      send: async (
        input: EditImageInput | GenerateFromPromptInput | string,
        sendOptions?: GeminiGenerateImageOptions,
      ) => {
        const config = sendOptions ? buildGeminiConfig(sendOptions) : undefined;

        const response = await chat.sendMessage({
          message: toGeminiContents(input),
          config,
        });

        return normalizeGeminiResponse(model, response);
      },
    };
  }

  /** Internal: single `generateContent` call with normalized multimodal `contents`. */
  private async generateGemini(
    model: GeminiImageModel,
    input: EditImageInput | GenerateFromPromptInput | string,
    options?: GeminiGenerateImageOptions,
  ): Promise<GenerateImageResult> {
    assertGeminiModel(model);

    const response = await this.ai.models.generateContent({
      model,
      contents: toGeminiContents(input),
      config: buildGeminiConfig(options),
    });

    return normalizeGeminiResponse(model, response);
  }
}

/**
 * Factory for {@linkcode NanoClient} with the same options as the constructor.
 *
 * @param options - Optional client options (see {@linkcode NanoClientOptions})
 */
export function createClient(options?: NanoClientOptions): NanoClient {
  return new NanoClient(options);
}
