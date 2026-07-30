import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

function createGroq(apiKey: string) {
  return createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey,
  });
}

export async function POST(req: Request) {
  try {
    const { title, type } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title/Service name is required to generate details" }, { status: 400 });
    }

    const settingsRef = doc(db, "settings", "ai");
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      return NextResponse.json({ error: "AI settings not configured" }, { status: 500 });
    }

    const settings = settingsSnap.data();
    const provider = settings.activeProvider || "gemini";
    let modelInstance;

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
          modelInstance = openrouter("meta-llama/llama-3.1-8b-instruct");
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

    const prompt = `You are an expert SEO copywriter and web designer. Your task is to generate comprehensive, engaging, and highly informative "Detailed Information" section for a service.
    
Service Name: "${title}"
Service Type: "${type || 'Business Registration/Compliance'}"
    
REQUIREMENTS FOR THE GENERATED HTML CONTENT:
1. SEO Optimization: Use proper heading hierarchy (<h2>, <h3>, <h4>).
2. Readability: Use clear paragraphs (<p>) and bullet points (<ul><li>).
3. Modern Icons: Include CSS or emoji-based colorful modern icons next to key features or list items to make it visually engaging (e.g., 🚀, 🛡️, 📊, 💼).
4. Links: Include 2-3 highlighted semantic internal or external contextual links (e.g., <a href="#" style="color:#ea580c; font-weight:600;">important term</a>).
5. Depth: The content must be comprehensive (at least 300-500 words), covering 'Why it is important', 'Key Benefits', 'Who needs it', and 'The Process'.
6. Do NOT include markdown blocks (\`\`\`html). Output pure HTML that can be directly injected into a Rich Text Editor.

IMPORTANT: Return your response ONLY as a raw JSON object matching the following structure:
{
  "generatedHtml": "<h2>...</h2><p>...</p>..."
}
`;

    const { generateObject } = await import("ai");
    const { object } = await generateObject({
      model: modelInstance as any,
      schema: z.object({
        generatedHtml: z.string().describe("The generated detailed HTML content for the service."),
      }),
      prompt: prompt,
      temperature: 0.7,
    });

    return NextResponse.json({
      generatedHtml: object.generatedHtml || ""
    });

  } catch (error: any) {
    console.error("AI Details Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate details" }, { status: 500 });
  }
}
