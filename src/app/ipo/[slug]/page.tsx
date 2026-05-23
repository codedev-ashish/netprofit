"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import styles from "./page.module.css";
import { IPOData, IPOStatus } from "../../admin/ipos/types";

export default function IPODetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [ipo, setIpo] = useState<IPOData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIPO = async () => {
      if (!params?.slug) return;
      const slugValue = params.slug as string;
      
      try {
        const q = query(collection(db, "ipos"), where("slug", "==", slugValue));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          setIpo({ id: docSnap.id, ...docSnap.data() } as IPOData);
        } else {
          // Fallback to fetch by ID if slug not found
          const docRef = doc(db, "ipos", slugValue);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setIpo({ id: docSnap.id, ...docSnap.data() } as IPOData);
          } else {
            router.push("/ipo");
          }
        }
      } catch (error) {
        console.error("Error fetching IPO details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIPO();
  }, [params?.slug, router]);

  useEffect(() => {
    if (ipo?.name) {
      document.title = `${ipo.name} | IPO Details`;
    }
  }, [ipo?.name]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--text-muted)' }}>Loading IPO details...</div>;
  }

  if (!ipo) return null;

  const getStatusClass = (status: string) => {
    if (status === IPOStatus.UPCOMING) return styles.statusUpcoming;
    if (status === IPOStatus.OPEN) return styles.statusActive;
    return styles.statusClosed;
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>{ipo.name}</h1>
            <span className={styles.symbol}>{ipo.symbol} | {ipo.type}</span>
            <div className={styles.badgeGroup}>
              <span className={`${styles.badge} ${getStatusClass(ipo.status)}`}>{ipo.status}</span>
              <span className={styles.badge}>{ipo.listingAt?.join(", ") || "NSE, BSE"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.mainColumn}>
          
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Issue Details</h2>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Open Date</span>
                <span className={styles.detailValue}>{ipo.openDate || "TBA"}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Close Date</span>
                <span className={styles.detailValue}>{ipo.closeDate || "TBA"}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Price Band</span>
                <span className={styles.detailValue}>₹{ipo.priceBandLow} - ₹{ipo.priceBandHigh}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Lot Size</span>
                <span className={styles.detailValue}>{ipo.lotSize} Shares</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Issue Size</span>
                <span className={styles.detailValue}>₹{ipo.issueSize} Cr</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Face Value</span>
                <span className={styles.detailValue}>₹{ipo.faceValue}</span>
              </div>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>IPO Timeline</h2>
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>Issue Opens</span>
              <span className={styles.timelineDate}>{ipo.timeline?.openDate || ipo.openDate || "TBA"}</span>
            </div>
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>Issue Closes</span>
              <span className={styles.timelineDate}>{ipo.timeline?.closeDate || ipo.closeDate || "TBA"}</span>
            </div>
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>Basis of Allotment</span>
              <span className={styles.timelineDate}>{ipo.timeline?.basisOfAllotment || "TBA"}</span>
            </div>
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>Initiation of Refunds</span>
              <span className={styles.timelineDate}>{ipo.timeline?.initiationOfRefunds || "TBA"}</span>
            </div>
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>Credit of Shares</span>
              <span className={styles.timelineDate}>{ipo.timeline?.creditOfShares || "TBA"}</span>
            </div>
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>Listing Date</span>
              <span className={styles.timelineDate}>{ipo.timeline?.listingDate || ipo.listingDate || "TBA"}</span>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Company Financials</h2>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>EPS</span>
                <span className={styles.detailValue}>₹{ipo.valuation?.eps || "N/A"}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>P/E Ratio</span>
                <span className={styles.detailValue}>{ipo.valuation?.pe || "N/A"}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Industry P/E</span>
                <span className={styles.detailValue}>{ipo.valuation?.industryPe || "N/A"}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Market Cap</span>
                <span className={styles.detailValue}>₹{ipo.valuation?.marketCap || "N/A"} Cr</span>
              </div>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>About the Company</h2>
            <p style={{ lineHeight: 1.6, color: "var(--text-color)" }}>
              {ipo.description || "Company description is not available yet."}
            </p>
          </div>

        </div>
        
        <div className={styles.sideColumn}>
          <div className={styles.applyCard}>
            <h3 className={styles.applyTitle}>Apply for {ipo.symbol} IPO</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Get expert consultation or open a Demat account to apply for this IPO.
            </p>
            {ipo.affiliateLink ? (
              <a href={ipo.affiliateLink} target="_blank" rel="noopener noreferrer" className={styles.applyBtn}>
                Apply Now
              </a>
            ) : (
              <Link href="/services" className={styles.applyBtn}>
                Consult an Expert
              </Link>
            )}
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Grey Market Premium</h2>
            <div className={styles.gmpBox}>
              <div className={styles.gmpValue}>₹{ipo.currentGmp || 0}</div>
              <div className={styles.gmpLabel}>Current GMP (Estimated)</div>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center" }}>
              Last updated: {ipo.gmpUpdatedAt || "N/A"}. GMP is subjective and may vary.
            </p>
          </div>

          {ipo.analysis && ipo.analysis.verdict && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Expert Verdict</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Verdict:</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  fontSize: '1.2rem',
                  color: ipo.analysis.verdict === 'APPLY' ? '#16a34a' : ipo.analysis.verdict === 'AVOID' ? '#dc2626' : '#ea580c'
                }}>
                  {ipo.analysis.verdict}
                </span>
              </div>
              <p style={{ lineHeight: 1.5, color: "var(--text-color)" }}>{ipo.analysis.reasoning}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
