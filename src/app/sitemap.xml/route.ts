import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export const revalidate = 0; // Generate sitemap on demand to show latest content immediately

export async function GET() {
  try {
    let domain = 'https://netprofit.in'; // Default

    // Fetch Global Settings for Domain
    try {
      const globalSnap = await getDocs(collection(db, 'settings'));
      globalSnap.forEach(doc => {
        if (doc.id === 'global') {
          const data = doc.data();
          if (data.domain) {
            domain = data.domain.replace(/\/$/, ''); // Remove trailing slash
            // Enforce HTTPS for the production domain to prevent 308 redirect loops in SEO crawlers
            if (!domain.includes('localhost') && domain.startsWith('http://')) {
              domain = domain.replace(/^http:\/\//i, 'https://');
            }
          }
        }
      });
    } catch (e) {
      console.warn("Could not fetch global domain", e);
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    const escapeXml = (unsafe: string) => {
      if (!unsafe) return unsafe;
      return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    // Helper to add URL entries
    const addedUrls = new Set<string>();
    const addUrl = (path: string, priority: string, changefreq: string, image?: string, date?: string) => {
      const url = escapeXml(`${domain}${path}`);
      if (addedUrls.has(url)) return;
      addedUrls.add(url);
      
      xml += `  <url>\n`;
      xml += `    <loc>${url}</loc>\n`;
      if (date) xml += `    <lastmod>${date}</lastmod>\n`;
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      if (image) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(image)}</image:loc>\n`;
        xml += `    </image:image>\n`;
      }
      xml += `  </url>\n`;
    };

    const now = new Date().toISOString();

    // 1. Static Pages
    addUrl('/', '1.0', 'daily', undefined, now);
    addUrl('/services', '1.0', 'daily', undefined, now);
    addUrl('/news', '1.0', 'hourly', undefined, now);
    addUrl('/ipo', '1.0', 'hourly', undefined, now);
    addUrl('/tools', '1.0', 'daily', undefined, now);
    addUrl('/contact-us', '0.5', 'monthly', undefined, now);
    addUrl('/about-us', '0.6', 'monthly', undefined, now);
    addUrl('/auth', '0.5', 'monthly', undefined, now);

    // 2. Fetch Services
    try {
      const servicesSnap = await getDocs(collection(db, 'services'));
      servicesSnap.forEach(doc => {
        const data = doc.data();
        if (data.slug && data.isPublished !== false) {
          let dateStr = now;
          if (data.updatedAt?.toDate) dateStr = data.updatedAt.toDate().toISOString();
          else if (data.createdAt?.toDate) dateStr = data.createdAt.toDate().toISOString();
          addUrl(`/services/${data.slug}`, '1.0', 'daily', undefined, dateStr);
        }
      });
    } catch (e) { console.error("Sitemap Services Error", e); }

    // 3. Fetch News (Has Images)
    try {
      const newsSnap = await getDocs(collection(db, 'news'));
      newsSnap.forEach(doc => {
        const data = doc.data();
        if (data.isPublished !== false) {
          let dateStr = now;
          if (data.updatedAt?.toDate) dateStr = data.updatedAt.toDate().toISOString();
          else if (data.publishedAt?.toDate) dateStr = data.publishedAt.toDate().toISOString();
          else if (data.createdAt?.toDate) dateStr = data.createdAt.toDate().toISOString();

          const urlIdentifier = data.slug ? data.slug : doc.id;
          addUrl(`/news/${urlIdentifier}`, '1.0', 'hourly', data.imageUrl, dateStr);
        }
      });
    } catch (e) { console.error("Sitemap News Error", e); }

    // 4. Fetch IPOs
    try {
      const ipoSnap = await getDocs(collection(db, 'ipos'));
      ipoSnap.forEach(doc => {
        const data = doc.data();
        if (data.slug) {
          let dateStr = now;
          if (data.updatedAt?.toDate) dateStr = data.updatedAt.toDate().toISOString();
          else if (data.createdAt?.toDate) dateStr = data.createdAt.toDate().toISOString();

          addUrl(`/ipo/${data.slug}`, '1.0', 'hourly', undefined, dateStr);
        }
      });
    } catch (e) { console.error("Sitemap IPOs Error", e); }

    // 5. Fetch Tools
    try {
      const toolsSnap = await getDocs(collection(db, 'tools'));
      toolsSnap.forEach(doc => {
        const data = doc.data();
        if (data.slug && data.isPublished !== false) {
          let dateStr = now;
          if (data.updatedAt?.toDate) dateStr = data.updatedAt.toDate().toISOString();
          else if (data.createdAt?.toDate) dateStr = data.createdAt.toDate().toISOString();
          addUrl(`/tools/${data.slug}`, '1.0', 'daily', undefined, dateStr);
        }
      });
    } catch (e) { console.error("Sitemap Tools Error", e); }

    // 6. Fetch Custom Pages
    try {
      const pagesSnap = await getDocs(collection(db, 'pages'));
      pagesSnap.forEach(doc => {
        const data = doc.data();
        if (data.slug && data.isPublished !== false) {
          let dateStr = now;
          if (data.updatedAt?.toDate) dateStr = data.updatedAt.toDate().toISOString();
          else if (data.createdAt?.toDate) dateStr = data.createdAt.toDate().toISOString();
          addUrl(`/${data.slug}`, '0.7', 'monthly', undefined, dateStr);
        }
      });
    } catch (e) { console.error("Sitemap Pages Error", e); }

    // 7. Fetch Authors
    try {
      const authorsSnap = await getDocs(collection(db, 'news_authors'));
      authorsSnap.forEach(doc => {
        const data = doc.data();
        const urlIdentifier = data.username || doc.id;
        addUrl(`/author/${urlIdentifier}`, '0.8', 'monthly', undefined, now);
      });
    } catch (e) { console.error("Sitemap Authors Error", e); }

    xml += `</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
