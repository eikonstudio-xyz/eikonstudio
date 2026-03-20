import type {
  GenerateContentConfig,
  GenerateContentResponse,
  GenerateImagesResponse,
  GoogleSearch,
  SearchTypes,
} from "@google/genai";
import { GoogleGenAI } from "@google/genai";

import { NanoError } from "./errors";
import type {
  EditImageInput,
  GeminiGenerateImageOptions,
  GeminiImageModel,
  GenerateFromPromptInput,
  GenerateImageResult,
  ImagenGenerateImageOptions,
  ImagenModel,
  NanoClientOptions,
  NanoGeneratedImage,
  NanoGoogleSearchOptions,
  NanoImageInput,
  NanoImageModel,
  NanoProvider,
  NanoResultPart,
  NanoThinkingLevel,
} from "./types";

const DEFAULT_GEMINI_RESPONSE_MODALITIES = ["TEXT", "IMAGE"] as const;

export function isGeminiModel(model: string): model is GeminiImageModel {
  return model.startsWith("gemini-");
}

export function isImagenModel(model: string): model is ImagenModel {
  return model.startsWith("imagen-");
}

export function assertGeminiModel(model: NanoImageModel): asserts model is GeminiImageModel {
  if (!isGeminiModel(model)) {
    throw new NanoError(
      "UNSUPPORTED_MODEL",
      `Model "${model}" does not support Gemini image workflows.`,
    );
  }
}

export function getApiKey(options?: NanoClientOptions): string {
  const apiKey = options?.apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new NanoError(
      "MISSING_API_KEY",
      "Missing API key. Pass apiKey or set GEMINI_API_KEY.",
    );
  }

  return apiKey;
}

export function createGoogleGenAI(options?: NanoClientOptions): GoogleGenAI {
  return new GoogleGenAI({ apiKey: getApiKey(options) });
}

export function toBuffer(data: NanoImageInput["data"]): Buffer {
  if (Buffer.isBuffer(data)) {
    return data;
  }

  if (data instanceof Uint8Array) {
    return Buffer.from(data);
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }

  if (typeof data === "string") {
    const base64Data = data.startsWith("data:")
      ? data.slice(data.indexOf(",") + 1)
      : data;

    return Buffer.from(base64Data, "base64");
  }

  throw new NanoError("INVALID_RESPONSE", "Unsupported image input data type.");
}

export function toInlineDataPart(input: NanoImageInput) {
  return {
    inlineData: {
      data: toBuffer(input.data).toString("base64"),
      mimeType: input.mimeType,
    },
  };
}

export function toGeminiContents(
  input: EditImageInput | GenerateFromPromptInput | string,
): string | Array<{ inlineData: { data: string; mimeType: string } } | { text: string }> {
  if (typeof input === "string") {
    return input;
  }

  if ("images" in input) {
    if (input.images.length === 0) {
      throw new NanoError("INVALID_RESPONSE", "At least one input image is required.");
    }

    return [...input.images.map(toInlineDataPart), { text: input.prompt }];
  }

  return input.prompt;
}

function normalizeThinkingLevel(level: NanoThinkingLevel | undefined): "High" | "minimal" | undefined {
  if (!level) {
    return undefined;
  }

  if (level === "high" || level === "High") {
    return "High";
  }

  return "minimal";
}

function buildSearchTypes(
  googleSearch: boolean | NanoGoogleSearchOptions | undefined,
): SearchTypes | undefined {
  if (!googleSearch || googleSearch === true) {
    return undefined;
  }

  const searchTypes: SearchTypes = {};

  if (googleSearch.webSearch) {
    searchTypes.webSearch = {};
  }

  if (googleSearch.imageSearch) {
    searchTypes.imageSearch = {};
  }

  return Object.keys(searchTypes).length > 0 ? searchTypes : undefined;
}

function buildGoogleSearchTool(
  googleSearch: boolean | NanoGoogleSearchOptions | undefined,
): { googleSearch: GoogleSearch }[] | undefined {
  if (!googleSearch) {
    return undefined;
  }

  const searchTypes = buildSearchTypes(googleSearch);

  if (searchTypes) {
    return [
      {
        googleSearch: {
          searchTypes,
        },
      },
    ];
  }

  return [{ googleSearch: {} }];
}

export function buildGeminiConfig(
  options: GeminiGenerateImageOptions | undefined,
): GenerateContentConfig | undefined {
  if (!options) {
    return undefined;
  }

  const config: GenerateContentConfig = {
    ...options.config,
  };

  if (options.responseModalities && options.responseModalities.length > 0) {
    config.responseModalities = options.responseModalities;
  } else {
    config.responseModalities = [...DEFAULT_GEMINI_RESPONSE_MODALITIES];
  }

  if (options.aspectRatio || options.imageSize) {
    config.imageConfig = {
      aspectRatio: options.aspectRatio,
      imageSize: options.imageSize,
    };
  }

  const thinkingLevel = normalizeThinkingLevel(options.thinkingLevel);
  if (thinkingLevel || options.includeThoughts !== undefined) {
    config.thinkingConfig = {
      thinkingLevel,
      includeThoughts: options.includeThoughts,
    };
  }

  const googleSearchTools = buildGoogleSearchTool(options.googleSearch);
  if (googleSearchTools) {
    config.tools = [...(config.tools ?? []), ...googleSearchTools];
  }

  if (options.seed !== undefined) {
    config.seed = options.seed;
  }

  return config;
}

