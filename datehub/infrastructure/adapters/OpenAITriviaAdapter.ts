import { ITriviaAIService, GeneratedTriviaQuestion } from "@/application/ports";

const CATEGORY_PROMPTS: Record<string, string> = {
  general: "general knowledge across all topics",
  science: "science and technology",
  history: "world history and historical events",
  "pop-culture": "pop culture, celebrities, and trending topics",
  geography: "world geography, countries, and landmarks",
  sports: "sports and athletics",
  "movies-tv": "movies, TV shows, and entertainment",
  music: "music, bands, and songs",
  "food-drink": "food, cooking, and beverages",
  animals: "animals and nature",
  "couples": "relationships, love, and romantic topics — fun and lighthearted",
};

const DIFFICULTY_PROMPTS: Record<string, string> = {
  easy: "straightforward and commonly known facts, suitable for casual players",
  medium: "moderately challenging, requires some knowledge but not obscure",
  hard: "difficult and obscure, for true trivia enthusiasts",
};

export class OpenAITriviaAdapter implements ITriviaAIService {
  private readonly apiKey: string;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not set");
    this.apiKey = key;
  }

  async generateQuestion(category: string, difficulty: string, previousQuestions?: string[]): Promise<GeneratedTriviaQuestion> {
    const categoryDesc = CATEGORY_PROMPTS[category] ?? CATEGORY_PROMPTS.general;
    const difficultyDesc = DIFFICULTY_PROMPTS[difficulty] ?? DIFFICULTY_PROMPTS.medium;

    const avoidList = previousQuestions && previousQuestions.length > 0
      ? `\n\nDo NOT repeat or closely resemble any of these previous questions:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "";

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a trivia question generator for a fun couples date night app. Generate entertaining, interesting questions that spark conversation. Always return valid JSON.",
          },
          {
            role: "user",
            content: `Generate a trivia question about ${categoryDesc}. Difficulty: ${difficultyDesc}.

Return ONLY a JSON object with this exact structure:
{
  "question": "The trivia question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "funFact": "A fun, interesting fact related to the answer that players would enjoy learning"
}

The correctIndex should be 0-3 indicating which option is correct. Mix up which index is correct — don't always use 0. Make the wrong answers plausible but clearly distinguishable. Keep the fun fact brief (1-2 sentences) and genuinely interesting.${avoidList}`,
          },
        ],
        temperature: 0.9,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const data = await res.json();
    const raw = data.choices[0].message.content.trim();

    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        question: parsed.question,
        options: parsed.options,
        correctIndex: parsed.correctIndex,
        funFact: parsed.funFact,
      };
    } catch {
      // Fallback question
      return {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctIndex: 2,
        funFact: "Paris is known as the City of Light (La Ville Lumière)!",
      };
    }
  }

  async checkAnswer(question: string, correctAnswer: string, userAnswer: string): Promise<{ correct: boolean; explanation: string }> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: `Question: "${question}"
Correct answer: "${correctAnswer}"
User's answer: "${userAnswer}"

Is the user's answer correct or essentially the same as the correct answer? Return ONLY a JSON object:
{"correct": true/false, "explanation": "Brief explanation"}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      return { correct: userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim(), explanation: "" };
    }

    const data = await res.json();
    const raw = data.choices[0].message.content.trim();

    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return { correct: false, explanation: "Could not verify answer." };
    }
  }
}
