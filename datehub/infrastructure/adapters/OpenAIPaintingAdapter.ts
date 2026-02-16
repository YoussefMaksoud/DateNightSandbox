import { IPaintingAIService, GeneratePaintingResult } from "@/application/ports";

const DIFFICULTY_PROMPTS: Record<string, string> = {
  beginner: "simple composition, bold flat colors, minimal detail, easy to replicate for a beginner painter",
  intermediate: "moderate detail, some color blending, balanced composition, suitable for an intermediate painter",
  advanced: "rich detail, complex lighting, nuanced color transitions, challenging composition for an advanced painter",
};

const THEME_PROMPTS: Record<string, string> = {
  landscape: "a beautiful landscape painting with natural scenery",
  portrait: "a portrait painting of a person",
  "still-life": "a still life painting with arranged objects like fruit, vases, or flowers on a table",
  abstract: "an abstract painting with expressive shapes and colors",
  floral: "a painting of flowers or a floral arrangement",
  sunset: "a painting of a sunset or golden hour scene",
};

export class OpenAIPaintingAdapter implements IPaintingAIService {
  private readonly apiKey: string;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not set");
    this.apiKey = key;
  }

  async generateReference(difficulty: string, theme: string): Promise<GeneratePaintingResult> {
    const difficultyDesc = DIFFICULTY_PROMPTS[difficulty] ?? DIFFICULTY_PROMPTS.beginner;
    const themeDesc = THEME_PROMPTS[theme] ?? THEME_PROMPTS.landscape;

    const imagePrompt = `A beautiful painting: ${themeDesc}. Style: ${difficultyDesc}. Oil on canvas style, painterly brushstrokes, warm and inviting.`;

    // Generate image with DALL-E 3
    const imageRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!imageRes.ok) {
      const err = await imageRes.text();
      throw new Error(`DALL-E error: ${err}`);
    }

    const imageData = await imageRes.json();
    const imageUrl: string = imageData.data[0].url;

    // Get palette from GPT based on the same theme/difficulty
    const paletteRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `I'm painting ${themeDesc} at a ${difficulty} level. Give me exactly 6 hex color codes that would be the main colors I need to mix for this painting. Return ONLY a JSON array of 6 hex strings, nothing else. Example: ["#FF5733","#2E86C1","#28B463","#F4D03F","#8E44AD","#E74C3C"]`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!paletteRes.ok) {
      const err = await paletteRes.text();
      throw new Error(`GPT error: ${err}`);
    }

    const paletteData = await paletteRes.json();
    const raw = paletteData.choices[0].message.content.trim();

    let palette: string[];
    try {
      palette = JSON.parse(raw);
    } catch {
      // Fallback palette if parsing fails
      palette = ["#E74C3C", "#3498DB", "#2ECC71", "#F39C12", "#9B59B6", "#1ABC9C"];
    }

    return { imageUrl, palette };
  }
}
