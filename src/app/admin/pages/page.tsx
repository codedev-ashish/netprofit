"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { Trash2, Edit2 } from "lucide-react";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content?: string;
  createdAt: any;
}

export default function AdminPages() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "pages"));
      const items: CustomPage[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as CustomPage);
      });
      setPages(items);
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingPageId) {
      // Auto-generate slug only if we are not editing an existing page
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingPageId) {
        // Update existing document
        await updateDoc(doc(db, "pages", editingPageId), {
          title,
          content
        });
      } else {
        // Create new document
        await setDoc(doc(db, "pages", slug), {
          title,
          slug,
          content,
          createdAt: serverTimestamp()
        });
      }
      
      setTitle("");
      setSlug("");
      setContent("");
      setEditingPageId(null);
      fetchPages();
    } catch (error) {
      console.error("Error saving page:", error);
      alert("Failed to save page.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this page?")) {
      try {
        await deleteDoc(doc(db, "pages", id));
        fetchPages();
      } catch (error) {
        console.error("Error deleting page:", error);
      }
    }
  };

  const handleEdit = (page: CustomPage) => {
    setEditingPageId(page.slug); // Since slug is the doc ID
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPageId(null);
    setTitle("");
    setSlug("");
    setContent("");
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className={styles.pageTitle}>Custom Pages</h1>
          <p className={styles.pageSubtitle}>Create and manage static pages like About Us, Privacy Policy, etc.</p>
        </div>
      </div>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>{editingPageId ? "Edit Page" : "Create New Page"}</h2>
        <form className={styles.form} onSubmit={handleAdd}>
          <div className={styles.inputGroup}>
            <label>Page Title</label>
            <input 
              type="text" 
              placeholder="e.g. Privacy Policy" 
              className={styles.inputField} 
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>URL Slug</label>
            <input 
              type="text" 
              placeholder="e.g. privacy-policy" 
              className={styles.inputField} 
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              disabled={!!editingPageId}
              style={{ opacity: editingPageId ? 0.6 : 1, cursor: editingPageId ? 'not-allowed' : 'text' }}
            />
            <small style={{ color: 'var(--text-muted)' }}>
              The page will be available at /{slug} {editingPageId && "(Slug cannot be changed)"}
            </small>
          </div>
          <div className={styles.inputGroup}>
            <label>Page Content (HTML/Rich Text)</label>
            <textarea 
              rows={10} 
              placeholder="<h2>Privacy Policy</h2><p>...</p>" 
              className={styles.inputField} 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (editingPageId ? "Update Page" : "Publish Page")}
            </button>
            {editingPageId && (
              <button 
                type="button" 
                onClick={handleCancelEdit} 
                style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className={`cleartax-card ${styles.managementCard}`} style={{ marginTop: "2rem" }}>
        <h2>Published Pages</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {pages.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No custom pages have been created yet.</p>
          ) : (
            pages.map(page => (
              <div key={page.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-color)' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-color)' }}>{page.title}</strong> 
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <a href={`/${page.slug}`} target="_blank" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
                      /{page.slug}
                    </a>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => handleEdit(page)} 
                    style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Edit2 size={16}/> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(page.id)} 
                    style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Trash2 size={16}/> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
