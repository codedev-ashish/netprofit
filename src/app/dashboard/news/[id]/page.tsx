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
    <div className={styles.container} style={{ minHeight: 'auto' }}>
      <div className={styles.hero} style={{ borderRadius: '8px', padding: '2rem' }}>
        <div className={styles.heroContent} style={{ maxWidth: '100%' }}>
          <Link href="/dashboard/news" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to News
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {news.categories && news.categories.length > 0 
              ? news.categories.map((cat: string) => (
                  <span key={cat} className={styles.categoryBadge}>{cat}</span>
                ))
              : (
                  <span className={styles.categoryBadge}>{news.category || 'Uncategorized'}</span>
                )
            }
          </div>
          <h1 className={styles.title} style={{ fontSize: '2rem' }}>{news.title}</h1>
          <p className={styles.date}>
            {news.date ? (typeof news.date === 'string' ? news.date : (typeof news.date.toDate === 'function' ? news.date.toDate().toLocaleDateString() : (news.date.seconds ? new Date(news.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'))) : 'Unknown Date'}
          </p>
          {news.tags && news.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {news.tags.map((tag: string) => (
                <span key={tag} className={styles.tagBadge}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.contentWrapper} style={{ maxWidth: '100%', padding: '0', marginTop: '2rem' }}>
        {news.imageUrl && (
          <div className={styles.imageContainer}>
            <img src={news.imageUrl} alt={news.title} className={styles.coverImage} />
          </div>
        )}
        <div className={styles.articleBody} dangerouslySetInnerHTML={{ __html: news.content.replace(/http:\/\//gi, 'https://') }} />
      </div>

      {relatedNews.length > 0 && (
        <div className={styles.relatedSection} style={{ maxWidth: '100%', padding: '0', marginTop: '3rem' }}>
          <h2 className={styles.relatedTitle}>Related News</h2>
          <div className={styles.relatedGrid}>
            {relatedNews.map(n => (
              <Link href={`/dashboard/news/${n.slug || n.id}`} key={n.id} className={styles.relatedCard}>
                {n.imageUrl ? (
                  <div className={styles.relatedImage} style={{ backgroundImage: `url(${n.imageUrl})` }} />
                ) : (
                  <div className={styles.relatedImagePlaceholder}>No Image</div>
                )}
                <div className={styles.relatedContent}>
                  <div className={styles.relatedCategory} style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {(n.categories && n.categories.length > 0) ? n.categories.map((cat: string) => <span key={cat}>{cat}</span>) : <span>{n.category || 'Uncategorized'}</span>}
                  </div>
                  <h3 className={styles.relatedCardTitle}>{n.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
