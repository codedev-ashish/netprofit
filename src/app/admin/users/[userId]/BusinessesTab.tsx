"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Briefcase, ChevronRight } from "lucide-react";

export default function BusinessesTab({ userId }: { userId: string }) {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const busQuery = query(collection(db, "businesses"), where("userId", "==", userId));
        const busSnap = await getDocs(busQuery);
        const fetchedBusinesses = busSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBusinesses(fetchedBusinesses);
      } catch (error) {
        console.error("Error fetching businesses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, [userId]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading businesses...</div>;
  if (businesses.length === 0) return <p style={{ color: "var(--text-muted)", padding: '1rem' }}>No businesses found for this user.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
      <h3 style={{ marginBottom: "0.5rem" }}>Select Business</h3>
      {businesses.map(b => (
        <div 
          key={b.id} 
          onClick={() => router.push(`/admin/users/${userId}/businesses/${b.id}`)} 
          style={{ cursor: "pointer", padding: "1.5rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s" }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-color)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Briefcase size={24} style={{ color: "var(--accent-color)" }} />
            <div>
              <h4 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{b.name || "Default Business"}</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>View assigned services and documents</p>
            </div>
          </div>
          <ChevronRight size={20} style={{ color: "var(--text-muted)" }} />
        </div>
      ))}
    </div>
  );
}
