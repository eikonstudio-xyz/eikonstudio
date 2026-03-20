import { describe, expect, mock, test } from "bun:test";

import { NanoClient } from "./client";

const chatResponse = {
  candidates: [
    {
      content: {
        parts: [
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
} as const;

const textOnlyChatResponse = {
  candidates: [
    {
      content: {
        parts: [{ text: "Can you upload a reference image first?" }],
      },
    },
  ],
} as const;

describe("NanoClient.startImageChat", () => {
  test("keeps chat-level config when send options are omitted", async () => {
    const sendMessage = mock(async () => chatResponse as never);
    const create = mock(() => ({ sendMessage }));
    const client = Object.create(NanoClient.prototype) as NanoClient;

    Object.defineProperty(client, "ai", {
      value: {
        chats: {
          create,
        },
      },
    });

    const chat = client.startImageChat("gemini-3.1-flash-image-preview", {
      responseModalities: ["IMAGE"],
      aspectRatio: "16:9",
      googleSearch: true,
    });

    const result = await chat.send("Make it cinematic");

    expect(result.images).toHaveLength(1);
    expect(create).toHaveBeenCalledWith({
      model: "gemini-3.1-flash-image-preview",
      config: expect.objectContaining({
        responseModalities: ["IMAGE"],
        imageConfig: expect.objectContaining({
          aspectRatio: "16:9",
        }),
        tools: [{ googleSearch: {} }],
      }),
    });
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage.mock.calls[0]?.[0]).toEqual({
      message: "Make it cinematic",
      config: undefined,
    });
  });

  test("returns text-only intermediate chat responses without throwing", async () => {
    const sendMessage = mock(async () => textOnlyChatResponse as never);
    const create = mock(() => ({ sendMessage }));
    const client = Object.create(NanoClient.prototype) as NanoClient;

    Object.defineProperty(client, "ai", {
      value: {
        chats: {
          create,
        },
      },
    });

    const chat = client.startImageChat("gemini-3.1-flash-image-preview");
    const result = await chat.send("What do you need from me?");

    expect(result.text).toBe("Can you upload a reference image first?");
    expect(result.texts).toEqual(["Can you upload a reference image first?"]);
    expect(result.images).toEqual([]);
    expect(result.parts).toHaveLength(1);
  });
});
