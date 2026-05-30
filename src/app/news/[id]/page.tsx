"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import Link from "next/link";
import styles from "./page.module.css";
import { ArrowLeft } from "lucide-react";

export default function NewsDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [news, setNews] = useState<any>(null);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<any[]>([]);
  const [processedContent, setProcessedContent] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      if (!params?.id) return;
      
      try {
        let newsData: any = null;
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
          let rawContent = newsData.content ? newsData.content.replace(/&nbsp;/g, ' ') : '';
          const extractedToc: any[] = [];
          
          if (rawContent) {
            // Match h1, h2, h3, h4 tags to generate table of contents
            rawContent = rawContent.replace(/<h([1-4])([^>]*)>(.*?)<\/h\1>/gi, (match: string, level: string, attrs: string, innerHtml: string) => {
              const cleanText = innerHtml.replace(/<[^>]+>/g, '').trim();
              if (!cleanText) return match;
              
              let id = '';
              const idMatch = attrs.match(/id=['"](.*?)['"]/);
              if (idMatch) {
                id = idMatch[1];
              } else {
                id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `section-${Math.random().toString(36).substring(2, 9)}`;
                attrs = ` id="${id}"` + attrs;
              }
              
              extractedToc.push({ level: parseInt(level), text: cleanText, id });
              return `<h${level}${attrs}>${innerHtml}</h${level}>`;
            });
          }
          
          setToc(extractedToc);
          setProcessedContent(rawContent);
          setNews(newsData);
          
          try {
            // Remove orderBy to prevent missing documents that lack a createdAt field
            const q = query(collection(db, "news"), limit(7));
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
          router.push("/news");
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
    <div className={styles.container}>
      {/* Header spanning full width but constrained to align with left column */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', width: '100%' }}>
        <div style={{ maxWidth: '810px' }}>
          <Link href="/news" className={styles.backLink} style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} /> Back to News
          </Link>
          
          <h1 className={styles.title} style={{ color: 'var(--text-color)', fontSize: '2.5rem', marginTop: '1rem' }}>{news.title}</h1>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
            <p className={styles.date} style={{ color: 'var(--text-muted)', margin: 0 }}>
              {news.date ? (typeof news.date === 'string' ? news.date : (typeof news.date.toDate === 'function' ? news.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (news.date.seconds ? new Date(news.date.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date'))) : 'Unknown Date'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {news.categories && news.categories.length > 0 
                ? news.categories.map((cat: string, index: number) => (
                    <Link key={`${cat}-${index}`} href={`/news/category/${encodeURIComponent(cat)}`} className={styles.categoryBadge} style={{ textDecoration: 'none' }}>
                      {cat}
                    </Link>
                  ))
                : (
                    <Link href={`/news/category/${encodeURIComponent(news.category || 'Uncategorized')}`} className={styles.categoryBadge} style={{ textDecoration: 'none' }}>
                      {news.category || 'Uncategorized'}
                    </Link>
                  )
              }
            </div>
          </div>

          {news.imageUrl && (
            <div className={styles.imageContainer} style={{ marginTop: '2rem', boxShadow: 'none', border: 'none', padding: 0 }}>
              <img src={news.imageUrl} alt={news.title} className={styles.coverImage} style={{ width: '100%', height: 'auto', maxHeight: '500px', borderRadius: 'var(--radius)' }} />
            </div>
          )}
        </div>
      </div>

      <div className={styles.pageLayout} style={{ marginTop: '2rem' }}>
        
        {/* Main Content Column */}
        <div className={styles.mainColumn}>

          <div className={styles.articleBody} style={{ padding: '2rem 0', border: 'none', boxShadow: 'none', background: 'transparent' }} dangerouslySetInnerHTML={{ __html: processedContent }} />
          
          {news.tags && news.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-color)', display: 'flex', alignItems: 'center' }}>Tags:</span>
              {news.tags.map((tag: string, index: number) => (
                <span key={`${tag}-${index}`} className={styles.tagBadge} style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={styles.sidebarColumn}>
          {toc.length > 0 && (
            <div className={styles.tocContainer}>
              <h3 className={styles.tocTitle}>Table of Contents</h3>
              <ul className={styles.tocList}>
                {toc.map((item, index) => (
                  <li key={`${item.id}-${index}`} className={`${styles.tocItem} ${styles[`tocItem${item.level}` as keyof typeof styles]}`}>
                    <a href={`#${item.id}`} className={styles.tocLink} onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(item.id);
                      if (element) {
                        const yOffset = -100; // Account for sticky navbar
                        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                        window.scrollTo({top: y, behavior: 'smooth'});
                      }
                    }}>
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relatedNews.length > 0 && (
            <div className={styles.sidebarWidget}>
              <h3 className={styles.sidebarTitle}>Recent Articles</h3>
              <div className={styles.compactPostList}>
                {relatedNews.map((n) => (
                  <Link key={n.id} href={`/news/${n.slug || n.id}`} style={{ textDecoration: 'none' }}>
                    <div className={styles.compactPost}>
                      {n.imageUrl ? (
                        <div className={styles.compactPostImageContainer}>
                          <img src={n.imageUrl} alt={n.title} className={styles.compactPostImage} />
                        </div>
                      ) : (
                        <div className={styles.compactPostImageContainer} style={{ background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          📰
                        </div>
                      )}
                      <div className={styles.compactPostContent}>
                        <span className={styles.compactPostDate}>
                           {n.date ? (typeof n.date === 'string' ? n.date : (typeof n.date.toDate === 'function' ? n.date.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : (n.date.seconds ? new Date(n.date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : 'UNKNOWN DATE'))) : 'UNKNOWN DATE'}
                        </span>
                        <h4 className={styles.compactPostTitle}>{n.title}</h4>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
