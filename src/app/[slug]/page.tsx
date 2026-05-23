"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import pageStyles from "./page.module.css";
import newsStyles from "./news.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SlugRendererPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [data, setData] = useState<any>(null);
  const [type, setType] = useState<"page" | "news" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        // 1. Try Custom Page
        const pageRef = doc(db, "pages", slug);
        const pageSnap = await getDoc(pageRef);
        
        if (pageSnap.exists()) {
          setData(pageSnap.data());
          setType("page");
          setLoading(false);
          return;
        }

        // 2. Try News by slug
        const newsQ = query(collection(db, "news"), where("slug", "==", slug));
        const newsSnap = await getDocs(newsQ);
        if (!newsSnap.empty) {
          setData({ id: newsSnap.docs[0].id, ...newsSnap.docs[0].data() });
          setType("news");
          setLoading(false);
          return;
        }

        // 3. Fallback: Try News by ID (for old URLs)
        const newsRef = doc(db, "news", slug);
        const newsDocSnap = await getDoc(newsRef);
        if (newsDocSnap.exists()) {
          setData({ id: newsDocSnap.id, ...newsDocSnap.data() });
          setType("news");
          setLoading(false);
          return;
        }

        // If none found
        setError(true);
      } catch (err) {
        console.error("Error fetching slug data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className={pageStyles.loadingContainer}>
        <div className={pageStyles.loader}>Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={pageStyles.errorContainer}>
        <h1>Page Not Found</h1>
        <p>The page or article you are looking for does not exist or has been removed.</p>
        <Link href="/" className={pageStyles.homeBtn}>Return to Home</Link>
      </div>
    );
  }

  if (type === "page") {
    return (
      <div className={pageStyles.pageContainer}>
        <div className={pageStyles.contentWrapper}>
          <div className={pageStyles.header}>
            <Link href="/" className={pageStyles.backLink}>
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <h1 className={pageStyles.title}>{data.title}</h1>
          </div>
          
          <div 
            className={pageStyles.richText}
            dangerouslySetInnerHTML={{ __html: data.content }} 
          />
        </div>
      </div>
    );
  }

  if (type === "news") {
    return (
      <div className={newsStyles.container}>
        <div className={newsStyles.hero}>
          <div className={newsStyles.heroContent}>
            <Link href="/news" className={newsStyles.backLink}>
              <ArrowLeft size={16} /> Back to News
            </Link>
            <span className={newsStyles.categoryBadge}>{data.category}</span>
            <h1 className={newsStyles.title}>{data.title}</h1>
            <p className={newsStyles.date}>
              {data.date ? (typeof data.date === 'string' ? data.date : (typeof data.date.toDate === 'function' ? data.date.toDate().toLocaleDateString() : (data.date.seconds ? new Date(data.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'))) : 'Unknown Date'}
            </p>
          </div>
        </div>

        <div className={newsStyles.contentWrapper}>
          {data.imageUrl && (
            <div className={newsStyles.imageContainer}>
              <img src={data.imageUrl} alt={data.title} className={newsStyles.coverImage} />
            </div>
          )}
          <div className={newsStyles.articleBody}>
            {data.content?.split('\n').map((paragraph: string, idx: number) => (
              <p key={idx} className={newsStyles.paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
