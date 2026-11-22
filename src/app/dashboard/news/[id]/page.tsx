"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import Link from "next/link";
import styles from "@/app/news/[slug]/page.module.css";
import { ArrowLeft } from "lucide-react";

export default function DashboardNewsDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [news, setNews] = useState<any>(null);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      if (!params?.id) return;
      
      try {
        let newsData = null;
        let actualId = params.id as string;
        
        const slugQuery = query(collection(db, "news"), where("slug", "==", params.id), limit(1));
        const slugSnap = await getDocs(slugQuery);
        
        if (!slugSnap.empty) {
          const d = slugSnap.docs[0];
          newsData = { id: d.id, ...d.data() };
          actualId = d.id;
        } else {
          const docRef = doc(db, "news", params.id as string);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            newsData = { id: docSnap.id, ...docSnap.data() };
          }
        }
        
        if (newsData) {
          setNews(newsData);
          try {
            const q = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(7));
            const relSnap = await getDocs(q);
            const related: any[] = [];
            relSnap.forEach((d) => {
              if (d.id !== actualId) {
                related.push({ id: d.id, ...d.data() });
              }
            });
            setRelatedNews(related.slice(0, 6));
          } catch (e) {
            console.error("Error fetching related news", e);
          }
        } else {
          router.push("/dashboard/news");
        }
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [params?.id, router]);

  if (loading) {
    return <div className={styles.loadingState}>Loading article...</div>;
  }

  if (!news) return null;

  return (
    <div style={{ padding: '0.5rem' }}>
      <Link href="/dashboard/news" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem', fontWeight: 500 }}>
        <ArrowLeft size={16} /> Back to News
      </Link>
      
      <div className="cleartax-card" style={{ padding: '2rem', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        {news.imageUrl && (
          <div style={{ width: '100%', marginBottom: '2rem', borderRadius: '8px', overflow: 'hidden' }}>
            <img src={news.imageUrl} alt={news.title} style={{ width: '100%', maxHeight: '450px', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {news.categories && news.categories.length > 0 
            ? news.categories.map((cat: string) => (
                <span key={cat} style={{ background: 'var(--accent-color)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>{cat}</span>
              ))
            : (
                <span style={{ background: 'var(--accent-color)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>{news.category || 'Uncategorized'}</span>
              )
          }
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.5rem', lineHeight: 1.2 }}>{news.title}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontWeight: 500 }}>
          {news.date ? (typeof news.date === 'string' ? news.date : (typeof news.date.toDate === 'function' ? news.date.toDate().toLocaleDateString() : (news.date.seconds ? new Date(news.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'))) : 'Unknown Date'}
        </p>

        <div className="articleContent" style={{ color: 'var(--text-color)', lineHeight: 1.8, fontSize: '1.05rem' }} dangerouslySetInnerHTML={{ __html: news.content ? news.content.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>').replace(/http:\/\//gi, 'https://') : '' }} />

        {news.tags && news.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
            {news.tags.map((tag: string) => (
              <span key={tag} style={{ background: 'var(--bg-secondary)', color: 'var(--text-color)', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {relatedNews.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-color)', marginBottom: '1.5rem', fontWeight: 700 }}>Related News</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {relatedNews.map(n => (
              <Link href={`/dashboard/news/${n.slug || n.id}`} key={n.id} style={{ textDecoration: 'none', background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                {n.imageUrl ? (
                  <div style={{ height: '160px', backgroundImage: `url(${n.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                ) : (
                  <div style={{ height: '160px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
                )}
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 700, margin: 0, lineHeight: 1.4 }}>{n.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
