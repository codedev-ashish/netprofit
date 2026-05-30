"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../../src/lib/firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Trash2, Edit2, Plus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminIPOs() {
  const [iposList, setIposList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchIPOs();
  }, []);

  const fetchIPOs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "ipos"));
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setIposList(data);
    } catch (error) {
      console.error("Error fetching IPOs:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteIPO = async (id: string) => {
    if (confirm("Are you sure you want to delete this IPO?")) {
      try {
        await deleteDoc(doc(db, "ipos", id));
        fetchIPOs();
      } catch (error) {
        console.error("Error deleting IPO:", error);
      }
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      // If isVisible is undefined, assume it's true currently
      const newStatus = currentStatus === false ? true : false;
      await updateDoc(doc(db, "ipos", id), {
        isVisible: newStatus
      });
      fetchIPOs();
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 className={styles.pageTitle}>Manage IPOs</h1>
          <p className={styles.pageSubtitle}>Add, edit, or remove IPO listings.</p>
        </div>
        <button 
          onClick={() => router.push('/admin/ipos/create')}
          className={styles.submitBtn} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}
        >
          <Plus size={18} /> Add New IPO
        </button>
      </div>

      <div className={`premium-card ${styles.managementCard}`}>
        <h2>Mainboard IPOs</h2>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
          {loading ? (
            <p style={{color: '#64748b'}}>Loading IPOs...</p>
          ) : iposList.filter(ipo => ipo.type?.toLowerCase() === 'mainboard').length === 0 ? (
            <p style={{color: '#64748b'}}>No Mainboard IPOs found.</p>
          ) : (
            iposList.filter(ipo => ipo.type?.toLowerCase() === 'mainboard').map(ipo => (
              <div key={ipo.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px'}}>
                <div>
                  <strong style={{fontSize: '1.1rem', color: 'white'}}>{ipo.name} ({ipo.symbol})</strong> 
                  <div style={{fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem'}}>
                    {ipo.type} • <span style={{textTransform: 'capitalize'}}>{ipo.status}</span>
                  </div>
                </div>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <button onClick={() => togglePublish(ipo.id, ipo.isVisible)} style={{color: ipo.isVisible !== false ? '#10b981' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    {ipo.isVisible !== false ? <Eye size={16}/> : <EyeOff size={16}/>}
                    {ipo.isVisible !== false ? 'Published' : 'Unpublished'}
                  </button>
                  <button onClick={() => router.push(`/admin/ipos/edit?id=${ipo.id}`)} style={{color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <Edit2 size={16}/> Edit
                  </button>
                  <button onClick={() => deleteIPO(ipo.id)} style={{color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <Trash2 size={16}/> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`premium-card ${styles.managementCard}`} style={{marginTop: '2rem'}}>
        <h2>SME IPOs</h2>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
          {loading ? (
            <p style={{color: '#64748b'}}>Loading IPOs...</p>
          ) : iposList.filter(ipo => ipo.type?.toLowerCase() === 'sme').length === 0 ? (
            <p style={{color: '#64748b'}}>No SME IPOs found.</p>
          ) : (
            iposList.filter(ipo => ipo.type?.toLowerCase() === 'sme').map(ipo => (
              <div key={ipo.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px'}}>
                <div>
                  <strong style={{fontSize: '1.1rem', color: 'white'}}>{ipo.name} ({ipo.symbol})</strong> 
                  <div style={{fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem'}}>
                    {ipo.type} • <span style={{textTransform: 'capitalize'}}>{ipo.status}</span>
                  </div>
                </div>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <button onClick={() => togglePublish(ipo.id, ipo.isVisible)} style={{color: ipo.isVisible !== false ? '#10b981' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    {ipo.isVisible !== false ? <Eye size={16}/> : <EyeOff size={16}/>}
                    {ipo.isVisible !== false ? 'Published' : 'Unpublished'}
                  </button>
                  <button onClick={() => router.push(`/admin/ipos/edit?id=${ipo.id}`)} style={{color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <Edit2 size={16}/> Edit
                  </button>
                  <button onClick={() => deleteIPO(ipo.id)} style={{color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <Trash2 size={16}/> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {iposList.filter(ipo => !ipo.type || (ipo.type.toLowerCase() !== 'mainboard' && ipo.type.toLowerCase() !== 'sme')).length > 0 && (
        <div className={`premium-card ${styles.managementCard}`} style={{marginTop: '2rem'}}>
          <h2>Other IPOs (Uncategorized)</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
            {iposList.filter(ipo => !ipo.type || (ipo.type.toLowerCase() !== 'mainboard' && ipo.type.toLowerCase() !== 'sme')).map(ipo => (
              <div key={ipo.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px'}}>
                <div>
                  <strong style={{fontSize: '1.1rem', color: 'white'}}>{ipo.name} ({ipo.symbol})</strong> 
                  <div style={{fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem'}}>
                    {ipo.type || 'Unknown'} • <span style={{textTransform: 'capitalize'}}>{ipo.status}</span>
                  </div>
                </div>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <button onClick={() => togglePublish(ipo.id, ipo.isVisible)} style={{color: ipo.isVisible !== false ? '#10b981' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    {ipo.isVisible !== false ? <Eye size={16}/> : <EyeOff size={16}/>}
                    {ipo.isVisible !== false ? 'Published' : 'Unpublished'}
                  </button>
                  <button onClick={() => router.push(`/admin/ipos/edit?id=${ipo.id}`)} style={{color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <Edit2 size={16}/> Edit
                  </button>
                  <button onClick={() => deleteIPO(ipo.id)} style={{color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <Trash2 size={16}/> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
