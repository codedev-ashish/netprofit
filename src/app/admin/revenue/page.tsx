"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../../src/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, RefreshCw } from "lucide-react";

export default function RevenueDashboard() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [graphData, setGraphData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch subscriptions
      const q = query(collection(db, "user_subscriptions"), orderBy("purchaseDate", "desc"));
      const querySnapshot = await getDocs(q);
      const subs: any[] = [];
      let income = 0;
      
      const incomeByDate: Record<string, number> = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const sub: any = { id: doc.id, ...data };
        subs.push(sub);
        
        const amount = sub.amount || 0;
        income += amount;

        // Group by date for graph
        if (sub.purchaseDate) {
          const dateStr = sub.purchaseDate.toDate().toLocaleDateString();
          incomeByDate[dateStr] = (incomeByDate[dateStr] || 0) + amount;
        }
      });

      // Also try to fetch users to map names (optional enhancement)
      const userCache: Record<string, string> = {};
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        usersSnap.forEach(u => {
          userCache[u.id] = u.data().name || u.data().email || u.id;
        });
      } catch (e) {
        console.warn("Could not fetch users collection for names", e);
      }

      // Map user names to subs
      const enrichedSubs = subs.map(sub => ({
        ...sub,
        userName: userCache[sub.userId] || sub.userId
      }));

      const chartData = Object.keys(incomeByDate).map(date => ({
        date,
        amount: incomeByDate[date]
      })).reverse(); // chronological

      setSubscriptions(enrichedSubs);
      setTotalIncome(income);
      setGraphData(chartData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching revenue data:", err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Revenue Dashboard</h1>
      <p className={styles.pageSubtitle}>Monitor income, refunds, and transaction history.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '50%', color: '#10b981' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Income</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)' }}>₹{totalIncome.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '50%', color: '#ef4444' }}>
            <RefreshCw size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Refunds</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)' }}>₹0</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Feature coming soon</div>
          </div>
        </div>
      </div>

      <div className={`cleartax-card ${styles.managementCard}`} style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-color)' }}>Income Over Time</h2>
        <div style={{ height: '300px', width: '100%' }}>
          {graphData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, "Income"]}
                  contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No income data available yet to display graph.
            </div>
          )}
        </div>
      </div>

      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-color)' }}>Recent Transactions</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>User Name</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Service Name</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Period</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found.</td>
                </tr>
              ) : (
                subscriptions.map(sub => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-color)' }}>
                      {sub.purchaseDate ? sub.purchaseDate.toDate().toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-color)' }} title={sub.userId}>
                      {sub.userName}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-color)' }}>
                      {sub.serviceName}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-color)', textTransform: 'capitalize' }}>
                      {sub.period || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#10b981' }}>
                      ₹{(sub.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
