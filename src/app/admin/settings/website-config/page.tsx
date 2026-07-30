"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../../lib/firebase";

export default function WebsiteConfig() {
  const [siteName, setSiteName] = useState("NetProfit");
  const [siteTitle, setSiteTitle] = useState("NetProfit");
  const [domain, setDomain] = useState("https://netprofit.in");
  const [seoMeta, setSeoMeta] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [currentLogo, setCurrentLogo] = useState("");
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [currentFavicon, setCurrentFavicon] = useState("");
  
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [footerCopyright, setFooterCopyright] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.siteName) setSiteName(data.siteName);
          if (data.siteTitle) setSiteTitle(data.siteTitle);
          if (data.domain) setDomain(data.domain);
          if (data.seoMeta) setSeoMeta(data.seoMeta);
          if (data.logoUrl) setCurrentLogo(data.logoUrl);
          if (data.faviconUrl) setCurrentFavicon(data.faviconUrl);
          
          if (data.socialLinks) {
            setFacebook(data.socialLinks.facebook || "");
            setTwitter(data.socialLinks.twitter || "");
            setInstagram(data.socialLinks.instagram || "");
            setLinkedin(data.socialLinks.linkedin || "");
            setWhatsapp(data.socialLinks.whatsapp || "");
            setTelegram(data.socialLinks.telegram || "");
          }
          if (data.address) setAddress(data.address);
          if (data.mobile) setMobile(data.mobile);
          if (data.email) setEmail(data.email);
          if (data.footerCopyright) setFooterCopyright(data.footerCopyright);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let uploadedLogoUrl = currentLogo;
      let uploadedFaviconUrl = currentFavicon;

      if (logoFile) {
        const logoRef = ref(storage, `settings/logo_${Date.now()}_${logoFile.name}`);
        const snapshot = await uploadBytes(logoRef, logoFile);
        uploadedLogoUrl = await getDownloadURL(snapshot.ref);
        setCurrentLogo(uploadedLogoUrl);
      }

      if (faviconFile) {
        const faviconRef = ref(storage, `settings/favicon_${Date.now()}_${faviconFile.name}`);
        const snapshot = await uploadBytes(faviconRef, faviconFile);
        uploadedFaviconUrl = await getDownloadURL(snapshot.ref);
        setCurrentFavicon(uploadedFaviconUrl);
      }

      const docRef = doc(db, "settings", "global");
      await setDoc(docRef, {
        siteName,
        siteTitle,
        domain,
        seoMeta,
        logoUrl: uploadedLogoUrl,
        faviconUrl: uploadedFaviconUrl,
        socialLinks: { facebook, twitter, instagram, linkedin, whatsapp, telegram },
        address,
        mobile,
        email,
        footerCopyright,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage("Website configuration saved successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Website Configuration</h1>
      <p className={styles.pageSubtitle}>Manage site name, logo, domain, SEO, contact info, and social links.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <form className={styles.form} onSubmit={handleSave}>
          
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>General Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className={styles.inputGroup}>
              <label>Site Name</label>
              <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className={styles.inputField} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Site Title (SEO Title)</label>
              <input type="text" value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} className={styles.inputField} required />
            </div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Domain</label>
              <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} className={styles.inputField} />
            </div>
            <div className={styles.inputGroup}>
              <label>Site Logo</label>
              {currentLogo && (
                <div style={{ marginBottom: "10px", background: 'var(--bg-secondary)', padding: '10px', borderRadius: '4px', display: 'inline-block' }}>
                  <img src={currentLogo} alt="Current Logo" style={{ height: "40px", objectFit: "contain" }} />
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) setLogoFile(e.target.files[0]); }} className={styles.inputField} />
            </div>
            <div className={styles.inputGroup}>
              <label>Site Icon (Favicon)</label>
              {currentFavicon && (
                <div style={{ marginBottom: "10px", background: 'var(--bg-secondary)', padding: '10px', borderRadius: '4px', display: 'inline-block' }}>
                  <img src={currentFavicon} alt="Current Favicon" style={{ height: "40px", width: "40px", objectFit: "contain" }} />
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) setFaviconFile(e.target.files[0]); }} className={styles.inputField} />
            </div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label>SEO Meta Description</label>
              <textarea rows={2} value={seoMeta} onChange={(e) => setSeoMeta(e.target.value)} className={styles.inputField} />
            </div>
          </div>

          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Sitemap & Search Console</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div>
              <strong style={{ fontSize: '1.1rem' }}>Live Sitemap URL:</strong> <a href={`${domain}/sitemap.xml`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', marginLeft: '0.5rem', fontSize: '1.1rem', textDecoration: 'underline' }}>{domain}/sitemap.xml</a>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>This XML sitemap is automatically generated in real-time. It contains all your active Services, News (with images), IPOs, Tools, and Pages. It is cached for performance.</p>
              <p style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: '0.5rem', padding: '0.5rem', background: '#fef3c720', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                <strong>Note:</strong> Both Google and Bing have officially deprecated manual sitemap ping URLs (which is why they return 404/410 errors). Search engines now automatically detect your sitemap via your <code>robots.txt</code> file and crawl it based on its updates. No manual submission is needed!
              </p>
            </div>
          </div>

          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Contact Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className={styles.inputGroup}>
              <label>Mobile Number</label>
              <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} className={styles.inputField} />
            </div>
            <div className={styles.inputGroup}>
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.inputField} />
            </div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Address</label>
              <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className={styles.inputField} />
            </div>
          </div>

          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Social Links & Footer</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className={styles.inputGroup}>
              <label>Facebook URL</label>
              <input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} className={styles.inputField} />
            </div>
            <div className={styles.inputGroup}>
              <label>Twitter/X URL</label>
              <input type="url" value={twitter} onChange={(e) => setTwitter(e.target.value)} className={styles.inputField} />
            </div>
            <div className={styles.inputGroup}>
              <label>Instagram URL</label>
              <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} className={styles.inputField} />
            </div>
            <div className={styles.inputGroup}>
              <label>LinkedIn URL</label>
              <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={styles.inputField} />
            </div>
            <div className={styles.inputGroup}>
              <label>WhatsApp Link</label>
              <input type="url" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={styles.inputField} placeholder="e.g. https://wa.me/919876543210" />
            </div>
            <div className={styles.inputGroup}>
              <label>Telegram Link</label>
              <input type="url" value={telegram} onChange={(e) => setTelegram(e.target.value)} className={styles.inputField} placeholder="e.g. https://t.me/netprofit" />
            </div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Footer Copyright Text</label>
              <input type="text" value={footerCopyright} onChange={(e) => setFooterCopyright(e.target.value)} className={styles.inputField} placeholder="© 2026 NetProfit. All rights reserved." />
            </div>
          </div>
          
          {message && (
            <div style={{ color: message.includes("Error") ? "#dc2626" : "#16a34a", padding: "10px 0", fontWeight: 'bold' }}>
              {message}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className={styles.submitBtn} disabled={loading} style={{ padding: '0.8rem 2rem' }}>
              {loading ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
