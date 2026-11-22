"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import styles from "./page.module.css";
import { IPOData, IPOStatus } from "../../admin/ipos/types";
import ShareButtons from "../../../components/ShareButtons";

const FAQItem = ({ faq }: { faq: { question: string; answer: string } }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.faqItem} onClick={() => setIsOpen(!isOpen)}>
      <div className={styles.faqHeader}>
        <h3 className={styles.faqQuestion}>{faq.question}</h3>
        <span className={`${styles.faqIcon} ${isOpen ? styles.open : ""}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </span>
      </div>
      <div className={`${styles.faqAnswerWrapper} ${isOpen ? styles.open : ""}`}>
        <div className={styles.faqAnswerInner}>
          <div className={`${styles.faqAnswerContent} rich-text-content`} dangerouslySetInnerHTML={{ __html: faq.answer.replace(/\n/g, '<br/>') }} />
        </div>
      </div>
    </div>
  );
};

const formatToDDMMMYYYY = (dateStr?: string) => {
  if (!dateStr || dateStr === "TBA") return "TBA";
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const day = parts[2];
      
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[monthNum - 1];
      
      if (month && day && year) {
        return `${day}-${month}-${year}`;
      }
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

export default function IPODetailsClient({ initialData = null }: { initialData?: IPOData | null }) {
  const params = useParams();
  const router = useRouter();
  const [ipo, setIpo] = useState<IPOData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      setLoading(false);
      return;
    }
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
  }, [params?.slug, router, initialData]);



  if (loading) {
    return <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--text-muted)' }}>Loading IPO details...</div>;
  }

  if (!ipo || (ipo as any).isVisible === false) {
    return (
      <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--text-muted)' }}>
        <h2 style={{ marginBottom: '1rem' }}>IPO Not Found</h2>
        <p style={{ marginBottom: '1.5rem' }}>The IPO you are looking for does not exist or is currently unpublished.</p>
        <Link href="/ipo" style={{ color: 'var(--icon-color)', textDecoration: 'underline' }}>Return to IPO list</Link>
      </div>
    );
  }

  const getTimelineField = (keyword: string, fallback: string | undefined) => {
    if (ipo.timelineFields) {
      const field = ipo.timelineFields.find(f => f.label.toLowerCase().includes(keyword.toLowerCase()));
      if (field) return field.value;
    }
    return fallback;
  };

  const getIssueDetailField = (keyword: string, fallback: string | number | undefined) => {
    if (ipo.issueDetailsFields) {
      const field = ipo.issueDetailsFields.find(f => f.label.toLowerCase().includes(keyword.toLowerCase()));
      if (field) return field.value;
    }
    return fallback;
  };

  const displayOpenDate = getTimelineField('open', ipo.timeline?.openDate || ipo.openDate);
  const displayCloseDate = getTimelineField('close', ipo.timeline?.closeDate || ipo.closeDate);
  const displayListingDate = getTimelineField('listing', ipo.timeline?.listingDate || ipo.listingDate);

  const getCalculatedStatus = () => {
    if (!ipo) return IPOStatus.UPCOMING;
    
    const now = new Date();
    
    const parseDate = (d?: string) => {
      if (!d || d === "TBA") return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const openDate = parseDate(displayOpenDate);
    const closeDate = parseDate(displayCloseDate);
    const listingDate = parseDate(displayListingDate);
    
    // Set closeDate to 4:00 PM local time
    if (closeDate) {
      closeDate.setHours(16, 0, 0, 0); 
    }
    
    if (listingDate && now >= listingDate) {
      return IPOStatus.LISTED;
    }
    
    if (closeDate && now > closeDate) {
      return IPOStatus.CLOSED;
    }
    
    if (openDate && now >= openDate) {
      if (!closeDate || now <= closeDate) {
        return IPOStatus.OPEN;
      }
    }
    
    if (openDate && now < openDate) {
      return IPOStatus.UPCOMING;
    }
    
    return ipo.status;
  };

  const calculatedStatus = getCalculatedStatus();

  const listedPriceStr = getIssueDetailField('listed price', ipo.listedPrice);
  const effectiveListedPrice = typeof listedPriceStr === 'string' 
    ? parseFloat(listedPriceStr.replace(/[^0-9.-]/g, '')) 
    : (Number(listedPriceStr) || 0);

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'upcoming') return styles.statusUpcoming;
    if (s === 'open') return styles.statusActive;
    if (s === 'listed') return styles.statusActive;
    return styles.statusClosed;
  };

  const shouldDisplayField = (value: any) => {
    if (value === undefined || value === null || value === '') return false;
    if (typeof value === 'number' && value === 0) return false;
    if (typeof value === 'string') {
      const lower = value.trim().toLowerCase();
      if (lower === '0' || lower === '0.00' || lower === 'nil' || lower === 'null' || lower === 'n/a' || lower === 'zero' || lower === '₹0' || lower === '₹0.00') return false;
    }
    return true;
  };

  const renderTextWithLinks = (text: string) => {
    if (!text) return text;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-link">{part}</a>;
      }
      return part;
    });
  };

  const formatDynamicValue = (value: string, label: string, isSubscription = false, isQuota = false, isDate = false) => {
    if (!value) return value;
    let strVal = value.toString();
    
    if (isDate) {
      strVal = formatToDDMMMYYYY(strVal);
    }
    
    const isPrice = label.toLowerCase().includes('price') && !label.toLowerCase().includes('size');
    
    if (isPrice && !strVal.startsWith('₹') && !isNaN(Number(strVal))) {
      strVal = `₹${strVal}`;
    } else if (isSubscription && !strVal.toLowerCase().includes('x') && !isNaN(Number(strVal))) {
      strVal = `${strVal}x`;
    } else if (isQuota && !strVal.includes('%') && !isNaN(Number(strVal))) {
      strVal = `${strVal}%`;
    }
    
    return renderTextWithLinks(strVal);
  };

  const renderCustomFieldValue = (field: any) => {
    if (field.type === 'url') {
      return <a href={field.value} target="_blank" rel="noopener noreferrer" className="text-link">Link</a>;
    }
    if (field.type === 'text' || field.type === 'textarea' || !field.type) {
      const secureValue = typeof field.value === 'string' ? field.value.replace(/http:\/\//gi, 'https://') : field.value;
      const finalValue = typeof secureValue === 'string' ? secureValue.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>') : secureValue;
      return <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: finalValue }} />;
    }
    return field.value;
  };

  const renderCustomFieldsAsGrid = (tabId: string) => {
    const tab = ipo.customTabs?.find(t => t.id === tabId);
    if (!tab || !tab.fields || tab.fields.length === 0) return null;
    return tab.fields.filter(f => shouldDisplayField(f.value)).map(field => {
      const isLongText = field.type === 'text' || (typeof field.value === 'string' && field.value.length > 60) || field.name.toLowerCase().includes('address');
      return (
        <div className={styles.detailItem} key={field.id} style={isLongText ? { gridColumn: '1 / -1' } : {}}>
          <span className={styles.detailLabel}>{field.name}</span>
          <span className={styles.detailValue}>{renderCustomFieldValue(field)}</span>
        </div>
      );
    });
  };

  const renderCustomFieldsAsTimeline = (tabId: string) => {
    const tab = ipo.customTabs?.find(t => t.id === tabId);
    if (!tab || !tab.fields || tab.fields.length === 0) return null;
    return tab.fields.filter(f => shouldDisplayField(f.value)).map(field => (
      <div className={styles.timelineItem} key={field.id}>
        <span className={styles.timelineLabel}>{field.name}</span>
        <span className={styles.timelineDate}>{renderCustomFieldValue(field)}</span>
      </div>
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.titleWrapper}>
            <div className={styles.title} style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{ipo.name}</div>
            <span className={styles.symbol}>{ipo.symbol} | {ipo.type}</span>
            <div className={styles.badgeGroup}>
              <span className={`${styles.badge} ${getStatusClass(calculatedStatus)}`}>{calculatedStatus}</span>
              <span className={styles.badge}>{ipo.listingAt?.join(", ") || "NSE, BSE"}</span>
            </div>
            
            <ShareButtons title={`IPO Details: ${ipo.name} (${ipo.symbol})`} />
          </div>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.mainColumn}>
          
          {(() => {
            const hasCustomGeneral = ipo.customTabs?.find(t => t.id === 'general')?.fields?.some(f => shouldDisplayField(f.value));
            const hasIssueDetailsFields = ipo.issueDetailsFields && ipo.issueDetailsFields.some(f => shouldDisplayField(f.value));
            const hasLegacyIssueDetails = shouldDisplayField(displayOpenDate) || shouldDisplayField(displayCloseDate) || shouldDisplayField(ipo.priceBandHigh) || shouldDisplayField(ipo.priceBandLow) || shouldDisplayField(ipo.lotSize) || shouldDisplayField(ipo.issueSize) || shouldDisplayField(ipo.faceValue) || shouldDisplayField(ipo.freshIssueSize) || shouldDisplayField(ipo.offerForSaleSize);
            const hasListedPrice = shouldDisplayField(ipo.listedPrice) && (!ipo.issueDetailsFields || !ipo.issueDetailsFields.some((f: any) => f.label.toLowerCase().includes('listed price')));

            if (!hasCustomGeneral && !hasIssueDetailsFields && !hasLegacyIssueDetails && !hasListedPrice) return null;

            return (
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>Issue Details</h2>
                <div className={styles.detailGrid}>
                  {shouldDisplayField(displayOpenDate) && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Open Date</span>
                    <span className={styles.detailValue}>{formatToDDMMMYYYY(displayOpenDate)}</span>
                  </div>)}
                  {shouldDisplayField(displayCloseDate) && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Close Date</span>
                    <span className={styles.detailValue}>{formatToDDMMMYYYY(displayCloseDate)}</span>
                  </div>)}
                  
                  {ipo.issueDetailsFields ? (
                    ipo.issueDetailsFields.filter(f => shouldDisplayField(f.value)).map(field => (
                      <div className={styles.detailItem} key={field.id}>
                        <span className={styles.detailLabel}>{field.label}</span>
                        <span className={styles.detailValue}>{formatDynamicValue(field.value, field.label)}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      {shouldDisplayField(ipo.priceBandLow) || shouldDisplayField(ipo.priceBandHigh) ? (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Price Band</span>
                        <span className={styles.detailValue}>
                          {ipo.priceBandLow && ipo.priceBandLow !== ipo.priceBandHigh ? `₹${ipo.priceBandLow} - ₹${ipo.priceBandHigh}` : `₹${ipo.priceBandHigh}`}
                        </span>
                      </div>) : null}
                      {shouldDisplayField(ipo.lotSize) ? (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Min Lot Size</span>
                        <span className={styles.detailValue}>{ipo.lotSize} shares</span>
                      </div>) : null}
                      {shouldDisplayField(ipo.issueSize) ? (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Issue Size</span>
                        <span className={styles.detailValue}>₹{ipo.issueSize} Cr</span>
                      </div>) : null}
                      {shouldDisplayField(ipo.faceValue) ? (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Face Value</span>
                        <span className={styles.detailValue}>₹{ipo.faceValue}</span>
                      </div>) : null}
                      {shouldDisplayField(ipo.freshIssueSize) ? (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Fresh Issue</span>
                          <span className={styles.detailValue}>₹{ipo.freshIssueSize} Cr</span>
                        </div>
                      ) : null}
                      {shouldDisplayField(ipo.offerForSaleSize) ? (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Offer for Sale</span>
                          <span className={styles.detailValue}>₹{ipo.offerForSaleSize} Cr</span>
                        </div>
                      ) : null}
                    </>
                  )}
                  {hasListedPrice ? (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Listed Price</span>
                      <span className={styles.detailValue}>₹{ipo.listedPrice}</span>
                    </div>
                  ) : null}
                  {renderCustomFieldsAsGrid('general')}
                </div>
              </div>
            );
          })()}

          {(() => {
            const hasCustomSub = ipo.customTabs?.find(t => t.id === 'subscription')?.fields?.some(f => shouldDisplayField(f.value));
            const hasSubFields = ipo.subscriptionFields && ipo.subscriptionFields.some(f => shouldDisplayField(f.value));
            const hasLegacySub = ipo.subscriptionStatus && (shouldDisplayField(ipo.subscriptionStatus.qib) || shouldDisplayField(ipo.subscriptionStatus.nii) || shouldDisplayField(ipo.subscriptionStatus.retail) || shouldDisplayField(ipo.subscriptionStatus.total));
            const hasQuotaFields = ipo.quotaFields && ipo.quotaFields.some(f => shouldDisplayField(f.value));
            const hasLegacyQuota = ipo.quota && (shouldDisplayField(ipo.quota.qib) || shouldDisplayField(ipo.quota.nii) || shouldDisplayField(ipo.quota.retail));
            
            if (!hasCustomSub && !hasSubFields && !hasLegacySub && !hasQuotaFields && !hasLegacyQuota) return null;

            return (
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>Subscription & Quota</h2>
                <div className={styles.detailGrid}>
                {ipo.subscriptionFields ? (
                  ipo.subscriptionFields.filter(f => shouldDisplayField(f.value)).map(field => (
                    <div className={styles.detailItem} key={field.id}>
                      <span className={styles.detailLabel}>{field.label}</span>
                      <span className={styles.detailValue}>{formatDynamicValue(field.value, field.label, true, false)}</span>
                    </div>
                  ))
                ) : ipo.subscriptionStatus ? (
                  <>
                    {shouldDisplayField(ipo.subscriptionStatus.qib) && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>QIB Sub</span>
                      <span className={styles.detailValue}>{ipo.subscriptionStatus.qib}x</span>
                    </div>)}
                    {shouldDisplayField(ipo.subscriptionStatus.nii) && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>NII Sub</span>
                      <span className={styles.detailValue}>{ipo.subscriptionStatus.nii}x</span>
                    </div>)}
                    {shouldDisplayField(ipo.subscriptionStatus.retail) && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Retail Sub</span>
                      <span className={styles.detailValue}>{ipo.subscriptionStatus.retail}x</span>
                    </div>)}
                    {shouldDisplayField(ipo.subscriptionStatus.total) && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Total Sub</span>
                      <span className={styles.detailValue}>{ipo.subscriptionStatus.total}x</span>
                    </div>)}
                  </>
                ) : null}

                {ipo.quotaFields ? (
                  ipo.quotaFields.filter(f => shouldDisplayField(f.value)).map(field => (
                    <div className={styles.detailItem} key={field.id}>
                      <span className={styles.detailLabel}>{field.label}</span>
                      <span className={styles.detailValue}>{formatDynamicValue(field.value, field.label, false, true)}</span>
                    </div>
                  ))
                ) : ipo.quota ? (
                  <>
                    {shouldDisplayField(ipo.quota.qib) && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>QIB Quota</span>
                      <span className={styles.detailValue}>{ipo.quota.qib}%</span>
                    </div>)}
                    {shouldDisplayField(ipo.quota.nii) && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>NII Quota</span>
                      <span className={styles.detailValue}>{ipo.quota.nii}%</span>
                    </div>)}
                    {shouldDisplayField(ipo.quota.retail) && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Retail Quota</span>
                      <span className={styles.detailValue}>{ipo.quota.retail}%</span>
                    </div>)}
                  </>
                ) : null}
              </div>
            </div>
            );
          })()}

          {(() => {
            const hasCustomTimeline = ipo.customTabs?.find(t => t.id === 'timeline')?.fields?.some(f => shouldDisplayField(f.value));
            const hasDynamicTimeline = ipo.timelineFields && ipo.timelineFields.some(f => shouldDisplayField(f.value));
            const hasLegacyTimeline = ipo.timeline && (shouldDisplayField(ipo.timeline.openDate) || shouldDisplayField(ipo.timeline.closeDate) || shouldDisplayField(ipo.timeline.basisOfAllotment) || shouldDisplayField(ipo.timeline.initiationOfRefunds) || shouldDisplayField(ipo.timeline.creditOfShares) || shouldDisplayField(ipo.timeline.listingDate));
            const hasFallbackTimeline = shouldDisplayField(ipo.openDate) || shouldDisplayField(ipo.closeDate) || shouldDisplayField(ipo.listingDate);
            
            if (!hasCustomTimeline && !hasDynamicTimeline && !hasLegacyTimeline && !hasFallbackTimeline) return null;

            return (
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>IPO Timeline</h2>
                <div className={styles.timelineContainer}>
                {ipo.timelineFields ? (
                  ipo.timelineFields.filter(f => shouldDisplayField(f.value)).map(field => (
                    <div className={styles.timelineItem} key={field.id}>
                      <span className={styles.timelineLabel}>{field.label}</span>
                      <span className={styles.timelineDate}>{formatDynamicValue(field.value, field.label, false, false, true)}</span>
                    </div>
                  ))
                ) : ipo.timeline ? (
                  <>
                    {shouldDisplayField(ipo.timeline?.openDate || ipo.openDate) && (
                    <div className={styles.timelineItem}>
                      <span className={styles.timelineLabel}>Issue Opens</span>
                      <span className={styles.timelineDate}>{formatToDDMMMYYYY(ipo.timeline?.openDate || ipo.openDate)}</span>
                    </div>)}
                    {shouldDisplayField(ipo.timeline?.closeDate || ipo.closeDate) && (
                    <div className={styles.timelineItem}>
                      <span className={styles.timelineLabel}>Issue Closes</span>
                      <span className={styles.timelineDate}>{formatToDDMMMYYYY(ipo.timeline?.closeDate || ipo.closeDate)}</span>
                    </div>)}
                    {shouldDisplayField(ipo.timeline?.basisOfAllotment) && (
                    <div className={styles.timelineItem}>
                      <span className={styles.timelineLabel}>Basis of Allotment</span>
                      <span className={styles.timelineDate}>{formatToDDMMMYYYY(ipo.timeline?.basisOfAllotment)}</span>
                    </div>)}
                    {shouldDisplayField(ipo.timeline?.initiationOfRefunds) && (
                    <div className={styles.timelineItem}>
                      <span className={styles.timelineLabel}>Initiation of Refunds</span>
                      <span className={styles.timelineDate}>{formatToDDMMMYYYY(ipo.timeline?.initiationOfRefunds)}</span>
                    </div>)}
                    {shouldDisplayField(ipo.timeline?.creditOfShares) && (
                    <div className={styles.timelineItem}>
                      <span className={styles.timelineLabel}>Credit of Shares</span>
                      <span className={styles.timelineDate}>{formatToDDMMMYYYY(ipo.timeline?.creditOfShares)}</span>
                    </div>)}
                    {shouldDisplayField(ipo.timeline?.listingDate || ipo.listingDate) && (
                    <div className={styles.timelineItem}>
                      <span className={styles.timelineLabel}>Listing Date</span>
                      <span className={styles.timelineDate}>{formatToDDMMMYYYY(ipo.timeline?.listingDate || ipo.listingDate)}</span>
                    </div>)}
                  </>
                ) : null}
                {renderCustomFieldsAsTimeline('timeline')}
                </div>
              </div>
            );
          })()}

          {(() => {
            const hasCustomFinancials = ipo.customTabs?.find(t => t.id === 'financials')?.fields?.some(f => shouldDisplayField(f.value));
            const hasCustomPrice = ipo.customTabs?.find(t => t.id === 'price')?.fields?.some(f => shouldDisplayField(f.value));
            const hasValuationFields = ipo.valuationFields && ipo.valuationFields.some(f => shouldDisplayField(f.value));
            const hasLegacyValuation = ipo.valuation && (shouldDisplayField(ipo.valuation.eps) || shouldDisplayField(ipo.valuation.pe) || shouldDisplayField(ipo.valuation.industryPe) || shouldDisplayField(ipo.valuation.marketCap) || shouldDisplayField(ipo.valuation.ronw) || shouldDisplayField(ipo.valuation.nav));
            const hasFinancialTable = ipo.financialTable && ipo.financialTable.rows.length > 0;
            const hasLegacyFinancials = ipo.financials && ipo.financials.length > 0;
            
            if (!hasCustomFinancials && !hasCustomPrice && !hasValuationFields && !hasLegacyValuation && !hasFinancialTable && !hasLegacyFinancials) return null;

            return (
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>Company Financials</h2>
                <div className={styles.detailGrid}>
                  {ipo.valuationFields ? (
                    ipo.valuationFields.filter(f => shouldDisplayField(f.value)).map(field => (
                      <div className={styles.detailItem} key={field.id}>
                        <span className={styles.detailLabel}>{field.label}</span>
                        <span className={styles.detailValue}>{formatDynamicValue(field.value, field.label)}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      {shouldDisplayField(ipo.valuation?.eps) && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>EPS</span>
                        <span className={styles.detailValue}>₹{ipo.valuation?.eps}</span>
                      </div>)}
                      {shouldDisplayField(ipo.valuation?.pe) && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>P/E Ratio</span>
                        <span className={styles.detailValue}>{ipo.valuation?.pe}</span>
                      </div>)}
                      {shouldDisplayField(ipo.valuation?.industryPe) && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Industry P/E</span>
                        <span className={styles.detailValue}>{ipo.valuation?.industryPe}</span>
                      </div>)}
                      {shouldDisplayField(ipo.valuation?.marketCap) && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Market Cap</span>
                        <span className={styles.detailValue}>₹{ipo.valuation?.marketCap} Cr</span>
                      </div>)}
                      {shouldDisplayField(ipo.valuation?.ronw) && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>RONW (%)</span>
                        <span className={styles.detailValue}>{ipo.valuation?.ronw}%</span>
                      </div>)}
                      {shouldDisplayField(ipo.valuation?.nav) && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>NAV</span>
                        <span className={styles.detailValue}>₹{ipo.valuation?.nav}</span>
                      </div>)}
                    </>
                  )}
                  {renderCustomFieldsAsGrid('price')}
                </div>

                {ipo.financialTable && ipo.financialTable.rows.length > 0 ? (
                  <div style={{ marginTop: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: 'var(--text-color)' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem', fontWeight: 600 }}>Period Ended</th>
                            {ipo.financialTable.rows.map(row => (
                              <th key={row.id} style={{ padding: '0.75rem', fontWeight: 600 }}>{row.values['year'] || "-"}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ipo.financialTable.columns.filter(col => col.id !== 'year').map((col, index) => (
                            <tr key={col.id} style={{ background: index % 2 === 0 ? 'var(--bg-secondary)' : 'transparent' }}>
                              <td style={{ padding: '0.75rem', color: '#3b82f6' }}>{col.label.replace(' (Cr)', '')}</td>
                              {ipo.financialTable!.rows.map(row => (
                                <td key={`${col.id}_${row.id}`} style={{ padding: '0.75rem' }}>
                                  {row.values[col.id] || "-"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                      Amount in ₹ Crore
                    </div>
                  </div>
                ) : (
                  ipo.financials && ipo.financials.length > 0 && (
                    <div style={{ marginTop: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: 'var(--text-color)' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Period Ended</th>
                              {ipo.financials.map((fy, idx) => (
                                <th key={`head_${idx}`} style={{ padding: '0.75rem', fontWeight: 600 }}>{fy.year || "-"}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {['revenue', 'expense', 'profit', 'assets', 'netWorth'].map((field, index) => {
                              const labels: Record<string, string> = {
                                revenue: 'Revenue',
                                expense: 'Expense',
                                profit: 'Profit After Tax',
                                assets: 'Assets',
                                netWorth: 'Net Worth'
                              };
                              return (
                                <tr key={field} style={{ background: index % 2 === 0 ? 'var(--bg-secondary)' : 'transparent' }}>
                                  <td style={{ padding: '0.75rem', color: '#3b82f6' }}>{labels[field]}</td>
                                  {ipo.financials!.map((fy: any, idx: number) => (
                                    <td key={`cell_${field}_${idx}`} style={{ padding: '0.75rem' }}>
                                      {fy[field] || "-"}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                        Amount in ₹ Crore
                      </div>
                    </div>
                  )
                )}
                
                <div className={styles.detailGrid} style={{ marginTop: '1.5rem' }}>
                  {renderCustomFieldsAsGrid('financials')}
                </div>
              </div>
            );
          })()}

          {(ipo.description || (ipo.objectsOfTheIssue && ipo.objectsOfTheIssue.length > 0) || (ipo.promoters && ipo.promoters.length > 0)) && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>About the Company</h2>
              
              {ipo.description && (
                <div style={{ lineHeight: 1.6, color: "var(--text-color)", overflowWrap: 'break-word', wordWrap: 'break-word', whiteSpace: 'normal', marginBottom: '1.5rem' }} className="rich-text-content">
                  <div dangerouslySetInnerHTML={{ __html: ipo.description.replace(/&nbsp;|\u00A0/g, ' ').replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>').replace(/http:\/\//gi, 'https://') }} />
                </div>
              )}
              
              {ipo.objectsOfTheIssue && ipo.objectsOfTheIssue.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Objects of the Issue</h3>
                  <ul style={{ paddingLeft: '1.5rem', color: "var(--text-color)", lineHeight: 1.6 }}>
                    {ipo.objectsOfTheIssue.map((obj, i) => <li key={i}>{obj}</li>)}
                  </ul>
                </div>
              )}
              
              {ipo.promoters && ipo.promoters.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Promoters</h3>
                  <p style={{ color: "var(--text-color)", lineHeight: 1.6 }}>{ipo.promoters.join(', ')}</p>
                  {ipo.promoterHolding && (
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', color: 'var(--text-color)' }}>
                      <span><strong>Pre Issue Holding:</strong> {ipo.promoterHolding.preIssue}%</span>
                      <span><strong>Post Issue Holding:</strong> {ipo.promoterHolding.postIssue}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          

          {ipo.aboutIpo && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>About the IPO</h2>
              <div style={{ lineHeight: 1.6, color: "var(--text-color)", overflowWrap: 'break-word', wordWrap: 'break-word', whiteSpace: 'normal' }} className="rich-text-content">
                <div dangerouslySetInnerHTML={{ __html: ipo.aboutIpo.replace(/&nbsp;|\u00A0/g, ' ').replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>').replace(/http:\/\//gi, 'https://') }} />
              </div>
            </div>
          )}

          {ipo.customTabs?.filter(t => !['general', 'timeline', 'price', 'financials', 'affiliate', 'faqs', 'contact'].includes(t.id)).map(tab => {
            const hasFields = tab.fields && tab.fields.length > 0 && tab.fields.some(f => shouldDisplayField(f.value));
            if (!hasFields) return null;
            return (
              <div className={styles.sectionCard} key={tab.id}>
                <h2 className={styles.sectionTitle}>{tab.name}</h2>
                <div className={styles.detailGrid}>
                  {renderCustomFieldsAsGrid(tab.id)}
                </div>
              </div>
            );
          })}

          {ipo.faqs && ipo.faqs.length > 0 && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {ipo.faqs.map((faq, idx) => (
                  <FAQItem key={idx} faq={faq} />
                ))}
              </div>
            </div>
          )}

        </div>
        
        <div className={styles.sideColumn}>
          {(ipo.analysis?.verdict || ipo.affiliateLink?.trim()) && (
            <div className={styles.applyCard}>
              {ipo.analysis?.verdict && (
                <div style={{ marginBottom: ipo.affiliateLink?.trim() ? '2rem' : '0', paddingBottom: ipo.affiliateLink?.trim() ? '2rem' : '0', borderBottom: ipo.affiliateLink?.trim() ? '1px dashed var(--border-color)' : 'none' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#a855f7' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg> 
                    AI Suggestion
                  </h3>
                  
                  <div style={{
                    display: 'inline-block',
                    padding: '0.75rem 2rem',
                    borderRadius: '50px',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '1rem',
                    ...(ipo.analysis.verdict.toLowerCase() === 'apply' ? {
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(21,128,61,0.1))',
                      color: '#16a34a',
                      border: '1px solid rgba(34,197,94,0.3)'
                    } : ipo.analysis.verdict.toLowerCase() === 'avoid' ? {
                      background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(185,28,28,0.1))',
                      color: '#dc2626',
                      border: '1px solid rgba(239,68,68,0.3)'
                    } : {
                      background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(194,65,12,0.1))',
                      color: '#ea580c',
                      border: '1px solid rgba(249,115,22,0.3)'
                    })
                  }}>
                    {ipo.analysis.verdict}
                  </div>
                  
                  {ipo.analysis.reasoning && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                      {ipo.analysis.reasoning}
                    </p>
                  )}
                </div>
              )}

              {ipo.affiliateLink?.trim() && (
                <>
                  <h3 className={styles.applyTitle}>Apply for {ipo.symbol} IPO</h3>
                  <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    Get expert consultation or open a Demat account to apply for this IPO.
                  </p>
                  <a href={ipo.affiliateLink} target="_blank" rel="noopener noreferrer" className={styles.applyBtn}>
                    Apply Now
                  </a>
                  <div className={styles.detailGrid} style={{ marginTop: '1.5rem' }}>
                    {renderCustomFieldsAsGrid('affiliate')}
                  </div>
                </>
              )}
            </div>
          )}

          {effectiveListedPrice > 0 ? (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Listing Details</h2>
              {(() => {
                const highPriceStr = getIssueDetailField('High', ipo.priceBandHigh);
                const highPrice = typeof highPriceStr === 'string' ? parseFloat(highPriceStr.replace(/[^0-9.-]/g, '')) || 0 : (highPriceStr || 0);
                let changeAmt = 0;
                let changePct = 0;
                if (highPrice > 0) {
                  changeAmt = effectiveListedPrice - highPrice;
                  changePct = (changeAmt / highPrice) * 100;
                }
                return (
                  <>
                    <div className={styles.gmpBox}>
                      <div className={styles.gmpValue}>₹{effectiveListedPrice}</div>
                      <div style={{ 
                        color: changeAmt >= 0 ? '#22c55e' : '#ef4444', 
                        fontWeight: 'bold', 
                        fontSize: '1rem',
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}>
                        {changeAmt >= 0 ? '▲' : '▼'} ₹{Math.abs(changeAmt).toFixed(2)} ({changeAmt >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
                      </div>
                      <div className={styles.gmpLabel} style={{ marginTop: '0.5rem' }}>Listing Price</div>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center" }}>
                      Compared to issue price band high (₹{highPrice}).
                    </p>
                  </>
                );
              })()}
            </div>
          ) : null}

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Grey Market Premium</h2>
            {(() => {
              const gmpHistory = [...(ipo.gmpHistory || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const latestGmp = gmpHistory[0];
              
              const currentGmp = latestGmp ? latestGmp.price : (ipo.currentGmp || 0);
              const lastUpdated = latestGmp ? latestGmp.date : (ipo.gmpUpdatedAt || "N/A");
              
              const highPriceStr = getIssueDetailField('High', ipo.priceBandHigh);
              const highPrice = typeof highPriceStr === 'string' ? parseFloat(highPriceStr.replace(/[^0-9.-]/g, '')) || 0 : (highPriceStr || 0);
              
              const estListingPrice = highPrice > 0 ? highPrice + currentGmp : 0;
              const premiumPct = highPrice > 0 ? (currentGmp / highPrice) * 100 : 0;

              return (
                <>
                  <div className={styles.gmpBox}>
                    <div className={styles.gmpValue}>₹{currentGmp}</div>
                    {highPrice > 0 && (
                      <div style={{ 
                        color: currentGmp >= 0 ? '#22c55e' : '#ef4444', 
                        fontWeight: 'bold', 
                        fontSize: '1.1rem',
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}>
                        {currentGmp >= 0 ? '▲' : '▼'} {Math.abs(premiumPct).toFixed(2)}%
                      </div>
                    )}
                    <div className={styles.gmpLabel} style={{ marginTop: '0.5rem' }}>Grey Market Premium (GMP)</div>
                    
                    {highPrice > 0 && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Est. Listing Price</span>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '1.25rem', color: 'var(--text-color)' }}>₹{estListingPrice}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", marginBottom: gmpHistory.length > 0 ? "1.5rem" : "0" }}>
                    Last updated: {lastUpdated}. GMP is subjective and may vary.
                  </p>

                  {gmpHistory.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <h3 style={{ fontSize: '1rem', color: 'var(--text-color)', marginBottom: '1rem' }}>GMP History</h3>
                      <div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: 'var(--text-color)' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left' }}>
                              <th style={{ padding: '0.5rem 0.25rem', borderBottom: '1px solid var(--border-color)' }}>Date</th>
                              <th style={{ padding: '0.5rem 0.25rem', borderBottom: '1px solid var(--border-color)' }}>GMP</th>
                              <th style={{ padding: '0.5rem 0.25rem', borderBottom: '1px solid var(--border-color)' }}>Est. Listing Price</th>
                              <th style={{ padding: '0.5rem 0.25rem', borderBottom: '1px solid var(--border-color)' }}>Percentage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gmpHistory.map((gmp, idx) => {
                              const gmpValue = gmp.price;
                              const estListPrice = highPrice > 0 ? highPrice + gmpValue : 0;
                              const itemPremiumPct = highPrice > 0 ? (gmpValue / highPrice) * 100 : 0;
                              
                              return (
                                <tr key={idx}>
                                  <td style={{ padding: '0.5rem 0.25rem', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{formatToDDMMMYYYY(gmp.date)}</td>
                                  <td style={{ padding: '0.5rem 0.25rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600' }}>₹{gmpValue}</td>
                                  <td style={{ padding: '0.5rem 0.25rem', borderBottom: '1px solid var(--border-color)' }}>{highPrice > 0 ? `₹${estListPrice}` : '-'}</td>
                                  <td style={{ padding: '0.5rem 0.25rem', borderBottom: '1px solid var(--border-color)' }}>
                                    {highPrice > 0 ? (
                                      <span style={{ color: gmpValue >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                        {gmpValue >= 0 ? '▲' : '▼'} {Math.abs(itemPremiumPct).toFixed(2)}%
                                      </span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {ipo.registrar?.name && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Registrar</h2>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-color)', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 'bold' }}>{ipo.registrar.name}</div>
                {ipo.registrar.website && <div><a href={ipo.registrar.website} target="_blank" rel="noreferrer" style={{color:'var(--primary-color)'}}>Website</a></div>}
                {ipo.registrar.phone && <div>{ipo.registrar.phone}</div>}
                {ipo.registrar.email && <div>{ipo.registrar.email}</div>}
              </div>
            </div>
          )}

          {ipo.leadManagers && ipo.leadManagers.length > 0 && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Lead Managers</h2>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-color)', lineHeight: 1.6 }}>
                {ipo.leadManagers
                  .flatMap(lm => {
                    const parts = lm.split(/(Ltd\.|Pvt\.Ltd\.|Co\.Ltd\.|Limited|LLC|Inc\.|Co\.|Corp\.|Corporation|LLP|L\.P\.|Pvt Ltd|Private Limited)\s+(?=[A-Z])/i);
                    return parts.reduce((acc: string[], curr, i) => {
                      if (i % 2 === 0) {
                        acc.push(curr);
                      } else {
                        acc[acc.length - 1] += ' ' + curr;
                      }
                      return acc;
                    }, []);
                  })
                  .map((lm, idx) => (
                  <div key={idx} style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{lm.trim()}</div>
                ))}
              </div>
            </div>
          )}

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
