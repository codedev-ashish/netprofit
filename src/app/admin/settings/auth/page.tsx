"use client";

import React, { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { Save, Plus, Trash2 } from "lucide-react";

export default function AuthSettingsPage() {
  const [restrictEmails, setRestrictEmails] = useState(true);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([
    "gmail.com",
    "zohomail.com",
    "zohomail.in",
    "outlook.com",
    "outlook.in",
    "live.com",
    "yahoo.com",
    "ymail.com",
    "rediffmail.com",
    "proton.me"
  ]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "auth");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.restrictEmails !== undefined) setRestrictEmails(data.restrictEmails);
          if (data.allowedDomains && Array.isArray(data.allowedDomains)) {
            setAllowedDomains(data.allowedDomains);
          }
        }
      } catch (err) {
        console.error("Error fetching auth settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleAddDomain = () => {
    let domain = newDomain.trim().toLowerCase();
    if (!domain) return;
    // Remove @ if user typed it
    if (domain.startsWith('@')) domain = domain.substring(1);
    
    if (!allowedDomains.includes(domain)) {
      setAllowedDomains([...allowedDomains, domain]);
    }
    setNewDomain("");
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setAllowedDomains(allowedDomains.filter(d => d !== domainToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const docRef = doc(db, "settings", "auth");
      await setDoc(docRef, {
        restrictEmails,
        allowedDomains,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage("Auth settings saved successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Auth & Registration Settings</h1>
      <p className={styles.pageSubtitle}>Control who can register on the website by restricting email providers.</p>
      
      <form onSubmit={handleSave}>
        <div className={`cleartax-card ${styles.managementCard}`} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-color)', marginBottom: '1.5rem' }}>Email Domain Restrictions</h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <input 
                type="checkbox" 
                id="restrictEmails" 
                checked={restrictEmails} 
                onChange={(e) => setRestrictEmails(e.target.checked)} 
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary-color)' }} 
              />
              <label htmlFor="restrictEmails" style={{ margin: 0, cursor: 'pointer', fontWeight: 600, fontSize: '1.05rem' }}>
                Restrict registration to specific email domains (Block Temp Emails)
              </label>
            </div>
          </div>

          <div style={{ opacity: restrictEmails ? 1 : 0.5, pointerEvents: restrictEmails ? 'auto' : 'none' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Allowed Email Domains</label>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Only users with email addresses ending in these domains will be permitted to register. 
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                value={newDomain} 
                onChange={(e) => setNewDomain(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDomain(); } }}
                className={styles.inputField} 
                placeholder="e.g. company.com or @gmail.com" 
                style={{ maxWidth: '300px' }}
              />
              <button 
                type="button" 
                onClick={handleAddDomain}
                className={styles.submitBtn} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1.5rem' }}
              >
                <Plus size={16} /> Add Domain
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {allowedDomains.length === 0 && (
                <span style={{ color: 'var(--text-muted)' }}>No domains added. If restriction is enabled, NO ONE will be able to register!</span>
              )}
              {allowedDomains.map(domain => (
                <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                  <span style={{ fontWeight: 500 }}>@{domain}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveDomain(domain)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                    title="Remove Domain"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {message && (
          <div style={{ color: message.includes("Error") ? "#dc2626" : "#16a34a", padding: "10px 0", fontWeight: 'bold', textAlign: 'right', marginTop: '1rem' }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', marginBottom: '2rem' }}>
          <button type="submit" className={styles.submitBtn} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem', fontSize: '1rem' }}>
            <Save size={18} /> {loading ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
