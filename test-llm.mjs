import { generateObject } from "ai";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
dotenv.config();

function createGroq(apiKey) {
  return createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey,
  });
}

const groq = createGroq(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY); // fallback

async function run() {
  const url = "https://www.chittorgarh.com/ipo/juniper-green-energy-ipo/2492/";
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await response.text();
  const $ = cheerio.load(html);
  $('script, style, iframe, nav, footer, header, svg, img').remove();
  $('td, th').append(' | ');
  $('tr, p, div, li, h1, h2, h3, h4, h5, h6').append('\n');
  let contentText = $('body').text().replace(/\s+/g, ' ').trim();

  const prompt = `You are an expert financial data extractor. I am providing you with the text content extracted from an IPO page on Chittorgarh.com.
Your task is to parse this information and map it into a structured JSON format for an IPO database.

URL: ${url}
Extracted Text:
"""
${contentText.substring(0, 30000)}
"""

Please extract as much relevant information as possible.
Important fields:
- extraFields: Extract all financial metrics (EPS, P/E Ratio, Market Cap, RoNW, EBITDA Margin, NAV, Net Worth, Total Borrowing, Assets, Revenue, Profit After Tax, etc.) as an array of { label, value } objects. ONLY output the raw number or text value (do NOT include symbols like ₹, just output 0.83 instead of ₹0.83). If it's a percentage, you can include the %.
`;

  console.log("Calling LLM...");
  try {
    const { object } = await generateObject({
      model: groq("llama-3.1-8b-instant"), // assuming Groq for speed
      schema: z.object({
        extraFields: z.array(z.object({
          label: z.string(),
          value: z.string()
        })).optional()
      }),
      prompt: prompt,
      temperature: 0.1,
    });
    console.log(JSON.stringify(object, null, 2));
  } catch(e) {
    console.error("LLM Error:", e);
  }
}
run();
