"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../../src/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { UserX, Shield, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminUsers() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Note: Since Firebase Auth doesn't allow listing users client-side, 
    // we would rely on a 'users' collection in Firestore where we save users upon registration.
    // Assuming such collection exists:
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData: any[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      setUsersList(usersData);
    } catch (e) {
      console.warn("No users collection found or permission denied.", e);
    }
  };

  const handleBan = async (id: string, currentStatus: boolean) => {
    if (confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) {
      try {
        await updateDoc(doc(db, "users", id), { isBanned: !currentStatus });
        fetchUsers();
      } catch (error) {
        console.error("Error updating user:", error);
      }
    }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Manage Users</h1>
      <p className={styles.pageSubtitle}>View registered users, edit plans, and manage access.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>User Directory</h2>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
          {usersList.length === 0 ? (
            <div style={{padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-muted)'}}>
              <p>No users found in the Firestore `users` collection yet.</p>
              <p style={{fontSize: '0.85rem', marginTop: '0.5rem'}}>Users will appear here once they register (requires auth trigger or client-side save on registration).</p>
            </div>
          ) : null}
          
          {usersList.map(u => (
            <div 
              key={u.id} 
              onClick={() => router.push(`/admin/users/${u.id}`)}
              style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', opacity: u.isBanned ? 0.6 : 1, cursor: 'pointer', transition: 'border-color 0.2s', backgroundColor: 'var(--card-bg)'}}
              className={styles.userRow}
            >
              <div>
                <strong style={{fontSize: '1.1rem', textDecoration: u.isBanned ? 'line-through' : 'none'}}>{u.email}</strong> 
                <div style={{fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem'}}>
                  Plan: {u.plan || 'Free'} • ID: {u.id}
                </div>
              </div>
              <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}} onClick={(e) => e.stopPropagation()}>
                <button style={{color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  <Shield size={16}/> Edit Plan
                </button>
                <button onClick={() => handleBan(u.id, !!u.isBanned)} style={{color: u.isBanned ? '#10b981' : '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  <UserX size={16}/> {u.isBanned ? "Unban User" : "Ban User"}
                </button>
                <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
