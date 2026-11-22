import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import * as cheerio from "cheerio";

function createGroq(apiKey: string) {
  return createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey,
  });
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes("chittorgarh.com")) {
      return NextResponse.json({ error: "A valid Chittorgarh URL is required" }, { status: 400 });
    }

    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // We'll strip scripts and styles first
    $('script, style, iframe, nav, footer, header, svg, img').remove();

    // Add spaces and newlines to preserve table structure and block spacing
    $('td, th').append(' | ');
    $('tr, p, div, li, h1, h2, h3, h4, h5, h6').append('\n');
    $('span, a, strong, b, i, em').prepend(' ').append(' ');

    let contentText = $('body').text().replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();

    // Limit text length to avoid token limits just in case (increased to 150k to ensure we capture Registrar and Contacts at the bottom)
    if (contentText.length > 250000) {
      contentText = contentText.substring(0, 250000);
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
      console.log("Selected AI Provider:", provider);
    } catch (configError: any) {
      console.error("Config Error:", configError);
      return NextResponse.json({ error: configError.message }, { status: 400 });
    }

    const prompt = `You are an expert financial data extractor. I am providing you with the text content extracted from an IPO page on Chittorgarh.com.
Your task is to parse this information and map it into a structured JSON format for an IPO database.

URL: ${url}
Extracted Text:
"""
${contentText}
"""

Please extract as much relevant information as possible.
Important fields:
- name: The full name of the company's IPO (without "IPO" at the end if possible)
- symbol: Short stock symbol if available
- description: Extract the "About Company" section as a detailed HTML-formatted string. Use <p>, <ul>, <li> tags.
- aboutIpo: Extract the "About IPO" section (which usually describes the issue details) as a detailed HTML-formatted string. Use <p>, <ul>, <li> tags.
- openDate, closeDate, listingDate: MUST use strictly YYYY-MM-DD format (e.g. "2024-07-24"). Do not use clear text.
- priceBandLow, priceBandHigh: Extract numerical values for the price band.
- faceValue, lotSize: Numeric values if available.
- issueSize, freshIssueSize, offerForSaleSize: Numeric values in Crores if available.
- issueSizeShares, freshIssueShares, offerForSaleShares: Numeric values representing the number of shares.
- shareHoldingPreIssue, shareHoldingPostIssue: Extract the Share Holding Pre Issue and Post Issue values if available.
- currentGmp: The latest Grey Market Premium (GMP) value as a number.
- timelineEvents: Extract timeline dates (e.g., Basis of Allotment, Refunds, Credit of Shares) as an array of { label, value }. Do NOT include Open Date, Close Date, or Listing Date here. The value MUST be strictly in YYYY-MM-DD format.
- valuationMetrics: Extract all valuation metrics (EPS, P/E Ratio, Market Cap, RoNW, EBITDA Margin, NAV, Price to Book, etc.) as an array of { label, value } objects. ONLY output the raw number or text value (do NOT include symbols like ₹). If it's a percentage, include %.
- subscriptionStatus: Extract subscription status (QIB, NII, Retail, Total) as an array of { label, value } objects.
- quotaPercentages: Extract quota percentages (QIB Quota, NII Quota, Retail Quota) as an array of { label, value } objects.
- financialTable: Extract the 'Company Financials' table into an array of objects for each period/year. Include year (e.g. "31 Mar 2026"), revenue, expense, profit (Profit After Tax), assets, networth (NET Worth), reserves, borrowing (Total Borrowing). Use raw numbers without commas.
- registrar: Extract the IPO Registrar details including name, phone, email, and website. (Look for "IPO Registrar").
- leadManagers: Extract the names of all IPO Lead Manager(s) as an array of strings. (Look for "IPO Lead Manager").
- contact: Extract the Contact Details of the company including address, phone, email, and website. (Look for "Contact Details").
- objectsOfTheIssue: Extract the "Objects of the Issue" (reasons for the IPO) as an array of strings. Look for headings like "Objects of the Issue" or "Purpose of the Issue" or "Objective".
- faqs: Extract any "Frequently Asked Questions" (FAQs) found on the page as an array of { question, answer } objects.
- additionalData: Extract any other important tables or lists (e.g. "Shareholding Structure", "Anchor Investors", "Company Promoters", "IPO Lot Size details", "Peer Comparison") as an array of { title, content } where content is a formatted string or HTML.
- analysis: Based on the financial metrics, GMP, and valuations, generate an investment verdict. It MUST be exactly one of: "Apply", "Moderate Risk", or "Avoid". Also provide a 1-2 sentence reasoning.

Make sure all numbers are extracted properly. If a value is missing or N/A, omit the field rather than returning broken strings.
`;

    console.log("Starting generateObject...");
    const startTime = Date.now();

    // Add a strict 45-second timeout using AbortController to prevent the connection from hanging
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort(new Error("AI generation timed out after 45 seconds. The model might be overloaded or processing too much text."));
    }, 45000);

    try {
      const { object } = await generateObject({
        model: modelInstance as any,
        maxRetries: 0,
        abortSignal: abortController.signal,
        schema: z.object({
          name: z.string().optional().describe("IPO Company Name"),
          symbol: z.string().optional().describe("IPO Symbol or short name if available"),
          description: z.string().optional().describe("HTML formatted description of the company (About Company) (e.g. paragraphs and lists)"),
          aboutIpo: z.string().optional().describe("HTML formatted description of the IPO (About IPO) (e.g. paragraphs and lists)"),
          objectsOfTheIssue: z.array(z.string()).optional().describe("Array of reasons for the IPO / objects of the issue"),
          openDate: z.string().optional().describe("Open Date (YYYY-MM-DD preferred)"),
          closeDate: z.string().optional().describe("Close Date (YYYY-MM-DD preferred)"),
          listingDate: z.string().optional().describe("Listing Date (YYYY-MM-DD preferred)"),
          priceBandLow: z.union([z.number(), z.string()]).optional().describe("Lower end of price band"),
          priceBandHigh: z.union([z.number(), z.string()]).optional().describe("Higher end of price band"),
          faceValue: z.union([z.number(), z.string()]).optional().describe("Face value per share"),
          lotSize: z.union([z.number(), z.string()]).optional().describe("Number of shares in a lot"),
          issueSize: z.union([z.number(), z.string()]).optional().describe("Total issue size in Crores if available"),
          issueSizeShares: z.union([z.number(), z.string()]).optional().describe("Total issue size in number of shares if available"),
          freshIssueSize: z.union([z.number(), z.string()]).optional().describe("Fresh issue size in Crores if available"),
          freshIssueShares: z.union([z.number(), z.string()]).optional().describe("Fresh issue size in number of shares if available"),
          offerForSaleSize: z.union([z.number(), z.string()]).optional().describe("Offer for sale size in Crores if available"),
          offerForSaleShares: z.union([z.number(), z.string()]).optional().describe("Offer for sale size in number of shares if available"),
          shareHoldingPreIssue: z.union([z.number(), z.string()]).optional().describe("Share holding pre issue percentage or amount"),
          shareHoldingPostIssue: z.union([z.number(), z.string()]).optional().describe("Share holding post issue percentage or amount"),
          currentGmp: z.union([z.number(), z.string()]).optional().describe("Latest GMP value"),
          registrar: z.object({
            name: z.string().optional(),
            phone: z.union([z.string(), z.number()]).optional(),
            email: z.string().optional(),
            website: z.string().optional()
          }).optional(),
          leadManagers: z.array(z.string()).optional(),
          contact: z.object({
            address: z.string().optional(),
            phone: z.union([z.string(), z.number()]).optional(),
            email: z.string().optional(),
            website: z.string().optional()
          }).optional(),
          faqs: z.array(z.object({
            question: z.string(),
            answer: z.string()
          })).optional().describe("Frequently Asked Questions"),
          timelineEvents: z.array(z.object({
            label: z.union([z.string(), z.number()]).optional(),
            value: z.union([z.string(), z.number()]).optional()
          })).optional().describe("Timeline dates like Basis of Allotment, Refunds, etc."),
          valuationMetrics: z.array(z.object({
            label: z.union([z.string(), z.number()]).optional(),
            value: z.union([z.string(), z.number()]).optional()
          })).optional().describe("All valuation metrics like EPS, P/E, Market Cap, RoNW, EBITDA Margin, NAV, Price to Book, etc."),
          subscriptionStatus: z.array(z.object({
            label: z.union([z.string(), z.number()]).optional(),
            value: z.union([z.string(), z.number()]).optional()
          })).optional().describe("Subscription status like QIB, NII, Retail, Total"),
          quotaPercentages: z.array(z.object({
            label: z.union([z.string(), z.number()]).optional(),
            value: z.union([z.string(), z.number()]).optional()
          })).optional().describe("Quota percentages like QIB Quota, NII Quota, Retail Quota"),
          financialTable: z.array(z.object({
            year: z.union([z.string(), z.number()]).optional(),
            revenue: z.union([z.string(), z.number()]).optional(),
            expense: z.union([z.string(), z.number()]).optional(),
            profit: z.union([z.string(), z.number()]).optional(),
            assets: z.union([z.string(), z.number()]).optional(),
            networth: z.union([z.string(), z.number()]).optional(),
            reserves: z.union([z.string(), z.number()]).optional(),
            borrowing: z.union([z.string(), z.number()]).optional()
          })).optional().describe("Company financials table data"),
          additionalData: z.array(z.object({
            title: z.string(),
            content: z.string()
          })).optional().describe("Any other important tabular data or details like Shareholding Structure, Anchor Investors, etc."),
          analysis: z.object({
            verdict: z.enum(["Apply", "Moderate Risk", "Avoid"]).optional().describe("The AI verdict on whether to apply or avoid."),
            reasoning: z.string().optional().describe("1-2 sentence reasoning for the verdict.")
          }).optional().describe("AI generated investment suggestion.")
        }),
        prompt: prompt,
        temperature: 0.1,
      });

      clearTimeout(timeoutId);
      console.log("generateObject finished in", Date.now() - startTime, "ms");
      return NextResponse.json(object);
    } catch (generateError: any) {
      clearTimeout(timeoutId);
      throw generateError;
    }

  } catch (error: any) {
    console.error("AI Fetch Chittorgarh Error:", error);
    let errorMessage = error.message || "Failed to fetch and parse data";

    // Add provider response context if available (useful for debugging "Invalid JSON response" errors from AI providers)
    if (error.responseBody) {
      errorMessage += ` | Provider Response: ${typeof error.responseBody === 'string' ? error.responseBody.substring(0, 150) : JSON.stringify(error.responseBody).substring(0, 150)}`;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
