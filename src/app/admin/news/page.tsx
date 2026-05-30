"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Trash2, Edit2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminNews() {
  const router = useRouter();
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "news"));
      const newsData: any[] = [];
      querySnapshot.forEach((doc) => {
        newsData.push({ id: doc.id, ...doc.data() });
      });
      // Sort by date descending
      newsData.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setNewsList(newsData);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ marginBottom: '0.5rem' }}>Published News</h1>
          <p className={styles.pageSubtitle} style={{ margin: 0 }}>Manage your published financial news articles.</p>
        </div>
        <Link href="/admin/news/add" className={styles.submitBtn} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Add New
        </Link>
      </div>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>Existing Articles</h2>
        {loading ? (
          <p style={{color: '#64748b', marginTop: '1rem'}}>Loading articles...</p>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
            {newsList.length === 0 ? <p style={{color: '#64748b'}}>No news found.</p> : null}
            {newsList.map(n => (
              <div key={n.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px'}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {n.imageUrl && <img src={n.imageUrl} alt={n.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />}
                  <div>
                    <strong style={{fontSize: '1.1rem'}}>{n.title}</strong> 
                    <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
                      {(n.categories && n.categories.length > 0) ? n.categories.join(', ') : (n.category || 'Uncategorized')} • {n.date ? (typeof n.date === 'string' ? n.date : (typeof n.date.toDate === 'function' ? n.date.toDate().toLocaleDateString() : (n.date.seconds ? new Date(n.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'))) : 'Unknown Date'}
                    </div>
                  </div>
                </div>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <button onClick={() => router.push(`/admin/news/edit/${n.id}`)} style={{color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <Edit2 size={16}/> Edit
                  </button>
                  <button onClick={() => deleteNews(n.id)} style={{color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <Trash2 size={16}/> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
