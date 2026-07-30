import styles from "./page.module.css";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import NewsPageClient from "./NewsPageClient";
import { Metadata } from "next";
import BreadcrumbSchema from "../../components/BreadcrumbSchema";

import { doc, getDoc } from "firebase/firestore";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Latest News, Updates & Analysis of Finance, Tax, Stocks & Economy | NetProfit";
  let description = "Stay informed with breaking news and in-depth analysis on finance, business, tax updates, accounting standards, labour laws, and stock market trends. | NetProfit";
  let keywords = undefined;

  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data()?.news;
      if (data) {
        if (data.title) title = data.title;
        if (data.description) description = data.description;
        if (data.keywords) keywords = data.keywords;
      }
    }
  } catch (e) {}

  
  const decodeTitle = (t: any) => t ? String(t).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/gi, ' ') : t;
  return {
    title: { absolute: decodeTitle(title) },
    description,
    ...(keywords && { keywords }),
    openGraph: { title, description },
    twitter: { title, description }
  };
}

export const revalidate = 3600;

export default async function NewsPage() {
  let customSchema = undefined;
  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const seoData = docSnap.data()?.news;
      if (seoData?.customSchema) customSchema = seoData.customSchema;
    }
  } catch (e) {}

  let newsItems: any[] = [];
  try {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Serialize date for client component
      let serializedDate = data.date;
      if (data.date && typeof data.date.toDate === 'function') {
        serializedDate = data.date.toDate().toISOString();
      } else if (data.date && data.date.seconds) {
        serializedDate = new Date(data.date.seconds * 1000).toISOString();
      }

      newsItems.push({
        id: doc.id,
        ...data,
        date: serializedDate,
        createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt
      });
    });
  } catch (error) {
    console.error("Error fetching news:", error);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Latest Financial News",
    "url": "https://netprofit.in/news",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": newsItems.map((news, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://netprofit.in/news/${news.slug || news.id}`
      }))
    }
  };

  return (
    <div className={styles.container} suppressHydrationWarning>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "News", url: "/news" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {customSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: customSchema }} />
      )}
      <div className={styles.hero} suppressHydrationWarning>
        <h1 className={styles.title}>Latest Financial News</h1>
        <p className={styles.subtitle}>Stay informed with breaking news and in-depth analysis.</p>
      </div>

      <div className={styles.contentWrapper}>
        {newsItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>No news published yet. Check back later!</div>
        ) : (
          <NewsPageClient initialNewsItems={newsItems} />
        )}
      </div>
    </div>
  );
}
