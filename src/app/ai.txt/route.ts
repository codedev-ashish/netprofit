import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const DEFAULT_AI = `# ai.txt - AI Agent & Machine Learning Crawler Guidelines
# Website: https://netprofit.in
# Standard: https://site.spawning.ai/spawning-ai-txt

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/

# AI Agent Directives
ai-train: allow
ai-search: allow
ai-citation: allow

# Machine-Readable AI Information
llms-txt: https://netprofit.in/llms.txt
sitemap: https://netprofit.in/sitemap.xml
contact: support@netprofit.in`;

export async function GET() {
  let content = DEFAULT_AI;
  try {
    const docRef = doc(db, "settings", "ads");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().aiTxt && docSnap.data().aiTxt.trim()) {
      content = docSnap.data().aiTxt;
    }
  } catch (err) {
    console.error("Error fetching ai.txt", err);
  }
  
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
