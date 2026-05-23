"use client";

import React, { useEffect, useState } from "react";
import styles from "../page.module.css";
import { db, auth, storage } from "../../../lib/firebase";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ChevronDown, ChevronUp, FileText, Download, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

interface Subscription {
  id: string;
  serviceId: string;
  serviceName: string;
  category: string;
  period: string;
  status: string;
  purchaseDate: any;
  businessId?: string;
  timeline?: { title: string; description: string; date: string; status: string }[];
}

interface UserDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  serviceId: string;
  serviceName: string;
  frequency: string;
  taxYear: string;
  periodValue?: string;
  documentStatus?: string;
  uploadedBy: string; // 'admin' or 'user'
  createdAt: any;
}

export default function ManageServicesPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const [uploadingDocFor, setUploadingDocFor] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const router = useRouter();

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [uploadSelections, setUploadSelections] = useState<Record<string, { taxYear: string; periodValue: string }>>({});

  const handleSelectionChange = (subId: string, field: 'taxYear' | 'periodValue', value: string) => {
    setUploadSelections(prev => {
      const current = prev[subId] || { taxYear: "2023-2024", periodValue: "January" };
      return { ...prev, [subId]: { ...current, [field]: value } };
    });
  };
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await Promise.all([
          fetchSubscriptions(currentUser.uid),
          fetchDocuments(currentUser.uid),
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

  const fetchDocuments = async (uid: string) => {
    try {
      const q = query(collection(db, "users", uid, "documents"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const docs: UserDocument[] = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as UserDocument);
      });
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
    setUploadError("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, sub: Subscription) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingDocFor(sub.id);
    setUploadError("");
    
    try {
      const storageRef = ref(storage, `user_documents/${user.uid}/${sub.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      const periodType = sub.period ? sub.period.toLowerCase() : "";
      const needsPeriodSelect = ['monthly', 'quarterly', 'yearly', 'annual'].includes(periodType);
      const currentSelection = uploadSelections[sub.id] || { taxYear: "2023-2024", periodValue: periodType === "quarterly" ? "Q1" : (periodType === "monthly" ? "January" : "Annual") };
      const userDocs = documents.filter(doc => doc.serviceId === sub.serviceId && doc.uploadedBy === 'user');
      const existingDoc = userDocs.find(d => d.taxYear === currentSelection.taxYear && d.periodValue === currentSelection.periodValue && d.documentStatus === 'original');
      const isRectification = !!existingDoc;

      const newDoc = {
        fileName: file.name,
        fileUrl,
        serviceId: sub.serviceId,
        serviceName: sub.serviceName,
        uploadedBy: 'user',
        taxYear: needsPeriodSelect ? currentSelection.taxYear : "",
        periodValue: needsPeriodSelect ? currentSelection.periodValue : "",
        documentStatus: needsPeriodSelect ? (isRectification ? 'rectified' : 'original') : "",
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "users", user.uid, "documents"), newDoc);
      
      // Refresh documents
      await fetchDocuments(user.uid);
    } catch (err: any) {
      console.error("Upload failed", err);
      setUploadError("Failed to upload document. Please try again.");
    } finally {
      setUploadingDocFor(null);
      // Reset input
      e.target.value = '';
    }
  };

  const handleAssignBusiness = async (subId: string, businessId: string) => {
    try {
      await updateDoc(doc(db, "user_subscriptions", subId), { businessId });
      await fetchSubscriptions(user.uid);
    } catch (err) {
      console.error("Failed to assign business", err);
    }
  };

  if (loading) return null; // Let layout handle loading

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
                  <th>Purchased On</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const isExpanded = expandedRow === sub.id;
                  const serviceDocs = documents.filter(doc => doc.serviceId === sub.serviceId);
                  const adminDocs = serviceDocs.filter(doc => doc.uploadedBy !== 'user');
                  const userDocs = serviceDocs.filter(doc => doc.uploadedBy === 'user');
                  
                  return (
                  <React.Fragment key={sub.id}>
                    <tr className={styles.clickableRow} onClick={() => toggleRow(sub.id)}>
                      <td><strong>{sub.serviceName}</strong></td>
                      <td>{sub.category}</td>
                      <td style={{textTransform: "capitalize"}}>{sub.period}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[sub.status]}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td>
                        {sub.purchaseDate ? (typeof sub.purchaseDate.toDate === 'function' ? sub.purchaseDate.toDate().toLocaleDateString() : (sub.purchaseDate.seconds ? new Date(sub.purchaseDate.seconds * 1000).toLocaleDateString() : 'Pending')) : 'Pending'}
                      </td>
                      <td style={{textAlign: 'right'}}>
                        {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={6} style={{ padding: 0, borderBottom: '1px solid var(--border-color)' }}>
                          <div className={styles.expandedContent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '2rem' }}>
                            <div className={styles.timelineSection}>
                              <h3>Progress Timeline</h3>
                              {!sub.timeline || sub.timeline.length === 0 ? (
                                <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No updates yet. Your service is being processed.</p>
                              ) : (
                                <div className={styles.timeline}>
                                  {sub.timeline.map((event, idx) => (
                                    <div key={idx} className={styles.timelineItem}>
                                      <div className={styles.timelineDot}></div>
                                      <div style={{display: 'flex', alignItems: 'center'}}>
                                        <span className={styles.timelineTitle}>{event.title}</span>
                                        <span className={styles.timelineDate}>{new Date(event.date).toLocaleDateString()}</span>
                                      </div>
                                      {event.description && <div className={styles.timelineDesc}>{event.description}</div>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className={styles.documentsSection} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                              
                              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Business Assignment</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                  Link this service to one of your business profiles.
                                </p>
                                <select 
                                  value={sub.businessId || ""} 
                                  onChange={(e) => handleAssignBusiness(sub.id, e.target.value)}
                                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)' }}
                                >
                                  <option value="">No Business Assigned</option>
                                  {businesses.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <h3>Upload Required Documents</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                  Provide necessary files for our team to process your service.
                                </p>
                                {(() => {
                                  const periodType = sub.period ? sub.period.toLowerCase() : "";
                                  const needsPeriodSelect = ['monthly', 'quarterly', 'yearly', 'annual'].includes(periodType);
                                  const currentSel = uploadSelections[sub.id] || { taxYear: "2023-2024", periodValue: periodType === "quarterly" ? "Q1" : (periodType === "monthly" ? "January" : "Annual") };
                                  const existingDoc = userDocs.find(d => d.taxYear === currentSel.taxYear && d.periodValue === currentSel.periodValue && d.documentStatus === 'original');
                                  const isRectification = !!existingDoc;

                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                      {needsPeriodSelect && (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                          <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500, color: 'var(--text-color)' }}>Tax Year</label>
                                            <select 
                                              value={currentSel.taxYear} 
                                              onChange={(e) => handleSelectionChange(sub.id, 'taxYear', e.target.value)}
                                              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-color)', outline: 'none', cursor: 'pointer' }}
                                            >
                                              <option value="2022-2023">2022-2023</option>
                                              <option value="2023-2024">2023-2024</option>
                                              <option value="2024-2025">2024-2025</option>
                                              <option value="2025-2026">2025-2026</option>
                                            </select>
                                          </div>
                                          
                                          {periodType === 'monthly' && (
                                            <div style={{ flex: 1 }}>
                                              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500, color: 'var(--text-color)' }}>Month</label>
                                              <select 
                                                value={currentSel.periodValue} 
                                                onChange={(e) => handleSelectionChange(sub.id, 'periodValue', e.target.value)}
                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-color)', outline: 'none', cursor: 'pointer' }}
                                              >
                                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                                  <option key={m} value={m}>{m}</option>
                                                ))}
                                              </select>
                                            </div>
                                          )}

                                          {periodType === 'quarterly' && (
                                            <div style={{ flex: 1 }}>
                                              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500, color: 'var(--text-color)' }}>Quarter</label>
                                              <select 
                                                value={currentSel.periodValue} 
                                                onChange={(e) => handleSelectionChange(sub.id, 'periodValue', e.target.value)}
                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-color)', outline: 'none', cursor: 'pointer' }}
                                              >
                                                {["Q1", "Q2", "Q3", "Q4"].map(q => (
                                                  <option key={q} value={q}>{q}</option>
                                                ))}
                                              </select>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                        <label 
                                          htmlFor={`upload-${sub.id}`} 
                                          className="btn btn-primary"
                                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: uploadingDocFor === sub.id ? 'not-allowed' : 'pointer', opacity: uploadingDocFor === sub.id ? 0.7 : 1, backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 500, transition: 'all 0.2s' }}
                                        >
                                          <Upload size={16} />
                                          {uploadingDocFor === sub.id ? 'Uploading...' : (needsPeriodSelect && isRectification ? 'Upload Rectification' : 'Select File')}
                                        </label>
                                        <input 
                                          type="file" 
                                          id={`upload-${sub.id}`} 
                                          style={{ display: 'none' }} 
                                          onChange={(e) => handleFileUpload(e, sub)}
                                          disabled={uploadingDocFor === sub.id}
                                        />
                                        {needsPeriodSelect && isRectification && <span style={{ fontSize: '0.85rem', color: '#d97706' }}>Document already uploaded. New upload will be marked as Rectified.</span>}
                                      </div>
                                    </div>
                                  );
                                })()}
                                {uploadError && <p style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '0.5rem' }}>{uploadError}</p>}
                                
                                {userDocs.length > 0 && (
                                  <div className={styles.documentList} style={{ marginTop: '1rem' }}>
                                    {userDocs.map(doc => (
                                      <div key={doc.id} className={styles.documentCard}>
                                        <div className={styles.documentInfo}>
                                          <FileText size={18} color="var(--primary-color)" />
                                          <div>
                                            <div className={styles.documentName}>{doc.fileName}</div>
                                            {(doc.periodValue || doc.taxYear) && (
                                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                {doc.taxYear} {doc.periodValue && doc.periodValue !== 'Annual' ? `- ${doc.periodValue}` : ''}
                                                {doc.documentStatus && (
                                                  <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: doc.documentStatus === 'rectified' ? '#fef3c7' : '#ecfdf5', color: doc.documentStatus === 'rectified' ? '#d97706' : '#059669', fontSize: '0.7rem' }}>
                                                    {doc.documentStatus.toUpperCase()}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                                          View
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div>
                                <h3>Final Documents (From Admin)</h3>
                                {adminDocs.length === 0 ? (
                                  <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No final documents uploaded yet.</p>
                                ) : (
                                  <div className={styles.documentList}>
                                    {adminDocs.map(doc => (
                                      <div key={doc.id} className={styles.documentCard}>
                                        <div className={styles.documentInfo}>
                                          <FileText size={18} color="var(--primary-color)" />
                                          <div>
                                            <div className={styles.documentName}>{doc.fileName}</div>
                                            {(doc.frequency || doc.taxYear || doc.periodValue) && (
                                              <div className={styles.documentMeta}>
                                                {doc.frequency} • Tax Year: {doc.taxYear}
                                                {doc.periodValue && doc.periodValue !== 'Annual' ? ` • ${doc.periodValue}` : ''}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                                          <Download size={14} /> Download
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