export function buildImagenConfig(options: ImagenGenerateImageOptions | undefined) {
  if (!options) {
    return undefined;
  }

  return {
    ...options.config,
    addWatermark: options.addWatermark,
    aspectRatio: options.aspectRatio,
    enhancePrompt: options.enhancePrompt,
    guidanceScale: options.guidanceScale,
    imageSize: options.imageSize,
    includeRaiReason: options.includeRaiReason,
    includeSafetyAttributes: options.includeSafetyAttributes,
    language: options.language,
    negativePrompt: options.negativePrompt,
    numberOfImages: options.numberOfImages,
    outputCompressionQuality: options.outputCompressionQuality,
    outputGcsUri: options.outputGcsUri,
    outputMimeType: options.outputMimeType,
    personGeneration: options.personGeneration,
    safetyFilterLevel: options.safetyFilterLevel,
    seed: options.seed,
  };
}

function toGeneratedImage(
  base64: string,
  mimeType = "image/png",
  thought?: boolean,
): NanoGeneratedImage {
  return {
    base64,
    buffer: Buffer.from(base64, "base64"),
    mimeType,
    thought,
  };
}

function pushImagePart(
  parts: NanoResultPart[],
  images: NanoGeneratedImage[],
  thoughts: GenerateImageResult["thoughts"],
  base64: string,
  mimeType: string,
  thought?: boolean,
) {
  const image = toGeneratedImage(base64, mimeType, thought);
  parts.push({ type: "image", image, thought });

  if (thought) {
    thoughts.push({ image });
    return;
  }

  images.push(image);
}

function pushTextPart(
  parts: NanoResultPart[],
  texts: string[],
  thoughts: GenerateImageResult["thoughts"],
  text: string,
  thought?: boolean,
) {
  parts.push({ type: "text", text, thought });

  if (thought) {
    thoughts.push({ text });
    return;
  }

  texts.push(text);
}

export function normalizeGeminiResponse(
  model: NanoImageModel,
  response: GenerateContentResponse,
): GenerateImageResult {
  const parts: NanoResultPart[] = [];
  const images: NanoGeneratedImage[] = [];
  const texts: string[] = [];
  const thoughts: GenerateImageResult["thoughts"] = [];

  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      const thought = part.thought === true;

      if (part.text) {
        pushTextPart(parts, texts, thoughts, part.text, thought);
      }

      if (part.inlineData?.data) {
        pushImagePart(
          parts,
          images,
          thoughts,
          part.inlineData.data,
          part.inlineData.mimeType ?? "image/png",
          thought,
        );
      }
    }
  }

  if (images.length === 0) {
    throw new NanoError(
      "NO_IMAGE_GENERATED",
      `Model "${model}" returned no final image output.`,
      { cause: response },
    );
  }

  const firstGroundedCandidate = response.candidates?.find(
    (candidate) => candidate.groundingMetadata !== undefined,
  );

  return {
    images,
    texts,
    thoughts,
    parts,
    text: texts.length > 0 ? texts.join("\n\n") : undefined,
    model,
    provider: "gemini",
    groundingMetadata: firstGroundedCandidate?.groundingMetadata as
      | Record<string, unknown>
      | undefined,
    raw: response,
  };
}

export function normalizeImagenResponse(
  model: NanoImageModel,
  response: GenerateImagesResponse,
): GenerateImageResult {
  const images =
    response.generatedImages
      ?.map((generatedImage) => {
        const base64 = generatedImage.image?.imageBytes;
        if (!base64) {
          return undefined;
        }

        return toGeneratedImage(base64, generatedImage.image?.mimeType ?? "image/png");
      })
      .filter((image): image is NanoGeneratedImage => image !== undefined) ?? [];

  if (images.length === 0) {
    throw new NanoError(
      "NO_IMAGE_GENERATED",
      `Model "${model}" returned no generated images.`,
      { cause: response },
    );
  }

  return {
    images,
    texts: [],
    thoughts: [],
    parts: images.map((image) => ({ type: "image", image })),
    text: undefined,
    model,
    provider: "imagen",
    groundingMetadata: undefined,
    raw: response,
  };
}

export function assertProviderSupportsImages(provider: NanoProvider, images: NanoGeneratedImage[]) {
  if (images.length === 0) {
    throw new NanoError(
      "NO_IMAGE_GENERATED",
      `${provider} returned an empty image response.`,
    );
  }
}
