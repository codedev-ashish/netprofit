"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { Plus, Trash2 } from "lucide-react";

interface HeaderLink {
  label: string;
  url: string;
}

interface FooterLink {
  label: string;
  url: string;
}

interface FooterBlock {
  title: string;
  links: FooterLink[];
}

export default function HeaderFooterConfig() {
  const [headerLinks, setHeaderLinks] = useState<HeaderLink[]>([]);
  const [footerBlocks, setFooterBlocks] = useState<FooterBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "header_footer");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.headerLinks) setHeaderLinks(data.headerLinks);
          if (data.footerBlocks) setFooterBlocks(data.footerBlocks);
        } else {
          // Initialize with some defaults
          setHeaderLinks([{ label: "Home", url: "/" }, { label: "Services", url: "/services" }]);
          setFooterBlocks([{ title: "Company", links: [{ label: "About Us", url: "/about" }] }]);
        }
      } catch (err) {
        console.error("Error fetching header/footer settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const docRef = doc(db, "settings", "header_footer");
      await setDoc(docRef, {
        headerLinks,
        footerBlocks,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage("Header and Footer configuration saved successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Header Helpers ---
  const addHeaderLink = () => {
    setHeaderLinks([...headerLinks, { label: "", url: "" }]);
  };
  const updateHeaderLink = (index: number, field: keyof HeaderLink, value: string) => {
    const newLinks = [...headerLinks];
    newLinks[index][field] = value;
    setHeaderLinks(newLinks);
  };
  const removeHeaderLink = (index: number) => {
    setHeaderLinks(headerLinks.filter((_, i) => i !== index));
  };

  // --- Footer Helpers ---
  const addFooterBlock = () => {
    if (footerBlocks.length >= 4) {
      alert("Maximum of 4 footer blocks allowed to maintain layout integrity.");
      return;
    }
    setFooterBlocks([...footerBlocks, { title: "New Block", links: [] }]);
  };
  const updateFooterBlockTitle = (blockIndex: number, title: string) => {
    const newBlocks = [...footerBlocks];
    newBlocks[blockIndex].title = title;
    setFooterBlocks(newBlocks);
  };
  const removeFooterBlock = (blockIndex: number) => {
    if (window.confirm("Are you sure you want to delete this entire block?")) {
      setFooterBlocks(footerBlocks.filter((_, i) => i !== blockIndex));
    }
  };
  const addFooterLink = (blockIndex: number) => {
    const newBlocks = [...footerBlocks];
    newBlocks[blockIndex].links.push({ label: "", url: "" });
    setFooterBlocks(newBlocks);
  };
  const updateFooterLink = (blockIndex: number, linkIndex: number, field: keyof FooterLink, value: string) => {
    const newBlocks = [...footerBlocks];
    newBlocks[blockIndex].links[linkIndex][field] = value;
    setFooterBlocks(newBlocks);
  };
  const removeFooterLink = (blockIndex: number, linkIndex: number) => {
    const newBlocks = [...footerBlocks];
    newBlocks[blockIndex].links.splice(linkIndex, 1);
    setFooterBlocks(newBlocks);
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Header & Footer Customize</h1>
      <p className={styles.pageSubtitle}>Manage navigation menus, footer blocks, and links dynamically.</p>
      
      <form onSubmit={handleSave}>
        
        {/* Header Section */}
        <div className={`cleartax-card ${styles.managementCard}`} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#60a5fa' }}>Header Navigation Links</h2>
            <button type="button" onClick={addHeaderLink} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'transparent', color: '#60a5fa', border: '1px solid #60a5fa', borderRadius: '6px', cursor: 'pointer' }}>
              <Plus size={16} /> Add Link
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {headerLinks.map((link, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Label</label>
                  <input type="text" value={link.label} onChange={(e) => updateHeaderLink(idx, 'label', e.target.value)} className={styles.inputField} placeholder="e.g. Services" required />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>URL</label>
                  <input type="text" value={link.url} onChange={(e) => updateHeaderLink(idx, 'url', e.target.value)} className={styles.inputField} placeholder="e.g. /services" required />
                </div>
                <button type="button" onClick={() => removeHeaderLink(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginTop: '1.2rem' }}>
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            {headerLinks.length === 0 && <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No header links added.</p>}
          </div>
        </div>

        {/* Footer Section */}
        <div className={`cleartax-card ${styles.managementCard}`} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', color: '#60a5fa' }}>Footer Blocks</h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>You have {footerBlocks.length}/4 blocks. Usually represents vertical columns in your footer.</p>
            </div>
            <button type="button" onClick={addFooterBlock} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'transparent', color: '#60a5fa', border: '1px solid #60a5fa', borderRadius: '6px', cursor: 'pointer' }} disabled={footerBlocks.length >= 4}>
              <Plus size={16} /> Add Block Column
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {footerBlocks.map((block, bIdx) => (
              <div key={bIdx} style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <input 
                    type="text" 
                    value={block.title} 
                    onChange={(e) => updateFooterBlockTitle(bIdx, e.target.value)} 
                    style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--border-color)', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-color)', width: '80%', outline: 'none' }}
                    placeholder="Block Title"
                    required
                  />
                  <button type="button" onClick={() => removeFooterBlock(bIdx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  {block.links.map((link, lIdx) => (
                    <div key={lIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="text" value={link.label} onChange={(e) => updateFooterLink(bIdx, lIdx, 'label', e.target.value)} className={styles.inputField} style={{ flex: 1, minWidth: 0, padding: '0.5rem', fontSize: '0.85rem' }} placeholder="Label" required />
                      <input type="text" value={link.url} onChange={(e) => updateFooterLink(bIdx, lIdx, 'url', e.target.value)} className={styles.inputField} style={{ flex: 1, minWidth: 0, padding: '0.5rem', fontSize: '0.85rem' }} placeholder="URL" required />
                      <button type="button" onClick={() => removeFooterLink(bIdx, lIdx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => addFooterLink(bIdx)} style={{ background: 'none', border: '1px dashed #60a5fa', color: '#60a5fa', width: '100%', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  + Add Link to {block.title || 'Block'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Global Save Button */}
        {message && (
          <div style={{ color: message.includes("Error") ? "#dc2626" : "#16a34a", padding: "10px 0", fontWeight: 'bold', textAlign: 'right' }}>
            {message}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="submit" className={styles.submitBtn} disabled={loading} style={{ padding: '0.8rem 2.5rem', fontSize: '1.1rem' }}>
            {loading ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
