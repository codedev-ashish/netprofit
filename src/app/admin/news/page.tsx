"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db, storage } from "../../../lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Trash2, Edit2 } from "lucide-react";

export default function AdminNews() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Markets");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(val));
    }
  };

  const fetchNews = async () => {
    const querySnapshot = await getDocs(collection(db, "news"));
    const newsData: any[] = [];
    querySnapshot.forEach((doc) => {
      newsData.push({ id: doc.id, ...doc.data() });
    });
    setNewsList(newsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let uploadedImageUrl = currentImage;

      if (imageFile) {
        const imageRef = ref(storage, `news/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        uploadedImageUrl = await getDownloadURL(snapshot.ref);
        setCurrentImage(uploadedImageUrl);
      }

      const newsData = {
        title,
        slug,
        category,
        content,
        excerpt,
        imageUrl: uploadedImageUrl,
        date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }),
      };

      if (editingId) {
        await updateDoc(doc(db, "news", editingId), newsData);
        alert("News updated successfully!");
      } else {
        await addDoc(collection(db, "news"), { ...newsData, createdAt: serverTimestamp() });
        alert("News published successfully!");
      }
      resetForm();
      fetchNews();
    } catch (error) {
      console.error("Error saving news: ", error);
      alert("Failed to save news.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNews = async (id: string) => {
    if (confirm("Are you sure you want to delete this article?")) {
      try {
        await deleteDoc(doc(db, "news", id));
        fetchNews();
      } catch (error) {
        console.error("Error deleting news:", error);
      }
    }
  };

  const handleEdit = (n: any) => {
    setEditingId(n.id);
    setTitle(n.title);
    setSlug(n.slug || "");
    setCategory(n.category);
    setContent(n.content);
    setExcerpt(n.excerpt);
    setCurrentImage(n.imageUrl || "");
    setImageFile(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setCategory("Markets");
    setContent("");
    setExcerpt("");
    setCurrentImage("");
    setImageFile(null);
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Manage News</h1>
      <p className={styles.pageSubtitle}>Publish, edit, or remove financial news articles.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>{editingId ? "Edit Article" : "Publish Article"}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>News Title</label>
            <input type="text" value={title} onChange={handleTitleChange} required className={styles.inputField} />
          </div>
          <div className={styles.inputGroup}>
            <label>Slug (URL)</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className={styles.inputField} />
          </div>
          <div className={styles.inputGroup}>
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.inputField}>
              <option value="Markets">Markets</option>
              <option value="Tax Policy">Tax Policy</option>
              <option value="Economy">Economy</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Cover Image (Optional)</label>
            {currentImage && (
              <div style={{ marginBottom: "10px" }}>
                <img src={currentImage} alt="Current Image" style={{ height: "60px", borderRadius: "8px", objectFit: "cover" }} />
              </div>
            )}
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImageFile(e.target.files[0]);
                }
              }}
              className={styles.inputField} 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Excerpt (Short summary)</label>
            <textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required className={styles.inputField} />
          </div>
          <div className={styles.inputGroup}>
            <label>Full Content</label>
            <textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} required className={styles.inputField} />
          </div>
          
          <div style={{display: 'flex', gap: '1rem'}}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (editingId ? "Update Article" : "Publish Article")}
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
        <h2>Existing Articles</h2>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
          {newsList.length === 0 ? <p style={{color: '#64748b'}}>No news found.</p> : null}
          {newsList.map(n => (
            <div key={n.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {n.imageUrl && <img src={n.imageUrl} alt={n.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />}
                <div>
                  <strong style={{fontSize: '1.1rem'}}>{n.title}</strong> 
                  <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
                    {n.category} • {n.date ? (typeof n.date === 'string' ? n.date : (typeof n.date.toDate === 'function' ? n.date.toDate().toLocaleDateString() : (n.date.seconds ? new Date(n.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'))) : 'Unknown Date'}
                  </div>
                </div>
              </div>
              <div style={{display: 'flex', gap: '1rem'}}>
                <button onClick={() => handleEdit(n)} style={{color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  <Edit2 size={16}/> Edit
                </button>
                <button onClick={() => deleteNews(n.id)} style={{color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
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
