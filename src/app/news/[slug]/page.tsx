import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, getDocs, query, limit, where, orderBy } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { ArrowLeft } from "lucide-react";
import ShareButtons from "../../../components/ShareButtons";
import { notFound } from "next/navigation";
import BreadcrumbSchema from "../../../components/BreadcrumbSchema";

const formatDate = (dateInput: any) => {
  if (!dateInput) return 'UNKNOWN DATE';
  let d;
  if (typeof dateInput === 'string') d = new Date(dateInput);
  else if (typeof dateInput.toDate === 'function') d = dateInput.toDate();
  else if (dateInput.seconds) d = new Date(dateInput.seconds * 1000);
  else return 'UNKNOWN DATE';

  if (isNaN(d.getTime())) return 'UNKNOWN DATE';
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const dynamic = 'force-dynamic';

import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let title = "News Article";
  let description = "";
  let imageUrl = "";
  let keywords = "";
  let publishedTime: string | undefined = undefined;
  let modifiedTime: string | undefined = undefined;
  let authorName: string | undefined = undefined;
  let categoryName: string | undefined = undefined;

  let isCustomMeta = false;

  try {
    const slugQuery = query(collection(db, "news"), where("slug", "==", slug), limit(1));
    const slugSnap = await getDocs(slugQuery);

    if (!slugSnap.empty) {
      const data = slugSnap.docs[0].data();
      title = data.title || title;
      keywords = data.seoKeywords || "";
      publishedTime = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt) : undefined;
      modifiedTime = data.updatedAt ? (typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt) : undefined;
      authorName = data.author || undefined;
      categoryName = data.category || undefined;
      if (data.metaDescription) {
        description = data.metaDescription;
        isCustomMeta = true;
      } else {
        description = data.excerpt || data.content || "";
      }
      imageUrl = data.imageUrl || "";
    } else {
      const docRef = doc(db, "news", slug);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        title = data.title || title;
        keywords = data.seoKeywords || "";
        publishedTime = data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt) : undefined;
        modifiedTime = data.updatedAt ? (typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt) : undefined;
        authorName = data.author || undefined;
        categoryName = data.category || undefined;
        if (data.metaDescription) {
          description = data.metaDescription;
          isCustomMeta = true;
        } else {
          description = data.excerpt || data.content || "";
        }
        imageUrl = data.imageUrl || "";
      }
    }
  } catch (error) {
    console.error("Error generating metadata for news:", error);
  }

  if (description && !isCustomMeta) {
    description = description.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').substring(0, 160);
  }

  
  const decodeTitle = (t: any) => t ? String(t).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/gi, ' ') : t;
  const metadata: Metadata = {
    title: { absolute: decodeTitle(title) },
    description: description,
    keywords: keywords ? keywords : undefined,
    openGraph: {
      title: decodeTitle(title),
      description: description,
      url: `https://netprofit.in/news/${slug}`,
      type: "article",
      siteName: "NetProfit",
      publishedTime,
      modifiedTime,
      authors: authorName ? [authorName] : undefined,
      section: categoryName,
      images: [
        {
          url: imageUrl || "https://netprofit.in/icon.svg",
          width: 512,
          height: 512,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: decodeTitle(title),
      description: description,
    }
  };

  if (imageUrl) {
    metadata.openGraph!.images = [{ url: imageUrl, width: 1200, height: 630 }];
    metadata.twitter!.images = [imageUrl];
  }

  if (!metadata.keywords) delete metadata.keywords;

  return metadata;
}

export default async function NewsDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!slug) return null;

  let newsData: any = null;
  let actualId = slug;

  try {
    const slugQuery = query(collection(db, "news"), where("slug", "==", slug), limit(1));
    const slugSnap = await getDocs(slugQuery);

    if (!slugSnap.empty) {
      const d = slugSnap.docs[0];
      newsData = { id: d.id, ...d.data() };
      actualId = d.id;
    } else {
      const docRef = doc(db, "news", slug);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        newsData = { id: docSnap.id, ...docSnap.data() };
      }
    }
  } catch (error) {
    console.error("Error fetching news on server:", error);
  }

  if (!newsData) {
    notFound();
  }

  let rawContent = newsData.content ? newsData.content.replace(/&nbsp;/g, ' ') : '';
  const extractedToc: any[] = [];
  let tocCounter = 0;

  if (rawContent) {
    rawContent = rawContent.replace(/<h([1-4])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match: string, level: string, attrs: string, innerHtml: string) => {
      let newLevel = level;
      if (newLevel === "1") {
        newLevel = "2";
      }

      let cleanText = innerHtml.replace(/<[^>]+>/g, '').trim();
      cleanText = cleanText
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&#039;/gi, "'")
        .replace(/&#x27;/gi, "'")
        .replace(/&nbsp;/gi, ' ');

      if (!cleanText) return match;

      let elementId = '';
      const idMatch = attrs.match(/id=['"](.*?)['"]/);
      if (idMatch) {
        elementId = idMatch[1];
      } else {
        tocCounter++;
        elementId = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `section-${tocCounter}`;
        attrs = ` id="${elementId}"` + attrs;
      }

      extractedToc.push({ level: parseInt(newLevel), text: cleanText, id: elementId });
      return `<h${newLevel}${attrs}>${innerHtml}</h${newLevel}>`;
    });
  }

  // rawContent = DOMPurify.sanitize(rawContent, { ADD_ATTR: ['target'] });

  let relatedNews: any[] = [];
  try {
    const q = query(collection(db, "news"), orderBy("date", "desc"), limit(7));
    const relSnap = await getDocs(q);
    relSnap.forEach((d) => {
      if (d.id !== actualId) {
        relatedNews.push({ id: d.id, ...d.data() });
      }
    });
    relatedNews = relatedNews.slice(0, 6);
  } catch (e) { }

  // Parse Date string for server rendering
  const dateString = formatDate(newsData.date || newsData.createdAt);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": newsData.title,
    "image": newsData.imageUrl ? [newsData.imageUrl] : [],
    "datePublished": newsData.createdAt ? (typeof newsData.createdAt.toDate === 'function' ? newsData.createdAt.toDate().toISOString() : newsData.createdAt) : undefined,
    "dateModified": newsData.updatedAt ? (typeof newsData.updatedAt.toDate === 'function' ? newsData.updatedAt.toDate().toISOString() : newsData.updatedAt) : undefined,
    "description": newsData.metaDescription || newsData.excerpt || undefined,
    "author": [{
      "@type": "Person",
      "name": newsData.author || "NetProfit Team",
      "url": "https://netprofit.in"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "NetProfit",
      "logo": {
        "@type": "ImageObject",
        "url": "https://netprofit.in/icon.svg"
      }
    }
  };

  return (
    <div className={styles.container}>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "News", url: "/news" },
        { name: newsData.title, url: `/news/${slug}` }
      ]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {newsData.customSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: newsData.customSchema }} />
      )}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', width: '100%' }}>
        <div style={{ maxWidth: '810px' }}>
          <Link href="/news" className={styles.backLink} style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} /> Back to News
          </Link>

          <h1 className={styles.title} style={{ color: 'var(--text-color)', fontSize: '2.5rem', marginTop: '1rem', fontWeight: 'bold' }}>
            {newsData.title ? String(newsData.title).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '”').replace(/&#39;/gi, '’').replace(/&#039;/gi, '’').replace(/&#x27;/gi, '’').replace(/'/g, '’').replace(/"/g, '”') : ''}
          </h1>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
            <p className={styles.date} style={{ color: 'var(--text-muted)', margin: 0 }}>
              By <strong style={{ color: 'var(--text-color)' }}>{newsData.author || "NetProfit Team"}</strong> • {dateString}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {Array.isArray(newsData.categories) && newsData.categories.length > 0
                ? newsData.categories.map((cat: string, index: number) => (
                  <Link key={`${cat}-${index}`} href={`/news/category/${encodeURIComponent(cat)}`} className={styles.categoryBadge} style={{ textDecoration: 'none' }}>
                    {cat}
                  </Link>
                ))
                : (
                  <Link href={`/news/category/${encodeURIComponent(newsData.category || 'Uncategorized')}`} className={styles.categoryBadge} style={{ textDecoration: 'none' }}>
                    {newsData.category || 'Uncategorized'}
                  </Link>
                )
              }
            </div>
          </div>

          <ShareButtons title={newsData.title} />

          {newsData.imageUrl && (
            <div className={styles.imageContainer} style={{ marginTop: '2rem', boxShadow: 'none', border: 'none', padding: 0 }}>
              <Image priority fetchPriority="high" unoptimized src={newsData.imageUrl} alt={newsData.imageAlt || newsData.title} width={1200} height={630} sizes="(max-width: 768px) 100vw, 810px" className={styles.coverImage} style={{ width: '100%', height: 'auto', aspectRatio: '1200/630', maxHeight: '500px', borderRadius: 'var(--radius)', objectFit: 'contain' }} />
            </div>
          )}
        </div>
      </div>

      <div className={styles.pageLayout} style={{ marginTop: '2rem' }}>
        <div className={styles.mainColumn}>
          {extractedToc.length > 0 && (
            <div className={`${styles.tocContainer} ${styles.mobileToc}`}>
              <h2 className={styles.tocTitle}>Table of Contents</h2>
              <ul className={styles.tocList}>
                {extractedToc.map((item, index) => (
                  <li key={`${item.id}-mobile-${index}`} className={`${styles.tocItem} ${styles[`tocItem${item.level}` as keyof typeof styles]}`}>
                    <a href={`#${item.id}`} className={styles.tocLink}>
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.articleBody} style={{ padding: '2rem 0', border: 'none', boxShadow: 'none', background: 'transparent' }} dangerouslySetInnerHTML={{ __html: rawContent.replace(/http:\/\//gi, 'https://') }} />

          {Array.isArray(newsData.tags) && newsData.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-color)', display: 'flex', alignItems: 'center' }}>Tags:</span>
              {newsData.tags.map((tag: string, index: number) => (
                <span key={`${tag}-${index}`} className={styles.tagBadge} style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.sidebarColumn}>
          {extractedToc.length > 0 && (
            <div className={`${styles.tocContainer} ${styles.desktopToc}`}>
              <h2 className={styles.tocTitle}>Table of Contents</h2>
              <ul className={styles.tocList}>
                {extractedToc.map((item, index) => (
                  <li key={`${item.id}-${index}`} className={`${styles.tocItem} ${styles[`tocItem${item.level}` as keyof typeof styles]}`}>
                    <a href={`#${item.id}`} className={styles.tocLink}>
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relatedNews.length > 0 && (
            <div className={styles.sidebarWidget}>
              <h3 className={styles.sidebarTitle}>Recent Articles</h3>
              <div className={styles.compactPostList}>
                {relatedNews.map((n) => {
                  const relDate = formatDate(n.date);
                  return (
                    <Link key={n.id} href={`/news/${n.slug || n.id}`} style={{ textDecoration: 'none' }}>
                      <div className={styles.compactPost}>
                        {n.imageUrl ? (
                          <div className={styles.compactPostImageContainer}>
                            <Image src={n.imageUrl} alt={n.title} width={100} height={60} className={styles.compactPostImage} style={{ objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div className={styles.compactPostImageContainer} style={{ background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            📰
                          </div>
                        )}
                        <div className={styles.compactPostContent}>
                          <span className={styles.compactPostDate}>{relDate}</span>
                          <h4 className={styles.compactPostTitle}>{n.title}</h4>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
