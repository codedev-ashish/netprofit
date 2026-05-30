"use client";

import { useState, useEffect } from "react";
import styles from "../../../page.module.css";
import { db, storage } from "../../../../../lib/firebase";
import { collection, doc, getDoc, updateDoc, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { useParams, useRouter } from "next/navigation";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function AdminNewsEdit() {
  const router = useRouter();
  const params = useParams();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }, { 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
    table: true
  };

  useEffect(() => {
    fetchCategories();
    fetchNewsArticle();
  }, [params?.id]);

  const fetchCategories = async () => {
    const querySnapshot = await getDocs(collection(db, "news_categories"));
    const catData: any[] = [];
    querySnapshot.forEach((doc) => {
      catData.push({ id: doc.id, ...doc.data() });
    });
    setAllCategories(catData);
  };

  const fetchNewsArticle = async () => {
    if (!params?.id) return;
    try {
      const docSnap = await getDoc(doc(db, "news", params.id as string));
      if (docSnap.exists()) {
        const n = docSnap.data();
        setTitle(n.title || "");
        setSlug(n.slug || "");
        setCategories(n.categories || (n.category ? [n.category] : []));
        setTags(n.tags ? n.tags.join(", ") : "");
        setContent(n.content || "");
        setExcerpt(n.excerpt || "");
        setCurrentImage(n.imageUrl || "");
      }
    } catch (e) {
      console.error("Error fetching article", e);
    } finally {
      setLoading(false);
    }
  };



  const toggleCategory = (catName: string) => {
    if (categories.includes(catName)) {
      setCategories(categories.filter(c => c !== catName));
    } else {
      setCategories([...categories, catName]);
    }
  };

  const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params?.id) return;
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
        categories,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        content,
        excerpt,
        imageUrl: uploadedImageUrl,
      };

      await updateDoc(doc(db, "news", params.id as string), newsData);
      alert("News updated successfully!");
      router.push("/admin/news");
    } catch (error) {
      console.error("Error saving news: ", error);
      alert("Failed to update news.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Edit Article</h1>
      <p className={styles.pageSubtitle}>Update your financial news article.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
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
            <label>Categories (Select multiple)</label>
            <select 
              className={styles.inputField} 
              onChange={(e) => {
                const val = e.target.value;
                if (val && !categories.includes(val)) {
                  setCategories([...categories, val]);
                }
                e.target.value = "";
              }}
              defaultValue=""
            >
              <option value="" disabled>-- Select Category --</option>
              {allCategories.filter(cat => !categories.includes(cat.name)).map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {categories.map(cat => (
                <span
                  key={cat}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '16px',
                    background: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.85rem'
                  }}
                >
                  {cat}
                  <button type="button" onClick={() => toggleCategory(cat)} style={{background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, fontSize: '1rem', lineHeight: 1}}>
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Tags (Comma-separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. finance, taxes, market" className={styles.inputField} />
          </div>
          <div className={styles.inputGroup}>
            <label>Cover Image (Upload or URL)</label>
            {currentImage && (
              <div style={{ marginBottom: "10px" }}>
                <img src={currentImage} alt="Current Image" style={{ height: "60px", borderRadius: "8px", objectFit: "cover" }} />
              </div>
            )}
            <input type="text" value={currentImage} onChange={(e) => setCurrentImage(e.target.value)} placeholder="Image URL (CROSS-ORIGIN allowed)" className={styles.inputField} style={{ marginBottom: '0.5rem' }} />
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
          <div className={styles.inputGroup} style={{ paddingBottom: '2rem' }}>
            <label>Full Content</label>
            <div style={{ background: 'white', color: 'black', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent} 
                modules={quillModules}
                style={{ height: '400px', marginBottom: '3rem' }} 
              />
            </div>
          </div>
          
          <div style={{display: 'flex', gap: '1rem'}}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Article"}
            </button>
            <button type="button" onClick={() => router.push("/admin/news")} className={styles.submitBtn} style={{backgroundColor: '#64748b'}}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
