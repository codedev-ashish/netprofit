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
  categories?: string[];
  imageUrl?: string;
  views?: number;
}

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Posts");

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

  const uniqueCategories = Array.from(new Set(newsItems.flatMap(item => item.categories || [item.category || 'Uncategorized'])));
  const filterCategories = ["All Posts", ...uniqueCategories];

  const filteredNews = selectedCategory === "All Posts"
    ? newsItems
    : newsItems.filter(item => {
      const itemCats = item.categories || [item.category || 'Uncategorized'];
      return itemCats.includes(selectedCategory);
    });

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
          <>
            <div className={styles.pageLayout}>
              {/* Main Content Column */}
              <div className={styles.mainColumn}>
                <div className={styles.categoryHeader}>
                  <h3>Featured Blogs</h3>
                </div>
                <div className={styles.newsGrid}>
                  {newsItems.map((item) => (
                    <article key={item.id} className={styles.newsCard}>
                      {item.imageUrl && (
                        <Link href={`/news/${item.slug || item.id}`} style={{ display: 'block' }}>
                          <div className={styles.cardImageContainer}>
                            <img src={item.imageUrl} alt={item.title} className={styles.cardImage} />
                          </div>
                        </Link>
                      )}
                      <div className={styles.cardContent}>
                        <p className={styles.newsDate}>
                          {item.date ? (typeof item.date === 'string' ? item.date : (typeof item.date.toDate === 'function' ? item.date.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : (item.date.seconds ? new Date(item.date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : 'UNKNOWN DATE'))) : 'UNKNOWN DATE'}
                        </p>
                        <Link href={`/news/${item.slug || item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <h2 className={styles.newsTitle}>{item.title}</h2>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className={styles.sidebarColumn}>
                {/* Top Viewed Widget */}
                <div className={styles.sidebarWidget}>
                  <h3 className={styles.sidebarTitle}>Top Viewed</h3>
                  <div className={styles.compactPostList}>
                    {[...newsItems].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((item) => (
                      <Link key={item.id} href={`/news/${item.slug || item.id}`} style={{ textDecoration: 'none' }}>
                        <div className={styles.compactPost}>
                          {item.imageUrl ? (
                            <div className={styles.compactPostImageContainer}>
                              <img src={item.imageUrl} alt={item.title} className={styles.compactPostImage} />
                            </div>
                          ) : (
                            <div className={styles.compactPostImageContainer} style={{ background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              📰
                            </div>
                          )}
                          <div className={styles.compactPostContent}>
                            <span className={styles.compactPostDate}>
                              {item.date ? (typeof item.date === 'string' ? item.date : (typeof item.date.toDate === 'function' ? item.date.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : (item.date.seconds ? new Date(item.date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : 'UNKNOWN DATE'))) : 'UNKNOWN DATE'}
                            </span>
                            <h4 className={styles.compactPostTitle}>{item.title}</h4>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Explore by Category Full Width Section */}
            <div className={styles.exploreSectionWrapper}>
              <div className={styles.exploreContainer}>
                <h2 className={styles.exploreMainTitle}>Explore by Category</h2>
                <div className={styles.filterPillsContainer}>
                  {filterCategories.map(cat => (
                    <button
                      key={cat}
                      className={`${styles.filterPill} ${selectedCategory === cat ? styles.activePill : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className={styles.exploreGrid}>
                  {filteredNews.map((item) => (
                    <article key={item.id} className={styles.exploreCard}>
                      {item.imageUrl && (
                        <Link href={`/news/${item.slug || item.id}`} style={{ display: 'block' }}>
                          <div className={styles.cardImageContainer}>
                            <img src={item.imageUrl} alt={item.title} className={styles.cardImage} />
                          </div>
                        </Link>
                      )}
                      <div className={styles.exploreCardContent}>
                        <Link href={`/news/${item.slug || item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <h3 className={styles.exploreCardTitle}>{item.title}</h3>
                        </Link>
                        <hr className={styles.exploreCardDivider} />
                        <p className={styles.exploreCardDate}>
                          {item.date ? (typeof item.date === 'string' ? item.date : (typeof item.date.toDate === 'function' ? item.date.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : (item.date.seconds ? new Date(item.date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : 'UNKNOWN DATE'))) : 'UNKNOWN DATE'}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
