import { createClient } from "./client";
import { NanoError } from "./errors";
import type {
  GenerateImageResult,
  GeminiGenerateImageOptions,
  ImagenGenerateImageOptions,
  NanoImageModel,
  NanoProvider,
} from "./types";

interface JsonSchemaString {
  type: "string";
  description?: string;
  minLength?: number;
  pattern?: string;
}

interface JsonSchemaObject {
  type: "object";
  description?: string;
  additionalProperties?: boolean;
  properties: Record<string, JsonSchemaString>;
  required?: string[];
}

const PROMPT_SCHEMA: JsonSchemaString = {
  type: "string",
  description: "Detailed natural-language description of the image to generate.",
  minLength: 1,
};

const MODEL_SCHEMA: JsonSchemaString = {
  type: "string",
  description:
    'Image model id starting with "gemini-" or "imagen-". Example: "gemini-3.1-flash-image-preview".',
  minLength: 1,
  pattern: "^(gemini|imagen)-.+",
};

/**
 * JSON-safe image object for AI SDK tool results.
 *
 * Buffers and raw SDK responses are intentionally removed so the result can move through AI SDK
 * tool pipelines and multi-step calls without binary-only fields.
 */
export interface NanoAiSdkGeneratedImage {
  /** Base64 payload for the generated image. */
  base64: string;
  /** MIME type such as `image/png`. */
  mimeType: string;
  /** True when this image was emitted as part of model thinking rather than the final output. */
  thought?: boolean;
}

/** JSON-safe text segment in the same order returned by Nano. */
export interface NanoAiSdkTextPart {
  type: "text";
  text: string;
  thought?: boolean;
}

/** JSON-safe image segment in the same order returned by Nano. */
export interface NanoAiSdkImagePart {
  type: "image";
  image: NanoAiSdkGeneratedImage;
  thought?: boolean;
}

/** Ordered multimodal output from the Nano AI SDK tool result. */
export type NanoAiSdkResultPart = NanoAiSdkTextPart | NanoAiSdkImagePart;

/** JSON-safe thought content in the AI SDK tool result. */
export interface NanoAiSdkThought {
  image?: NanoAiSdkGeneratedImage;
  text?: string;
}

/**
 * Serializable version of {@linkcode GenerateImageResult} for AI SDK tool execution.
 *
 * This mirrors Nano's normalized response shape, but excludes:
 * - `buffer` fields, because tool results should remain JSON-safe
 * - `raw`, because SDK responses are often large and provider-specific
 */
export interface NanoAiSdkGenerateImageResult {
  images: NanoAiSdkGeneratedImage[];
  texts: string[];
  thoughts: NanoAiSdkThought[];
  parts: NanoAiSdkResultPart[];
  text?: string;
  model: NanoImageModel;
  provider: NanoProvider;
  groundingMetadata?: Record<string, unknown>;
}

/** Tool input when the caller provides the model on each invocation. */
export interface NanoAiSdkGenerateImageInput {
  model: NanoImageModel;
  prompt: string;
}

/** Tool input when a default model is configured up front. */
export interface NanoAiSdkPromptInput {
  prompt: string;
}

/** Minimal AI SDK-compatible tool shape consumed by `generateText` / `streamText`. */
export interface NanoAiSdkTool<INPUT, RESULT> {
  description: string;
  inputSchema: JsonSchemaObject;
  execute: (input: INPUT) => Promise<RESULT>;
  strict?: boolean;
}

/** Shared options for creating a Nano-backed AI SDK tool. */
export interface CreateAiSdkImageToolOptions {
  /**
   * Optional default model for the tool.
   *
   * When provided, the tool input schema only requires `prompt`. When omitted, callers must send
   * both `model` and `prompt` in the tool input.
   */
  defaultModel?: NanoImageModel;
  /** Override the default tool description shown to the model. */
  description?: string;
  /**
   * Options forwarded to {@linkcode NanoClient.generateImage} on every tool execution.
   *
   * Use this to set `apiKey`, Gemini-specific options, or Imagen-specific options once when you
   * create the tool.
   */
  generationOptions?: GeminiGenerateImageOptions | ImagenGenerateImageOptions;
  /** Forwarded to AI SDK providers that support strict tool calling. */
  strict?: boolean;
}

