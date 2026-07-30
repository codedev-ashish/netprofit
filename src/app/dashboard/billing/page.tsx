"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { auth } from "../../../lib/firebase-auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FileText, Download } from "lucide-react";
import { generateInvoice } from "../../../lib/generateInvoice";
import styles from "../page.module.css";

export default function BillingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatServiceName = (nameOrSlug: string) => {
    if (!nameOrSlug || typeof nameOrSlug !== 'string') return 'Service';
    // If it's a slug with hyphens, format it cleanly
    if (nameOrSlug.includes('-') && nameOrSlug === nameOrSlug.toLowerCase()) {
      return nameOrSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return nameOrSlug;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await fetchOrders(currentUser.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchOrders = async (uid: string) => {
    try {
      // Firebase requires an index if sorting by createdAt while filtering by userId, 
      // so we'll just filter by userId and sort locally if needed.
      const q = query(collection(db, "orders"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const o: any[] = [];
      querySnapshot.forEach((doc) => {
        o.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort locally descending
      o.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      setOrders(o);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading billing history...</div>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Billing & Invoices</h1>
      <p className={styles.pageSubtitle}>View your past payments and download tax invoices.</p>

      <div className={`cleartax-card ${styles.managementCard}`} style={{ marginTop: '2rem' }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3>No Billing History</h3>
            <p>You haven't made any purchases yet.</p>
          </div>
        ) : (
          <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Invoice No.</th>
                  <th style={{ padding: '1rem' }}>Service Details</th>
                  <th style={{ padding: '1rem' }}>Amount</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                      {order.createdAt ? (typeof order.createdAt.toDate === 'function' ? order.createdAt.toDate().toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()) : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {order.invoiceNumber || `INV-${order.id.slice(0, 8).toUpperCase()}`}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <strong style={{ display: 'block' }}>{formatServiceName(order.serviceName || order.serviceSlug)}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.planType}</span>
                      {order.taxYear && <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-color)', marginTop: '0.25rem', fontWeight: 500 }}>Tax Year: {order.taxYear}</span>}
                      {order.startMonth && order.startYear && <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-color)', marginTop: '0.25rem', fontWeight: 500 }}>{order.startMonth} {order.startYear} - {order.endMonth} {order.endYear}</span>}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      ₹{order.amount?.toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem', 
                        fontWeight: 600,
                        backgroundColor: '#dcfce7',
                        color: '#166534'
                      }}>
                        {order.paymentStatus || 'Paid'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => generateInvoice(order)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--accent-color)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-color)'}
                      >
                        <Download size={16} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
