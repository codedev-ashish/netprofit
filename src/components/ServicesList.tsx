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
          servicesData.push({ id: doc.id, ...doc.data() } as Service);
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
                    <div key={service.id} className={styles.serviceCard} style={service.isCombo ? { border: '2px solid #f59e0b', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.2)' } : {}}>
                      <div className={styles.cardHeader}>
                        <h3 style={{ marginRight: '1rem' }}>{service.name}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {service.isCombo && <span className={styles.badge} style={{ backgroundColor: '#f59e0b' }}>Combo</span>}
                          {service.isRecurring && <span className={styles.badge}>Recurring</span>}
                        </div>
                      </div>
                      <p className={styles.description}>{service.description}</p>
                      {service.documentsRequired && (
                        <div style={{marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#475569'}}>
                          <strong>Required Documents:</strong> {service.documentsRequired}
                        </div>
                      )}
                      <div className={styles.cardFooter}>
                        <span className={styles.period} style={{ textTransform: 'capitalize' }}>{service.period}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link 
                            href={getDetailsUrl(service)} 
                            className={styles.buyBtn} 
                            style={{ backgroundColor: 'transparent', color: 'var(--text-color)', border: '1px solid var(--border-color)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          >
                            Details
                          </Link>
                          <button 
                            className={styles.buyBtn} 
                            onClick={() => handleBuy(service)}
                            disabled={buyingId === service.id}
                          >
                            {buyingId === service.id ? "Processing..." : "Buy Now"}
                          </button>
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
