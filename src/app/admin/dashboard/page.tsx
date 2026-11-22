"use client";

import styles from "../page.module.css";
import Loader from "../../../components/Loader";
import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface Subscription {
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  category: string;
  period: string;
  status: string;
  purchaseDate: any;
  timeline?: { title: string; description: string; date: string; status: string }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ services: 0, news: 0, subscriptions: 0 });
  const [allSubs, setAllSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [servicesSnap, newsSnap, subsSnap] = await Promise.all([
          getDocs(collection(db, "services")),
          getDocs(collection(db, "news")),
          getDocs(collection(db, "user_subscriptions"))
        ]);
        
        setStats({
          services: servicesSnap.size,
          news: newsSnap.size,
          subscriptions: subsSnap.size
        });

        const subsData: Subscription[] = [];
        subsSnap.forEach((doc) => {
          subsData.push({ id: doc.id, ...doc.data() } as Subscription);
        });
        
        // Sort by newest first based on purchaseDate if available
        subsData.sort((a, b) => {
          const dateA = a.purchaseDate?.seconds || 0;
          const dateB = b.purchaseDate?.seconds || 0;
          return dateB - dateA;
        });

        setAllSubs(subsData);
      } catch (error) {
        console.error("Error fetching admin dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Dashboard Overview</h1>
      <p className={styles.pageSubtitle}>Welcome to the NetProfit Admin Panel.</p>
      
      <div className={styles.statsGrid}>
        <div className={`cleartax-card ${styles.statCard}`}>
          <h3>Total Services</h3>
          <div className={styles.statValueUpdated}>{stats.services}</div>
        </div>
        <div className={`cleartax-card ${styles.statCard}`}>
          <h3>Active Subscriptions</h3>
          <div className={styles.statValueUpdated}>{stats.subscriptions}</div>
        </div>
        <div className={`cleartax-card ${styles.statCard}`}>
          <h3>News Articles</h3>
          <div className={styles.statValueUpdated}>{stats.news}</div>
        </div>
      </div>

      <div className={`cleartax-card ${styles.managementCard}`} style={{ marginTop: '2rem' }}>
        <h2>All Active Client Services</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>A global view of all subscriptions across the platform.</p>
        
        {allSubs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No active subscriptions found.</p>
        ) : (
          <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem' }}>Client ID</th>
                  <th style={{ padding: '1rem' }}>Service Name</th>
                  <th style={{ padding: '1rem' }}>Category</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Purchased On</th>
                  <th style={{ padding: '1rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {allSubs.map((sub) => {
                  const isExpanded = expandedRow === sub.id;
                  
                  return (
                  <React.Fragment key={sub.id}>
                    <tr 
                      onClick={() => toggleRow(sub.id)}
                      style={{ 
                        borderBottom: '1px solid var(--border-color)', 
                        cursor: 'pointer', 
                        backgroundColor: isExpanded ? 'rgba(0,0,0,0.02)' : 'transparent',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#60a5fa', fontWeight: 600, fontFamily: 'monospace' }}>
                        {sub.userId.substring(0, 8)}...
                      </td>
                      <td style={{ padding: '1rem' }}><strong>{sub.serviceName}</strong></td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{sub.category}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '12px', 
                          fontSize: '0.8rem', 
                          fontWeight: 600,
                          backgroundColor: sub.status === 'active' ? '#dcfce7' : '#f1f5f9',
                          color: sub.status === 'active' ? '#166534' : '#475569',
                          textTransform: 'capitalize'
                        }}>
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {sub.purchaseDate ? (typeof sub.purchaseDate.toDate === 'function' ? sub.purchaseDate.toDate().toLocaleDateString() : (sub.purchaseDate.seconds ? new Date(sub.purchaseDate.seconds * 1000).toLocaleDateString() : 'Pending')) : 'Pending'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: '1.5rem', backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, paddingRight: '2rem' }}>
                              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Service Progress</h3>
                              {!sub.timeline || sub.timeline.length === 0 ? (
                                <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No updates have been posted to this timeline yet.</p>
                              ) : (
                                <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '2px solid #e2e8f0' }}>
                                  {sub.timeline.map((event, idx) => (
                                    <div key={idx} style={{ position: 'relative', marginBottom: '1.25rem' }}>
                                      <div style={{ position: 'absolute', left: '-1.35rem', top: '0.25rem', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }}></div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <strong style={{ fontSize: '0.95rem' }}>{event.title}</strong>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(event.date).toLocaleDateString()}</span>
                                      </div>
                                      {event.description && <div style={{ fontSize: '0.85rem', color: '#475569' }}>{event.description}</div>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); router.push(`/admin/users/${sub.userId}`); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                              >
                                <ExternalLink size={16} /> Manage Client Details
                              </button>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                                Click here to upload documents, add timeline events, or chat with the client.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
