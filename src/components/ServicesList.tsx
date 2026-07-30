"use client";

import { useEffect, useState } from "react";
import styles from "../app/services/page.module.css";
import { db } from "../lib/firebase";
import { auth } from "../lib/firebase-auth";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building, FileText, Calculator, ShieldCheck, Briefcase, Scale, FileCheck, Landmark } from "lucide-react";

interface Service {
  id: string;
  slug?: string;
  name: string;
  category: string;
  description: string;
  period: string;
  isRecurring: boolean;
  price?: number;
  documentsRequired?: string;
  isCombo?: boolean;
  oneTimePrice?: number;
  oneTimeDiscountType?: string;
  oneTimeDiscountValue?: number;
  halfYearlyPrice?: number;
  halfYearlyDiscountType?: string;
  halfYearlyDiscountValue?: number;
  annualPrice?: number;
  annualDiscountType?: string;
  annualDiscountValue?: number;
  annualOnly?: boolean;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Registration": return <Building size={24} />;
    case "Filing Returns": return <FileText size={24} />;
    case "Accounting": return <Calculator size={24} />;
    case "Compliance": return <ShieldCheck size={24} />;
    case "Corporate Services": return <Briefcase size={24} />;
    case "Legal Services": return <Scale size={24} />;
    case "Licensing Services": return <FileCheck size={24} />;
    case "Accounting & Taxation": return <Landmark size={24} />;
    default: return <FileText size={24} />;
  }
};

