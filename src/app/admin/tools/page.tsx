"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../../src/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Trash2, Edit2, Check, X } from "lucide-react";
import RichTextEditor from "../../../../src/components/RichTextEditor";

const INITIAL_TOOLS = [
  { name: "Income Tax Calculator", slug: "income-tax-calculator", description: "Calculate your income tax for the old and new regime.", isPublished: true },
  { name: "Capital Gain Calculator", slug: "capital-gain-calculator", description: "Calculate capital gains tax on stocks, mutual funds, and real estate.", isPublished: true },
  { name: "Crypto Income Calculator", slug: "crypto-income-calculator", description: "Calculate tax on your cryptocurrency gains.", isPublished: true },
  { name: "Loan Calculator", slug: "loan-calculator", description: "Calculate EMIs for Car, Home, and Personal loans.", isPublished: true },
  { name: "FD/RD Interest Calculator", slug: "fd-rd-calculator", description: "Calculate returns on Fixed and Recurring Deposits.", isPublished: true },
  { name: "SIP Calculator", slug: "sip-calculator", description: "Calculate the future value of your Systematic Investment Plan.", isPublished: true },
];

export default function AdminTools() {
  const [toolName, setToolName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [customSchema, setCustomSchema] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toolsList, setToolsList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTools();
  }, []);

  const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setToolName(val);
    if (!slug || slug === generateSlug(toolName)) {
      setSlug(generateSlug(val));
    }
  };

  const fetchTools = async () => {
    const querySnapshot = await getDocs(collection(db, "tools"));
    const toolsData: any[] = [];
    querySnapshot.forEach((doc) => {
      toolsData.push({ id: doc.id, ...doc.data() });
    });
    setToolsList(toolsData);
  };

  const seedTools = async () => {
    if (confirm("This will add the default tools if they don't exist. Proceed?")) {
      const existingSlugs = toolsList.map(t => t.slug);
      for (const tool of INITIAL_TOOLS) {
        if (!existingSlugs.includes(tool.slug)) {
          await addDoc(collection(db, "tools"), { ...tool, createdAt: serverTimestamp() });
        }
      }
      fetchTools();
      alert("Seeding complete!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const toolData = {
      name: toolName,
      slug,
      description,
      disclaimer,
      metaTitle,
      metaDescription,
      customSchema,
      isPublished,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "tools", editingId), toolData);
        alert("Tool updated successfully!");
      } else {
        await addDoc(collection(db, "tools"), { ...toolData, createdAt: serverTimestamp() });
        alert("Tool added successfully!");
      }
      resetForm();
      fetchTools();
    } catch (error) {
      console.error("Error saving tool: ", error);
      alert("Failed to save tool.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTool = async (id: string) => {
    if (confirm("Are you sure you want to delete this tool?")) {
      try {
        await deleteDoc(doc(db, "tools", id));
        fetchTools();
      } catch (error) {
        console.error("Error deleting tool:", error);
      }
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "tools", id), { isPublished: !currentStatus });
      fetchTools();
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setToolName(t.name);
    setSlug(t.slug || "");
    setDescription(t.description || "");
    setDisclaimer(t.disclaimer || "");
    setMetaTitle(t.metaTitle || "");
    setMetaDescription(t.metaDescription || "");
    setCustomSchema(t.customSchema || "");
    setIsPublished(t.isPublished ?? true);
  };

  const resetForm = () => {
    setEditingId(null);
    setToolName("");
    setSlug("");
    setDescription("");
    setDisclaimer("");
    setMetaTitle("");
    setMetaDescription("");
    setCustomSchema("");
    setIsPublished(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className={styles.pageTitle}>Manage Tools</h1>
          <p className={styles.pageSubtitle}>Add, edit, publish or unpublish calculator tools.</p>
        </div>
        <button onClick={seedTools} className={styles.submitBtn} style={{ backgroundColor: '#4f46e5' }}>
          Seed Default Tools
        </button>
      </div>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>{editingId ? "Edit Tool" : "Add New Tool"}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Tool Name</label>
            <input type="text" value={toolName} onChange={handleNameChange} required className={styles.inputField} />
          </div>
          <div className={styles.inputGroup}>
            <label>Slug (URL)</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className={styles.inputField} />
          </div>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Description</label>
            <RichTextEditor value={description} onChange={setDescription} />
          </div>
          <div className={styles.inputGroup}>
            <label>Disclaimer (Optional)</label>
            <textarea rows={2} value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} className={styles.inputField} />
          </div>
          <div className={styles.inputGroup}>
            <label>Custom SEO Meta Title (Optional)</label>
            <input 
              type="text" 
              placeholder="Custom SEO Title" 
              className={styles.inputField} 
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Custom SEO Meta Description (Optional)</label>
            <textarea 
              rows={3} 
              placeholder="Custom SEO Description..." 
              className={styles.inputField} 
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Custom Schema (JSON-LD) (Optional)</label>
            <textarea 
              value={customSchema} 
              onChange={(e) => setCustomSchema(e.target.value)} 
              placeholder='{"@context": "https://schema.org", "@type": "WebApplication", ...}' 
              rows={4} 
              className={styles.inputField} 
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
          </div>
          <div className={styles.inputGroup} style={{flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
            <input type="checkbox" id="published" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} style={{width: '18px', height: '18px'}} />
            <label htmlFor="published">Is Published?</label>
          </div>
          
          <div style={{display: 'flex', gap: '1rem', marginTop: '0.5rem'}}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (editingId ? "Update Tool" : "Add Tool")}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className={styles.submitBtn} style={{backgroundColor: '#64748b'}}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>Existing Tools</h2>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
          {toolsList.length === 0 ? <p style={{color: '#64748b'}}>No tools found.</p> : null}
          {toolsList.map(t => (
            <div key={t.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px'}}>
              <div>
                <strong style={{fontSize: '1.1rem'}}>{t.name}</strong> 
                <div style={{fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem'}}>
                  /{t.slug}
                </div>
                <div style={{fontSize: '0.9rem', marginTop: '0.25rem', color: '#475569'}} dangerouslySetInnerHTML={{ __html: t.description }} />
                {t.disclaimer && (
                  <div style={{fontSize: '0.85rem', marginTop: '0.25rem', color: '#94a3b8', fontStyle: 'italic'}}>
                    Disclaimer: {t.disclaimer.substring(0, 60)}{t.disclaimer.length > 60 ? '...' : ''}
                  </div>
                )}
                <div style={{ marginTop: '0.5rem' }}>
                  {t.isPublished ? (
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Published</span>
                  ) : (
                    <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Unpublished</span>
                  )}
                </div>
              </div>
              <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                <button onClick={() => togglePublish(t.id, t.isPublished)} style={{color: t.isPublished ? '#f59e0b' : '#10b981', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  {t.isPublished ? <><X size={16}/> Unpublish</> : <><Check size={16}/> Publish</>}
                </button>
                <button onClick={() => handleEdit(t)} style={{color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  <Edit2 size={16}/> Edit
                </button>
                <button onClick={() => deleteTool(t.id)} style={{color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  <Trash2 size={16}/> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
