import { describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { generateGeminiImage } from "./generate";

const shouldRunLive = process.env.NANO_LIVE_TEST === "1";
const outputPath = process.env.NANO_LIVE_TEST_OUTPUT;

describe("live image generation", () => {
  const run = shouldRunLive ? test : test.skip;

  run("generates a real image with Gemini", async () => {
    expect(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY).toBeTruthy();

    const result = await generateGeminiImage(
      "gemini-2.5-flash-image",
      "A clean studio product photo of a tiny banana-shaped robot on a white background",
      {
        responseModalities: ["IMAGE"],
      },
    );

    expect(result.provider).toBe("gemini");
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0]?.buffer.length).toBeGreaterThan(0);
    expect(result.images[0]?.mimeType.startsWith("image/")).toBe(true);

    if (outputPath && result.images[0]) {
      const absoluteOutput = resolve(outputPath);
      mkdirSync(dirname(absoluteOutput), { recursive: true });
      writeFileSync(absoluteOutput, result.images[0].buffer);
    }
  }, 120_000);
});
