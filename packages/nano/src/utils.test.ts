import { describe, expect, test } from "bun:test";

import { NanoError } from "./errors";
import {
  buildGeminiConfig,
  buildImagenConfig,
  isGeminiModel,
  isImagenModel,
  normalizeGeminiResponse,
  normalizeImagenResponse,
  toBuffer,
  toGeminiContents,
} from "./utils";

describe("model guards", () => {
  test("detects gemini and imagen models", () => {
    expect(isGeminiModel("gemini-3.1-flash-image-preview")).toBe(true);
    expect(isGeminiModel("imagen-4.0-generate-001")).toBe(false);
    expect(isImagenModel("imagen-4.0-generate-001")).toBe(true);
    expect(isImagenModel("gemini-2.5-flash-image")).toBe(false);
  });
});

describe("toBuffer", () => {
  test("accepts binary input variants", () => {
    const fromBuffer = toBuffer(Buffer.from("nano"));
    const fromUint8 = toBuffer(new Uint8Array([110, 97, 110, 111]));
    const fromArrayBuffer = toBuffer(Uint8Array.from([110, 97, 110, 111]).buffer);
    const fromDataUrl = toBuffer("data:image/png;base64,bmFubw==");

    expect(fromBuffer.toString()).toBe("nano");
    expect(fromUint8.toString()).toBe("nano");
    expect(fromArrayBuffer.toString()).toBe("nano");
    expect(fromDataUrl.toString()).toBe("nano");
  });
});

describe("toGeminiContents", () => {
  test("keeps prompt-only inputs simple", () => {
    expect(toGeminiContents("hello world")).toBe("hello world");
    expect(toGeminiContents({ prompt: "hello" })).toBe("hello");
  });

  test("converts image edits to inlineData parts", () => {
    const contents = toGeminiContents({
      images: [{ data: Buffer.from("nano"), mimeType: "image/png" }],
      prompt: "Edit this",
    });

    expect(Array.isArray(contents)).toBe(true);
    expect(contents).toEqual([
      {
        inlineData: {
          data: Buffer.from("nano").toString("base64"),
          mimeType: "image/png",
        },
      },
      { text: "Edit this" },
    ]);
  });

  test("rejects empty edit inputs", () => {
    expect(() =>
      toGeminiContents({
        images: [],
        prompt: "Edit this",
      }),
    ).toThrow(NanoError);
  });
});

describe("buildGeminiConfig", () => {
  test("maps ergonomic options to SDK config", () => {
    const config = buildGeminiConfig({
      aspectRatio: "16:9",
      imageSize: "2K",
      includeThoughts: true,
      thinkingLevel: "high",
      googleSearch: { webSearch: true, imageSearch: true },
      seed: 42,
    });

    expect(config).toEqual({
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "2K",
      },
      responseModalities: ["TEXT", "IMAGE"],
      seed: 42,
      thinkingConfig: {
        includeThoughts: true,
        thinkingLevel: "High",
      },
      tools: [
        {
          googleSearch: {
            searchTypes: {
              webSearch: {},
              imageSearch: {},
            },
          },
        },
      ],
    });
  });

  test("uses image-only responses when requested", () => {
    const config = buildGeminiConfig({
      responseModalities: ["IMAGE"],
      googleSearch: true,
    });

    expect(config?.responseModalities).toEqual(["IMAGE"]);
    expect(config?.tools).toEqual([{ googleSearch: {} }]);
  });
});

describe("buildImagenConfig", () => {
  test("passes imagen options through cleanly", () => {
    const config = buildImagenConfig({
      aspectRatio: "16:9",
      numberOfImages: 2,
      negativePrompt: "blurry",
      outputMimeType: "image/jpeg",
      seed: 7,
    });

    expect(config).toMatchObject({
      aspectRatio: "16:9",
      numberOfImages: 2,
      negativePrompt: "blurry",
      outputMimeType: "image/jpeg",
      seed: 7,
    });
  });
});

describe("response normalization", () => {
  test("normalizes gemini text, image, thoughts, and grounding metadata", () => {
    const response = {
      candidates: [
        {
          groundingMetadata: {
            searchEntryPoint: {
              renderedContent: "<div>source</div>",
            },
          },
          content: {
            parts: [
              { text: "caption" },
              {
                thought: true,
                text: "draft reasoning",
              },
              {
                thought: true,
                inlineData: {
                  data: Buffer.from("thought-image").toString("base64"),
                  mimeType: "image/png",
                },
              },
              {
                inlineData: {
                  data: Buffer.from("final-image").toString("base64"),
                  mimeType: "image/png",
                },
              },
            ],
          },
        },
      ],
    };

    const result = normalizeGeminiResponse(
      "gemini-3.1-flash-image-preview",
      response as never,
    );

    expect(result.provider).toBe("gemini");
    expect(result.text).toBe("caption");
    expect(result.texts).toEqual(["caption"]);
    expect(result.images).toHaveLength(1);
    expect(result.images[0]?.buffer.toString()).toBe("final-image");
    expect(result.thoughts).toHaveLength(2);
    expect(result.parts).toHaveLength(4);
    expect(result.groundingMetadata).toEqual({
      searchEntryPoint: {
        renderedContent: "<div>source</div>",
      },
    });
  });

  test("throws when gemini returns no final images", () => {
    expect(() =>
      normalizeGeminiResponse(
        "gemini-3.1-flash-image-preview",
        {
          candidates: [
            {
              content: {
                parts: [{ text: "text only" }],
              },
            },
          ],
        } as never,
      ),
    ).toThrow(NanoError);
  });

  test("normalizes imagen image arrays", () => {
    const response = {
      generatedImages: [
        {
          image: {
            imageBytes: Buffer.from("imagen-output").toString("base64"),
            mimeType: "image/jpeg",
          },
        },
      ],
    };

    const result = normalizeImagenResponse("imagen-4.0-generate-001", response as never);

    expect(result.provider).toBe("imagen");
    expect(result.images).toHaveLength(1);
    expect(result.images[0]?.buffer.toString()).toBe("imagen-output");
    expect(result.images[0]?.mimeType).toBe("image/jpeg");
    expect(result.parts).toHaveLength(1);
  });
});
