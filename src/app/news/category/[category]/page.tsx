"use client";

import { useEffect, useState } from "react";
import styles from "../../page.module.css";
import Link from "next/link";
import { useParams } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

interface NewsItem {
  id: string;
  slug?: string;
  title: string;
  excerpt: string;
  date: any;
  category: string;
  categories?: string[];
  imageUrl?: string;
}

export default function CategoryNewsPage() {
  const params = useParams();
  const categoryName = params?.category ? decodeURIComponent(params.category as string) : "";
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      if (!categoryName) return;
      try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedNews: NewsItem[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const matchCategories = data.categories && data.categories.includes(categoryName);
          const matchCategory = data.category === categoryName;
          
          if (matchCategories || matchCategory) {
            fetchedNews.push({ id: doc.id, ...data } as NewsItem);
          }
        });
        
        setNewsItems(fetchedNews);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [categoryName]);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>{categoryName} News</h1>
        <p className={styles.subtitle}>Latest updates and articles in {categoryName}.</p>
      </div>

      <div className={styles.contentWrapper}>
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/news" className={styles.backLink} style={{ color: 'var(--text-color)' }}>
            ← Back to All News
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>Loading articles...</div>
        ) : newsItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>No news published in this category yet.</div>
        ) : (
          <div className={styles.newsGrid}>
            {newsItems.map((item) => (
              <article key={item.id} className={styles.newsCard}>
                {item.imageUrl && (
                  <Link href={`/news/${item.id}`} style={{ display: 'block' }}>
                    <div className={styles.cardImageContainer}>
                      <img src={item.imageUrl} alt={item.title} className={styles.cardImage} />
                    </div>
                  </Link>
                )}
                <div className={styles.cardContent}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {item.categories && item.categories.length > 0 
                      ? item.categories.map((cat: string) => (
                          <span key={cat} className={styles.categoryBadge} style={{ background: cat === categoryName ? 'var(--primary)' : 'var(--accent-color)' }}>
                            {cat}
                          </span>
                        ))
                      : (
                          <span className={styles.categoryBadge}>
                            {item.category || 'Uncategorized'}
                          </span>
                        )
                    }
                  </div>
                  <Link href={`/news/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h2 className={styles.newsTitle}>{item.title}</h2>
                  </Link>
                  <p className={styles.newsDate}>
                    {item.date ? (typeof item.date === 'string' ? item.date : (typeof item.date.toDate === 'function' ? item.date.toDate().toLocaleDateString() : (item.date.seconds ? new Date(item.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'))) : 'Unknown Date'}
                  </p>
                  <p className={styles.newsExcerpt}>{item.excerpt}</p>
                  <Link href={`/news/${item.id}`} className={styles.readMore}>
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
