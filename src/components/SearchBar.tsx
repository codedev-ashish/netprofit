"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import styles from "./SearchBar.module.css";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}&type=${type}`);
    }
  };

  return (
    <div ref={containerRef} className={styles.searchContainer}>
      {!isExpanded ? (
        <button 
          type="button"
          aria-label="Open search"
          className={styles.searchIconBtn}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
          }}
        >
          <Search size={20} />
        </button>
      ) : (
        <form 
          className={styles.searchForm} 
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
          suppressHydrationWarning={true}
        >
          <select 
            id="searchType"
            name="searchType"
            aria-label="Search Type"
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className={styles.searchSelect}
          >
            <option value="all">All</option>
            <option value="news">News</option>
            <option value="ipo">IPO</option>
            <option value="tools">Tools</option>
            <option value="services">Services</option>
          </select>
          <input
            id="searchQuery"
            name="searchQuery"
            aria-label="Search Query"
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
          <button type="submit" className={styles.searchButton} aria-label="Submit search">
            <Search size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
