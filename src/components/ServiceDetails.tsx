"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, documentId } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import styles from "../app/services/page.module.css";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  period: string;
  isRecurring: boolean;
  documentsRequired?: string;
  isCombo?: boolean;
  comboServices?: string[];
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
          sData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Service;
        } else {
          // 2. Fallback to fetch by ID
          const fallbackRef = doc(db, "services", slugValue);
          const docSnap = await getDoc(fallbackRef);
          if (docSnap.exists()) {
            sData = { id: docSnap.id, ...docSnap.data() } as Service;
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

  const handleBuy = async () => {
    if (!service) return;
    if (!user) {
      router.push("/auth");
      return;
    }

    setBuying(true);
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
      setBuying(false);
    }
  };

  if (loading) {
    return <div className={styles.container}><p style={{textAlign: 'center', padding: '4rem'}}>Loading service details...</p></div>;
  }

  if (!service) return null;

  const backLink = user ? "/user/services" : "/services";

  return (
    <div className={styles.container}>
      <div className={styles.hero} style={{ padding: '3rem 2rem' }}>
        <Link href={backLink} style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', marginBottom: '1rem', fontWeight: 600 }}>
          <ArrowLeft size={20} /> Back to Services
        </Link>
        <h1 className={styles.title} style={{ fontSize: '2.5rem' }}>{service.name}</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.25rem 1rem', borderRadius: '20px', fontWeight: 600 }}>{service.category}</span>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.25rem 1rem', borderRadius: '20px', fontWeight: 600, textTransform: 'capitalize' }}>{service.period}</span>
          {service.isCombo && <span style={{ backgroundColor: '#f59e0b', color: 'white', padding: '0.25rem 1rem', borderRadius: '20px', fontWeight: 800 }}>COMBO BUNDLE</span>}
        </div>
      </div>

      <div className={styles.contentWrapper} style={{ maxWidth: '800px', padding: '3rem 2rem' }}>
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-color)' }}>Service Overview</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2rem' }}>
            {service.description}
          </p>

          {service.documentsRequired && (
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#334155' }}>Required Documents</h3>
              <p style={{ color: '#475569', lineHeight: 1.6 }}>{service.documentsRequired}</p>
            </div>
          )}

          {service.isCombo && comboDetails.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>What's Included in this Combo</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {comboDetails.map((subItem) => (
                  <div key={subItem.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', backgroundColor: 'var(--bg-color)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <CheckCircle2 color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{subItem.name}</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{subItem.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
            <button 
              className={styles.buyBtn} 
              style={{ fontSize: '1.1rem', padding: '1rem 3rem' }}
              onClick={handleBuy}
              disabled={buying}
            >
              {buying ? "Processing..." : "Purchase Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
