"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, getDocs, doc, updateDoc } from "firebase/firestore";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      const q = query(collection(db, "service_requests"));
      const querySnapshot = await getDocs(q);
      const reqs: any[] = [];
      querySnapshot.forEach((doc) => {
        reqs.push({ id: doc.id, ...doc.data() });
      });
      setRequests(reqs);
    } catch (error) {
      console.error("Error fetching admin requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "service_requests", id), {
        status: newStatus
      });
      await fetchAllRequests();
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading Admin Panel...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Admin Panel - Service Requests</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Manage and update all user service requests.</p>

      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem' }}>User / Business</th>
              <th style={{ padding: '1rem' }}>Service & Period</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{req.businessName}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div>{req.serviceName} ({req.planType})</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Period: {req.taxYear} {req.quarter} {req.month}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 'bold',
                    backgroundColor: req.status === 'Filed' ? '#EAF3DE' : req.status === 'Pending' ? '#FAEEDA' : '#E1F5EE',
                    color: req.status === 'Filed' ? '#3B6D11' : req.status === 'Pending' ? '#854F0B' : '#0F6E56'
                  }}>
                    {req.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={req.status}
                      onChange={(e) => updateStatus(req.id, e.target.value)}
                      style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Documents Received & Checked">Documents Received & Checked</option>
                      <option value="Filing Progress">Filing Progress (Takes 2-3 Working Days)</option>
                      <option value="Filed">Filed</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No requests found.
          </div>
        )}
      </div>
    </div>
  );
}
