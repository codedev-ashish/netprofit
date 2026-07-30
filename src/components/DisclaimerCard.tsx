"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function DisclaimerCard({ toolSlug }: { toolSlug: string }) {
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDisclaimer = async () => {
      try {
        const q = query(collection(db, "tools"), where("slug", "==", toolSlug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          if (data.disclaimer && data.disclaimer.trim() !== "") {
            setDisclaimer(data.disclaimer);
          }
        }
      } catch (err) {
        console.error("Failed to fetch disclaimer", err);
      }
    };
    fetchDisclaimer();
  }, [toolSlug]);

  if (!disclaimer) return null;

  return (
    <div className="cleartax-card" style={{ 
      marginTop: '2rem', 
      width: '100%', 
      padding: '2rem', 
      backgroundColor: 'var(--card-bg)', 
      border: '1px solid var(--border-color)', 
      borderRadius: '16px', 
      boxShadow: 'var(--shadow-lg)' 
    }}>
      <h3 style={{ color: 'var(--text-color)', marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: 700 }}>Disclaimer</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
        {disclaimer}
      </p>
    </div>
  );
}
