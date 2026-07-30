import styles from "./page.module.css";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import IPOPageClient from "./IPOPageClient";
import { Metadata } from "next";
import BreadcrumbSchema from "../../components/BreadcrumbSchema";

import { doc, getDoc } from "firebase/firestore";

export async function generateMetadata(): Promise<Metadata> {
  let title = "IPO News, Updates & Subscription Status | NetProfit";
  let description = "Track upcoming, active, and recently closed IPOs. Get live updates on price bands, issue dates, subscription rates, and allotment status. | NetProfit";
  let keywords = undefined;

  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data()?.ipo;
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

export default async function IPOPage() {
  let customSchema = undefined;
  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const seoData = docSnap.data()?.ipo;
      if (seoData?.customSchema) customSchema = seoData.customSchema;
    }
  } catch (e) {}

  let ipos: any[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, "ipos"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let serializedData = { ...data };
      if (serializedData.createdAt && typeof serializedData.createdAt.toDate === 'function') {
        serializedData.createdAt = serializedData.createdAt.toDate().toISOString();
      } else if (serializedData.createdAt && serializedData.createdAt.seconds) {
        serializedData.createdAt = new Date(serializedData.createdAt.seconds * 1000).toISOString();
      }
      
      if (serializedData.updatedAt && typeof serializedData.updatedAt.toDate === 'function') {
        serializedData.updatedAt = serializedData.updatedAt.toDate().toISOString();
      } else if (serializedData.updatedAt && serializedData.updatedAt.seconds) {
        serializedData.updatedAt = new Date(serializedData.updatedAt.seconds * 1000).toISOString();
      }
      ipos.push({ id: doc.id, ...serializedData });
    });
  } catch (error) {
    console.error("Error fetching IPOs:", error);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "IPO Watch",
    "url": "https://netprofit.in/ipo",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": ipos.map((ipo, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://netprofit.in/ipo/${ipo.slug || ipo.id}`
      }))
    }
  };

  return (
    <div className={styles.container}>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "IPO Watch", url: "/ipo" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {customSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: customSchema }} />
      )}
      <div className={styles.hero}>
        <h1 className={styles.title}>IPO Watch</h1>
        <p className={styles.subtitle}>Track upcoming, active, and recently closed Initial Public Offerings.</p>
      </div>

      <div className={styles.contentWrapper}>
        <IPOPageClient initialIpos={ipos} />
      </div>
    </div>
  );
}
