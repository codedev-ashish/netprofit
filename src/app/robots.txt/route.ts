import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const DEFAULT_ROBOTS = `# robots.txt for NetProfit (https://netprofit.in)
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/

# Search Engine Crawlers
User-agent: Googlebot
Allow: /

User-agent: Googlebot-Mobile
Allow: /

User-agent: Googlebot-Smartphone
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Applebot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: YandexBot
Allow: /

# AI Agents & LLM Crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /

User-agent: Cohere-ai
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: Diffbot
Allow: /

# Direct links for AI agents, ad verification and policies
Allow: /llms.txt
Allow: /ai.txt
Allow: /ads.txt
Allow: /app-ads.txt

# Sitemap
Sitemap: https://netprofit.in/sitemap.xml`;

export async function GET() {
  let content = DEFAULT_ROBOTS;
  
  try {
    const docRef = doc(db, "settings", "ads");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().robotsTxt) {
      content = docSnap.data().robotsTxt;
      
      content = content.replace(/http:\/\//gi, 'https://');
      if (!content.toLowerCase().includes('sitemap:')) {
        content += '\nSitemap: https://netprofit.in/sitemap.xml';
      }
    }
  } catch (err) {
    console.error("Error fetching robots.txt", err);
  }
  
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
