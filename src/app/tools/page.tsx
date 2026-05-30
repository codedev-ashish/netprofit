"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Calculator } from "lucide-react";
import styles from "../page.module.css";

export default function ToolsListPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const q = query(collection(db, "tools"), where("isPublished", "==", true));
        const snapshot = await getDocs(q);
        const toolsData: any[] = [];
        snapshot.forEach((doc) => {
          toolsData.push({ id: doc.id, ...doc.data() });
        });
        setTools(toolsData);
      } catch (error) {
        console.error("Error fetching tools:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTools();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Financial & Tax Calculators</h1>
        <p className={styles.subtitle}>Plan your finances better with our free online tools.</p>
      </div>

      <div className={styles.section}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading calculators...</div>
        ) : tools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No calculators available at the moment.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {tools.map(tool => (
              <div key={tool.id} className="cleartax-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem', background: 'var(--card-bg)' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255, 107, 0, 0.1)', color: 'var(--accent-color)' }}>
                  <Calculator size={28} />
                </div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.4rem', fontWeight: 800 }}>
                  <Link href={`/tools/${tool.slug}`} style={{ textDecoration: 'none', color: 'var(--text-color)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-color)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-color)'}>
                    {tool.name}
                  </Link>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, flexGrow: 1 }}>
                  {tool.description}
                </p>
                <div style={{ marginTop: '2rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <Link href={`/tools/${tool.slug}`} style={{ textDecoration: 'none', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.gap = '0.75rem'; }} onMouseLeave={(e) => { e.currentTarget.style.gap = '0.5rem'; }}>
                    Use Tool <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
