"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { MessageCircleQuestion, Flag, Trash2, CheckCircle, Clock } from "lucide-react";
import styles from "../page.module.css";

export default function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setFeedbackList(list);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "feedback", id), { status: newStatus });
      setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    try {
      await deleteDoc(doc(db, "feedback", id));
      setFeedbackList(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("Failed to delete feedback");
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading feedback...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className={styles.pageTitle}>User Feedback & Reports</h1>
      </div>

      {feedbackList.length === 0 ? (
        <div className="cleartax-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>No feedback or reports found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {feedbackList.map((item) => (
            <div key={item.id} className="cleartax-card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ padding: '1rem', backgroundColor: item.type === 'report' ? 'rgba(229, 62, 62, 0.1)' : 'rgba(56, 189, 248, 0.1)', borderRadius: '12px' }}>
                {item.type === 'report' ? <Flag color="#e53e3e" size={24} /> : <MessageCircleQuestion color="var(--icon-color)" size={24} />}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{item.subject}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      From: <strong>{item.userEmail}</strong> &bull; {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'Recently'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'capitalize',
                      backgroundColor: item.status === 'resolved' ? '#E1F5EE' : '#FAEEDA',
                      color: item.status === 'resolved' ? '#0F6E56' : '#854F0B',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      {item.status === 'resolved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {item.status || 'open'}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                  {item.message}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  {item.status !== 'resolved' && (
                    <button onClick={() => updateStatus(item.id, 'resolved')} className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', backgroundColor: 'rgba(15, 110, 86, 0.1)', color: '#0F6E56' }}>
                      Mark Resolved
                    </button>
                  )}
                  {item.status === 'resolved' && (
                    <button onClick={() => updateStatus(item.id, 'open')} className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', backgroundColor: 'rgba(133, 79, 11, 0.1)', color: '#854F0B' }}>
                      Reopen
                    </button>
                  )}
                  <button onClick={() => deleteFeedback(item.id)} className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', backgroundColor: 'rgba(229, 62, 62, 0.1)', color: '#e53e3e' }}>
                    <Trash2 size={16} style={{ display: 'inline', marginRight: '4px' }} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
