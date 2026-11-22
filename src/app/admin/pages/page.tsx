"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { Trash2, Edit2, Eye, EyeOff } from "lucide-react";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  seoKeywords?: string;
  isPublished?: boolean;
  createdAt: any;
}

export default function AdminPages() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "pages"));
      const items: CustomPage[] = [];
      let hasContactUs = false;

      querySnapshot.forEach((doc) => {
        if (doc.id === "contact-us") hasContactUs = true;
        items.push({ id: doc.id, ...doc.data() } as CustomPage);
      });

      if (!hasContactUs) {
        // Auto-seed Contact Us page for editability
        const contactData = {
          title: "Contact Us",
          slug: "contact-us",
          content: "<p>Have a question or need assistance? Fill out the form below, and our team will get back to you as soon as possible.</p>",
          isPublished: true,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, "pages", "contact-us"), contactData);
        items.push({ id: "contact-us", ...contactData } as CustomPage);
      }

      setPages(items);
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const handleOptimizeSEO = async () => {
    if (!content) {
      alert("Please add some content first to generate SEO.");
      return;
    }
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/ai/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, type: "custom page" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate SEO");

      if (data.metaTitle) setMetaTitle(data.metaTitle);
      if (data.metaDescription) setMetaDescription(data.metaDescription);
      if (data.seoKeywords) setSeoKeywords(data.seoKeywords);
      if (data.optimizedContent) setContent(data.optimizedContent);

      alert("AI successfully optimized the SEO and injected contextual links!");
    } catch (error: any) {
      console.error(error);
      alert("SEO Optimization failed: " + error.message);
    } finally {
      setIsOptimizing(false);
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
          content,
          metaTitle,
          metaDescription,
          seoKeywords
        });
      } else {
        // Create new document
        await setDoc(doc(db, "pages", slug), {
          title,
          slug,
          content,
          metaTitle,
          metaDescription,
          seoKeywords,
          isPublished: true,
          createdAt: serverTimestamp()
        });
      }

      setTitle("");
      setSlug("");
      setContent("");
      setMetaTitle("");
      setMetaDescription("");
      setSeoKeywords("");
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

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "pages", id), {
        isPublished: !currentStatus
      });
      fetchPages();
    } catch (error) {
      console.error("Error updating publish status:", error);
    }
  };

  const handleEdit = (page: CustomPage) => {
    setEditingPageId(page.slug); // Since slug is the doc ID
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content || "");
    setMetaTitle(page.metaTitle || "");
    setMetaDescription(page.metaDescription || "");
    setSeoKeywords(page.seoKeywords || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPageId(null);
    setTitle("");
    setSlug("");
    setContent("");
    setMetaTitle("");
    setMetaDescription("");
    setSeoKeywords("");
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
          <div className={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
              <label style={{ marginBottom: 0 }}>Custom SEO Meta Title (Optional)</label>
              <button
                type="button"
                onClick={handleOptimizeSEO}
                disabled={isOptimizing || !content}
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
                  border: 'none',
                  color: 'white',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                {isOptimizing ? "Optimizing..." : "✨ AI Optimize SEO & Links"}
              </button>
            </div>
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
          <div className={styles.inputGroup}>
            <label>SEO Keywords (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. business registration, tax filing"
              className={styles.inputField}
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
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
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-color)', textDecoration: page.isPublished === false ? 'line-through' : 'none', opacity: page.isPublished === false ? 0.6 : 1 }}>{page.title}</strong>
                  {page.isPublished === false && <span style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, marginLeft: '8px' }}>Hidden</span>}
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <a href={`/${page.slug}`} target="_blank" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
                      /{page.slug}
                    </a>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button
                    onClick={() => togglePublish(page.slug, page.isPublished !== false)}
                    style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    title={page.isPublished !== false ? "Unpublish/Hide" : "Publish/Show"}
                  >
                    {page.isPublished !== false ? <EyeOff size={18} /> : <Eye size={18} />}
                    <span style={{ fontSize: '0.9rem' }}>{page.isPublished !== false ? 'Hide' : 'Show'}</span>
                  </button>
                  <button
                    onClick={() => handleEdit(page)}
                    style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(page.id)}
                    style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Trash2 size={16} /> Delete
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
