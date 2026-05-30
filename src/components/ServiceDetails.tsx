"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, documentId } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import styles from "../app/services/page.module.css";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  period: string;
  isRecurring: boolean;
  documentsRequired?: string | string[];
  isCombo?: boolean;
  comboServices?: string[];
  price?: number;
  features?: string[];
  content?: string;
}

export default function ServiceDetails() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [comboDetails, setComboDetails] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!params?.slug) return;
      const slugValue = params.slug as string;
      
      try {
        let sData: Service | null = null;
        
        // 1. Try by slug
        const q = query(collection(db, "services"), where("slug", "==", slugValue));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          if (data.isPublished !== false) {
            sData = { id: querySnapshot.docs[0].id, ...data } as Service;
          }
        } else {
          // 2. Fallback to fetch by ID
          const fallbackRef = doc(db, "services", slugValue);
          const docSnap = await getDoc(fallbackRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.isPublished !== false) {
              sData = { id: docSnap.id, ...data } as Service;
            }
          }
        }
        
        if (sData) {
          setService(sData);
          
          if (sData.isCombo && sData.comboServices && sData.comboServices.length > 0) {
            const comboQuery = query(collection(db, "services"), where(documentId(), "in", sData.comboServices));
            const comboSnap = await getDocs(comboQuery);
            const comboItems: Service[] = [];
            comboSnap.forEach((cDoc) => {
              comboItems.push({ id: cDoc.id, ...cDoc.data() } as Service);
            });
            setComboDetails(comboItems);
          }
        } else {
          router.push(user ? "/user/services" : "/services");
        }
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [params?.slug, router, user]);

  const handleBuy = () => {
    if (!service) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    router.push(`/services/${params.slug}/buy`);
  };

  if (loading) {
    return <div className={styles.container}><p style={{textAlign: 'center', padding: '4rem'}}>Loading service details...</p></div>;
  }

  if (!service) return null;

  const backLink = user ? "/user/services" : "/services";

  return (
    <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" />
    <div className={styles.container} style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className={styles.hero} style={{ 
        padding: '4rem 2rem', 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Link href={backLink} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontWeight: 500, transition: 'color 0.2s', padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <ArrowLeft size={18} /> Back to Services
          </Link>
          <h1 className={styles.title} style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            {service.name}
          </h1>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.4rem 1.25rem', borderRadius: '30px', fontWeight: 600, fontSize: '0.9rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>{service.category}</span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.4rem 1.25rem', borderRadius: '30px', fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>{service.period}</span>
            {service.isCombo && <span style={{ backgroundColor: '#f97316', color: 'white', padding: '0.4rem 1.25rem', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)' }}>COMBO BUNDLE</span>}
          </div>
        </div>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', zIndex: 1 }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)', zIndex: 1 }}></div>
      </div>

      <div className={styles.contentWrapper} style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '3rem', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
          <div className={styles.detailsLayout}>
            
            {/* Main Content Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%', minWidth: 0 }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', color: 'var(--text-color)', fontWeight: 800, borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>Service Overview</h2>
                <div 
                  className={styles.richContent}
                  style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '2rem' }}
                  dangerouslySetInnerHTML={{ __html: service.description ? service.description.replace(/&nbsp;/g, ' ') : '' }}
                />
                
                {service.content && (
                  <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--text-color)', fontWeight: 700 }}>Detailed Information</h3>
                    {service.content.replace(/&nbsp;/g, ' ').split(/(?=<h[23][^>]*>)/i).map((section, idx) => {
                      if (!section.trim()) return null;
                      return (
                        <div key={idx} style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                          <div 
                            className={styles.richContent}
                            style={{ fontSize: '1.05rem', color: 'var(--text-color)', lineHeight: 1.8 }}
                            dangerouslySetInnerHTML={{ __html: section }} 
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {service.documentsRequired && (
                <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)', borderLeft: '4px solid #22c55e' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#22c55e', fontWeight: 700 }}>Required Documents</h3>
                  {Array.isArray(service.documentsRequired) ? (
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-color)', lineHeight: 1.7 }}>
                      {service.documentsRequired.map((doc, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{doc}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: 'var(--text-color)', lineHeight: 1.7 }}>{service.documentsRequired}</p>
                  )}
                </div>
              )}

              {service.isCombo && comboDetails.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem', fontWeight: 800 }}>What's Included in this Combo</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {comboDetails.map((subItem) => (
                      <div key={subItem.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}>
                        <CheckCircle2 color="var(--accent-color)" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong style={{ display: 'block', fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--text-color)' }}>{subItem.name}</strong>
                          <div 
                            className={styles.richContent}
                            style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}
                            dangerouslySetInnerHTML={{ __html: subItem.description ? subItem.description.replace(/&nbsp;/g, ' ') : '' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pricing & Checkout Column */}
            <div style={{ position: 'sticky', top: '2rem' }}>
              <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', color: 'var(--accent-color)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 800, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pricing Plan
                </div>
                
                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-color)', marginTop: '0.5rem', marginRight: '0.25rem' }}>₹</span>
                  <span style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--text-color)', lineHeight: 1 }}>{service.price ? service.price.toLocaleString() : '0'}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2rem' }}>
                  {service.isRecurring ? `Billed ${service.period}` : 'One-time payment'}
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', width: '100%', textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  {(service.features && service.features.length > 0 ? service.features : ["Professional Assistance", "100% Online Process", "Dedicated Support", "Secure Payment"]).map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem', color: 'var(--text-color)' }}>
                      <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} /> 
                      <span style={{ lineHeight: 1.4 }}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  style={{ 
                    width: '100%',
                    fontSize: '1.1rem', 
                    padding: '1.1rem', 
                    backgroundColor: 'var(--accent-color)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    fontWeight: 800, 
                    cursor: 'pointer',
                    transition: 'background-color 0.2s, transform 0.1s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-color)'; e.currentTarget.style.transform = 'none'; }}
                  onClick={handleBuy}
                  disabled={buying}
                >
                  {buying ? "Processing..." : "Purchase Now"}
                </button>
                
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No hidden fees. Secure checkout.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
