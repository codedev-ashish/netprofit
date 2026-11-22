"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Trash2, Edit2, Plus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminAuthors() {
  const router = useRouter();
  const [authorsList, setAuthorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "news_authors"));
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setAuthorsList(data);
    } catch (error) {
      console.error("Error fetching authors:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAuthor = async (id: string) => {
    if (confirm("Are you sure you want to delete this author?")) {
      try {
        await deleteDoc(doc(db, "news_authors", id));
        fetchAuthors();
      } catch (error) {
        console.error("Error deleting author:", error);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ marginBottom: '0.5rem' }}>Authors</h1>
          <p className={styles.pageSubtitle} style={{ margin: 0 }}>Manage news authors.</p>
        </div>
        <Link href="/admin/news/authors/add" className={styles.submitBtn} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Add Author
        </Link>
      </div>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>Existing Authors</h2>
        {loading ? (
          <p style={{color: '#64748b', marginTop: '1rem'}}>Loading authors...</p>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
            {authorsList.length === 0 ? <p style={{color: '#64748b'}}>No authors found.</p> : null}
            {authorsList.map(a => (
              <div key={a.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px'}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt={a.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {a.name ? a.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : <User size={24} />}
                    </div>
                  )}
                  <div>
                    <strong style={{fontSize: '1.1rem'}}>{a.name}</strong> 
                    <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
                      {a.email}
                    </div>
                  </div>
                </div>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <button onClick={() => router.push(`/admin/news/authors/edit/${a.id}`)} style={{color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <Edit2 size={16}/> Edit
                  </button>
                  <button onClick={() => deleteAuthor(a.id)} style={{color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
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
 
