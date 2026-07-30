"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "../../../page.module.css";
import { db, storage } from "../../../../../lib/firebase";
import { collection, doc, getDoc, updateDoc, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

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
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [customSchema, setCustomSchema] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [loading, setLoading] = useState(true);

  const joditConfig = useMemo(() => ({
    readonly: false,
    height: 500,
    placeholder: 'Start writing your amazing article...',
    uploader: {
      insertImageAsBase64URI: true
    },
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'align', 'outdent', 'indent', '|',
      'ul', 'ol', '|',
      'eraser', 'copyformat', 'hr', 'symbol', 
      '\n',
      'source', '|',
      'undo', 'redo', '|',
      'link', 'image', 'video', 'file', 'table', '|',
      'find', 'preview', 'print', '|',
      'fullsize', 'about'
    ],
    controls: {
      font: {
        list: {
          'Arial,Helvetica,sans-serif': 'Arial',
          'Georgia,serif': 'Georgia',
          'Impact,Charcoal,sans-serif': 'Impact',
          'Tahoma,Geneva,sans-serif': 'Tahoma',
          'Times New Roman,Times,serif': 'Times New Roman',
          'Verdana,Geneva,sans-serif': 'Verdana',
          'Courier New,Courier,monospace': 'Courier New',
          'Comic Sans MS,Comic Sans,cursive': 'Comic Sans',
          'Trebuchet MS,Helvetica,sans-serif': 'Trebuchet MS',
          'Palatino Linotype,Book Antiqua,Palatino,serif': 'Palatino',
          'Lucida Sans Unicode,Lucida Grande,sans-serif': 'Lucida Sans',
          'Garamond,serif': 'Garamond',
          'Brush Script MT,cursive': 'Brush Script',
          'Calibri,sans-serif': 'Calibri'
        }
      }
    },
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: true,
    resizer: {
      showSize: true
    },
    toolbarAdaptive: false,
    style: {
      background: '#ffffff',
      color: '#333333',
      fontFamily: 'inherit'
    }
  }), []);

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
        setMetaTitle(n.metaTitle || "");
        setMetaDescription(n.metaDescription || "");
        setSeoKeywords(n.seoKeywords || "");
        setCustomSchema(n.customSchema || "");
        setCurrentImage(n.imageUrl || "");
        setImageName(n.imageName || "");
        setImageAlt(n.imageAlt || "");
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
        body: JSON.stringify({ title, content, type: "news article" })
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
        metaTitle,
        metaDescription,
        seoKeywords,
        customSchema,
        imageUrl: uploadedImageUrl,
        imageName,
        imageAlt,
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
            <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Custom SEO Title" className={styles.inputField} />
          </div>
          <div className={styles.inputGroup}>
            <label>Custom SEO Meta Description (Optional)</label>
            <textarea rows={3} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Custom SEO Description..." className={styles.inputField} />
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
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Custom Schema (JSON-LD) (Optional)</label>
            <textarea 
              value={customSchema} 
              onChange={(e) => setCustomSchema(e.target.value)} 
              placeholder='{"@context": "https://schema.org", "@type": "NewsArticle", ...}' 
              rows={4} 
              className={styles.inputField} 
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Image Name (Optional)</label>
                <input type="text" value={imageName} onChange={(e) => setImageName(e.target.value)} placeholder="Name of the image" className={styles.inputField} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Image Alt Text (Optional)</label>
                <input type="text" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="SEO Alt text" className={styles.inputField} />
              </div>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Excerpt (Short summary)</label>
            <textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required className={styles.inputField} />
          </div>
          <div className={styles.inputGroup} style={{ paddingBottom: '2rem' }}>
            <label>Full Content</label>
            <div style={{ background: 'white', color: 'black', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', marginBottom: '3rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
              <JoditEditor 
                value={content}
                config={joditConfig}
                onBlur={(newContent) => setContent(newContent)}
              />
            </div>
          </div>
          
          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Article"}
            </button>
            <button type="button" className={styles.submitBtn} style={{backgroundColor: '#3b82f6'}} onClick={() => alert("More options coming soon!")}>
              More Options
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
