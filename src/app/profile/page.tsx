"use client";

import { useEffect, useState } from "react";
import styles from "../dashboard/page.module.css";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/auth");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return <div className={styles.container}><p>Loading your profile...</p></div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.subtitle}>Manage your public profile information</p>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
      </header>

      <section className={styles.section}>
        <div className={styles.tableContainer} style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--text-color)', marginBottom: '1rem' }}><strong>Email:</strong> {user?.email}</p>
          <p style={{ color: 'var(--text-color)', marginBottom: '1rem' }}><strong>User ID:</strong> {user?.uid}</p>
          <p style={{ color: 'var(--text-muted)' }}>Profile editing features coming soon.</p>
        </div>
      </section>
    </div>
  );
}
