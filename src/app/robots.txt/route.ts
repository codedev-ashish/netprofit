import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  let content = "User-agent: *\nAllow: /\n\nSitemap: https://netprofit.in/sitemap.xml";
  
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
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
