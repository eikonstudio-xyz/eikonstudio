import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";

import { createAiSdkImageTool } from "./ai-sdk";
import { NanoClient } from "./client";
import type { GenerateImageResult } from "./types";

const fakeResult: GenerateImageResult = {
  images: [
    {
      base64: Buffer.from("final-image").toString("base64"),
      buffer: Buffer.from("final-image"),
      mimeType: "image/png",
    },
  ],
  texts: ["Image complete"],
  thoughts: [
    {
      text: "Trying a brighter studio setup.",
    },
    {
      image: {
        base64: Buffer.from("thought-image").toString("base64"),
        buffer: Buffer.from("thought-image"),
        mimeType: "image/jpeg",
        thought: true,
      },
    },
  ],
  parts: [
    {
      type: "text",
      text: "Image complete",
    },
    {
      type: "image",
      image: {
        base64: Buffer.from("final-image").toString("base64"),
        buffer: Buffer.from("final-image"),
        mimeType: "image/png",
      },
    },
  ],
  text: "Image complete",
  model: "gemini-3.1-flash-image-preview",
  provider: "gemini",
  groundingMetadata: {
    source: "test",
  },
  raw: {} as never,
};

afterEach(() => {
  mock.restore();
});

describe("createAiSdkImageTool", () => {
  test("builds a prompt-only tool when a default model is configured", async () => {
    const generateSpy = spyOn(NanoClient.prototype, "generateImage").mockResolvedValue(fakeResult);

    const tool = createAiSdkImageTool({
      defaultModel: "gemini-3.1-flash-image-preview",
      generationOptions: {
        apiKey: "test-key",
        responseModalities: ["TEXT", "IMAGE"],
      },
      strict: true,
    });

    expect(tool.description).toContain("gemini-3.1-flash-image-preview");
    expect(tool.strict).toBe(true);
    expect(tool.inputSchema).toEqual({
      type: "object",
      additionalProperties: false,
      properties: {
        prompt: {
          type: "string",
          description: "Detailed natural-language description of the image to generate.",
          minLength: 1,
        },
      },
      required: ["prompt"],
    });

    const result = await tool.execute({ prompt: "A premium banana perfume ad." });

    expect(generateSpy).toHaveBeenCalledTimes(1);
    expect(generateSpy).toHaveBeenCalledWith(
      "gemini-3.1-flash-image-preview",
      "A premium banana perfume ad.",
      expect.objectContaining({
        apiKey: "test-key",
        responseModalities: ["TEXT", "IMAGE"],
      }),
    );
    expect(result).toEqual({
      images: [
        {
          base64: Buffer.from("final-image").toString("base64"),
          mimeType: "image/png",
          thought: undefined,
        },
      ],
      texts: ["Image complete"],
      thoughts: [
        {
          text: "Trying a brighter studio setup.",
          image: undefined,
        },
        {
          text: undefined,
          image: {
            base64: Buffer.from("thought-image").toString("base64"),
            mimeType: "image/jpeg",
            thought: true,
          },
        },
      ],
      parts: [
        {
          type: "text",
          text: "Image complete",
          thought: undefined,
        },
        {
          type: "image",
          image: {
            base64: Buffer.from("final-image").toString("base64"),
            mimeType: "image/png",
            thought: undefined,
          },
          thought: undefined,
        },
      ],
      text: "Image complete",
      model: "gemini-3.1-flash-image-preview",
      provider: "gemini",
      groundingMetadata: {
        source: "test",
      },
    });
    expect((result as Record<string, unknown>).raw).toBeUndefined();
  });

  test("requires model input when no default model is configured", async () => {
    const generateSpy = spyOn(NanoClient.prototype, "generateImage").mockResolvedValue(fakeResult);

    const tool = createAiSdkImageTool();

    expect(tool.inputSchema).toEqual({
      type: "object",
      additionalProperties: false,
      properties: {
        model: {
          type: "string",
          description:
            'Image model id starting with "gemini-" or "imagen-". Example: "gemini-3.1-flash-image-preview".',
          minLength: 1,
          pattern: "^(gemini|imagen)-.+",
        },
        prompt: {
          type: "string",
          description: "Detailed natural-language description of the image to generate.",
          minLength: 1,
        },
      },
      required: ["model", "prompt"],
    });

    await tool.execute({
      model: "imagen-4.0-generate-001",
      prompt: "A clean ecommerce shot of a futuristic banana blender.",
    });

    expect(generateSpy).toHaveBeenCalledTimes(1);
    expect(generateSpy).toHaveBeenCalledWith(
      "imagen-4.0-generate-001",
      "A clean ecommerce shot of a futuristic banana blender.",
      undefined,
    );
  });
});
