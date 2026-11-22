"use client";

import { useEffect, useState } from "react";
import styles from "../../news/page.module.css";
import Link from "next/link";
import { db } from "../../../lib/firebase";
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

export default function DashboardNewsPage() {
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
    <div style={{ padding: '0.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.5rem' }}>News & Updates</h1>
        <p style={{ color: 'var(--text-muted)' }}>Latest insights, updates, and announcements.</p>
      </div>

      <div style={{ width: '100%' }}>
        {loading ? (
          <div className="cleartax-card" style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
            Loading latest news...
          </div>
        ) : newsItems.length === 0 ? (
          <div className="cleartax-card" style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
            No news published yet. Check back later!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {newsItems.map((item) => (
              <article key={item.id} className="cleartax-card" style={{ background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                {item.imageUrl && (
                  <Link href={`/dashboard/news/${item.slug || item.id}`} style={{ display: 'block' }}>
                    <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
                      <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </Link>
                )}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {item.categories && item.categories.length > 0 
                      ? item.categories.map((cat: string) => (
                          <span key={cat} style={{ background: 'var(--bg-secondary)', color: 'var(--text-color)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                            {cat}
                          </span>
                        ))
                      : (
                          <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-color)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                            {item.category || 'Uncategorized'}
                          </span>
                        )
                    }
                  </div>
                  <Link href={`/dashboard/news/${item.slug || item.id}`} style={{ textDecoration: 'none', color: 'inherit', marginBottom: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, lineHeight: 1.4, color: 'var(--text-color)' }}>{item.title}</h2>
                  </Link>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 500 }}>
                    {item.date ? (typeof item.date === 'string' ? item.date : (typeof item.date.toDate === 'function' ? item.date.toDate().toLocaleDateString() : (item.date.seconds ? new Date(item.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'))) : 'Unknown Date'}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.excerpt}</p>
                  <Link href={`/dashboard/news/${item.slug || item.id}`} style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none', marginTop: 'auto' }}>
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
