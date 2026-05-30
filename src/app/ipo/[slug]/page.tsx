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

  if (!ipo || (ipo as any).isVisible === false) {
    return (
      <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--text-muted)' }}>
        <h2 style={{ marginBottom: '1rem' }}>IPO Not Found</h2>
        <p style={{ marginBottom: '1.5rem' }}>The IPO you are looking for does not exist or is currently unpublished.</p>
        <Link href="/ipo" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Return to IPO list</Link>
      </div>
    );
  }

  const getStatusClass = (status: string) => {
    if (status === IPOStatus.UPCOMING) return styles.statusUpcoming;
    if (status === IPOStatus.OPEN) return styles.statusActive;
    return styles.statusClosed;
  };

  const renderCustomFieldValue = (field: any) => {
    if (field.type === 'url') {
      return <a href={field.value} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Link</a>;
    }
    if (field.type === 'text' || !field.type) {
      return <span className="rich-text-content" dangerouslySetInnerHTML={{ __html: field.value }} />;
    }
    return field.value;
  };

  const renderCustomFieldsAsGrid = (tabId: string) => {
    const tab = ipo.customTabs?.find(t => t.id === tabId);
    if (!tab || !tab.fields || tab.fields.length === 0) return null;
    return tab.fields.map(field => (
      <div className={styles.detailItem} key={field.id}>
        <span className={styles.detailLabel}>{field.name}</span>
        <span className={styles.detailValue}>{renderCustomFieldValue(field)}</span>
      </div>
    ));
  };

  const renderCustomFieldsAsTimeline = (tabId: string) => {
    const tab = ipo.customTabs?.find(t => t.id === tabId);
    if (!tab || !tab.fields || tab.fields.length === 0) return null;
    return tab.fields.map(field => (
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
              {ipo.freshIssueSize ? (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Fresh Issue</span>
                  <span className={styles.detailValue}>₹{ipo.freshIssueSize} Cr</span>
                </div>
              ) : null}
              {ipo.offerForSaleSize ? (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Offer for Sale</span>
                  <span className={styles.detailValue}>₹{ipo.offerForSaleSize} Cr</span>
                </div>
              ) : null}
              {ipo.listedPrice ? (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Listed Price</span>
                  <span className={styles.detailValue}>₹{ipo.listedPrice}</span>
                </div>
              ) : null}
              {renderCustomFieldsAsGrid('general')}
            </div>
          </div>

          {(ipo.subscriptionStatus || ipo.quota) && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Subscription & Quota</h2>
              <div className={styles.detailGrid}>
                {ipo.subscriptionStatus && (
                  <>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>QIB Sub</span>
                      <span className={styles.detailValue}>{ipo.subscriptionStatus.qib}x</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>NII Sub</span>
                      <span className={styles.detailValue}>{ipo.subscriptionStatus.nii}x</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Retail Sub</span>
                      <span className={styles.detailValue}>{ipo.subscriptionStatus.retail}x</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Total Sub</span>
                      <span className={styles.detailValue}>{ipo.subscriptionStatus.total}x</span>
                    </div>
                  </>
                )}
                {ipo.quota && (
                  <>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>QIB Quota</span>
                      <span className={styles.detailValue}>{ipo.quota.qib}%</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>NII Quota</span>
                      <span className={styles.detailValue}>{ipo.quota.nii}%</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Retail Quota</span>
                      <span className={styles.detailValue}>{ipo.quota.retail}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

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
            {renderCustomFieldsAsTimeline('timeline')}
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
              {renderCustomFieldsAsGrid('price')}
            </div>

            {ipo.financials && ipo.financials.length > 0 && (
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
            )}
            
            <div className={styles.detailGrid} style={{ marginTop: '1.5rem' }}>
              {renderCustomFieldsAsGrid('financials')}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>About the Company</h2>
            <div style={{ lineHeight: 1.6, color: "var(--text-color)", overflowWrap: 'break-word', wordWrap: 'break-word', whiteSpace: 'normal' }} className="rich-text-content">
              {ipo.description ? (
                <div dangerouslySetInnerHTML={{ __html: ipo.description.replace(/&nbsp;|\u00A0/g, ' ') }} />
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

          <div className={styles.sectionCard}>
            {ipo.listedPrice && ipo.listedPrice > 0 ? (
              <>
                <h2 className={styles.sectionTitle}>Listing Details</h2>
                {(() => {
                  const highPrice = ipo.priceBandHigh || 0;
                  let changeAmt = 0;
                  let changePct = 0;
                  if (highPrice > 0) {
                    changeAmt = ipo.listedPrice - highPrice;
                    changePct = (changeAmt / highPrice) * 100;
                  }
                  return (
                    <>
                      <div className={styles.gmpBox}>
                        <div className={styles.gmpValue}>₹{ipo.listedPrice}</div>
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
              </>
            ) : (
              <>
                <h2 className={styles.sectionTitle}>Grey Market Premium</h2>
                {(() => {
                  const gmpHistory = [...(ipo.gmpHistory || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  const latestGmp = gmpHistory[0];
                  const previousGmp = gmpHistory[1];
                  
                  const currentPrice = latestGmp ? latestGmp.price : (ipo.currentGmp || 0);
                  const lastUpdated = latestGmp ? latestGmp.date : (ipo.gmpUpdatedAt || "N/A");
                  
                  let changeAmt = 0;
                  let changePct = 0;
                  if (latestGmp && previousGmp && previousGmp.price > 0) {
                    changeAmt = latestGmp.price - previousGmp.price;
                    changePct = (changeAmt / previousGmp.price) * 100;
                  }

                  return (
                    <>
                      <div className={styles.gmpBox}>
                        <div className={styles.gmpValue}>₹{currentPrice}</div>
                        {latestGmp && previousGmp && (
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
                        )}
                        <div className={styles.gmpLabel} style={{ marginTop: '0.5rem' }}>Current GMP (Estimated)</div>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", marginBottom: gmpHistory.length > 0 ? "1.5rem" : "0" }}>
                        Last updated: {lastUpdated}. GMP is subjective and may vary.
                      </p>

                      {gmpHistory.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                          <h3 style={{ fontSize: '1rem', color: 'var(--text-color)', marginBottom: '1rem' }}>GMP History</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {gmpHistory.map((gmp, idx) => {
                              const prev = gmpHistory[idx + 1];
                              let diffAmt = 0;
                              let diffPct = 0;
                              if (prev && prev.price > 0) {
                                diffAmt = gmp.price - prev.price;
                                diffPct = (diffAmt / prev.price) * 100;
                              }
                              return (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.9rem' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{gmp.date}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>₹{gmp.price}</span>
                                    {prev ? (
                                      <span style={{ 
                                        color: diffAmt >= 0 ? '#22c55e' : '#ef4444',
                                        fontSize: '0.8rem',
                                        minWidth: '60px',
                                        textAlign: 'right'
                                      }}>
                                        {diffAmt >= 0 ? '▲' : '▼'} {Math.abs(diffPct).toFixed(1)}%
                                      </span>
                                    ) : (
                                      <span style={{ minWidth: '60px', display: 'inline-block' }}></span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
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
