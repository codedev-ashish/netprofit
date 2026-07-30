"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";

interface NewsItem {
  id: string;
  slug?: string;
  title: string;
  excerpt: string;
  date: any;
  category: string;
  categories?: string[];
  imageUrl?: string;
  imageAlt?: string;
  views?: number;
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
  return `${month} ${day}, ${year}`;
};

export default function NewsPageClient({ initialNewsItems }: { initialNewsItems: NewsItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Posts");

  const uniqueCategories = Array.from(new Set(initialNewsItems.flatMap(item => item.categories || [item.category || 'Uncategorized'])));
  const filterCategories = ["All Posts", ...uniqueCategories];

  const filteredNews = selectedCategory === "All Posts"
    ? initialNewsItems
    : initialNewsItems.filter(item => {
      const itemCats = item.categories || [item.category || 'Uncategorized'];
      return itemCats.includes(selectedCategory);
    });

  // For Hero Grid (Top 3 items)
  const heroItems = initialNewsItems.slice(0, 3);
  const remainingItems = initialNewsItems.slice(3);

  return (
    <>
      <div className={styles.pageLayout}>
        {/* Main Content Column */}
        <div className={styles.mainColumn}>
          
          {/* Hero Grid Section */}
          {heroItems.length > 0 && selectedCategory === "All Posts" && (
            <div className={styles.heroGrid}>
              {/* Main Hero Article */}
              {heroItems[0] && (
                <div className={styles.heroMain}>
                  <Link href={`/news/${heroItems[0].slug || heroItems[0].id}`} className={styles.heroCard}>
                    {heroItems[0].imageUrl && (
                      <div className={styles.heroImageWrapper}>
                        <Image src={heroItems[0].imageUrl} alt={heroItems[0].title} fill sizes="(max-width: 768px) 100vw, 60vw" className={styles.heroImage} />
                      </div>
                    )}
                    <div className={styles.heroContentOverlay}>
                      <span className={styles.categoryPill}>{heroItems[0].category || 'News'}</span>
                      <h2 className={styles.heroTitle}>{heroItems[0].title}</h2>
                      <div className={styles.heroMeta}>
                        <span>{formatDate(heroItems[0].date)}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
              
              {/* Secondary Hero Articles */}
              <div className={styles.heroSecondaryColumn}>
                {heroItems.slice(1, 3).map((item) => (
                  <Link key={item.id} href={`/news/${item.slug || item.id}`} className={styles.heroCardSecondary}>
                    {item.imageUrl && (
                      <div className={styles.heroImageWrapper}>
                        <Image src={item.imageUrl} alt={item.title} fill sizes="(max-width: 768px) 100vw, 30vw" className={styles.heroImage} />
                      </div>
                    )}
                    <div className={styles.heroContentOverlay}>
                      <span className={styles.categoryPillSmall}>{item.category || 'News'}</span>
                      <h3 className={styles.heroTitleSecondary}>{item.title}</h3>
                      <div className={styles.heroMeta}>
                        <span>{formatDate(item.date)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className={styles.filterContainer}>
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
          </div>

          {/* Main Feed Grid */}
          <div className={styles.newsGrid}>
            {(selectedCategory === "All Posts" ? remainingItems : filteredNews).map((item) => (
              <article key={item.id} className={styles.newsCard}>
                {item.imageUrl && (
                  <Link href={`/news/${item.slug || item.id}`} className={styles.cardImageLink}>
                    <div className={styles.cardImageContainer}>
                      <span className={styles.categoryPillAbsolute}>{item.category || 'News'}</span>
                      <Image src={item.imageUrl} alt={item.imageAlt || item.title} fill sizes="(max-width: 768px) 100vw, 400px" className={styles.cardImage} />
                    </div>
                  </Link>
                )}
                <div className={styles.cardContent}>
                  <Link href={`/news/${item.slug || item.id}`} className={styles.titleLink}>
                    <h2 className={styles.newsTitle}>{item.title}</h2>
                  </Link>
                  <p className={styles.newsDate}>
                    {formatDate(item.date)}
                  </p>
                  <p className={styles.newsExcerpt}>
                    {item.excerpt && item.excerpt.length > 100 ? `${item.excerpt.substring(0, 100)}...` : item.excerpt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebarColumn}>
          {/* Trending Widget */}
          <div className={styles.sidebarWidget}>
            <div className={styles.sidebarWidgetHeader}>
              <h3 className={styles.sidebarTitle}>Trending Now</h3>
              <div className={styles.titleAccent}></div>
            </div>
            <div className={styles.compactPostList}>
              {[...initialNewsItems].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((item, index) => (
                <Link key={item.id} href={`/news/${item.slug || item.id}`} className={styles.compactPostLink}>
                  <div className={styles.compactPost}>
                    <div className={styles.compactPostNumber}>{index + 1}</div>
                    <div className={styles.compactPostContent}>
                      <h4 className={styles.compactPostTitle}>{item.title}</h4>
                      <span className={styles.compactPostDate}>{formatDate(item.date)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Newsletter Widget */}
          <div className={styles.newsletterWidget}>
            <h3>Get Daily Updates</h3>
            <p>Subscribe to our newsletter for the latest business and tax news.</p>
            <input type="email" placeholder="Your Email Address" className={styles.newsletterInput} />
            <button className={styles.newsletterBtn}>Subscribe</button>
          </div>
        </aside>
      </div>
    </>
  );
}