/** Tool factory options where the model is fixed up front. */
export interface CreateAiSdkImageToolWithDefaultModelOptions extends CreateAiSdkImageToolOptions {
  defaultModel: NanoImageModel;
}

function buildInputSchema(defaultModel: NanoImageModel | undefined): JsonSchemaObject {
  if (defaultModel) {
    return {
      type: "object",
      additionalProperties: false,
      properties: {
        prompt: PROMPT_SCHEMA,
      },
      required: ["prompt"],
    };
  }

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      model: MODEL_SCHEMA,
      prompt: PROMPT_SCHEMA,
    },
    required: ["model", "prompt"],
  };
}

function buildDescription(defaultModel: NanoImageModel | undefined): string {
  if (defaultModel) {
    return `Generate an image with @eikonstudio/nano using the ${defaultModel} model. Return base64-encoded images and any accompanying text output.`;
  }

  return 'Generate an image with @eikonstudio/nano. The input must include a model id that starts with "gemini-" or "imagen-" plus a detailed prompt. Return base64-encoded images and any accompanying text output.';
}

function serializeImage(image: GenerateImageResult["images"][number]): NanoAiSdkGeneratedImage {
  return {
    base64: image.base64,
    mimeType: image.mimeType,
    thought: image.thought,
  };
}

function serializeResult(result: GenerateImageResult): NanoAiSdkGenerateImageResult {
  return {
    images: result.images.map(serializeImage),
    texts: [...result.texts],
    thoughts: result.thoughts.map((thought) => ({
      image: thought.image ? serializeImage(thought.image) : undefined,
      text: thought.text,
    })),
    parts: result.parts.map((part) =>
      part.type === "text"
        ? {
            type: "text",
            text: part.text,
            thought: part.thought,
          }
        : {
            type: "image",
            image: serializeImage(part.image),
            thought: part.thought,
          },
    ),
    text: result.text,
    model: result.model,
    provider: result.provider,
    groundingMetadata: result.groundingMetadata,
  };
}

/**
 * Create a plain AI SDK tool object backed by {@linkcode @eikonstudio/nano}'s `generateImage`.
 *
 * The returned value follows the AI SDK tools contract (`description`, `inputSchema`, `execute`)
 * so it can be passed directly to `generateText()` / `streamText()` without importing `tool()`.
 */
export function createAiSdkImageTool(
  options: CreateAiSdkImageToolWithDefaultModelOptions,
): NanoAiSdkTool<NanoAiSdkPromptInput, NanoAiSdkGenerateImageResult>;
export function createAiSdkImageTool(
  options?: CreateAiSdkImageToolOptions,
): NanoAiSdkTool<NanoAiSdkGenerateImageInput, NanoAiSdkGenerateImageResult>;
export function createAiSdkImageTool(
  options: CreateAiSdkImageToolOptions = {},
):
  | NanoAiSdkTool<NanoAiSdkPromptInput, NanoAiSdkGenerateImageResult>
  | NanoAiSdkTool<NanoAiSdkGenerateImageInput, NanoAiSdkGenerateImageResult> {
  const description = options.description ?? buildDescription(options.defaultModel);
  const inputSchema = buildInputSchema(options.defaultModel);

  return {
    description,
    inputSchema,
    strict: options.strict,
    execute: async (input: NanoAiSdkPromptInput | NanoAiSdkGenerateImageInput) => {
      const model = options.defaultModel ?? ("model" in input ? input.model : undefined);

      if (!model) {
        throw new NanoError(
          "UNSUPPORTED_MODEL",
          "Missing model. Pass defaultModel when creating the tool or include model in the tool input.",
        );
      }

      const result = await createClient(options.generationOptions).generateImage(
        model as never,
        input.prompt,
        options.generationOptions as never,
      );

      return serializeResult(result);
    },
  };
}
