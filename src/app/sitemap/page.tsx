import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import styles from './page.module.css';

export const revalidate = 3600; // Cache for 1 hour

export const metadata = {
  title: 'Sitemap easily navigate - NetProfit',
  description: 'Explore the NetProfit sitemap to easily navigate our platform and find all available services, financial tools, tax calculators, news, and IPO updates.',
};

export default async function SitemapPage() {
  const services: { title: string, slug: string }[] = [];
  const news: { title: string, slug: string }[] = [];
  const ipos: { title: string, slug: string }[] = [];
  const tools: { title: string, slug: string }[] = [];
  const pages: { title: string, slug: string }[] = [];

  // Fetch all collections concurrently to reduce TTFB
  const promises = [
    getDocs(collection(db, 'services')),
    getDocs(collection(db, 'news')),
    getDocs(collection(db, 'ipos')),
    getDocs(collection(db, 'tools')),
    getDocs(collection(db, 'pages'))
  ];

  const results = await Promise.allSettled(promises);

  // Process Services
  if (results[0].status === 'fulfilled') {
    results[0].value.forEach(doc => {
      const data = doc.data();
      if (data.slug && data.isPublished !== false) {
        services.push({ title: data.title || data.name || data.slug, slug: `/services/${data.slug}` });
      }
    });
  }

  // Process News
  if (results[1].status === 'fulfilled') {
    results[1].value.forEach(doc => {
      const data = doc.data();
      if (data.isPublished !== false) {
        const id = data.slug || doc.id;
        news.push({ title: data.title || id, slug: `/news/${id}` });
      }
    });
  }

  // Process IPOs
  if (results[2].status === 'fulfilled') {
    results[2].value.forEach(doc => {
      const data = doc.data();
      if (data.slug) {
        ipos.push({ title: data.name || data.title || data.slug, slug: `/ipo/${data.slug}` });
      }
    });
  }

  // Process Tools
  if (results[3].status === 'fulfilled') {
    results[3].value.forEach(doc => {
      const data = doc.data();
      if (data.slug && data.isPublished !== false) {
        tools.push({ title: data.title || data.name || data.slug, slug: `/tools/${data.slug}` });
      }
    });
  }

  // Process Pages
  if (results[4].status === 'fulfilled') {
    results[4].value.forEach(doc => {
      const data = doc.data();
      if (data.slug && data.isPublished !== false) {
        pages.push({ title: data.title || data.slug, slug: `/${data.slug}` });
      }
    });
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sitemap - NetProfit</h1>

      <div className={styles.grid}>
        <div className={styles.section}>
          <h2 className={styles.heading}>Main Pages</h2>
          <div className={styles.linkList}>
            <Link href="/" className={styles.link}>Home</Link>
            <Link href="/services" className={styles.link}>Services</Link>
            <Link href="/news" className={styles.link}>News</Link>
            <Link href="/ipo" className={styles.link}>IPO Watch</Link>
            <Link href="/tools" className={styles.link}>Tools &amp; Calculators</Link>
            <Link href="/auth" className={styles.link}>Login / Register</Link>
            {pages.map(p => <Link key={p.slug} href={p.slug} className={styles.link}>{p.title}</Link>)}
          </div>
        </div>

        {services.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.heading}>Services</h2>
            <div className={styles.linkList}>
              {services.map(p => <Link key={p.slug} href={p.slug} className={styles.link}>{p.title}</Link>)}
            </div>
          </div>
        )}

        {tools.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.heading}>Tools &amp; Calculators</h2>
            <div className={styles.linkList}>
              {tools.map(p => <Link key={p.slug} href={p.slug} className={styles.link}>{p.title}</Link>)}
            </div>
          </div>
        )}

        {news.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.heading}>News &amp; Articles</h2>
            <div className={styles.linkList}>
              {news.map(p => <Link key={p.slug} href={p.slug} className={styles.link}>{p.title}</Link>)}
            </div>
          </div>
        )}

        {ipos.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.heading}>IPOs</h2>
            <div className={styles.linkList}>
              {ipos.map(p => <Link key={p.slug} href={p.slug} className={styles.link}>{p.title}</Link>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
