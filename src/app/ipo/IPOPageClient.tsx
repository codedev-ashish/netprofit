"use client";

import { useState } from "react";
import styles from "./page.module.css";
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
  issueDetailsFields?: { id: string; label: string; value: string }[];
  timelineFields?: { id: string; label: string; value: string }[];
  isVisible?: boolean;
}

export default function IPOPageClient({ initialIpos }: { initialIpos: IPOItem[] }) {
  const [activeTab, setActiveTab] = useState<"All" | "Mainboard" | "SME">("All");
  const [activeStatusTab, setActiveStatusTab] = useState<"All" | "Upcoming" | "Open" | "Closed" | "Listed">("All");

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'upcoming') return styles.statusUpcoming;
    if (s === 'open' || s === 'active' || s === 'listed') return styles.statusActive;
    return styles.statusClosed;
  };

  const getCalculatedStatus = (ipo: IPOItem) => {
    if (!ipo) return "Upcoming";
    
    const now = new Date();
    
    const parseDate = (d?: string | number) => {
      if (!d || d === "TBA") return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const openDateStr = ipo.timelineFields?.find(f => f.id === 'openDate')?.value || ipo.timeline?.openDate || ipo.openDate;
    const closeDateStr = ipo.timelineFields?.find(f => f.id === 'closeDate')?.value || ipo.timeline?.closeDate || ipo.closeDate;
    const listingDateStr = ipo.timelineFields?.find(f => f.id === 'listingDate')?.value || (ipo.timeline as any)?.listingDate || (ipo as any).listingDate;

    const openDate = parseDate(openDateStr);
    const closeDate = parseDate(closeDateStr);
    const listingDate = parseDate(listingDateStr);
    
    if (closeDate) {
      closeDate.setHours(16, 0, 0, 0); 
    }
    
    if (listingDate && now >= listingDate) return "Listed";
    if (closeDate && now > closeDate) return "Closed";
    if (openDate && now >= openDate) {
      if (!closeDate || now <= closeDate) return "Open";
    }
    if (openDate && now < openDate) return "Upcoming";
    
    return ipo.status;
  };

  const filteredIpos = initialIpos.filter(ipo => {
    if (ipo.isVisible === false) return false;
    
    if (activeTab !== "All" && ipo.type?.toLowerCase() !== activeTab.toLowerCase()) return false;

    if (activeStatusTab !== "All") {
      const status = getCalculatedStatus(ipo);
      if (status.toLowerCase() !== activeStatusTab.toLowerCase()) return false;
    }
    
    return true;
  });

  const sortedIpos = [...filteredIpos].sort((a, b) => {
    const statusA = getCalculatedStatus(a).toLowerCase();
    const statusB = getCalculatedStatus(b).toLowerCase();
    
    const statusPriority: Record<string, number> = {
      'open': 1,
      'upcoming': 2,
      'listed': 3,
      'closed': 4
    };
    
    const priorityA = statusPriority[statusA] || 5;
    const priorityB = statusPriority[statusB] || 5;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    const dateA = a.timelineFields?.find(f => f.id === 'openDate')?.value || a.timeline?.openDate || a.openDate || "";
    const dateB = b.timelineFields?.find(f => f.id === 'openDate')?.value || b.timeline?.openDate || b.openDate || "";
    
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <>
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

      <div className={styles.tabsContainer} style={{ marginTop: '-1rem', marginBottom: '2rem', gap: '0.5rem' }}>
        {["All", "Upcoming", "Open", "Closed", "Listed"].map((status) => (
          <button
            key={status}
            className={`${styles.tab} ${activeStatusTab === status ? styles.tabActive : ""}`}
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            onClick={() => setActiveStatusTab(status as any)}
          >
            {status}
          </button>
        ))}
      </div>

      {sortedIpos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No IPOs currently listed in this category. Please check back later.</div>
      ) : (
        <div className={styles.ipoGrid}>
          {sortedIpos.map((ipo) => {
            const calculatedStatus = getCalculatedStatus(ipo);
            return (
            <div key={ipo.id} className={styles.ipoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.companyInfo}>
                  <span className={styles.companyName}>{ipo.name}</span>
                  <span className={styles.companySymbol}>{ipo.symbol}</span>
                </div>
                <span className={`${styles.statusBadge} ${getStatusClass(calculatedStatus)}`}>
                  {calculatedStatus}
                </span>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Type</span>
                  <span className={styles.detailValue}>{ipo.type || "N/A"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Lot Size</span>
                  <span className={styles.detailValue}>
                    {ipo.issueDetailsFields?.find(f => f.id === 'lotSize')?.value || ipo.lotSize || "N/A"}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>IPO Open</span>
                  <span className={styles.detailValue}>
                    {(() => {
                      const d = ipo.timelineFields?.find(f => f.id === 'openDate')?.value || ipo.timeline?.openDate || ipo.openDate;
                      if (!d || d === 'TBA') return d || "N/A";
                      try {
                        const date = new Date(d);
                        if (!isNaN(date.getTime())) return date.toLocaleDateString();
                      } catch(e) {}
                      return d;
                    })()}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>IPO Close</span>
                  <span className={styles.detailValue}>
                    {(() => {
                      const d = ipo.timelineFields?.find(f => f.id === 'closeDate')?.value || ipo.timeline?.closeDate || ipo.closeDate;
                      if (!d || d === 'TBA') return d || "N/A";
                      try {
                        const date = new Date(d);
                        if (!isNaN(date.getTime())) return date.toLocaleDateString();
                      } catch(e) {}
                      return d;
                    })()}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>IPO Size</span>
                  <span className={styles.detailValue}>
                    {ipo.issueDetailsFields?.find(f => f.id === 'issueSize')?.value || (ipo.issueSize ? `${ipo.issueSize} Cr` : "N/A")}
                  </span>
                </div>
              </div>

              <Link href={`/ipo/${ipo.slug || ipo.id}`} className={styles.actionBtn}>
                View Details
              </Link>
            </div>
            );
          })}
        </div>
      )}
    </>
  );
}
