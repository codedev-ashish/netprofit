"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import { db } from "../../lib/firebase";
import { auth } from "../../lib/firebase-auth";
import { collection, query, where, getDocs, orderBy, limit, deleteDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { TrendingUp, FileText, ShoppingBag, CreditCard, Bell, AlertCircle, Calendar, Newspaper } from "lucide-react";
import Link from "next/link";

export default function DashboardOverviewPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    activeServices: 0,
    totalDocuments: 0,
    totalSpent: "₹0"
  });
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(2));
        const querySnapshot = await getDocs(q);
        const news: any[] = [];
        querySnapshot.forEach((doc) => {
          news.push({ id: doc.id, ...doc.data() });
        });
        setLatestNews(news);
      } catch (error) {
        console.error("Error fetching latest news:", error);
      }
    };
    fetchLatestNews();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchStats(currentUser.uid);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchStats = async (uid: string) => {
    try {
      const q = query(collection(db, "user_subscriptions"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      let active = 0;
      querySnapshot.forEach((doc) => {
        if (doc.data().status === 'active') active++;
      });
      
      const docQ = query(collection(db, "users", uid, "documents"));
      const docSnapshot = await getDocs(docQ);
      
      setStats({
        activeServices: active,
        totalDocuments: docSnapshot.size,
        totalSpent: "—" // Mocking for now, as price isn't stored in sub currently
      });

      // Fetch Notifications
      const notifQ = query(collection(db, "users", uid, "notifications"), orderBy("createdAt", "desc"), limit(5));
      const notifSnap = await getDocs(notifQ);
      const notifs: any[] = [];
      notifSnap.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(notifs);

    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleDismissNotification = async (notifId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "notifications", notifId));
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  if (loading) return null; // Handled by layout

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, {user?.email?.split('@')[0]}</h1>
          <p className={styles.subtitle}>Here's an overview of your account.</p>
        </div>
      </div>

      <div className={styles.statsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div className="cleartax-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '50%' }}>
              <ShoppingBag size={24} color="var(--icon-color)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Active Services</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-color)' }}>{stats.activeServices}</p>
        </div>

        <div className="cleartax-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '50%' }}>
              <FileText size={24} color="var(--icon-color)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Documents</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-color)' }}>{stats.totalDocuments}</p>
        </div>

        <div className="cleartax-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '50%' }}>
              <CreditCard size={24} color="var(--icon-color)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Billing Status</h3>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-color)' }}>Up to date</p>
        </div>
      </div>

      {/* New Widgets Row */}
      <div className={styles.widgetsGrid}>
        
        {/* Due Dates Section */}
        <div className="cleartax-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Calendar size={20} color="var(--accent-color)" />
            <h2 style={{ fontSize: '1.25rem' }}>Due Date of Returns</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderLeft: '4px solid #ed8936', background: 'var(--bg-secondary)', borderRadius: '0 4px 4px 0' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>GST GSTR-3B</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Due: 20th of this month</p>
            </div>
            <div style={{ padding: '1rem', borderLeft: '4px solid #48bb78', background: 'var(--bg-secondary)', borderRadius: '0 4px 4px 0' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Income Tax Return</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Due: July 31st</p>
            </div>
            <div style={{ padding: '1rem', borderLeft: '4px solid #ecc94b', background: 'var(--bg-secondary)', borderRadius: '0 4px 4px 0' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>TDS Return (Q1)</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Due: July 31st</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Alerts & Notifications */}
          <div className="cleartax-card" style={{ padding: '2rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <AlertCircle size={20} color="#e53e3e" />
              <h2 style={{ fontSize: '1.25rem' }}>Alerts & Notifications</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notifications.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You have no new notifications.</p>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <Bell size={16} color={notif.type === 'alert' ? '#e53e3e' : 'var(--primary-color)'} style={{ marginTop: '0.25rem' }} />
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{notif.title || 'Notification'}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{notif.message}</p>
                        {notif.createdAt && (
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {typeof notif.createdAt.toDate === 'function' ? notif.createdAt.toDate().toLocaleDateString() : 'Recent'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleDismissNotification(notif.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                      Dismiss
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* News Section */}
          <div className="cleartax-card" style={{ padding: '2rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Newspaper size={20} color="var(--icon-color)" />
              <h2 style={{ fontSize: '1.25rem' }}>Latest News</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {latestNews.length > 0 ? (
                latestNews.map((item, index) => (
                  <div key={item.id}>
                    {index > 0 && <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />}
                    <Link href={`/news/${item.slug || item.id}`} style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-color)', textDecoration: 'none', display: 'block' }}>
                      {item.title}
                    </Link>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {item.excerpt ? (item.excerpt.length > 80 ? item.excerpt.substring(0, 80) + '...' : item.excerpt) : ''}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No recent news.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      <div className="cleartax-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <TrendingUp size={48} color="var(--accent-color)" style={{ marginBottom: '1rem', margin: '0 auto' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Need a new service?</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Explore our range of corporate, tax, and legal services to grow your business.</p>
        <Link href="/user/services" className="btn btn-primary">Browse Services</Link>
      </div>
    </div>
  );
}
