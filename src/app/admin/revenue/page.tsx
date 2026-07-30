"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../../src/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, RefreshCw, Tag, Wallet, TrendingDown, Download } from "lucide-react";
import { generateInvoice } from "../../../../src/lib/generateInvoice";

export default function RevenueDashboard() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalGrossIncome, setTotalGrossIncome] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalNetIncome, setTotalNetIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
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

      // Fetch orders for detailed revenue metrics AND table display
      const allTransactions: any[] = [];
      try {
        const ordersSnap = await getDocs(query(collection(db, "orders")));
        let gross = 0;
        let disc = 0;
        let net = 0;
        ordersSnap.forEach((doc) => {
          const d = doc.data();
          const amount = d.amount || d.basePrice || 0;
          gross += (d.basePrice || amount);
          disc += (d.discountAmount || 0);
          net += amount;
          
          allTransactions.push({
            id: doc.id,
            ...d,
            type: 'order',
            userName: d.userName || d.userEmail || d.userId,
            date: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
            amount: amount,
            invoiceNumber: d.invoiceNumber || `INV-${doc.id.slice(0, 8).toUpperCase()}`
          });
        });
        setTotalGrossIncome(gross);
        setTotalDiscount(disc);
        setTotalNetIncome(net);
      } catch (e) {
        console.warn("Could not fetch orders for revenue metrics", e);
      }

      // Add enriched subscriptions to transactions
      enrichedSubs.forEach(sub => {
        allTransactions.push({
          ...sub,
          type: 'subscription',
          date: sub.purchaseDate?.toDate ? sub.purchaseDate.toDate() : new Date(),
          invoiceNumber: sub.invoiceNumber || `SUB-${sub.id.slice(0, 8).toUpperCase()}`
        });
      });

      // Sort all transactions chronologically descending
      allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Fetch expenses
      try {
        const expensesSnap = await getDocs(collection(db, "expenses"));
        let exp = 0;
        expensesSnap.forEach((doc) => {
          exp += (doc.data().amount || 0);
        });
        setTotalExpenses(exp);
      } catch (e) {
        console.warn("Could not fetch expenses", e);
      }

      setSubscriptions(allTransactions);
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '50%', color: '#10b981' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Gross Income</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)' }}>₹{totalGrossIncome.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ backgroundColor: '#fffbeb', padding: '1rem', borderRadius: '50%', color: '#f59e0b' }}>
            <Tag size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Discounts</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)' }}>₹{totalDiscount.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '50%', color: '#3b82f6' }}>
            <Wallet size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Net Income</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)' }}>₹{totalNetIncome.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '50%', color: '#ef4444' }}>
            <TrendingDown size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Expenses</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)' }}>₹{totalExpenses.toLocaleString()}</div>
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
                <th style={{ padding: '1rem', fontWeight: 600 }}>Invoice No.</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>User Name</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Service Name</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found.</td>
                </tr>
              ) : (
                subscriptions.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-color)' }}>
                      {tx.date ? tx.date.toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {tx.invoiceNumber}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-color)' }} title={tx.userId}>
                      {tx.userName}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-color)' }}>
                      {tx.serviceName || tx.planName || 'Unknown'}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-color)', textTransform: 'capitalize' }}>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem', 
                        backgroundColor: tx.type === 'order' ? '#e0e7ff' : '#dcfce7',
                        color: tx.type === 'order' ? '#3730a3' : '#166534'
                      }}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#10b981' }}>
                      ₹{(tx.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => generateInvoice(tx)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.4rem 0.8rem',
                          backgroundColor: 'var(--card-bg)',
                          color: 'var(--accent-color)',
                          border: '1px solid var(--accent-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-color)'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-bg)'; e.currentTarget.style.color = 'var(--accent-color)'; }}
                      >
                        <Download size={14} /> PDF
                      </button>
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
