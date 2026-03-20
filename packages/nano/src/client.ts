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

export class NanoClient {
  readonly ai: GoogleGenAI;

  constructor(options: NanoClientOptions = {}) {
    this.ai = createGoogleGenAI(options);
  }

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
      return this.generateGemini(model, { prompt }, options as GeminiGenerateImageOptions | undefined);
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

  async editImage(
    model: GeminiImageModel,
    input: EditImageInput,
    options?: GeminiGenerateImageOptions,
  ): Promise<GenerateImageResult> {
    return this.generateGemini(model, input, options);
  }

  async composeImages(
    model: GeminiImageModel,
    input: EditImageInput,
    options?: GeminiGenerateImageOptions,
  ): Promise<GenerateImageResult> {
    return this.generateGemini(model, input, options);
  }

  startImageChat(
    model: GeminiImageModel,
    options?: GeminiGenerateImageOptions,
  ): NanoImageChat {
    const chat = this.ai.chats.create({
      model,
      config: buildGeminiConfig(options),
    });

    return {
      send: async (
        input: EditImageInput | GenerateFromPromptInput | string,
        sendOptions?: GeminiGenerateImageOptions,
      ) => {
        const config = buildGeminiConfig(sendOptions);

        const response = await chat.sendMessage({
          message: toGeminiContents(input),
          config,
        });

        return normalizeGeminiResponse(model, response);
      },
    };
  }

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

export function createClient(options?: NanoClientOptions): NanoClient {
  return new NanoClient(options);
}
