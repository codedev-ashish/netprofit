import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: Request) {
  try {
    const { robotsTxt, adsTxt, appAdsTxt, llmsTxt, aiTxt } = await request.json();
    const cwd = process.cwd();

    const filesToSync: Record<string, string | undefined> = {
      'robots.txt': robotsTxt,
      'ads.txt': adsTxt,
      'app-ads.txt': appAdsTxt,
      'llms.txt': llmsTxt,
      'ai.txt': aiTxt,
    };

    const results: Record<string, string> = {};

    for (const [filename, content] of Object.entries(filesToSync)) {
      if (typeof content === 'string' && content.trim()) {
        try {
          // Write to project root
          await fs.promises.writeFile(path.join(cwd, filename), content, 'utf-8');
          // Write to public folder
          await fs.promises.writeFile(path.join(cwd, 'public', filename), content, 'utf-8');
          results[filename] = 'synced';
        } catch (err: any) {
          results[filename] = `fs_write_skipped: ${err.message}`;
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Error in sync-root-files:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
