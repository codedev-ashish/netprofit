"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export default function AISettings() {
  const [activeProvider, setActiveProvider] = useState("gemini");
  
  const [geminiKey, setGeminiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [groqKey, setGroqKey] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "ai");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.activeProvider) setActiveProvider(data.activeProvider);
          if (data.geminiKey) setGeminiKey(data.geminiKey);
          if (data.claudeKey) setClaudeKey(data.claudeKey);
          if (data.openaiKey) setOpenaiKey(data.openaiKey);
          if (data.openrouterKey) setOpenrouterKey(data.openrouterKey);
          if (data.groqKey) setGroqKey(data.groqKey);
        }
      } catch (err) {
        console.error("Error fetching AI settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const docRef = doc(db, "settings", "ai");
      await setDoc(docRef, {
        activeProvider,
        geminiKey,
        claudeKey,
        openaiKey,
        openrouterKey,
        groqKey,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Save to .env and .env.local as requested
      await fetch("/api/admin/save-env", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          GEMINI_API_KEY: geminiKey,
          CLAUDE_API_KEY: claudeKey,
          OPENAI_API_KEY: openaiKey,
          OPENROUTER_API_KEY: openrouterKey,
          GROQ_API_KEY: groqKey
        })
      });

      setMessage("AI configuration saved successfully to Database and Environment Files!");
    } catch (err: any) {
      console.error(err);
      setMessage("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>AI Configuration</h1>
      <p className={styles.pageSubtitle}>Manage your AI provider API keys for automated news generation.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <form className={styles.form} onSubmit={handleSave}>
          
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Provider Selection</h2>
          <div className={styles.inputGroup} style={{ marginBottom: '2rem', maxWidth: '400px' }}>
            <label>Active AI Provider</label>
            <select 
              value={activeProvider} 
              onChange={(e) => setActiveProvider(e.target.value)} 
              className={styles.inputField} 
              required
            >
              <option value="gemini">Google Gemini</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="openai">Open AI</option>
              <option value="openrouter">Open Router</option>
              <option value="groq">Groq</option>
            </select>
          </div>

          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>API Keys</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            
            <div className={styles.inputGroup} style={{ background: activeProvider === 'gemini' ? 'var(--bg-secondary)' : 'transparent', padding: activeProvider === 'gemini' ? '1rem' : '0', borderRadius: '8px', border: activeProvider === 'gemini' ? '1px solid var(--border-color)' : 'none', opacity: activeProvider === 'gemini' ? 1 : 0.6 }}>
              <label>Google Gemini API Key</label>
              <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className={styles.inputField} placeholder="AIzaSy..." disabled={activeProvider !== 'gemini'} />
            </div>

            <div className={styles.inputGroup} style={{ background: activeProvider === 'claude' ? 'var(--bg-secondary)' : 'transparent', padding: activeProvider === 'claude' ? '1rem' : '0', borderRadius: '8px', border: activeProvider === 'claude' ? '1px solid var(--border-color)' : 'none', opacity: activeProvider === 'claude' ? 1 : 0.6 }}>
              <label>Claude (Anthropic) API Key</label>
              <input type="password" value={claudeKey} onChange={(e) => setClaudeKey(e.target.value)} className={styles.inputField} placeholder="sk-ant-..." disabled={activeProvider !== 'claude'} />
            </div>

            <div className={styles.inputGroup} style={{ background: activeProvider === 'openai' ? 'var(--bg-secondary)' : 'transparent', padding: activeProvider === 'openai' ? '1rem' : '0', borderRadius: '8px', border: activeProvider === 'openai' ? '1px solid var(--border-color)' : 'none', opacity: activeProvider === 'openai' ? 1 : 0.6 }}>
              <label>Open AI API Key</label>
              <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} className={styles.inputField} placeholder="sk-..." disabled={activeProvider !== 'openai'} />
            </div>

            <div className={styles.inputGroup} style={{ background: activeProvider === 'openrouter' ? 'var(--bg-secondary)' : 'transparent', padding: activeProvider === 'openrouter' ? '1rem' : '0', borderRadius: '8px', border: activeProvider === 'openrouter' ? '1px solid var(--border-color)' : 'none', opacity: activeProvider === 'openrouter' ? 1 : 0.6 }}>
              <label>Open Router API Key</label>
              <input type="password" value={openrouterKey} onChange={(e) => setOpenrouterKey(e.target.value)} className={styles.inputField} placeholder="sk-or-v1-..." disabled={activeProvider !== 'openrouter'} />
            </div>

            <div className={styles.inputGroup} style={{ background: activeProvider === 'groq' ? 'var(--bg-secondary)' : 'transparent', padding: activeProvider === 'groq' ? '1rem' : '0', borderRadius: '8px', border: activeProvider === 'groq' ? '1px solid var(--border-color)' : 'none', opacity: activeProvider === 'groq' ? 1 : 0.6 }}>
              <label>Groq API Key</label>
              <input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} className={styles.inputField} placeholder="gsk_..." disabled={activeProvider !== 'groq'} />
            </div>

          </div>

          {message && (
            <div style={{ color: message.includes("Error") ? "#dc2626" : "#16a34a", padding: "10px 0", fontWeight: 'bold' }}>
              {message}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
            <button type="submit" className={styles.submitBtn} disabled={loading} style={{ padding: '0.8rem 2rem' }}>
              {loading ? "Saving..." : "Save AI Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
