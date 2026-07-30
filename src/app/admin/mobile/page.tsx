"use client";

import React, { useState, useEffect } from "react";
import styles from "../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Save } from "lucide-react";

export default function AdminMobileApp() {
  const [minVersionAndroid, setMinVersionAndroid] = useState("1.0.0");
  const [minVersionIos, setMinVersionIos] = useState("1.0.0");
  const [forceUpdate, setForceUpdate] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // Feature Toggles
  const [enableNews, setEnableNews] = useState(true);
  const [enableIpos, setEnableIpos] = useState(true);
  const [enableServices, setEnableServices] = useState(true);
  const [enableTools, setEnableTools] = useState(true);
  const [enableAuth, setEnableAuth] = useState(true);
  const [enableActivity, setEnableActivity] = useState(true);

  // API Security
  const [apiEnabled, setApiEnabled] = useState(true);
  const [appPackageName, setAppPackageName] = useState("com.netprofit.app");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "mobile_app");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.minVersionAndroid) setMinVersionAndroid(data.minVersionAndroid);
          if (data.minVersionIos) setMinVersionIos(data.minVersionIos);
          if (data.forceUpdate !== undefined) setForceUpdate(data.forceUpdate);
          if (data.maintenanceMode !== undefined) setMaintenanceMode(data.maintenanceMode);
          if (data.apiEnabled !== undefined) setApiEnabled(data.apiEnabled);
          if (data.appPackageName) setAppPackageName(data.appPackageName);
          
          if (data.features) {
            if (data.features.enableNews !== undefined) setEnableNews(data.features.enableNews);
            if (data.features.enableIpos !== undefined) setEnableIpos(data.features.enableIpos);
            if (data.features.enableServices !== undefined) setEnableServices(data.features.enableServices);
            if (data.features.enableTools !== undefined) setEnableTools(data.features.enableTools);
            if (data.features.enableAuth !== undefined) setEnableAuth(data.features.enableAuth);
            if (data.features.enableActivity !== undefined) setEnableActivity(data.features.enableActivity);
          }
        }
      } catch (err) {
        console.error("Error fetching mobile app settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const docRef = doc(db, "settings", "mobile_app");
      await setDoc(docRef, {
        minVersionAndroid,
        minVersionIos,
        forceUpdate,
        maintenanceMode,
        apiEnabled,
        appPackageName,
        features: {
          enableNews,
          enableIpos,
          enableServices,
          enableTools,
          enableAuth,
          enableActivity,
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage("Mobile App Configuration saved successfully!");
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
      <h1 className={styles.pageTitle}>Mobile App Management</h1>
      <p className={styles.pageSubtitle}>Control app versions, maintenance mode, and application feature toggles.</p>
      
      <form onSubmit={handleSave}>
        <div className={`cleartax-card ${styles.managementCard}`} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-color)', marginBottom: '1.5rem' }}>App Version Control & Maintenance</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className={styles.inputGroup}>
              <label>Minimum Required Version (Android)</label>
              <input type="text" value={minVersionAndroid} onChange={(e) => setMinVersionAndroid(e.target.value)} className={styles.inputField} placeholder="e.g. 1.0.5" required />
            </div>
            <div className={styles.inputGroup}>
              <label>Minimum Required Version (iOS)</label>
              <input type="text" value={minVersionIos} onChange={(e) => setMinVersionIos(e.target.value)} className={styles.inputField} placeholder="e.g. 1.0.5" required />
            </div>
            
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="forceUpdate" checked={forceUpdate} onChange={(e) => setForceUpdate(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="forceUpdate" style={{ margin: 0, cursor: 'pointer' }}>Enable Force Update Prompt</label>
            </div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="maintenance" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="maintenance" style={{ margin: 0, cursor: 'pointer', color: maintenanceMode ? '#ef4444' : 'inherit' }}>Enable Maintenance Mode (Blocks app access)</label>
            </div>
          </div>
        </div>

        <div className={`cleartax-card ${styles.managementCard}`} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-color)', marginBottom: '1.5rem' }}>API Security & Access</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div className={styles.inputGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="apiEnabled" checked={apiEnabled} onChange={(e) => setApiEnabled(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="apiEnabled" style={{ margin: 0, cursor: 'pointer', color: !apiEnabled ? '#ef4444' : 'inherit' }}>Enable Mobile APIs (Turn off to block all app requests)</label>
            </div>
            
            <div className={styles.inputGroup}>
              <label>Authorized App Package Name</label>
              <input type="text" value={appPackageName} onChange={(e) => setAppPackageName(e.target.value)} className={styles.inputField} placeholder="e.g. com.netprofit.app" required />
              <small style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Only requests containing this package name in the 'x-app-package-name' header will be accepted.</small>
            </div>
          </div>
        </div>

        <div className={`cleartax-card ${styles.managementCard}`}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-color)', marginBottom: '1.5rem' }}>App Feature Toggles</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Use these switches to instantly hide or show sections in the mobile app without requiring an app update.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="toggleNews" checked={enableNews} onChange={(e) => setEnableNews(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="toggleNews" style={{ margin: 0, cursor: 'pointer' }}>Enable News Section</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="toggleIpos" checked={enableIpos} onChange={(e) => setEnableIpos(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="toggleIpos" style={{ margin: 0, cursor: 'pointer' }}>Enable IPOs Section</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="toggleServices" checked={enableServices} onChange={(e) => setEnableServices(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="toggleServices" style={{ margin: 0, cursor: 'pointer' }}>Enable Services Section</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="toggleTools" checked={enableTools} onChange={(e) => setEnableTools(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="toggleTools" style={{ margin: 0, cursor: 'pointer' }}>Enable Tools Section</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="toggleAuth" checked={enableAuth} onChange={(e) => setEnableAuth(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="toggleAuth" style={{ margin: 0, cursor: 'pointer' }}>Enable User Auth / Login</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="toggleActivity" checked={enableActivity} onChange={(e) => setEnableActivity(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="toggleActivity" style={{ margin: 0, cursor: 'pointer' }}>Enable Activity / Notifications</label>
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

      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-color)', marginBottom: '1rem' }}>Mobile App API Reference</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Use the following endpoints to connect your Android/iOS app to the web server. 
          <br/><strong>Base URL:</strong> <code>https://yourdomain.com</code> <i>(or http://10.0.2.2:3000 for Android Emulator)</i>
          <br/><strong>Required Header:</strong> <code>x-app-package-name: {appPackageName}</code>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>
          <div><strong style={{ color: '#60a5fa' }}>GET</strong> /api/app/config <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>- App Version & Features Toggles</span></div>
          <div><strong style={{ color: '#60a5fa' }}>GET</strong> /api/app/news <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>- All News Articles (add ?category=xyz&limit=20 to filter)</span></div>
          <div><strong style={{ color: '#60a5fa' }}>GET</strong> /api/app/news/categories <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>- News Categories List</span></div>
          <div><strong style={{ color: '#60a5fa' }}>GET</strong> /api/app/ipos?activeOnly=true&limit=50 <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>- IPO Listings</span></div>
          <div><strong style={{ color: '#60a5fa' }}>GET</strong> /api/app/services <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>- All Services (add ?category=xyz to filter)</span></div>
          <div><strong style={{ color: '#60a5fa' }}>GET</strong> /api/app/services/categories <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>- Service Categories List</span></div>
          <div><strong style={{ color: '#60a5fa' }}>GET</strong> /api/app/tools <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>- Financial Tools List</span></div>
          <div><strong style={{ color: '#60a5fa' }}>GET</strong> /api/app/users?uid=[USER_ID] <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>- Get User Auth Profile</span></div>
          <div><strong style={{ color: '#10b981' }}>POST</strong> /api/app/users <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>- Sync Login / Update Profile</span></div>
          <div><strong style={{ color: '#60a5fa' }}>GET</strong> /api/app/activity?uid=[USER_ID] <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>- Get User Activity / Notifications</span></div>
        </div>
      </div>
    </div>
  );
}
