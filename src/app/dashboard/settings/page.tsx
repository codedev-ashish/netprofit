"use client";

import React, { useState, useEffect } from "react";
import styles from "../page.module.css";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { AlertTriangle, Lock } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Profile State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [updating, setUpdating] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email || "");
        
        // Fetch name from firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setName(userDoc.data().name || currentUser.displayName || "");
          } else {
            setName(currentUser.displayName || "");
          }
        } catch (err) {
          console.error("Error loading user name:", err);
          setName(currentUser.displayName || "");
        }
      } else {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSavingProfile(true);
    setProfileSuccess("");
    setProfileError("");
    
    try {
      // 1. Update Firestore
      await setDoc(doc(db, "users", user.uid), { 
        name: name.trim(),
        email: user.email
      }, { merge: true });
      
      // 2. Update Auth Profile displayName
      await updateProfile(user, { displayName: name.trim() });
      
      setProfileSuccess("Profile updated successfully!");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setProfileError("Failed to update profile. " + (err.message || ""));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    
    setUpdating(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setPasswordError("Incorrect current password.");
      } else if (err.code === 'auth/weak-password') {
        setPasswordError("New password should be at least 6 characters.");
      } else {
        setPasswordError("Failed to update password. Please try again.");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    
    setDeleting(true);
    setDeleteError("");

    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Delete Firestore Data (Businesses & Feedback, Subscriptions)
      // Note: In a production app, you might want a Cloud Function to handle deep cleanup.
      // We will do basic cleanup here.
      const uid = user.uid;
      
      // Delete Businesses
      const bQuery = query(collection(db, "businesses"), where("userId", "==", uid));
      const bSnaps = await getDocs(bQuery);
      bSnaps.forEach(async (d) => await deleteDoc(doc(db, "businesses", d.id)));

      // Delete user document
      await deleteDoc(doc(db, "users", uid));

      // 3. Delete Auth User
      await deleteUser(user);
      
      // 4. Redirect
      router.push("/");
    } catch (err: any) {
      console.error("Delete account error:", err);
      if (err.code === 'auth/invalid-credential') {
        setDeleteError("Incorrect password.");
      } else {
        setDeleteError("An error occurred while deleting your account.");
      }
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className={styles.title} style={{ marginBottom: '2rem' }}>Account Settings</h1>

      {/* Account Setting Section */}
      <section className="cleartax-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Account Profile</h2>
        </div>
        
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
            <input 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.7 }}>Email ID (Not Editable)</label>
            <input 
              type="email" 
              disabled
              value={email}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
            />
          </div>
          {profileError && <p style={{ color: '#e53e3e', fontSize: '0.85rem' }}>{profileError}</p>}
          {profileSuccess && <p style={{ color: '#48bb78', fontSize: '0.85rem' }}>{profileSuccess}</p>}
          
          <button type="submit" disabled={savingProfile} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>

      {/* Change Password Section */}
      <section className="cleartax-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Lock size={24} color="var(--primary-color)" />
          <h2 style={{ fontSize: '1.25rem' }}>Change Password</h2>
        </div>
        
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Current Password</label>
            <input 
              type="password" 
              required 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>New Password</label>
            <input 
              type="password" 
              required 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }}
            />
          </div>
          {passwordError && <p style={{ color: '#e53e3e', fontSize: '0.85rem' }}>{passwordError}</p>}
          {passwordSuccess && <p style={{ color: '#48bb78', fontSize: '0.85rem' }}>{passwordSuccess}</p>}
          
          <button type="submit" disabled={updating} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            {updating ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>

      {/* Danger Zone: Delete Account */}
      <section className="cleartax-card" style={{ padding: '2rem', border: '1px solid #fc8181' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <AlertTriangle size={24} color="#e53e3e" />
          <h2 style={{ fontSize: '1.25rem', color: '#e53e3e' }}>Danger Zone</h2>
        </div>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Once you delete your account, there is no going back. All your data, purchased services, and chat history will be permanently deleted. Please be certain.
        </p>

        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-primary" style={{ backgroundColor: '#e53e3e', borderColor: '#e53e3e' }}>
            Delete Account
          </button>
        ) : (
          <div style={{ background: 'rgba(229, 62, 62, 0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fc8181' }}>
            <h3 style={{ fontSize: '1rem', color: '#e53e3e', marginBottom: '1rem' }}>Are you absolutely sure?</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Please enter your password to confirm account deletion.</p>
            
            <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
              <input 
                type="password" 
                required 
                placeholder="Your Password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #fc8181', background: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
              {deleteError && <p style={{ color: '#e53e3e', fontSize: '0.85rem' }}>{deleteError}</p>}
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" disabled={deleting} className="btn btn-primary" style={{ backgroundColor: '#e53e3e', borderColor: '#e53e3e', flex: 1 }}>
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button type="button" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

    </div>
  );
}
