"use client";

import React, { useEffect, useState } from "react";
import styles from "../page.module.css";
import { db } from "../../../lib/firebase";
import { auth } from "../../../lib/firebase-auth";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Building2, Plus, Trash2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Business {
  id: string;
  name: string;
  type: string;
  gstNumber: string;
  panNumber: string;
  tanNumber: string;
  pfNumber: string;
  esicNumber: string;
}

export default function ManageBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBusiness, setNewBusiness] = useState({ name: '', type: '', gstNumber: '', panNumber: '', tanNumber: '', pfNumber: '', esicNumber: '' });
  const [submitting, setSubmitting] = useState(false);

  const [deletingBusinessId, setDeletingBusinessId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchBusinesses(currentUser.uid);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchBusinesses = async (uid: string) => {
    try {
      const q = query(collection(db, "businesses"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const b: Business[] = [];
      querySnapshot.forEach((doc) => {
        b.push({ id: doc.id, ...doc.data() } as Business);
      });
      setBusinesses(b);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    }
  };

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "businesses"), {
        userId: user.uid,
        ...newBusiness,
        createdAt: serverTimestamp()
      });
      setNewBusiness({ name: '', type: '', gstNumber: '', panNumber: '', tanNumber: '', pfNumber: '', esicNumber: '' });
      setShowAddForm(false);
      await fetchBusinesses(user.uid);
    } catch (error) {
      console.error("Error adding business:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    try {
      const q = query(collection(db, "user_subscriptions"), where("userId", "==", user.uid), where("businessId", "==", id));
      const querySnapshot = await getDocs(q);
      let hasActive = false;
      querySnapshot.forEach((doc) => {
        if (doc.data().status === 'active') {
          hasActive = true;
        }
      });
      if (hasActive) {
        alert("You cannot delete a business that has active service plans.");
        return;
      }
      setDeletingBusinessId(id);
      setDeletePassword("");
      setDeleteError("");
    } catch (err) {
      console.error("Error checking business services:", err);
      alert("An error occurred. Please try again.");
    }
  };

  const confirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email || !deletingBusinessId) return;
    
    setIsDeleting(true);
    setDeleteError("");

    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      
      await deleteDoc(doc(db, "businesses", deletingBusinessId));
      
      setDeletingBusinessId(null);
      setDeletePassword("");
      await fetchBusinesses(user.uid);
    } catch (err: any) {
      console.error("Delete business error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setDeleteError("Incorrect password.");
      } else {
        setDeleteError("An error occurred while deleting the business. " + err.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return null;

  return (
    <div>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className={styles.title}>Manage Businesses</h1>
          <p className={styles.subtitle}>Link your purchased services to your registered businesses.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Business
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddBusiness} className="cleartax-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>Add New Business</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Business Name</label>
              <input type="text" required value={newBusiness.name} onChange={e => setNewBusiness({...newBusiness, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }} placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Entity Type</label>
              <select required value={newBusiness.type} onChange={e => setNewBusiness({...newBusiness, type: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }}>
                <option value="">Select Type</option>
                <option value="Private Limited">Private Limited</option>
                <option value="LLP">LLP</option>
                <option value="Proprietorship">Proprietorship</option>
                <option value="Partnership">Partnership</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>GST Number (Optional)</label>
            <input type="text" value={newBusiness.gstNumber} onChange={e => setNewBusiness({...newBusiness, gstNumber: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }} placeholder="e.g. 22AAAAA0000A1Z5" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>PAN Number (Optional)</label>
              <input type="text" value={newBusiness.panNumber} onChange={e => setNewBusiness({...newBusiness, panNumber: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }} placeholder="e.g. ABCDE1234F" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>TAN Number (Optional)</label>
              <input type="text" value={newBusiness.tanNumber} onChange={e => setNewBusiness({...newBusiness, tanNumber: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }} placeholder="e.g. BLRE12345F" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>PF Establishment No (Optional)</label>
              <input type="text" value={newBusiness.pfNumber} onChange={e => setNewBusiness({...newBusiness, pfNumber: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }} placeholder="PF Number" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ESIC Establishment No (Optional)</label>
              <input type="text" value={newBusiness.esicNumber} onChange={e => setNewBusiness({...newBusiness, esicNumber: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }} placeholder="ESIC Number" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Adding...' : 'Save Business'}</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {businesses.length === 0 ? (
        <div className={styles.emptyState}>
          <Building2 size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <p>No business profiles created yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {businesses.map(b => {
            return (
              <div 
                key={b.id} 
                className="cleartax-card" 
                style={{ padding: '1.5rem', position: 'relative', cursor: 'pointer', transition: 'transform 0.2s' }}
                onClick={() => router.push(`/dashboard/businesses/${b.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(b.id); }} 
                  style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer', zIndex: 10 }}
                >
                  <Trash2 size={18} />
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <Building2 size={24} color="#60a5fa" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{b.name}</h3>
                    <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--primary-color)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>{b.type}</span>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  {b.gstNumber && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>GST:</strong> {b.gstNumber}</p>}
                  {b.panNumber && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>PAN:</strong> {b.panNumber}</p>}
                  {b.tanNumber && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>TAN:</strong> {b.tanNumber}</p>}
                  {b.pfNumber && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>PF:</strong> {b.pfNumber}</p>}
                  {b.esicNumber && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>ESIC:</strong> {b.esicNumber}</p>}
                </div>

                <hr style={{ margin: '1rem 0', borderColor: 'var(--border-color)', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span>Open Business Details</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deletingBusinessId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="cleartax-card" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '1rem', color: '#e53e3e' }}>Confirm Deletion</h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Please enter your password to confirm deletion of this business.</p>
            <form onSubmit={confirmDelete} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="password" 
                required 
                placeholder="Your Password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
              {deleteError && <p style={{ color: '#e53e3e', fontSize: '0.85rem' }}>{deleteError}</p>}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" disabled={isDeleting} className="btn btn-primary" style={{ backgroundColor: '#e53e3e', borderColor: '#e53e3e', flex: 1 }}>
                  {isDeleting ? 'Deleting...' : 'Delete Business'}
                </button>
                <button type="button" onClick={() => { setDeletingBusinessId(null); setDeletePassword(""); setDeleteError(""); }} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
