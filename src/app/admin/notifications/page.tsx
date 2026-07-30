"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Bell, CheckCircle2, Trash2, Clock, UploadCloud } from "lucide-react";
import Link from "next/link";

interface AdminAlert {
  id: string;
  title: string;
  message: string;
  businessName: string;
  serviceName: string;
  plan?: string;
  taxYear?: string;
  period?: string;
  type: string;
  read: boolean;
  createdAt: any;
  link?: string;
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const q = query(collection(db, "admin_alerts"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const items: AdminAlert[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as AdminAlert);
      });
      setAlerts(items);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "admin_alerts", id), { read: true });
      setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
    } catch (error) {
      console.error("Error updating read status:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadAlerts = alerts.filter(a => !a.read);
      await Promise.all(
        unreadAlerts.map(a => updateDoc(doc(db, "admin_alerts", a.id), { read: true }))
      );
      setAlerts(alerts.map(a => ({ ...a, read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;
    try {
      await deleteDoc(doc(db, "admin_alerts", id));
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading notifications...</div>;

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.25rem' }}>Admin Notifications</h1>
          <p style={{ color: 'var(--text-muted)' }}>Important alerts and system updates.</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            style={{ 
              background: 'transparent', 
              color: 'var(--icon-color)', 
              border: '1px solid var(--primary-color)', 
              padding: '0.5rem 1rem', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <CheckCircle2 size={16} /> Mark all as read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {alerts.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
            <Bell size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <h3>No Notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div 
              key={alert.id}
              style={{
                background: alert.read ? 'var(--bg-secondary)' : 'var(--bg-color)',
                border: '1px solid',
                borderColor: alert.read ? 'var(--border-color)' : 'var(--primary-color)',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'flex-start',
                boxShadow: alert.read ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.1)',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {!alert.read && (
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--primary-color)' }} />
              )}
              
              <div style={{ 
                background: alert.read ? 'rgba(0,0,0,0.05)' : 'rgba(37, 99, 235, 0.1)', 
                color: alert.read ? 'var(--text-muted)' : 'var(--primary-color)',
                padding: '1rem', 
                borderRadius: '50%',
                flexShrink: 0
              }}>
                {alert.type === 'document_upload' ? <UploadCloud size={24} /> : <Bell size={24} />}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: alert.read ? 600 : 700, color: 'var(--text-color)', margin: 0 }}>
                    {alert.link ? (
                      <Link href={alert.link} style={{ color: 'inherit', textDecoration: 'none' }}>
                        <span style={{ textDecoration: 'underline' }}>{alert.title}</span>
                      </Link>
                    ) : (
                      alert.title
                    )}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <Clock size={12} />
                      {alert.createdAt?.toDate ? new Date(alert.createdAt.toDate()).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'}
                    </span>
                  </div>
                </div>
                
                <p style={{ color: 'var(--text-color)', lineHeight: '1.6', fontSize: '1rem', marginBottom: '1rem', opacity: alert.read ? 0.8 : 1 }}>
                  {alert.message}
                </p>
                
                {alert.businessName && (
                  alert.link ? (
                    <Link href={alert.link} style={{ textDecoration: 'none', display: 'inline-block', marginTop: '0.5rem' }}>
                      <div style={{ background: 'rgba(0,0,0,0.05)', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-color)', border: '1px solid var(--primary-color)', transition: 'all 0.2s', cursor: 'pointer' }}>
                        <strong>Business:</strong> {alert.businessName} | <strong>Service:</strong> {alert.serviceName}
                        {alert.plan && <span> | <strong>Plan:</strong> {alert.plan}</span>}
                        {alert.taxYear && <span> | <strong>Tax Year:</strong> {alert.taxYear}</span>}
                        {alert.period && alert.period !== 'Annual' && <span> | <strong>Period:</strong> {alert.period}</span>}
                      </div>
                    </Link>
                  ) : (
                    <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.05)', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                      <strong>Business:</strong> {alert.businessName} | <strong>Service:</strong> {alert.serviceName}
                      {alert.plan && <span> | <strong>Plan:</strong> {alert.plan}</span>}
                      {alert.taxYear && <span> | <strong>Tax Year:</strong> {alert.taxYear}</span>}
                      {alert.period && alert.period !== 'Annual' && <span> | <strong>Period:</strong> {alert.period}</span>}
                    </div>
                  )
                )}
                {alert.link && (
                  <div style={{ marginTop: '1rem' }}>
                    <Link href={alert.link} style={{ fontSize: '0.9rem', color: 'var(--icon-color)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
                      Go to Service Page →
                    </Link>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {!alert.read && (
                  <button 
                    onClick={() => handleMarkAsRead(alert.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--icon-color)', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Mark as read"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(alert.id)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}
                  title="Delete notification"
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
