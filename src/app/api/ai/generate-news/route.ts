import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

// Extend with Groq provider if needed, or use OpenAI SDK with Groq base URL
function createGroq(apiKey: string) {
  return createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey,
  });
}

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // 1. Fetch AI settings from Firestore
    const settingsRef = doc(db, "settings", "ai");
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      return NextResponse.json({ error: "AI settings not configured" }, { status: 500 });
    }

    const settings = settingsSnap.data();
    const provider = settings.activeProvider || "gemini";
    let modelInstance;

    // 2. Configure the correct provider and model
    try {
      switch (provider) {
        case "gemini":
          if (!settings.geminiKey) throw new Error("Gemini API key is missing");
          const google = createGoogleGenerativeAI({ apiKey: settings.geminiKey });
          modelInstance = google("gemini-1.5-pro");
          break;
        case "claude":
          if (!settings.claudeKey) throw new Error("Claude API key is missing");
          const anthropic = createAnthropic({ apiKey: settings.claudeKey });
          modelInstance = anthropic("claude-3-5-sonnet-20240620");
          break;
        case "openai":
          if (!settings.openaiKey) throw new Error("OpenAI API key is missing");
          const openai = createOpenAI({ apiKey: settings.openaiKey });
          modelInstance = openai("gpt-4o");
          break;
        case "openrouter":
          if (!settings.openrouterKey) throw new Error("Open Router API key is missing");
          const openrouter = createOpenRouter({ apiKey: settings.openrouterKey });
          modelInstance = openrouter("meta-llama/llama-3.1-8b-instruct"); // Or whatever model you prefer
          break;
        case "groq":
          if (!settings.groqKey) throw new Error("Groq API key is missing");
          const groq = createGroq(settings.groqKey);
          modelInstance = groq("llama-3.1-8b-instant");
          break;
        default:
          throw new Error("Invalid provider selected");
      }
    } catch (configError: any) {
      return NextResponse.json({ error: configError.message }, { status: 400 });
    }

    // 3. Generate structured news content using the selected model
    const prompt = `You are a professional financial and business journalist. Write a comprehensive, detailed, and engaging news article about the following topic: "${topic}".
    
REQUIREMENTS:
- The content must be unique and highly informative.
- The article MUST be at least 750 words long.
- Use proper HTML formatting for the content. Do NOT include an H1 tag in the content (the title will be separate). Use H2, H3, H4 tags for subheadings.
- Use proper <p> tags for paragraphs. Use <ul>, <li>, <strong> where appropriate.
- Provide a catchy, SEO-friendly title.
- Provide a short 2-3 sentence excerpt/summary.
- Provide 3-5 relevant tags (as an array of strings).

IMPORTANT: Return your response ONLY as a raw JSON object matching the following structure, without any markdown formatting or \`\`\`json block:
{
  "title": "SEO-friendly title",
  "excerpt": "Short summary",
  "content": "<p>Full HTML content...</p>",
  "tags": ["tag1", "tag2"]
}
`;

    let parsedResult;
    let text = "";


      // Use structured outputs (generateObject) for all other providers (Groq, OpenAI, Claude) for maximum reliability
      const { generateObject } = await import("ai");
      const { object } = await generateObject({
        model: modelInstance as any,
        schema: z.object({
          title: z.string().describe("The SEO-friendly H1 title of the article"),
          excerpt: z.string().describe("A 2-3 sentence summary of the article"),
          content: z.string().describe("The full HTML content of the article, at least 750 words, using H2, H3, H4, and p tags"),
          tags: z.array(z.string()).describe("3-5 relevant tags for the article"),
        }),
        prompt: prompt,
        temperature: 0.7,
      });
      parsedResult = object;

    return NextResponse.json({
      title: parsedResult.title || "",
      excerpt: parsedResult.excerpt || "",
      content: parsedResult.content || "",
      tags: Array.isArray(parsedResult.tags) ? parsedResult.tags.join(', ') : parsedResult.tags
    });

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate content" }, { status: 500 });
  }
}
