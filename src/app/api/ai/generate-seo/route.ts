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
    const { title, content, type } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required for SEO optimization" }, { status: 400 });
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
          modelInstance = openrouter("meta-llama/llama-3.1-8b-instruct"); // Using a reliable generic model, or you can keep minimax/minimax-m3
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

    const prompt = `You are an expert SEO specialist. Analyze the following content for a ${type || 'webpage'}.
    
Title: "${title || 'Untitled'}"
Content: """${content}"""
    
REQUIREMENTS:
1. Generate an optimal, catchy, highly-clickable SEO Meta Title (max 60 characters).
2. Generate an engaging SEO Meta Description (max 155 characters) that encourages clicks.
3. Generate a list of 5 to 10 highly relevant SEO Keywords based on the content (comma-separated string).
4. Rewrite the provided HTML content to automatically inject semantic contextual links to improve SEO:
   - Inject 2-3 INTERNAL links where relevant context exists. Wrap them in standard do-follow tags: <a href="https://netprofit.in/...">keyword</a>
   - Inject 1-2 EXTERNAL links to high-authority, trusted sites (like Forbes, Investopedia, or official gov sites) where appropriate. Wrap them in no-follow tags: <a href="https://..." rel="nofollow" target="_blank">keyword</a>
   - Ensure the rewritten HTML maintains its original formatting, paragraphs, headers, and lists, but now includes these strategic links. Do not change the overall meaning of the content.

IMPORTANT: Return your response ONLY as a raw JSON object matching the following structure, without any markdown formatting or \`\`\`json block:
{
  "metaTitle": "SEO Title",
  "metaDescription": "SEO Meta Description",
  "seoKeywords": "keyword1, keyword2, keyword3",
  "optimizedContent": "<p>Original content with <a href='https://netprofit.in/services/gst-registration'>internal links</a> and <a href='https://official-source.com' rel='nofollow' target='_blank'>external links</a> added contextually.</p>"
}
`;

    let parsedResult;
    let text = "";


      const { generateObject } = await import("ai");
      const { object } = await generateObject({
        model: modelInstance as any,
        schema: z.object({
          metaTitle: z.string().describe("The highly optimized SEO Meta Title (max 60 chars)"),
          metaDescription: z.string().describe("The engaging SEO Meta Description (max 155 chars)"),
          seoKeywords: z.string().describe("A comma-separated string of 5-10 highly relevant SEO keywords"),
          optimizedContent: z.string().describe("The rewritten HTML content with injected do-follow internal links and no-follow external links"),
        }),
        prompt: prompt,
        temperature: 0.7,
      });
      parsedResult = object;

    return NextResponse.json({
      metaTitle: parsedResult.metaTitle || "",
      metaDescription: parsedResult.metaDescription || "",
      seoKeywords: parsedResult.seoKeywords || "",
      optimizedContent: parsedResult.optimizedContent || ""
    });

  } catch (error: any) {
    console.error("AI SEO Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate SEO" }, { status: 500 });
  }
}
