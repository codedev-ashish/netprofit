"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DatabaseConfigPage() {
  const [activeDb, setActiveDb] = useState("firebase");
  
  // Connection credentials
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("3306");
  const [dbName, setDbName] = useState("netprofit");
  const [username, setUsername] = useState("root");
  const [password, setPassword] = useState("");
  const [connectionString, setConnectionString] = useState(""); // for MongoDB

  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "database"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setActiveDb(data.activeDb || "firebase");
          setHost(data.host || "localhost");
          setPort(data.port || "3306");
          setDbName(data.dbName || "netprofit");
          setUsername(data.username || "root");
          setPassword(data.password || "");
          setConnectionString(data.connectionString || "");
        }
      } catch (err) {
        console.error("Error fetching database settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleTestConnection = async () => {
    setTestLoading(true);
    setMessage("");
    setMessageType("");
    try {
      const res = await fetch("/api/admin/database/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeDb,
          host,
          port,
          dbName,
          username,
          password,
          connectionString
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setMessageType("success");
        setMessage("Connection Test Succeeded!");
      } else {
        setMessageType("error");
        setMessage(result.error || "Connection Test Failed.");
      }
    } catch (err: any) {
      setMessageType("error");
      setMessage("Connection test request failed: " + err.message);
    } finally {
      setTestLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      await setDoc(doc(db, "settings", "database"), {
        activeDb,
        host,
        port,
        dbName,
        username,
        password,
        connectionString,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessageType("success");
      setMessage("Database configuration saved successfully!");
    } catch (err: any) {
      console.error("Error saving database settings:", err);
      setMessageType("error");
      setMessage("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!confirm("Are you sure you want to download & convert Firestore database data? This will package your entire Firestore data into MySQL & PostgreSQL compatible SQL files.")) return;
    
    setLoading(true);
    setMessage("Converting & downloading database schema... Please wait...");
    setMessageType("success");

    try {
      window.location.href = "/api/admin/database/migrate";
    } catch (err: any) {
      setMessageType("error");
      setMessage("Migration failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Adjust default ports when changing database type
  const handleDbChange = (dbType: string) => {
    setActiveDb(dbType);
    if (dbType === "mysql") {
      setPort("3306");
    } else if (dbType === "postgresql") {
      setPort("5432");
    } else if (dbType === "mongodb") {
      setPort("27017");
    }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Database Settings</h1>
      <p className={styles.pageSubtitle}>Manage data storage engines, configure server or localhost database configurations, and download converted SQL tables.</p>

      <div className={`cleartax-card ${styles.managementCard}`}>
        <form className={styles.form} onSubmit={handleSave}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#60a5fa' }}>Database Engine Config</h2>

          <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 'bold' }}>Active Database Provider</label>
            <select 
              value={activeDb} 
              onChange={(e) => handleDbChange(e.target.value)} 
              className={styles.inputField}
              style={{ marginTop: '0.5rem' }}
            >
              <option value="firebase">Firebase Firestore (Cloud NoSQL)</option>
              <option value="cloudflare">Cloudflare D1 (Serverless SQL)</option>
              <option value="mysql">MySQL (Relational SQL - Local/Online)</option>
              <option value="postgresql">PostgreSQL (Relational SQL - Local/Online)</option>
              <option value="mongodb">MongoDB (Document NoSQL - Local/Online)</option>
            </select>
          </div>

          {activeDb !== "firebase" && activeDb !== "cloudflare" && (
            <div style={{ display: 'grid', gridTemplateColumns: activeDb === "mongodb" ? '1fr' : '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {activeDb === "mongodb" ? (
                <div className={styles.inputGroup}>
                  <label>MongoDB Connection String (URI)</label>
                  <input 
                    type="text" 
                    value={connectionString} 
                    onChange={(e) => setConnectionString(e.target.value)} 
                    className={styles.inputField} 
                    placeholder="mongodb://localhost:27017/netprofit or mongodb+srv://..."
                    required
                  />
                </div>
              ) : (
                <>
                  <div className={styles.inputGroup}>
                    <label>Database Host / IP Address</label>
                    <input 
                      type="text" 
                      value={host} 
                      onChange={(e) => setHost(e.target.value)} 
                      className={styles.inputField} 
                      placeholder="localhost or 127.0.0.1 or online-db.server.com"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Port</label>
                    <input 
                      type="text" 
                      value={port} 
                      onChange={(e) => setPort(e.target.value)} 
                      className={styles.inputField} 
                      placeholder={activeDb === "mysql" ? "3306" : "5432"}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Database Name</label>
                    <input 
                      type="text" 
                      value={dbName} 
                      onChange={(e) => setDbName(e.target.value)} 
                      className={styles.inputField} 
                      placeholder="netprofit"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Username</label>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      className={styles.inputField} 
                      placeholder="root"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                    <label>Password</label>
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className={styles.inputField} 
                      placeholder="Database access password"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {message && (
            <div style={{ color: messageType === "error" ? "#dc2626" : "#16a34a", padding: "10px 0", fontWeight: 'bold' }}>
              {message}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <button 
                type="button" 
                onClick={handleMigrate}
                className={styles.submitBtn} 
                style={{ background: '#10b981', marginRight: '1rem' }}
              >
                Download & Convert SQL
              </button>
              
              {activeDb !== "firebase" && activeDb !== "cloudflare" && (
                <button 
                  type="button" 
                  onClick={handleTestConnection}
                  disabled={testLoading}
                  className={styles.submitBtn}
                  style={{ background: '#4b5563' }}
                >
                  {testLoading ? "Testing..." : "Test Connection"}
                </button>
              )}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
