/**
 * @packageDocumentation
 * Strongly typed helpers for Gemini native image generation and Imagen, built on `@google/genai`.
 *
 * **Entry points**
 * - {@linkcode generateImage} — one-shot prompt, auto-routes by model prefix
 * - {@linkcode generateGeminiImage} / {@linkcode generateImagenImage} — narrowed overloads
 * - {@linkcode editImage} / {@linkcode composeImages} — multimodal `generateContent`
 * - {@linkcode startImageChat} — multi-turn sessions
 * - {@linkcode createAiSdkImageTool} — AI SDK-compatible tool object for image generation
 * - {@linkcode createClient} / {@linkcode NanoClient} — reuse one SDK client
 *
 * **Errors** — `NanoError` with exported `NanoErrorCode`
 *
 * **Environment** — set `GEMINI_API_KEY` or pass `apiKey` in options.
 */
export { NanoClient, createClient } from "./client";
export { createAiSdkImageTool } from "./ai-sdk";
export { NanoError } from "./errors";
export {
  composeImages,
  editImage,
  generateGeminiImage,
  generateImage,
  generateImagenImage,
  startImageChat,
} from "./generate";
export type {
  CreateAiSdkImageToolOptions,
  CreateAiSdkImageToolWithDefaultModelOptions,
  NanoAiSdkGenerateImageInput,
  NanoAiSdkGenerateImageResult,
  NanoAiSdkGeneratedImage,
  NanoAiSdkImagePart,
  NanoAiSdkPromptInput,
  NanoAiSdkResultPart,
  NanoAiSdkTextPart,
  NanoAiSdkThought,
  NanoAiSdkTool,
} from "./ai-sdk";
export type {
  BaseGenerateImageOptions,
  EditImageInput,
  GeminiGenerateImageOptions,
  GeminiImageModel,
  GeminiSdkConfig,
  GenerateFromPromptInput,
  GenerateImageResult,
  ImagenGenerateImageOptions,
  ImagenModel,
  ImagenSdkConfig,
  NanoClientOptions,
  NanoErrorCode,
  NanoGeneratedImage,
  NanoGoogleSearchOptions,
  NanoImageChat,
  NanoImageInput,
  NanoImageModel,
  NanoProvider,
  NanoRawResponse,
  NanoResponseModality,
  NanoResultPart,
  NanoThought,
  NanoThinkingLevel,
} from "./types";
