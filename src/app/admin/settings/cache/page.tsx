"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export default function CacheConfig() {
  const [redisUrl, setRedisUrl] = useState("");
  const [enableCache, setEnableCache] = useState(false);
  const [cacheTtl, setCacheTtl] = useState(3600);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "cache");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.redisUrl) setRedisUrl(data.redisUrl);
          if (data.enableCache !== undefined) setEnableCache(data.enableCache);
          if (data.cacheTtl) setCacheTtl(data.cacheTtl);
        }
      } catch (err) {
        console.error("Error fetching cache settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const docRef = doc(db, "settings", "cache");
      await setDoc(docRef, {
        redisUrl,
        enableCache,
        cacheTtl,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage("Cache configuration saved successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage("Error saving cache settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    alert("This action would clear the redis cache via an API endpoint in production.");
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Cache (Redis)</h1>
      <p className={styles.pageSubtitle}>Configure Redis caching to improve application performance and response times.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <form className={styles.form} onSubmit={handleSave}>
          
          <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={enableCache}
                onChange={(e) => setEnableCache(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Enable Redis Cache</span>
            </label>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              When enabled, supported API routes and database queries will use Redis to reduce latency.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '2rem', opacity: enableCache ? 1 : 0.5, pointerEvents: enableCache ? 'auto' : 'none' }}>
            <div className={styles.inputGroup}>
              <label>Redis Connection URL</label>
              <input 
                type="text" 
                value={redisUrl} 
                onChange={(e) => setRedisUrl(e.target.value)} 
                className={styles.inputField} 
                placeholder="redis://username:password@host:port"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Default TTL (Seconds)</label>
              <input 
                type="number" 
                value={cacheTtl} 
                onChange={(e) => setCacheTtl(Number(e.target.value))} 
                className={styles.inputField} 
                placeholder="3600"
              />
            </div>
          </div>
          
          {message && (
            <div style={{ color: message.includes("Error") ? "#dc2626" : "#16a34a", padding: "10px 0", fontWeight: 'bold' }}>
              {message}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" onClick={clearCache} className={styles.submitBtn} style={{ background: '#dc2626' }}>
              Clear Entire Cache
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading} style={{ padding: '0.8rem 2rem' }}>
              {loading ? "Saving..." : "Save Cache Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
