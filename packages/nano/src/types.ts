import type {
  GenerateContentConfig,
  GenerateContentResponse,
  GenerateImagesConfig,
  GenerateImagesResponse,
} from "@google/genai";

export type GeminiImageModel = `gemini-${string}`;
export type ImagenModel = `imagen-${string}`;
export type NanoImageModel = GeminiImageModel | ImagenModel;

export type NanoProvider = "gemini" | "imagen";
export type NanoResponseModality = "TEXT" | "IMAGE";
export type NanoThinkingLevel = "minimal" | "high" | "Minimal" | "High";
export type NanoErrorCode =
  | "MISSING_API_KEY"
  | "UNSUPPORTED_MODEL"
  | "NO_IMAGE_GENERATED"
  | "INVALID_RESPONSE";

export type GeminiSdkConfig = Omit<
  GenerateContentConfig,
  "imageConfig" | "thinkingConfig" | "responseModalities" | "tools"
>;

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

export type NanoRawResponse = GenerateContentResponse | GenerateImagesResponse;

export interface NanoClientOptions {
  apiKey?: string;
}

export interface NanoGoogleSearchOptions {
  webSearch?: boolean;
  imageSearch?: boolean;
}

export interface BaseGenerateImageOptions extends NanoClientOptions {
  seed?: number;
}

export interface GeminiGenerateImageOptions extends BaseGenerateImageOptions {
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
  imageSize?: "512" | "1K" | "2K" | "4K";
  responseModalities?: NanoResponseModality[];
  includeThoughts?: boolean;
  thinkingLevel?: NanoThinkingLevel;
  googleSearch?: boolean | NanoGoogleSearchOptions;
  config?: GeminiSdkConfig;
}

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
  config?: ImagenSdkConfig;
}

export interface NanoImageInput {
  data: ArrayBuffer | Buffer | Uint8Array | string;
  mimeType: string;
}

export interface GenerateFromPromptInput {
  prompt: string;
}

export interface EditImageInput {
  images: NanoImageInput[];
  prompt: string;
}

export interface NanoGeneratedImage {
  buffer: Buffer;
  base64: string;
  mimeType: string;
  thought?: boolean;
}

export interface NanoTextPart {
  type: "text";
  text: string;
  thought?: boolean;
}

export interface NanoImagePart {
  type: "image";
  image: NanoGeneratedImage;
  thought?: boolean;
}

export type NanoResultPart = NanoTextPart | NanoImagePart;

export interface NanoThought {
  image?: NanoGeneratedImage;
  text?: string;
}

export interface GenerateImageResult {
  images: NanoGeneratedImage[];
  texts: string[];
  thoughts: NanoThought[];
  parts: NanoResultPart[];
  text?: string;
  model: NanoImageModel;
  provider: NanoProvider;
  groundingMetadata?: Record<string, unknown>;
  raw: NanoRawResponse;
}

export interface NanoImageChat {
  send(
    input: EditImageInput | GenerateFromPromptInput | string,
    options?: GeminiGenerateImageOptions,
  ): Promise<GenerateImageResult>;
}
