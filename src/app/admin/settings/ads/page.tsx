"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export default function AdsConfig() {
  const [activeTab, setActiveTab] = useState("seo");

  // SEO & TXT Files
  const [robotsTxt, setRobotsTxt] = useState("User-agent: *\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nUser-agent: Googlebot-Mobile\nAllow: /\n\nUser-agent: Googlebot-Smartphone\nAllow: /\n\nUser-agent: bingbot\nAllow: /");
  const [adsTxt, setAdsTxt] = useState("");
  const [appAdsTxt, setAppAdsTxt] = useState("");
  const [searchConsoleCode, setSearchConsoleCode] = useState("");
  const [analyticsCode, setAnalyticsCode] = useState("");

  // Website Ads
  const [websiteAdsEnabled, setWebsiteAdsEnabled] = useState(false);
  const [placements, setPlacements] = useState<{ id: number, network: string, position: string, code: string }[]>([]);

  // App Ads
  const [appAdsEnabled, setAppAdsEnabled] = useState(false);
  const [admobCode, setAdmobCode] = useState("");
  const [fbAudienceCode, setFbAudienceCode] = useState("");
  const [unityAdsCode, setUnityAdsCode] = useState("");
  const [appOtherAdCode, setAppOtherAdCode] = useState("");
  const [appCustomAdsCode, setAppCustomAdsCode] = useState("");

  // Global Custom Code
  const [headCode, setHeadCode] = useState("");
  const [bodyCode, setBodyCode] = useState("");
  const [globalScripts, setGlobalScripts] = useState<{ id: number, name: string, position: string, code: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, size: number}[]>([]);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const fetchUploadedFiles = async () => {
    try {
      const res = await fetch("/api/upload-root-file");
      const data = await res.json();
      if (data.files) {
        setUploadedFiles(data.files);
      }
    } catch (err) {
      console.error("Failed to fetch uploaded files", err);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) return;
    setDeletingFile(fileName);
    try {
      const res = await fetch(`/api/upload-root-file?fileName=${encodeURIComponent(fileName)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUploadedFiles();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete file.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting file.");
    } finally {
      setDeletingFile(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];

    // Check if file already exists
    const fileExists = uploadedFiles.some(f => f.name === file.name);
    if (fileExists) {
      if (!window.confirm(`A file named "${file.name}" already exists. Do you want to replace it?`)) {
        e.target.value = ""; // reset input
        return;
      }
    }

    setIsUploading(true);
    setUploadStatus(`Uploading ${file.name}...`);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("/api/upload-root-file", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok) {
        setUploadStatus(data.message || "Upload successful.");
        fetchUploadedFiles();
      } else {
        setUploadStatus(data.error || "Upload failed.");
      }
    } catch (err) {
      console.error(err);
      setUploadStatus("Error during upload.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(""), 5000);
      e.target.value = ""; // reset input
    }
  };

  useEffect(() => {
    fetchUploadedFiles();
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "ads");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.robotsTxt) setRobotsTxt(data.robotsTxt);
          if (data.adsTxt !== undefined) setAdsTxt(data.adsTxt);
          if (data.appAdsTxt !== undefined) setAppAdsTxt(data.appAdsTxt);
          if (data.searchConsoleCode) setSearchConsoleCode(data.searchConsoleCode);
          if (data.analyticsCode) setAnalyticsCode(data.analyticsCode);

          if (data.websiteAds) {
            setWebsiteAdsEnabled(!!data.websiteAds.enabled);
            if (Array.isArray(data.websiteAds.placements)) {
              setPlacements(data.websiteAds.placements.map((p: any, i: number) => ({ id: Date.now() + i, ...p })));
            } else {
              setPlacements([]);
            }
          }

          if (data.appAds) {
            setAppAdsEnabled(!!data.appAds.enabled);
            setAdmobCode(data.appAds.admobCode || "");
            setFbAudienceCode(data.appAds.fbAudienceCode || "");
            setUnityAdsCode(data.appAds.unityAdsCode || "");
            setAppOtherAdCode(data.appAds.appOtherAdNetworkCode || "");
            setAppCustomAdsCode(data.appAds.appCustomAdsCode || "");
          }

          if (data.headCode) setHeadCode(data.headCode);
          if (data.bodyCode) setBodyCode(data.bodyCode);

          if (Array.isArray(data.globalScripts)) {
            setGlobalScripts(data.globalScripts.map((s: any, i: number) => ({ id: Date.now() + i, ...s })));
          } else {
            setGlobalScripts([]);
          }
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
        robotsTxt,
        adsTxt,
        appAdsTxt,
        searchConsoleCode,
        analyticsCode,
        websiteAds: {
          enabled: websiteAdsEnabled,
          placements: placements.map(({ network, position, code }) => ({ network, position, code })),
        },
        appAds: {
          enabled: appAdsEnabled,
          admobCode,
          fbAudienceCode,
          unityAdsCode,
          appOtherAdNetworkCode: appOtherAdCode,
          appCustomAdsCode,
        },
        headCode,
        bodyCode,
        globalScripts: globalScripts.map(({ name, position, code }) => ({ name, position, code })),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage("Settings saved successfully!");
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
      <h1 className={styles.pageTitle}>SEO & Ad Networks</h1>
      <p className={styles.pageSubtitle}>Manage your SEO files, Analytics, Search Console, Website Ads, and Android App Ads.</p>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button type="button" onClick={() => setActiveTab("seo")} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: activeTab === "seo" ? "bold" : "normal", color: activeTab === "seo" ? "var(--link-color)" : "var(--text-color)", borderBottom: activeTab === "seo" ? "2px solid var(--link-color)" : "none" }}>SEO & TXT Files</button>
        <button type="button" onClick={() => setActiveTab("webAds")} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: activeTab === "webAds" ? "bold" : "normal", color: activeTab === "webAds" ? "var(--link-color)" : "var(--text-color)", borderBottom: activeTab === "webAds" ? "2px solid var(--link-color)" : "none" }}>Website Ads</button>
        <button type="button" onClick={() => setActiveTab("appAds")} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: activeTab === "appAds" ? "bold" : "normal", color: activeTab === "appAds" ? "var(--link-color)" : "var(--text-color)", borderBottom: activeTab === "appAds" ? "2px solid var(--link-color)" : "none" }}>Android App Ads</button>
        <button type="button" onClick={() => setActiveTab("customCode")} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: activeTab === "customCode" ? "bold" : "normal", color: activeTab === "customCode" ? "var(--link-color)" : "var(--text-color)", borderBottom: activeTab === "customCode" ? "2px solid var(--link-color)" : "none" }}>Global Scripts</button>
      </div>

      <div className={`cleartax-card ${styles.managementCard}`}>
        <form className={styles.form} onSubmit={handleSave}>
          
          {activeTab === "seo" && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Search Engine Verification Codes (Google, Bing, Yandex, etc.)</label>
                <textarea rows={3} value={searchConsoleCode} onChange={(e) => setSearchConsoleCode(e.target.value)} className={styles.inputField} placeholder="<meta name='google-site-verification' content='...' />\n<meta name='msvalidate.01' content='...' />" style={{ fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0' }} />
                <small style={{ color: 'var(--text-muted)' }}>Paste full HTML tags. Automatically injected securely.</small>
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Google Analytics Code</label>
                <textarea rows={4} value={analyticsCode} onChange={(e) => setAnalyticsCode(e.target.value)} className={styles.inputField} placeholder="<!-- Global site tag (gtag.js) - Google Analytics -->..." style={{ fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0' }} />
              </div>
              <div className={styles.inputGroup}>
                <label>robots.txt</label>
                <textarea rows={6} value={robotsTxt} onChange={(e) => setRobotsTxt(e.target.value)} className={styles.inputField} style={{ fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0' }} />
              </div>
              <div className={styles.inputGroup}>
                <label>ads.txt</label>
                <textarea rows={6} value={adsTxt} onChange={(e) => setAdsTxt(e.target.value)} className={styles.inputField} style={{ fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0' }} />
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>app-ads.txt</label>
                <textarea rows={4} value={appAdsTxt} onChange={(e) => setAppAdsTxt(e.target.value)} className={styles.inputField} style={{ fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0' }} />
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <label>Upload File to Root Folder</label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Need to upload a verification file (e.g. <code>google1234.html</code>, <code>ads.txt</code>) to the root of your domain?
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="file" onChange={handleFileUpload} disabled={isUploading} style={{ padding: '0.5rem', border: '1px dashed var(--border-color)', borderRadius: '6px', width: '100%', maxWidth: '400px' }} />
                  {isUploading && <span style={{ color: 'var(--link-color)', fontSize: '0.9rem' }}>Uploading...</span>}
                </div>
                {uploadStatus && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: uploadStatus.includes('Error') || uploadStatus.includes('failed') ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                    {uploadStatus}
                  </div>
                )}
                
                {uploadedFiles.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <label style={{ fontSize: '0.95rem', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold' }}>Files in Root Folder (public/)</label>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                      {uploadedFiles.map((f, i) => (
                        <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: i < uploadedFiles.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <a href={`/${f.name}`} target="_blank" rel="noreferrer" className="text-link" style={{ fontWeight: 'bold', textDecoration: 'none' }}>{f.name}</a>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(2)} KB</span>
                          </div>
                          <button type="button" onClick={() => handleDeleteFile(f.name)} disabled={deletingFile === f.name} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: deletingFile === f.name ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {deletingFile === f.name ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "webAds" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <input type="checkbox" checked={websiteAdsEnabled} onChange={(e) => setWebsiteAdsEnabled(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                Enable Ads on Website
              </label>

              {placements.map((placement, index) => (
                <div key={placement.id} style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0 }}>Ad Placement {index + 1}</h4>
                    <button type="button" onClick={() => setPlacements(placements.filter(p => p.id !== placement.id))} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.inputGroup}>
                      <label>Ad Network</label>
                      <select value={placement.network} onChange={(e) => {
                        const newP = [...placements];
                        newP[index].network = e.target.value;
                        setPlacements(newP);
                      }} className={styles.inputField} disabled={!websiteAdsEnabled} style={{ appearance: 'auto', paddingRight: '2rem' }}>
                        <option value="Google AdSense">Google AdSense</option>
                        <option value="Media.net">Media.net</option>
                        <option value="PropellerAds">PropellerAds</option>
                        <option value="Custom">Custom HTML / JS</option>
                      </select>
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <label>Ad Position</label>
                      <select value={placement.position} onChange={(e) => {
                        const newP = [...placements];
                        newP[index].position = e.target.value;
                        setPlacements(newP);
                      }} className={styles.inputField} disabled={!websiteAdsEnabled} style={{ appearance: 'auto', paddingRight: '2rem' }}>
                        <optgroup label="Global (Whole Website)">
                          <option value="head">Global Head Auto for Whole Website</option>
                          <option value="top_header">Top Header Above Navbar for Whole Website</option>
                          <option value="below_header">Below Header for Whole Website</option>
                          <option value="above_footer">Above Footer for Whole Website</option>
                          <option value="below_footer">Below Footer for Whole Website</option>
                          <option value="global_sidebar">Side Bar</option>
                        </optgroup>

                        <optgroup label="Additional News (News Listing Page)">
                          <option value="news_before_content">Before Content</option>
                          <option value="news_after_content">After Content</option>
                          <option value="news_inbetween_content">Inbetween Content</option>
                          <option value="news_sidebar">Side bar</option>
                        </optgroup>

                        <optgroup label="Additional for IPO (IPO Listing Page)">
                          <option value="ipo_between_cards">Ads cards between cards</option>
                          <option value="ipo_sidebar">Side bar</option>
                        </optgroup>

                        <optgroup label="Additional for Tools Page (Tools Listing Page)">
                          <option value="tools_before">before tools</option>
                          <option value="tools_after">after tools</option>
                          <option value="tools_between_cards">between two cards</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Ad Code</label>
                    <textarea rows={4} value={placement.code} onChange={(e) => {
                      const newP = [...placements];
                      newP[index].code = e.target.value;
                      setPlacements(newP);
                    }} className={styles.inputField} style={{ fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0' }} disabled={!websiteAdsEnabled} placeholder="<script>...</script>" />
                  </div>
                </div>
              ))}

              <button type="button" onClick={() => setPlacements([...placements, { id: Date.now(), network: 'Google AdSense', position: 'below_header', code: '' }])} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-start' }} disabled={!websiteAdsEnabled}>
                + Add Ad Placement
              </button>
            </div>
          )}

          {activeTab === "appAds" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <input type="checkbox" checked={appAdsEnabled} onChange={(e) => setAppAdsEnabled(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                Enable Ads in Android App
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className={styles.inputGroup}>
                  <label>Admob Credentials</label>
                  <textarea rows={3} value={admobCode} onChange={(e) => setAdmobCode(e.target.value)} className={styles.inputField} placeholder="Enter App ID and Unit IDs (JSON or lines)" disabled={!appAdsEnabled} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Facebook Audience Network</label>
                  <textarea rows={3} value={fbAudienceCode} onChange={(e) => setFbAudienceCode(e.target.value)} className={styles.inputField} placeholder="Enter Placement IDs" disabled={!appAdsEnabled} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Unity Ads</label>
                  <textarea rows={3} value={unityAdsCode} onChange={(e) => setUnityAdsCode(e.target.value)} className={styles.inputField} placeholder="Enter Game ID" disabled={!appAdsEnabled} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Other Ad Network</label>
                  <textarea rows={3} value={appOtherAdCode} onChange={(e) => setAppOtherAdCode(e.target.value)} className={styles.inputField} disabled={!appAdsEnabled} />
                </div>
                <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Custom Ads Configuration</label>
                  <textarea rows={4} value={appCustomAdsCode} onChange={(e) => setAppCustomAdsCode(e.target.value)} className={styles.inputField} disabled={!appAdsEnabled} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "customCode" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Manage global scripts and meta tags injected into the whole website. You can still use the legacy head/body code fields below, or add named scripts individually.
                </p>
                {globalScripts.map((script, index) => (
                  <div key={script.id} style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0 }}>Script {index + 1}</h4>
                      <button type="button" onClick={() => setGlobalScripts(globalScripts.filter(s => s.id !== script.id))} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className={styles.inputGroup}>
                        <label>Script Name (e.g. Meta Pixel, Custom CSS)</label>
                        <input type="text" value={script.name} onChange={(e) => {
                          const newS = [...globalScripts];
                          newS[index].name = e.target.value;
                          setGlobalScripts(newS);
                        }} className={styles.inputField} placeholder="Name" />
                      </div>
                      
                      <div className={styles.inputGroup}>
                        <label>Position</label>
                        <select value={script.position} onChange={(e) => {
                          const newS = [...globalScripts];
                          newS[index].position = e.target.value;
                          setGlobalScripts(newS);
                        }} className={styles.inputField} style={{ appearance: 'auto', paddingRight: '2rem' }}>
                          <option value="head">In &lt;head&gt;</option>
                          <option value="body">In &lt;body&gt;</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label>Code</label>
                      <textarea rows={4} value={script.code} onChange={(e) => {
                        const newS = [...globalScripts];
                        newS[index].code = e.target.value;
                        setGlobalScripts(newS);
                      }} className={styles.inputField} style={{ fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0' }} placeholder="<script>...</script> or <meta ... />" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setGlobalScripts([...globalScripts, { id: Date.now(), name: '', position: 'head', code: '' }])} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-start' }}>
                  + Add New Script
                </button>
              </div>

              <div className={styles.inputGroup}>
                <label>Legacy Code in &lt;head&gt; (Injected just before &lt;/head&gt;)</label>
                <textarea rows={6} value={headCode} onChange={(e) => setHeadCode(e.target.value)} className={styles.inputField} style={{ fontFamily: 'monospace', background: '#1e293b', color: '#e2e8f0' }} placeholder="<!-- e.g. custom CSS -->" />
              </div>
              <div className={styles.inputGroup}>
                <label>Legacy Code in &lt;body&gt; (Injected just before &lt;/body&gt;)</label>
                <textarea rows={6} value={bodyCode} onChange={(e) => setBodyCode(e.target.value)} className={styles.inputField} style={{ fontFamily: 'monospace', background: '#1e293b', color: '#e2e8f0' }} placeholder="<!-- e.g. tracking pixels -->" />
              </div>
            </div>
          )}
          
          {message && (
            <div style={{ color: message.includes("Error") ? "#dc2626" : "#16a34a", padding: "10px 0", fontWeight: 'bold' }}>
              {message}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className={styles.submitBtn} disabled={loading} style={{ padding: '0.8rem 2rem' }}>
              {loading ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
