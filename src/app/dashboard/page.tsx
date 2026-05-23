"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
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
    } catch (error) {
      console.error("Error fetching stats:", error);
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
              <ShoppingBag size={24} color="var(--primary-color)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Active Services</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-color)' }}>{stats.activeServices}</p>
        </div>

        <div className="cleartax-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '50%' }}>
              <FileText size={24} color="var(--primary-color)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Documents</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-color)' }}>{stats.totalDocuments}</p>
        </div>

        <div className="cleartax-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '50%' }}>
              <CreditCard size={24} color="var(--primary-color)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Billing Status</h3>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-color)' }}>Up to date</p>
        </div>
      </div>

      {/* New Widgets Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        
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
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <Bell size={16} color="var(--primary-color)" style={{ marginTop: '0.25rem' }} />
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Action Required</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Please upload your PAN card for the Company Incorporation service.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <Bell size={16} color="var(--primary-color)" style={{ marginTop: '0.25rem' }} />
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Service Update</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your GST Registration is currently under processing.</p>
                </div>
              </div>
            </div>
          </div>

          {/* News Section */}
          <div className="cleartax-card" style={{ padding: '2rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Newspaper size={20} color="var(--primary-color)" />
              <h2 style={{ fontSize: '1.25rem' }}>Latest News</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <Link href="/news" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-color)', textDecoration: 'none' }}>
                  New GST Compliance Rules for 2024
                </Link>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Learn about the recent changes to the GST compliance structure.</p>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
              <div>
                <Link href="/news" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-color)', textDecoration: 'none' }}>
                  Tax Benefits for Startups Extended
                </Link>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>The government has extended tax holidays for recognized startups.</p>
              </div>
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
