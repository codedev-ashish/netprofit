"use client";

import { useState, useEffect, use } from "react";
import styles from "../../../../page.module.css";
import { db, storage } from "../../../../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import Loader from "../../../../../../components/Loader";

export default function AdminAuthorEdit({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState("");
  
  // Social links
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [x, setX] = useState(""); // Twitter/X
  const [reddit, setReddit] = useState("");
  const [telegram, setTelegram] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAuthor();
    }
  }, [id]);

  const fetchAuthor = async () => {
    try {
      const docRef = doc(db, "news_authors", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setEmail(data.email || "");
        setCurrentImage(data.imageUrl || "");
        if (data.socials) {
          setFacebook(data.socials.facebook || "");
          setInstagram(data.socials.instagram || "");
          setX(data.socials.x || "");
          setReddit(data.socials.reddit || "");
          setTelegram(data.socials.telegram || "");
        }
      } else {
        alert("Author not found");
        router.push("/admin/news/authors");
      }
    } catch (error) {
      console.error("Error fetching author:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let uploadedImageUrl = currentImage;

      if (imageFile) {
        const imageRef = ref(storage, `authors/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        uploadedImageUrl = await getDownloadURL(snapshot.ref);
      }

      const authorData = {
        name,
        username: username.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        bio,
        email,
        imageUrl: uploadedImageUrl,
        socials: {
          facebook,
          instagram,
          x,
          reddit,
          telegram
        },
        updatedAt: new Date()
      };

      await updateDoc(doc(db, "news_authors", id), authorData);
      alert("Author updated successfully!");
      router.push("/admin/news/authors");
    } catch (error) {
      console.error("Error updating author: ", error);
      alert("Failed to update author.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading author..." />;
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Edit Author</h1>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={styles.inputField} />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Username (URL Slug)</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. john-doe" required className={styles.inputField} />
            <small style={{color: 'var(--text-muted)'}}>This will be used for the author profile URL: /author/username</small>
          </div>
          
          <div className={styles.inputGroup}>
            <label>Email (Optional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.inputField} />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Profile Image (Upload or URL)</label>
            {currentImage && (
              <div style={{ marginBottom: "10px" }}>
                <img src={currentImage} alt="Current Image" style={{ height: "60px", borderRadius: "50%", objectFit: "cover" }} />
              </div>
            )}
            <input type="text" value={currentImage} onChange={(e) => setCurrentImage(e.target.value)} placeholder="Image URL (Optional)" className={styles.inputField} style={{ marginBottom: '0.5rem' }} />
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
            <small style={{color: 'var(--text-muted)'}}>If no image is provided, abbreviation of name will be shown.</small>
          </div>
          
          <div className={styles.inputGroup}>
            <label>Bio</label>
            <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className={styles.inputField} placeholder="Short author biography..." />
          </div>
          
          <h3 style={{marginBottom: '1rem', color: 'var(--text-color)', marginTop: '1rem'}}>Social Media Links (Optional)</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.inputGroup}>
              <label>Facebook</label>
              <input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." className={styles.inputField} />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Instagram</label>
              <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className={styles.inputField} />
            </div>
            
            <div className={styles.inputGroup}>
              <label>X (Twitter)</label>
              <input type="url" value={x} onChange={(e) => setX(e.target.value)} placeholder="https://x.com/..." className={styles.inputField} />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Reddit</label>
              <input type="url" value={reddit} onChange={(e) => setReddit(e.target.value)} placeholder="https://reddit.com/user/..." className={styles.inputField} />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Telegram</label>
              <input type="url" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/..." className={styles.inputField} />
            </div>
          </div>
          
          <div style={{display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem'}}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Author"}
            </button>
            <button type="button" onClick={() => router.push("/admin/news/authors")} className={styles.submitBtn} style={{backgroundColor: '#64748b'}}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
