"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ArrowLeft, FileText, ChevronRight } from "lucide-react";
import styles from "../../../../page.module.css";

export default function BusinessDetailsPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const businessId = params?.businessId as string;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (!userId || !businessId) return;

    const fetchData = async () => {
      try {
        // Fetch Business Details
        const bRef = doc(db, "businesses", businessId);
        const bSnap = await getDoc(bRef);
        if (bSnap.exists()) {
          setBusiness({ id: bSnap.id, ...bSnap.data() });
        }

        // Fetch Services associated with this business (via service_requests)
        const srQuery = query(collection(db, "service_requests"), where("userId", "==", userId), where("businessId", "==", businessId));
        const srSnap = await getDocs(srQuery);
        
        const fetchedServices: any[] = [];
        const seenServiceIds = new Set();
        
        srSnap.forEach(s => {
          const data = s.data();
          const serviceIdentifier = data.serviceId || data.serviceName;
          
          if (serviceIdentifier && !seenServiceIds.has(serviceIdentifier)) {
            seenServiceIds.add(serviceIdentifier);
            fetchedServices.push({ 
              id: s.id, 
              serviceId: data.serviceId,
              serviceName: data.serviceName || "Unknown Service",
              category: data.category
            });
          }
        });
        
        setServices(fetchedServices);
      } catch (error) {
        console.error("Error fetching business details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, businessId]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading business details...</div>;

  return (
    <div>
      <button 
        onClick={() => router.push(`/admin/users/${userId}`)} 
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
      >
        <ArrowLeft size={16} /> Back to User Profile
      </button>

      <h1 className={styles.pageTitle} style={{ marginBottom: '2rem' }}>
        🏢 {business?.name || "Business Details"}
      </h1>

      <div className={`cleartax-card ${styles.managementCard}`}>
        <h3 style={{ marginBottom: "1rem" }}>Services for this Business</h3>
        
        {services.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: '1rem' }}>No services found for this business.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {services.map(s => (
              <div 
                key={s.id} 
                onClick={() => router.push(`/admin/users/${userId}/businesses/${businessId}/services/${encodeURIComponent(s.serviceName)}`)} 
                style={{ cursor: "pointer", padding: "1.5rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-color)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <FileText size={20} style={{ color: "var(--primary-color)" }} />
                  <div>
                    <h4 style={{ fontSize: "1.05rem", marginBottom: "0.25rem" }}>{s.serviceName}</h4>
                    {s.category && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{s.category}</p>}
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
