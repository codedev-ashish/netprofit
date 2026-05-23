"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import styles from "./page.module.css";
import { ArrowLeft } from "lucide-react";

export default function NewsDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      if (!params?.id) return;
      
      try {
        const docRef = doc(db, "news", params.id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setNews({ id: docSnap.id, ...docSnap.data() });
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
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <Link href="/news" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to News
          </Link>
          <span className={styles.categoryBadge}>{news.category}</span>
          <h1 className={styles.title}>{news.title}</h1>
          <p className={styles.date}>
            {news.date ? (typeof news.date === 'string' ? news.date : (typeof news.date.toDate === 'function' ? news.date.toDate().toLocaleDateString() : (news.date.seconds ? new Date(news.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'))) : 'Unknown Date'}
          </p>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        {news.imageUrl && (
          <div className={styles.imageContainer}>
            <img src={news.imageUrl} alt={news.title} className={styles.coverImage} />
          </div>
        )}
        <div className={styles.articleBody}>
          {news.content.split('\n').map((paragraph: string, idx: number) => (
            <p key={idx} className={styles.paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
