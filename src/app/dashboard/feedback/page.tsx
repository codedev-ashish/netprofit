"use client";

import React, { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../lib/firebase";
import { auth } from "../../../lib/firebase-auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Flag, MessageCircleQuestion, CheckCircle2 } from "lucide-react";

export default function FeedbackPage() {
  const [user, setUser] = useState<any>(null);
  const [type, setType] = useState("feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        userId: user.uid,
        userEmail: user.email,
        type,
        subject,
        message,
        status: 'open',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className={styles.title} style={{ marginBottom: '0.5rem' }}>Report & Feedback</h1>
      <p className={styles.subtitle} style={{ marginBottom: '2rem' }}>Help us improve! Send us your feedback or report an issue.</p>

      {submitted ? (
        <div className="cleartax-card" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <CheckCircle2 size={48} color="#48bb78" />
          <h2 style={{ fontSize: '1.5rem' }}>Thank you!</h2>
          <p style={{ color: 'var(--text-muted)' }}>Your {type} has been successfully submitted. Our team will review it shortly.</p>
          <button onClick={() => setSubmitted(false)} className="btn btn-secondary" style={{ marginTop: '1rem' }}>Submit Another</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="cleartax-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div 
              onClick={() => setType('feedback')}
              style={{ 
                padding: '1.5rem', 
                border: `2px solid ${type === 'feedback' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                backgroundColor: type === 'feedback' ? 'rgba(249, 115, 22, 0.05)' : 'transparent'
              }}
            >
              <MessageCircleQuestion size={32} color={type === 'feedback' ? 'var(--accent-color)' : 'var(--text-muted)'} style={{ margin: '0 auto 0.5rem auto' }} />
              <h3 style={{ fontSize: '1rem', color: type === 'feedback' ? 'var(--accent-color)' : 'inherit' }}>General Feedback</h3>
            </div>
            
            <div 
              onClick={() => setType('report')}
              style={{ 
                padding: '1.5rem', 
                border: `2px solid ${type === 'report' ? '#e53e3e' : 'var(--border-color)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                backgroundColor: type === 'report' ? 'rgba(229, 62, 62, 0.05)' : 'transparent'
              }}
            >
              <Flag size={32} color={type === 'report' ? '#e53e3e' : 'var(--text-muted)'} style={{ margin: '0 auto 0.5rem auto' }} />
              <h3 style={{ fontSize: '1rem' }}>Report an Issue</h3>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Subject</label>
            <input 
              type="text" 
              required 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Briefly describe the topic..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Message</label>
            <textarea 
              required 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Provide more details here..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ minWidth: '150px' }}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
