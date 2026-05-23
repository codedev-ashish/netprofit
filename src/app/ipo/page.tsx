"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

interface IPOItem {
  id: string;
  slug?: string;
  name: string;
  symbol: string;
  type: string;
  status: "upcoming" | "active" | "closed" | string;
  priceBand?: string;
  lotSize?: string;
  issueSize?: number;
  timeline?: {
    openDate?: string;
    closeDate?: string;
  };
  openDate?: string;
  closeDate?: string;
}

export default function IPOPage() {
  const [ipos, setIpos] = useState<IPOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"All" | "Mainboard" | "SME">("All");

  useEffect(() => {
    const fetchIPOs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "ipos"));
        const data: IPOItem[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as IPOItem);
        });
        setIpos(data);
      } catch (error) {
        console.error("Error fetching IPOs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIPOs();
  }, []);

  const getStatusClass = (status: string) => {
    if (status.toLowerCase() === 'upcoming') return styles.statusUpcoming;
    if (status.toLowerCase() === 'active') return styles.statusActive;
    return styles.statusClosed;
  };

  const filteredIpos = ipos.filter(ipo => {
    if (activeTab === "All") return true;
    return ipo.type?.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>IPO Watch</h1>
        <p className={styles.subtitle}>Track upcoming, active, and recently closed Initial Public Offerings.</p>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tab} ${activeTab === "All" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("All")}
          >
            All IPOs
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "Mainboard" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("Mainboard")}
          >
            Mainboard
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "SME" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("SME")}
          >
            SME
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading IPO data...</div>
        ) : filteredIpos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No IPOs currently listed in this category. Please check back later.</div>
        ) : (
          <div className={styles.ipoGrid}>
            {filteredIpos.map((ipo) => (
              <div key={ipo.id} className={styles.ipoCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.companyInfo}>
                    <span className={styles.companyName}>{ipo.name}</span>
                    <span className={styles.companySymbol}>{ipo.symbol}</span>
                  </div>
                  <span className={`${styles.statusBadge} ${getStatusClass(ipo.status)}`}>
                    {ipo.status}
                  </span>
                </div>
                
                <div className={styles.cardBody}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Type</span>
                    <span className={styles.detailValue}>{ipo.type || "N/A"}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Lot Size</span>
                    <span className={styles.detailValue}>{ipo.lotSize || "N/A"}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>IPO Open</span>
                    <span className={styles.detailValue}>
                      {ipo.timeline?.openDate || ipo.openDate ? new Date(ipo.timeline?.openDate || ipo.openDate!).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>IPO Close</span>
                    <span className={styles.detailValue}>
                      {ipo.timeline?.closeDate || ipo.closeDate ? new Date(ipo.timeline?.closeDate || ipo.closeDate!).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>IPO Size</span>
                    <span className={styles.detailValue}>
                      {ipo.issueSize ? `${ipo.issueSize} Cr` : "N/A"}
                    </span>
                  </div>
                </div>

                <Link href={`/ipo/${ipo.slug || ipo.id}`} className={styles.actionBtn}>
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
