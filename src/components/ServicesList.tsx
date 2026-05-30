"use client";

import { useEffect, useState } from "react";
import styles from "../app/services/page.module.css";
import { db, auth } from "../lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
}

export default function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

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

  if (loading) {
    return <div className={styles.container}><p style={{textAlign: 'center', padding: '4rem'}}>Loading services...</p></div>;
  }

  // Helper to construct dynamic details URL based on whether user is logged in
  const getDetailsUrl = (service: Service) => {
    const targetSlug = service.slug || service.id;
    return user ? `/user/services/${targetSlug}` : `/services/${targetSlug}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Our Professional Services</h1>
        <p className={styles.subtitle}>Select a service to simplify your financial compliance.</p>
      </div>

      <div className={styles.contentWrapper}>
        {services.length === 0 ? (
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
                    <div key={service.id} className={`cleartax-card ${styles.serviceCard}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem', background: 'var(--card-bg)', border: service.isCombo ? '2px solid #f59e0b' : undefined, boxShadow: service.isCombo ? '0 10px 15px -3px rgba(245, 158, 11, 0.2)' : undefined }}>
                      <div className={styles.cardHeader} style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255, 107, 0, 0.1)', color: 'var(--accent-color)' }}>
                          <span style={{ fontSize: '1.5rem' }}>📄</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                            <Link href={getDetailsUrl(service)} style={{ textDecoration: 'none', color: 'var(--text-color)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-color)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-color)'}>
                              {service.name}
                            </Link>
                          </h3>
                        </div>
                        {(service.isCombo || service.isRecurring) && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {service.isCombo && <span className={styles.badge} style={{ backgroundColor: '#f59e0b', fontSize: '0.7rem' }}>Combo</span>}
                            {service.isRecurring && <span className={styles.badge} style={{ fontSize: '0.7rem' }}>Recurring</span>}
                          </div>
                        )}
                      </div>
                      
                      <div 
                        className={`${styles.description} ${styles.richContent}`} 
                        style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, flexGrow: 1, margin: 0 }}
                        dangerouslySetInnerHTML={{ __html: service.description ? service.description.replace(/&nbsp;/g, ' ') : '' }}
                      />
                      
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
