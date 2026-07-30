"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

const PUBLIC_PAGES = [
  { id: "home", name: "Home Page", url: "/" },
  { id: "services", name: "Services", url: "/services" },
  { id: "news", name: "News", url: "/news" },
  { id: "ipo", name: "IPO", url: "/ipo" },
  { id: "tools", name: "Tools", url: "/tools" },
  { id: "login", name: "Login", url: "/login" },
  { id: "register", name: "Register", url: "/register" },
  { id: "newsCategory", name: "News Category", url: "/news/category/[category]" }
];

export default function PublicSEOSettings() {
  const [seoData, setSeoData] = useState<Record<string, { title: string, description: string, keywords: string, customSchema?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState(PUBLIC_PAGES[0].id);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "public_seo");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSeoData(docSnap.data() || {});
        } else {
          // Initialize empty
          const initialData: any = {};
          PUBLIC_PAGES.forEach(p => {
            initialData[p.id] = { title: "", description: "", keywords: "", customSchema: "" };
          });
          setSeoData(initialData);
        }
      } catch (err) {
        console.error("Error fetching SEO settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (field: "title" | "description" | "keywords", value: string) => {
    setSeoData(prev => ({
      ...prev,
      [activeTab]: {
        ...(prev[activeTab] || { title: "", description: "", keywords: "", customSchema: "" }),
        [field]: value
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const docRef = doc(db, "settings", "public_seo");
      await setDoc(docRef, {
        ...seoData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage("Public SEO settings saved successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentData = seoData[activeTab] || { title: "", description: "", keywords: "", customSchema: "" };

  return (
    <div>
      <h1 className={styles.pageTitle}>Public Pages SEO</h1>
      <p className={styles.pageSubtitle}>Manage Meta Title, Description, and Keywords for standard public routes.</p>

      <div className={`cleartax-card ${styles.managementCard}`}>
        <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {PUBLIC_PAGES.map(page => (
            <button
              key={page.id}
              onClick={() => setActiveTab(page.id)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                background: activeTab === page.id ? 'var(--primary)' : 'var(--bg-secondary)',
                color: activeTab === page.id ? '#fff' : 'var(--text-color)',
                borderRadius: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: activeTab === page.id ? 'bold' : 'normal'
              }}
            >
              {page.name}
            </button>
          ))}
        </div>

        <form className={styles.form} onSubmit={handleSave}>

          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#60a5fa' }}>
            Editing SEO for: {PUBLIC_PAGES.find(p => p.id === activeTab)?.name} ({PUBLIC_PAGES.find(p => p.id === activeTab)?.url})
          </h2>

          {activeTab === 'newsCategory' && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
              Note: For the News Category page, you can use the placeholder <strong>{`{category}`}</strong> in the Title and Description. It will be replaced automatically with the actual category name (e.g., "Tax News").
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>

            <div className={styles.inputGroup}>
              <label>SEO Meta Title</label>
              <input
                type="text"
                value={currentData.title || ''}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={styles.inputField}
                placeholder={`e.g., ${PUBLIC_PAGES.find(p => p.id === activeTab)?.name.split(' ')[0]} | NetProfit`}
              />
              <small style={{ color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Leave empty to use default title. Best kept under 60 characters.
              </small>
            </div>

            <div className={styles.inputGroup}>
              <label>SEO Meta Description</label>
              <textarea
                value={currentData.description || ''}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className={styles.inputField}
                rows={3}
                placeholder="Enter a compelling meta description..."
              />
              <small style={{ color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Best kept under 155 characters to avoid truncation in search results.
              </small>
            </div>

            <div className={styles.inputGroup}>
              <label>SEO Keywords</label>
              <input
                type="text"
                value={currentData.keywords || ''}
                onChange={(e) => handleInputChange("keywords", e.target.value)}
                className={styles.inputField}
                placeholder="e.g., tax, finance, business registration (comma separated)"
              />
              <small style={{ color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Comma-separated list of keywords. Note: modern search engines focus more on content, but keywords are still useful.
              </small>
            </div>

            <div className={styles.inputGroup}>
              <label>Custom Schema (JSON-LD) (Optional)</label>
              <textarea
                value={currentData.customSchema || ''}
                onChange={(e) => handleInputChange("customSchema" as any, e.target.value)}
                className={styles.inputField}
                rows={4}
                placeholder='{"@context": "https://schema.org", "@type": "WebSite", ...}'
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              />
              <small style={{ color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Paste the raw JSON object here. It will automatically be wrapped in a script tag on the frontend.
              </small>
            </div>

          </div>

          {message && (
            <div style={{ color: message.includes("Error") ? "#dc2626" : "#16a34a", padding: "10px 0", fontWeight: 'bold' }}>
              {message}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
            <button type="submit" className={styles.submitBtn} disabled={loading} style={{ padding: '0.8rem 2rem' }}>
              {loading ? "Saving..." : "Save SEO Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
