"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "../../../lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { CheckCircle, Clock, UploadCloud, FileText } from "lucide-react";

export default function UserRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchRequests(currentUser.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchRequests = async (uid: string) => {
    try {
      const q = query(collection(db, "service_requests"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const reqs: any[] = [];
      querySnapshot.forEach((doc) => {
        reqs.push({ id: doc.id, ...doc.data() });
      });
      setRequests(reqs);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>My Services & Requests</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Track progress and upload required documents for your purchased services.</p>

      {requests.length === 0 ? (
        <div style={{ background: 'var(--bg-secondary)', padding: '3rem', textAlign: 'center', borderRadius: '8px' }}>
          <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3>No service requests found</h3>
          <p>You haven't purchased any services yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {requests.map(req => (
            <div key={req.id} className="cleartax-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{req.serviceName}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Business: {req.businessName} • Plan: {req.planType}</p>
                </div>
                <span style={{ 
                  padding: '4px 12px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 'bold',
                  backgroundColor: req.status === 'Completed' ? '#EAF3DE' : req.status === 'In Progress' ? '#E1F5EE' : '#FAEEDA',
                  color: req.status === 'Completed' ? '#3B6D11' : req.status === 'In Progress' ? '#0F6E56' : '#854F0B'
                 }}>
                  {req.status}
                </span>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Progress Timeline</p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: req.status !== 'Pending' ? '#3B6D11' : 'var(--text-muted)' }}>
                    <CheckCircle size={16} /> 1. Purchased
                  </div>
                  <div style={{ width: '40px', height: '2px', background: req.status !== 'Pending' ? '#3B6D11' : 'var(--border-color)' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: req.status === 'In Progress' || req.status === 'Completed' ? '#3B6D11' : 'var(--text-muted)' }}>
                    <Clock size={16} /> 2. Admin Working
                  </div>
                  <div style={{ width: '40px', height: '2px', background: req.status === 'Completed' ? '#3B6D11' : 'var(--border-color)' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: req.status === 'Completed' ? '#3B6D11' : 'var(--text-muted)' }}>
                    <CheckCircle size={16} /> 3. Completed
                  </div>
                </div>
                {req.expectedCompletionDate && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                    Expected Completion: {req.expectedCompletionDate}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <a href={`/dashboard/requests/${req.id}/upload`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UploadCloud size={16} /> Upload Required Documents
                </a>
                {req.status === 'Completed' && (
                  <button className="btn btn-secondary">
                    Download Final Deliverables
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
