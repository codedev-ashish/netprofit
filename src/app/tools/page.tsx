import Link from "next/link";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Calculator } from "lucide-react";
import styles from "../page.module.css";
import { Metadata } from "next";
import BreadcrumbSchema from "../../components/BreadcrumbSchema";

import { doc, getDoc } from "firebase/firestore";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Financial, Investment & Tax Calculators | NetProfit";
  let description = "Plan your finances better with our free online calculators. Easily estimate your ITR, monthly SIP, loan EMIs, PPF growth, gratuity, and more today.";
  let keywords = undefined;

  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data()?.tools;
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

export const revalidate = 3600; // Revalidate every hour

export default async function ToolsListPage() {
  let customSchema = undefined;
  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const seoData = docSnap.data()?.tools;
      if (seoData?.customSchema) customSchema = seoData.customSchema;
    }
  } catch (e) {}

  let tools: any[] = [];
  try {
    const q = query(collection(db, "tools"), where("isPublished", "==", true));
    const snapshot = await getDocs(q);
    snapshot.forEach((doc) => {
      tools.push({ id: doc.id, ...doc.data() });
    });
  } catch (error) {
    console.error("Error fetching tools:", error);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Financial & Tax Calculators",
    "url": "https://netprofit.in/tools",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": tools.map((tool, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://netprofit.in/tools/${tool.slug || tool.id}`
      }))
    }
  };

  return (
    <div className={styles.container}>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Tools", url: "/tools" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {customSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: customSchema }} />
      )}
      <div className={styles.hero}>
        <h1 className={styles.title}>Financial & Tax Calculators</h1>
        <p className={styles.subtitle}>Plan your finances better with our free online tools.</p>
      </div>

      <div className={styles.section}>
        {tools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No calculators available at the moment.</div>
        ) : (
          <div className={styles.servicesGrid} style={{ gap: '2rem' }}>
            {tools.map(tool => (
              <div key={tool.id} className="cleartax-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem', background: 'var(--card-bg)' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255, 107, 0, 0.1)', color: 'var(--accent-color)' }}>
                  <Calculator size={28} />
                </div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.4rem', fontWeight: 800 }}>
                  <Link href={`/tools/${tool.slug}`} style={{ textDecoration: 'none', color: 'var(--text-color)', transition: 'color 0.2s' }} className={styles.linkHover}>
                    {tool.name}
                  </Link>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, flexGrow: 1 }}>
                  {tool.description ? (tool.description.split(' ').length > 50 ? tool.description.split(' ').slice(0, 50).join(' ') + '...' : tool.description) : ''}
                </p>
                <div style={{ marginTop: '2rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <Link href={`/tools/${tool.slug}`} style={{ textDecoration: 'none', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }} className={styles.toolBtnHover}>
                    Use Tool <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
