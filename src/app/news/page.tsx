"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

interface NewsItem {
  id: string;
  slug?: string;
  title: string;
  excerpt: string;
  date: any;
  category: string;
  imageUrl?: string;
}

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedNews: NewsItem[] = [];
        querySnapshot.forEach((doc) => {
          fetchedNews.push({ id: doc.id, ...doc.data() } as NewsItem);
        });
        setNewsItems(fetchedNews);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Latest Financial News</h1>
        <p className={styles.subtitle}>Stay informed with breaking news and in-depth analysis.</p>
      </div>

      <div className={styles.contentWrapper}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>Loading latest news...</div>
        ) : newsItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>No news published yet. Check back later!</div>
        ) : (
          <div className={styles.newsGrid}>
            {newsItems.map((item) => (
              <article key={item.id} className={styles.newsCard}>
                {item.imageUrl && (
                  <div className={styles.cardImageContainer}>
                    <img src={item.imageUrl} alt={item.title} className={styles.cardImage} />
                  </div>
                )}
                <div className={styles.cardContent}>
                  <span className={styles.categoryBadge}>{item.category}</span>
                  <h2 className={styles.newsTitle}>{item.title}</h2>
                  <p className={styles.newsDate}>
                    {item.date ? (typeof item.date === 'string' ? item.date : (typeof item.date.toDate === 'function' ? item.date.toDate().toLocaleDateString() : (item.date.seconds ? new Date(item.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'))) : 'Unknown Date'}
                  </p>
                  <p className={styles.newsExcerpt}>{item.excerpt}</p>
                  <Link href={`/${item.slug || item.id}`} className={styles.readMore}>
                    Read Full Article →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
