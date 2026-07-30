"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import styles from "./page.module.css";

interface SearchResult {
  id: string;
  type: "news" | "ipo" | "tools" | "services";
  title: string;
  description: string;
  url: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const typeParam = searchParams.get("type") || "all";

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const lowerQuery = query.toLowerCase();
      const newResults: SearchResult[] = [];

      try {
        const fetchNews = async () => {
          if (typeParam === "all" || typeParam === "news") {
            const snapshot = await getDocs(collection(db, "news"));
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (
                data.title?.toLowerCase().includes(lowerQuery) ||
                data.excerpt?.toLowerCase().includes(lowerQuery) ||
                data.category?.toLowerCase().includes(lowerQuery)
              ) {
                newResults.push({
                  id: doc.id,
                  type: "news",
                  title: data.title,
                  description: data.excerpt || "News article",
                  url: `/news/${data.slug || doc.id}`,
                });
              }
            });
          }
        };

        const fetchIpos = async () => {
          if (typeParam === "all" || typeParam === "ipo") {
            const snapshot = await getDocs(collection(db, "ipos"));
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (
                data.name?.toLowerCase().includes(lowerQuery) ||
                data.symbol?.toLowerCase().includes(lowerQuery) ||
                data.type?.toLowerCase().includes(lowerQuery)
              ) {
                newResults.push({
                  id: doc.id,
                  type: "ipo",
                  title: `${data.name} (${data.symbol})`,
                  description: `Status: ${data.status} | Type: ${data.type}`,
                  url: `/ipo/${data.slug || doc.id}`,
                });
              }
            });
          }
        };

        const fetchTools = async () => {
          if (typeParam === "all" || typeParam === "tools") {
            const snapshot = await getDocs(collection(db, "tools"));
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (
                data.name?.toLowerCase().includes(lowerQuery) ||
                data.description?.toLowerCase().includes(lowerQuery)
              ) {
                newResults.push({
                  id: doc.id,
                  type: "tools",
                  title: data.name,
                  description: data.description || "Financial Tool",
                  url: `/tools/${data.slug || doc.id}`,
                });
              }
            });
          }
        };

        const fetchServices = async () => {
          if (typeParam === "all" || typeParam === "services") {
            const snapshot = await getDocs(collection(db, "services"));
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (
                data.name?.toLowerCase().includes(lowerQuery) ||
                data.description?.toLowerCase().includes(lowerQuery)
              ) {
                // Strip HTML tags for the description
                let cleanDesc = data.description ? data.description.replace(/<[^>]*>?/gm, '') : "Financial Service";
                
                newResults.push({
                  id: doc.id,
                  type: "services",
                  title: data.name,
                  description: cleanDesc,
                  url: `/services/${data.slug || doc.id}`,
                });
              }
            });
          }
        };

        await Promise.all([fetchNews(), fetchIpos(), fetchTools(), fetchServices()]);
        setResults(newResults);
      } catch (error) {
        console.error("Error performing search:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, typeParam]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "news": return "News";
      case "ipo": return "IPO";
      case "tools": return "Tool";
      case "services": return "Service";
      default: return type;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Search Results</h1>
        <p className={styles.subtitle}>
          {query ? `Showing results for "${query}"` : "Enter a search term to begin."}
        </p>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.message}>Searching...</div>
        ) : !query.trim() ? (
          <div className={styles.message}>Please enter a search query above.</div>
        ) : results.length === 0 ? (
          <div className={styles.message}>No results found for "{query}".</div>
        ) : (
          <div className={styles.resultsGrid}>
            {results.map((result) => (
              <Link href={result.url} key={`${result.type}-${result.id}`} className={styles.resultCard}>
                <div className={styles.resultType}>{getTypeLabel(result.type)}</div>
                <h3 className={styles.resultTitle}>{result.title}</h3>
                <p className={styles.resultDesc}>{result.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center" }}>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
