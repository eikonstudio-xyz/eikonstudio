import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";

import { NanoClient } from "./client";
import {
  composeImages,
  editImage,
  generateGeminiImage,
  generateImage,
  generateImagenImage,
  startImageChat,
} from "./generate";
import type { GenerateImageResult, NanoImageChat } from "./types";

const fakeResult: GenerateImageResult = {
  images: [
    {
      base64: Buffer.from("final-image").toString("base64"),
      buffer: Buffer.from("final-image"),
      mimeType: "image/png",
    },
  ],
  texts: ["done"],
  thoughts: [],
  parts: [
    {
      type: "text",
      text: "done",
    },
  ],
  text: "done",
  model: "gemini-3.1-flash-image-preview",
  provider: "gemini",
  raw: {} as never,
};

afterEach(() => {
  mock.restore();
});

describe("public helper delegation", () => {
  test("generateImage delegates to NanoClient.generateImage", async () => {
    const spy = spyOn(NanoClient.prototype, "generateImage").mockResolvedValue(fakeResult);

    const result = await generateImage("gemini-3.1-flash-image-preview", "hello", {
      apiKey: "test-key",
    });

    expect(result).toBe(fakeResult);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      "gemini-3.1-flash-image-preview",
      "hello",
      expect.objectContaining({ apiKey: "test-key" }),
    );
  });

  test("model-specific helpers preserve model-specific call shapes", async () => {
    const generateSpy = spyOn(NanoClient.prototype, "generateImage").mockResolvedValue(fakeResult);

    await generateGeminiImage("gemini-2.5-flash-image", "sunset", {
      apiKey: "test-key",
      aspectRatio: "16:9",
    });
    await generateImagenImage("imagen-4.0-generate-001", "poster", {
      apiKey: "test-key",
      numberOfImages: 2,
    });

    expect(generateSpy).toHaveBeenCalledTimes(2);
    expect(generateSpy.mock.calls[0]).toEqual([
      "gemini-2.5-flash-image",
      "sunset",
      expect.objectContaining({ aspectRatio: "16:9", apiKey: "test-key" }),
    ]);
    expect(generateSpy.mock.calls[1]).toEqual([
      "imagen-4.0-generate-001",
      "poster",
      expect.objectContaining({ numberOfImages: 2, apiKey: "test-key" }),
    ]);
  });

  test("edit and compose delegate to the matching client methods", async () => {
    const editSpy = spyOn(NanoClient.prototype, "editImage").mockResolvedValue(fakeResult);
    const composeSpy = spyOn(NanoClient.prototype, "composeImages").mockResolvedValue(fakeResult);

    const input = {
      images: [{ data: Buffer.from("image"), mimeType: "image/png" }],
      prompt: "make it better",
    };

    await editImage("gemini-3.1-flash-image-preview", input, {
      apiKey: "test-key",
    });
    await composeImages("gemini-3.1-flash-image-preview", input, {
      apiKey: "test-key",
    });

    expect(editSpy).toHaveBeenCalledTimes(1);
    expect(composeSpy).toHaveBeenCalledTimes(1);
    expect(editSpy).toHaveBeenCalledWith(
      "gemini-3.1-flash-image-preview",
      input,
      expect.objectContaining({ apiKey: "test-key" }),
    );
    expect(composeSpy).toHaveBeenCalledWith(
      "gemini-3.1-flash-image-preview",
      input,
      expect.objectContaining({ apiKey: "test-key" }),
    );
  });

  test("startImageChat delegates to NanoClient.startImageChat", () => {
    const fakeChat: NanoImageChat = {
      send: mock(async () => fakeResult),
    };
    const spy = spyOn(NanoClient.prototype, "startImageChat").mockReturnValue(fakeChat);

    const chat = startImageChat("gemini-3.1-flash-image-preview", {
      apiKey: "test-key",
      responseModalities: ["TEXT", "IMAGE"],
    });

    expect(chat).toBe(fakeChat);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      "gemini-3.1-flash-image-preview",
      expect.objectContaining({
        apiKey: "test-key",
        responseModalities: ["TEXT", "IMAGE"],
      }),
    );
  });
});
