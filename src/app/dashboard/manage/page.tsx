"use client";

import React, { useEffect, useState } from "react";
import styles from "../page.module.css";
import { db, auth } from "../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

interface Subscription {
  id: string;
  serviceId: string;
  serviceName: string;
  category: string;
  period: string;
  status: string;
  purchaseDate: any;
  nextDueDate?: string;
  businessId?: string;
  businessName?: string;
}

export default function ManageServicesPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await Promise.all([
          fetchSubscriptions(currentUser.uid),
          fetchBusinesses(currentUser.uid)
        ]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchBusinesses = async (uid: string) => {
    try {
      const q = query(collection(db, "businesses"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const b: any[] = [];
      querySnapshot.forEach((doc) => {
        b.push({ id: doc.id, ...doc.data() });
      });
      setBusinesses(b);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    }
  };

  const fetchSubscriptions = async (uid: string) => {
    try {
      const q = query(collection(db, "user_subscriptions"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const subs: Subscription[] = [];
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() } as Subscription);
      });
      setSubscriptions(subs);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  };

  if (loading) return null;

  return (
    <div>
      <h1 className={styles.title} style={{ marginBottom: '2rem' }}>Manage Services</h1>

      <section className={styles.section}>
        {subscriptions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You haven't purchased any services yet.</p>
            <button onClick={() => router.push("/user/services")} className={styles.browseBtn}>
              Browse Services
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Next Due Date</th>
                  <th>Purchased On</th>
                  <th>Linked Business</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const linkedBizName = businesses.find(b => b.id === sub.businessId)?.name || sub.businessName || "N/A";
                  const nextDueDisplay = (sub.period?.toLowerCase() === 'one-time' || sub.period?.toLowerCase() === 'one-time (registration)') 
                    ? "N/A" 
                    : (sub.nextDueDate ? new Date(sub.nextDueDate).toLocaleDateString() : "Pending");

                  return (
                    <tr key={sub.id}>
                      <td><strong>{sub.serviceName}</strong></td>
                      <td>{sub.category}</td>
                      <td style={{ textTransform: "capitalize" }}>{sub.period}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[sub.status] || ''}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td>{nextDueDisplay}</td>
                      <td>
                        {sub.purchaseDate ? (typeof sub.purchaseDate.toDate === 'function' ? sub.purchaseDate.toDate().toLocaleDateString() : (sub.purchaseDate.seconds ? new Date(sub.purchaseDate.seconds * 1000).toLocaleDateString() : 'Pending')) : 'Pending'}
                      </td>
                      <td>{linkedBizName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
