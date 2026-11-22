import { generateObject } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY }); // or any dummy key
  try {
    const { object } = await generateObject({
      model: google("gemini-1.5-pro") as any,
      schema: z.object({ name: z.string() }),
      prompt: "Extract name from: The company is Juniper Green Energy",
    });
    console.log("Success:", object);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
