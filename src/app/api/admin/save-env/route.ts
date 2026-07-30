import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

async function updateEnvFile(filePath: string, updates: Record<string, string>) {
  try {
    let content = "";
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch (e) {
      // File doesn't exist, start with empty string
    }

    const lines = content.split(/\r?\n/);
    const newLines = [];
    const keysUpdated = new Set();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        newLines.push(line);
        continue;
      }

      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        if (key in updates) {
          newLines.push(`${key}="${updates[key]}"`);
          keysUpdated.add(key);
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }

    for (const [key, value] of Object.entries(updates)) {
      if (!keysUpdated.has(key)) {
        newLines.push(`${key}="${value}"`);
      }
    }

    await fs.writeFile(filePath, newLines.join("\n"));
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const envPath = path.join(process.cwd(), ".env");
    const envLocalPath = path.join(process.cwd(), ".env.local");

    await updateEnvFile(envPath, data);
    await updateEnvFile(envLocalPath, data);

    return NextResponse.json({ success: true, message: "Environment variables saved successfully" });
  } catch (error: any) {
    console.error("Error saving env vars:", error);
    return NextResponse.json({ error: error.message || "Failed to save environment variables" }, { status: 500 });
  }
}