export default function ServicesList({ initialServices }: { initialServices?: Service[] }) {
  const [services, setServices] = useState<Service[]>(initialServices || []);
  const [loading, setLoading] = useState(!initialServices);
  const [user, setUser] = useState<any>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initialServices) {
      setServices(initialServices);
      setLoading(false);
      return;
    }

    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "services"));
        const servicesData: Service[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isPublished !== false) {
            servicesData.push({ id: doc.id, ...data } as Service);
          }
        });
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [initialServices]);

  const handleBuy = async (service: Service) => {
    if (!user) {
      router.push("/auth");
      return;
    }

    setBuyingId(service.id);
    try {
      await addDoc(collection(db, "user_subscriptions"), {
        userId: user.uid,
        serviceId: service.id,
        serviceName: service.name,
        category: service.category,
        period: service.period,
        purchaseDate: serverTimestamp(),
        status: "active",
      });
      alert(`Successfully purchased ${service.name}!`);
      router.push("/dashboard");
    } catch (error) {
      console.error("Purchase error", error);
      alert("Failed to purchase service.");
    } finally {
      setBuyingId(null);
    }
  };

  const categories = ["Registration", "Filing Returns", "Accounting", "Compliance", "Corporate Services", "Legal Services", "Licensing Services", "Accounting & Taxation", "Other Services"];



  // Helper to construct dynamic details URL based on whether user is logged in
  const getDetailsUrl = (service: Service) => {
    const targetSlug = service.slug || service.id;
    return user ? `/user/services/${targetSlug}` : `/services/${targetSlug}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title} style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>Our Professional Services</h1>
        <p className={styles.subtitle}>Select a service to simplify your financial compliance.</p>
      </div>

      <div className={styles.contentWrapper}>
        {loading ? (
          <div className={styles.emptyState}>
            <p style={{ textAlign: 'center', padding: '2rem' }}>Loading services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No services available at the moment. Please check back later.</p>
          </div>
        ) : (
          categories.map((category) => {
            const categoryServices = services.filter((s) => s.category === category);
            if (categoryServices.length === 0) return null;

            return (
              <div key={category} className={styles.categorySection}>
                <h2 className={styles.categoryTitle}>{category}</h2>
                <div className={styles.serviceGrid}>
                  {categoryServices.map((service) => (
                    <div key={service.id} className={`cleartax-card ${styles.serviceCard}`} style={{ border: service.isCombo ? '2px solid #f59e0b' : '1px solid var(--border-color)' }}>
                      <div className={styles.cardHeader} style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--accent-color) 0%, #f97316 100%)', color: '#ffffff', boxShadow: '0 8px 16px rgba(234, 88, 12, 0.25)' }}>
                          {getCategoryIcon(service.category)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                            <Link href={getDetailsUrl(service)} style={{ textDecoration: 'none', color: 'var(--text-color)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-color)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-color)'}>
                              {service.name}
                            </Link>
                          </h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {service.isCombo && <span className={styles.badge} style={{ backgroundColor: '#f59e0b', fontSize: '0.7rem' }}>Combo</span>}
                          {service.isRecurring && <span className={styles.badge} style={{ fontSize: '0.7rem' }}>Recurring</span>}

                          {(() => {
                            let hasDiscount = false;
                            let maxDiscountPercentage = 0;
                            let maxDiscountAmount = 0;

                            if (!service.isRecurring) {
                              if (service.oneTimeDiscountType === 'percentage' && service.oneTimeDiscountValue) {
                                hasDiscount = true; maxDiscountPercentage = service.oneTimeDiscountValue;
                              } else if (service.oneTimeDiscountType === 'amount' && service.oneTimeDiscountValue) {
                                hasDiscount = true; maxDiscountAmount = service.oneTimeDiscountValue;
                              }
                            } else {
                              if (service.halfYearlyDiscountType === 'percentage' && service.halfYearlyDiscountValue) {
                                hasDiscount = true; maxDiscountPercentage = Math.max(maxDiscountPercentage, service.halfYearlyDiscountValue);
                              } else if (service.halfYearlyDiscountType === 'amount' && service.halfYearlyDiscountValue) {
                                hasDiscount = true; maxDiscountAmount = Math.max(maxDiscountAmount, service.halfYearlyDiscountValue);
                              }

                              if (service.annualDiscountType === 'percentage' && service.annualDiscountValue) {
                                hasDiscount = true; maxDiscountPercentage = Math.max(maxDiscountPercentage, service.annualDiscountValue);
                              } else if (service.annualDiscountType === 'amount' && service.annualDiscountValue) {
                                hasDiscount = true; maxDiscountAmount = Math.max(maxDiscountAmount, service.annualDiscountValue);
                              }
                            }

                            if (hasDiscount) {
                              let label = '';
                              if (maxDiscountPercentage > 0) {
                                label = `Up to ${maxDiscountPercentage}% OFF`;
                              } else if (maxDiscountAmount > 0) {
                                label = `Save ₹${maxDiscountAmount.toLocaleString()}`;
                              }
                              return <span className={styles.badge} style={{ backgroundColor: '#10b981', color: 'var(--primary-text-color)', fontSize: '0.7rem', border: '1px solid #059669', boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}>✨ {label}</span>;
                            }
                            return null;
                          })()}
                        </div>
                      </div>

                      <div 
                        className="rich-text-content" 
                        dangerouslySetInnerHTML={{ __html: service.description ? service.description.replace(/&nbsp;/g, ' ').replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>').replace(/http:\/\//gi, 'https://') : '' }} 
                      />

                      {(() => {
                        let lowestPrice = Infinity;
                        let bestPlan = '';
                        let originalPrice = 0;

                        if (!service.isRecurring) {
                          originalPrice = service.oneTimePrice || 0;
                          let price = originalPrice;
                          if (service.oneTimeDiscountType === 'percentage' && service.oneTimeDiscountValue) {
                            price = Math.round(price - (price * (service.oneTimeDiscountValue / 100)));
                          } else if (service.oneTimeDiscountType === 'amount' && service.oneTimeDiscountValue) {
                            price = Math.max(0, Math.round(price - service.oneTimeDiscountValue));
                          }
                          lowestPrice = price;
                        } else {
                          // Half Yearly
                          let hPrice = service.halfYearlyPrice || 0;
                          let hDiscount = 0;
                          if (service.halfYearlyDiscountType === 'percentage' && service.halfYearlyDiscountValue) {
                            hDiscount = Math.round(hPrice * (service.halfYearlyDiscountValue / 100));
                          } else if (service.halfYearlyDiscountType === 'amount' && service.halfYearlyDiscountValue) {
                            hDiscount = Math.round(service.halfYearlyDiscountValue);
                          }
                          let hFinal = Math.max(0, hPrice - hDiscount);

                          // Annual
                          let aPrice = service.annualPrice || 0;
                          let aDiscount = 0;
                          if (service.annualDiscountType === 'percentage' && service.annualDiscountValue) {
                            aDiscount = Math.round(aPrice * (service.annualDiscountValue / 100));
                          } else if (service.annualDiscountType === 'amount' && service.annualDiscountValue) {
                            aDiscount = Math.round(service.annualDiscountValue);
                          }
                          let aFinal = Math.max(0, aPrice - aDiscount);

                          if (service.annualOnly) {
                            lowestPrice = aFinal;
                            originalPrice = aPrice;
                          } else if (hPrice > 0 && (aPrice === 0 || hFinal <= aFinal)) {
                            lowestPrice = hFinal;
                            originalPrice = hPrice;
                          } else {
                            lowestPrice = aFinal;
                            originalPrice = aPrice;
                          }

                          // Best plan highlight based on absolute savings or just highlighting annual if it saves more
                          if (aDiscount > 0 && aDiscount > hDiscount) {
                            bestPlan = '🔥 Annual Plan is Best Value!';
                          } else if (hDiscount > 0) {
                            bestPlan = '🔥 Half-Yearly is Best Value!';
                          }
                        }

                        if (lowestPrice === Infinity || lowestPrice === 0) return null;

                        return (
                          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,107,0,0.05)', borderRadius: '8px', border: '1px dashed rgba(255,107,0,0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Starting at</div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                {originalPrice > lowestPrice && (
                                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    ₹{originalPrice.toLocaleString()}
                                  </span>
                                )}
                                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-color)' }}>
                                  ₹{lowestPrice.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {bestPlan && (
                              <div style={{ marginTop: '0.5rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                                {bestPlan}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                        <span className={styles.period} style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{service.period}</span>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <Link
                            href={getDetailsUrl(service)}
                            style={{ textDecoration: 'none', color: 'var(--accent-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }}
                            onMouseEnter={(e) => { e.currentTarget.style.gap = '0.75rem'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.gap = '0.5rem'; }}
                          >
                            Details <span>→</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
