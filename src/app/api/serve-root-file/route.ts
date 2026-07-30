import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return new NextResponse('File not specified', { status: 400 });
    }

    const docRef = doc(db, "rootFiles", fileName);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Fallback for robots.txt, ads.txt, app-ads.txt from settings/ads
      if (fileName === 'robots.txt' || fileName === 'ads.txt' || fileName === 'app-ads.txt') {
        const adsRef = doc(db, "settings", "ads");
        const adsSnap = await getDoc(adsRef);
        if (adsSnap.exists()) {
          const adsData = adsSnap.data();
          let fallbackContent = '';
          if (fileName === 'robots.txt') fallbackContent = adsData.robotsTxt;
          else if (fileName === 'ads.txt') fallbackContent = adsData.adsTxt;
          else if (fileName === 'app-ads.txt') fallbackContent = adsData.appAdsTxt;

          if (fallbackContent) {
            if (fileName === 'robots.txt') {
              fallbackContent = fallbackContent.replace(/http:\/\//gi, 'https://');
              if (!fallbackContent.toLowerCase().includes('sitemap:')) {
                fallbackContent += '\nSitemap: https://netprofit.in/sitemap.xml';
              }
            }
            return new NextResponse(fallbackContent, {
              status: 200,
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'public, max-age=3600',
              },
            });
          }
        }
      }
      
      if (fileName === 'robots.txt') {
        const defaultRobotsTxt = "User-agent: *\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nUser-agent: Googlebot-Mobile\nAllow: /\n\nUser-agent: Googlebot-Smartphone\nAllow: /\n\nUser-agent: bingbot\nAllow: /\n\nSitemap: https://netprofit.in/sitemap.xml";
        return new NextResponse(defaultRobotsTxt, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      return new NextResponse('Not Found', { status: 404 });
    }

    let contentText = '';
    const data = docSnap.data();
    if (data.content) {
      contentText = Buffer.from(data.content, 'base64').toString('utf-8');
      if (fileName === 'robots.txt') {
        contentText = contentText.replace(/http:\/\//gi, 'https://');
        if (!contentText.toLowerCase().includes('sitemap:')) {
          contentText += '\nSitemap: https://netprofit.in/sitemap.xml';
        }
      }
    }

    return new NextResponse(data.content ? contentText : '', {
      status: 200,
      headers: {
        'Content-Type': (data.contentType || 'text/plain') + '; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error("Error serving root file:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
