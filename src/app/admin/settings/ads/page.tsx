"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export default function AdsConfig() {
  const [headCode, setHeadCode] = useState("");
  const [bodyCode, setBodyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "ads");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.headCode) setHeadCode(data.headCode);
          if (data.bodyCode) setBodyCode(data.bodyCode);
        }
      } catch (err) {
        console.error("Error fetching ads settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const docRef = doc(db, "settings", "ads");
      await setDoc(docRef, {
        headCode,
        bodyCode,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage("Custom code configuration saved successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Ads & Custom Code</h1>
      <p className={styles.pageSubtitle}>Inject custom HTML, CSS, Javascript or Ad networks code into your site's &lt;head&gt; or &lt;body&gt; tags.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <form className={styles.form} onSubmit={handleSave}>
          
          <div className={styles.inputGroup} style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Code in &lt;head&gt;</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Added right before &lt;/head&gt;</span>
            </label>
            <textarea 
              rows={8} 
              value={headCode} 
              onChange={(e) => setHeadCode(e.target.value)} 
              className={styles.inputField} 
              placeholder="<!-- e.g. Google Analytics, AdSense auto-ads, custom CSS -->"
              style={{ fontFamily: 'monospace', fontSize: '0.9rem', background: '#1e293b', color: '#e2e8f0' }}
            />
          </div>

          <div className={styles.inputGroup} style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Code in &lt;body&gt;</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Added right before &lt;/body&gt;</span>
            </label>
            <textarea 
              rows={8} 
              value={bodyCode} 
              onChange={(e) => setBodyCode(e.target.value)} 
              className={styles.inputField} 
              placeholder="<!-- e.g. External scripts, tracking pixels -->"
              style={{ fontFamily: 'monospace', fontSize: '0.9rem', background: '#1e293b', color: '#e2e8f0' }}
            />
          </div>
          
          {message && (
            <div style={{ color: message.includes("Error") ? "#dc2626" : "#16a34a", padding: "10px 0", fontWeight: 'bold' }}>
              {message}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className={styles.submitBtn} disabled={loading} style={{ padding: '0.8rem 2rem' }}>
              {loading ? "Saving..." : "Save Custom Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
