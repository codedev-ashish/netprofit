"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import styles from "./page.module.css";
import { IPOData, IPOStatus } from "../../admin/ipos/types";
import ShareButtons from "../../../components/ShareButtons";

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
    if (field.type === 'text' || !field.type) {
      const secureValue = typeof field.value === 'string' ? field.value.replace(/http:\/\//gi, 'https://') : field.value;
      return <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: secureValue }} />;
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
                    <span className={styles.detailValue}>₹{ipo.priceBandLow} - ₹{ipo.priceBandHigh}</span>
                  </div>) : null}
                  {shouldDisplayField(ipo.lotSize) ? (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Lot Size</span>
                    <span className={styles.detailValue}>{ipo.lotSize} Shares</span>
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
              {shouldDisplayField(ipo.listedPrice) && (!ipo.issueDetailsFields || !ipo.issueDetailsFields.some((f: any) => f.label.toLowerCase().includes('listed price'))) ? (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Listed Price</span>
                  <span className={styles.detailValue}>₹{ipo.listedPrice}</span>
                </div>
              ) : null}
              {renderCustomFieldsAsGrid('general')}
            </div>
          </div>

          {(ipo.subscriptionFields || ipo.quotaFields || ipo.subscriptionStatus || ipo.quota) && (
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
          )}

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
              <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: 'var(--text-color)' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left' }}>
                      {ipo.financialTable.columns.map(col => (
                        <th key={col.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ipo.financialTable.rows.map(row => (
                      <tr key={row.id}>
                        {ipo.financialTable!.columns.map(col => (
                          <td key={col.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                            {row.values[col.id] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              ipo.financials && ipo.financials.length > 0 && (
                <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: 'var(--text-color)' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Year</th>
                        <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Revenue</th>
                        <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Expense</th>
                        <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Profit</th>
                        <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Assets</th>
                        <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Net Worth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ipo.financials.map((fy, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>{fy.year}</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>₹{fy.revenue} Cr</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>₹{fy.expense} Cr</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>₹{fy.profit} Cr</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>₹{fy.assets} Cr</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>₹{fy.netWorth} Cr</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
            
            <div className={styles.detailGrid} style={{ marginTop: '1.5rem' }}>
              {renderCustomFieldsAsGrid('financials')}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>About the Company</h2>
            <div style={{ lineHeight: 1.6, color: "var(--text-color)", overflowWrap: 'break-word', wordWrap: 'break-word', whiteSpace: 'normal' }} className="rich-text-content">
              {ipo.description ? (
                <div dangerouslySetInnerHTML={{ __html: ipo.description.replace(/&nbsp;|\u00A0/g, ' ').replace(/http:\/\//gi, 'https://') }} />
              ) : (
                <p>Company description is not available yet.</p>
              )}
            </div>
            {ipo.objectsOfTheIssue && ipo.objectsOfTheIssue.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Objects of the Issue</h3>
                <ul style={{ paddingLeft: '1.5rem', color: "var(--text-color)", lineHeight: 1.6 }}>
                  {ipo.objectsOfTheIssue.map((obj, i) => <li key={i}>{obj}</li>)}
                </ul>
              </div>
            )}
            {ipo.promoters && ipo.promoters.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
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
          
          {(ipo.registrar?.name || (ipo.leadManagers && ipo.leadManagers.length > 0)) && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Registrar & Lead Managers</h2>
              <div className={styles.detailGrid}>
                {ipo.registrar?.name && (
                  <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                    <span className={styles.detailLabel}>Registrar</span>
                    <span className={styles.detailValue}>
                      {ipo.registrar.name}
                      {ipo.registrar.website && <span> | <a href={ipo.registrar.website} target="_blank" rel="noreferrer" style={{color:'var(--primary-color)'}}>Website</a></span>}
                      {ipo.registrar.phone && <span> | {ipo.registrar.phone}</span>}
                    </span>
                  </div>
                )}
                {ipo.leadManagers && ipo.leadManagers.length > 0 && (
                  <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                    <span className={styles.detailLabel}>Lead Managers</span>
                    <span className={styles.detailValue}>{ipo.leadManagers.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {ipo.customTabs?.filter(t => !['general', 'timeline', 'price', 'financials', 'affiliate'].includes(t.id)).map(tab => (
            <div className={styles.sectionCard} key={tab.id}>
              <h2 className={styles.sectionTitle}>{tab.name}</h2>
              <div className={styles.detailGrid}>
                {renderCustomFieldsAsGrid(tab.id)}
              </div>
            </div>
          ))}

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
            <div className={styles.detailGrid} style={{ marginTop: '1.5rem' }}>
              {renderCustomFieldsAsGrid('affiliate')}
            </div>
          </div>

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
