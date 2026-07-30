"use client";

import { useEffect, useState } from "react";
import styles from "../dashboard/page.module.css";
import { db } from "../../lib/firebase";
import { auth } from "../../lib/firebase-auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ name: '', city: '', state: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch profile
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            name: data.name || currentUser.displayName || '',
            city: data.city || '',
            state: data.state || ''
          });
        } else {
          setProfile((prev) => ({ ...prev, name: currentUser.displayName || '' }));
        }
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, "users", user.uid), {
        name: profile.name,
        city: profile.city,
        state: profile.state,
        email: user.email,
        updatedAt: new Date()
      }, { merge: true });
      setMessage('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      setMessage('Error updating profile.');
    }
    setSaving(false);
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
        <div className={styles.tableContainer} style={{ padding: '2rem', maxWidth: '600px' }}>
          <p style={{ color: 'var(--text-color)', marginBottom: '1.5rem' }}><strong>Email:</strong> {user?.email}</p>
          <p style={{ color: 'var(--text-color)', marginBottom: '2rem' }}><strong>User ID:</strong> {user?.uid}</p>
          
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Full Name</label>
              <input 
                type="text" 
                value={profile.name} 
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white' }}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>City</label>
              <input 
                type="text" 
                value={profile.city} 
                onChange={(e) => setProfile({...profile, city: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white' }}
                placeholder="Enter your city"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>State</label>
              <input 
                type="text" 
                value={profile.state} 
                onChange={(e) => setProfile({...profile, state: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white' }}
                placeholder="Enter your state"
              />
            </div>
            
            {message && <p style={{ color: message.includes('success') ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}>{message}</p>}
            
            <button 
              type="submit" 
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '0.75rem', marginTop: '1rem' }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
