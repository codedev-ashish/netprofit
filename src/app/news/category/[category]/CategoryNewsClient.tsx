"use client";

import { useEffect, useState } from "react";
import styles from "../../page.module.css";
import Link from "next/link";
import Image from "next/image";
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

export default function CategoryNewsClient() {
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
                  <Link href={`/news/${item.slug || item.id}`} style={{ display: 'block' }}>
                    <div className={styles.cardImageContainer}>
                      <Image src={item.imageUrl} alt={item.title} width={400} height={250} sizes="(max-width: 768px) 100vw, 400px" className={styles.cardImage} style={{ objectFit: 'cover' }} />
                    </div>
                  </Link>
                )}
                <div className={styles.cardContent}>
                  <p className={styles.newsDate} style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                    {formatDate(item.date)}
                  </p>
                  <Link href={`/news/${item.slug || item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h2 className={styles.newsTitle} style={{ fontSize: '1.2rem', lineHeight: 1.4, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, lineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h2>
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
