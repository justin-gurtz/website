import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { OPENAI_API_KEY } from "@/env/secret";
import type { InstagramImageClassification } from "@/types/models";

const classificationSchema = z.object({
  isScreenshot: z.boolean(),
  isRevealing: z.boolean(),
  focus: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

const prompt = `Analyze this Instagram image for a personal website's photo widget.

1. isScreenshot: true if the image is a screenshot of a device screen or app UI (race results, weather maps, chat threads, websites, etc.) rather than a camera photo.
2. isRevealing: true if the photo's intended subject — a person posing for or clearly featured by the camera — is shirtless or wearing notably revealing attire (swimwear, underwear, open shirt). If the photo captures a scene or crowd (a race, a beach, an event) and the shirtless people in it are just participants in that scene, answer false. Ordinary athletic wear like tank tops never counts.
3. focus: the point (x and y as percentages 0-100, measured from the top-left corner) that should stay centered when the image is cropped to a square. If there is a person, use the midpoint between the eyes of the most prominent face. Otherwise use the main subject. Default to x=50, y=50.`;

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// True when the OpenAI account has run out of prepaid credits — callers should
// stop classifying and let later runs retry once the balance is topped up
export const isOutOfCredits = (error: unknown) =>
  error instanceof OpenAI.APIError &&
  (error.code === "credit_balance_exhausted" ||
    error.type === "insufficient_quota");

// Classify a single image by public URL. Throws on transport/API errors so
// callers can distinguish quota exhaustion from transient failures.
export const classifyImage = async (
  imageUrl: string,
): Promise<InstagramImageClassification> => {
  const response = await openai.responses.parse(
    {
      model: "gpt-5.5",
      reasoning: { effort: "medium" },
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageUrl, detail: "low" },
          ],
        },
      ],
      text: { format: zodTextFormat(classificationSchema, "image_analysis") },
    },
    // Bound each call so one hung request can't eat the cron's time budget
    { timeout: 30_000, maxRetries: 1 },
  );

  const parsed = response.output_parsed;
  if (!parsed) {
    // The API succeeded but produced no classification — a refusal or an
    // unreadable file. Retrying will not help, so persist a fail-closed
    // marker: the image stays hidden and is never re-attempted.
    return {
      isScreenshot: false,
      isRevealing: false,
      unclassifiable: true,
      focus: { x: 50, y: 50 },
    };
  }

  return {
    isScreenshot: parsed.isScreenshot,
    isRevealing: parsed.isRevealing,
    focus: { x: clamp(parsed.focus.x), y: clamp(parsed.focus.y) },
  };
};
