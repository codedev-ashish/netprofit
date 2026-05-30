"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { ArrowLeft, FileText, Download, Upload, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import styles from "../../../../../../page.module.css";

export default function ServiceDetailsPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const businessId = params?.businessId as string;
  const serviceName = decodeURIComponent(params?.serviceName as string);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  
  // Tax Year Selection
  const [availableTaxYears, setAvailableTaxYears] = useState<string[]>([]);
  const [selectedTaxYear, setSelectedTaxYear] = useState<string>("");
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [storageSettings, setStorageSettings] = useState<any>(null);

  // Upload State
  const [uploadPeriodNode, setUploadPeriodNode] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [adminReturnType, setAdminReturnType] = useState("Original");

  useEffect(() => {
    if (!userId || !businessId || !serviceName) return;

    let unsubUserDocs = () => {};
    let unsubAdminDocs = () => {};

    const fetchData = async () => {
      try {
        // Fetch Storage Settings
        const sRef = doc(db, 'settings', 'storage');
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) setStorageSettings(sSnap.data());

        // Fetch Business Details
        const bRef = doc(db, "businesses", businessId);
        const bSnap = await getDoc(bRef);
        let bData: any = null;
        if (bSnap.exists()) {
          bData = { id: bSnap.id, ...bSnap.data() };
          setBusiness(bData);
        }

        // Fetch Service Requests matching this business and service to find IDs
        const srQuery = query(collection(db, "service_requests"), where("userId", "==", userId), where("businessId", "==", businessId), where("serviceName", "==", serviceName));
        const srSnap = await getDocs(srQuery);
        const serviceRequestsMap: Record<string, string> = {};
        srSnap.docs.forEach(d => {
          serviceRequestsMap[d.id] = d.data().returnType || "Original";
        });
        const srIds = Object.keys(serviceRequestsMap);

        let allUserDocs: any[] = [];
        let allAdminDocs: any[] = [];

        const updateDocs = () => {
          const merged = [...allUserDocs, ...allAdminDocs].sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.uploadedAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || b.uploadedAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          
          setDocuments(merged);
          
          // Determine available tax years
          const years = new Set<string>();
          merged.forEach(doc => {
            if (doc.taxYear) years.add(doc.taxYear);
            else years.add("Unknown Year");
          });
          const yearsArr = Array.from(years).sort().reverse();
          setAvailableTaxYears(yearsArr);
          if (yearsArr.length > 0 && !selectedTaxYear) {
            setSelectedTaxYear(yearsArr[0]);
          }
        };

        // Listen for user uploaded documents matching these service request IDs
        if (srIds.length > 0) {
          const userDocsQuery = query(collection(db, "documents"), where("serviceRequestId", "in", srIds.slice(0, 10)));
          unsubUserDocs = onSnapshot(userDocsQuery, (snap) => {
            allUserDocs = snap.docs.map(doc => {
              const data = doc.data();
              return { 
                id: doc.id, 
                ...data, 
                isUserUploaded: true,
                returnType: data.returnType || (data.serviceRequestId ? serviceRequestsMap[data.serviceRequestId] : "Original")
              };
            });
            updateDocs();
          });
        }

        // Listen for admin uploaded documents matching this business and service
        const adminDocsQuery = query(collection(db, "users", userId, "documents"), where("serviceName", "==", serviceName), where("businessName", "==", bData?.name || "Default Business"));
        unsubAdminDocs = onSnapshot(adminDocsQuery, (snap) => {
          allAdminDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), isUserUploaded: false }));
          updateDocs();
        });

      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      unsubUserDocs();
      unsubAdminDocs();
    };
  }, [userId, businessId, serviceName, selectedTaxYear]);

  const handleAdminUpload = async (e: React.FormEvent, period: string) => {
    e.preventDefault();
    if (!docFile) return alert("Please select a file to upload.");
    setUploadingDoc(true);

    try {
      const provider = storageSettings?.storageProvider || (storageSettings?.gdriveEnabled ? 'gdrive' : 'firebase');
      let downloadUrl = "";
      let fileId: string | null = null;

      if (provider === 'gdrive' || provider === 'idrive') {
        const uData = new window.FormData();
        uData.append("file", docFile);
        uData.append("uploadType", "admin");
        uData.append("user", userId);
        uData.append("business", business?.name || "unknown-business");
        uData.append("service", serviceName);
        uData.append("taxYear", selectedTaxYear);
        uData.append("period", period);

        const res = await fetch("/api/upload-drive", { method: "POST", body: uData });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Upload failed");
        }
        const uploadRes = await res.json();
        downloadUrl = uploadRes.webViewLink || "";
        fileId = uploadRes.fileId || null;
      } else {
        const { storage } = await import("@/lib/firebase");
        const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
        const fileRef = ref(storage, `users/${userId}/documents/${Date.now()}_${docFile.name}`);
        await uploadBytes(fileRef, docFile);
        downloadUrl = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, "users", userId, "documents"), {
        fileName: docFile.name,
        fileUrl: downloadUrl,
        fileId: fileId,
        serviceName: serviceName,
        taxYear: selectedTaxYear,
        periodValue: period,
        businessName: business?.name || "Default Business",
        uploadedBy: "Admin",
        returnType: adminReturnType,
        createdAt: serverTimestamp()
      });

      alert("Document uploaded successfully.");
      setUploadPeriodNode(null);
      setDocFile(null);
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (document: any) => {
    if (!confirm(`Are you sure you want to delete "${document.fileName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      let targetFileId = document.fileId;
      if (!targetFileId && document.fileUrl) {
        try {
          const urlObj = new URL(document.fileUrl);
          if (urlObj.hostname.includes('idrivee2.com')) {
            const pathParts = urlObj.pathname.split('/');
            if (pathParts.length > 2) {
              targetFileId = decodeURIComponent(pathParts.slice(2).join('/'));
            }
          } else if (urlObj.hostname.includes('drive.google.com')) {
            const match = document.fileUrl.match(/id=([^&]+)/) || document.fileUrl.match(/d\/([a-zA-Z0-9_-]+)/);
            if (match) targetFileId = match[1];
          }
        } catch (e) {}
      }

      // Delete from Storage Provider (Drive/iDrive or Firebase)
      if (targetFileId) {
        // Delete using universal backend route for Drive / iDrive
        try {
          const res = await fetch("/api/delete-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId: targetFileId })
          });
          if (!res.ok) {
            console.error("Failed to delete file from external storage provider");
          }
        } catch (extError) {
          console.error("Error calling /api/delete-file:", extError);
        }
      } else if (document.fileUrl && (document.fileUrl.includes('firebasestorage.googleapis.com') || document.fileUrl.startsWith('gs://'))) {
        // Fallback to Firebase Storage deletion (useful for legacy files or Firebase provider)
        try {
          const fileRef = ref(storage, document.fileUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.error("Error deleting file from Firebase storage:", storageError);
          // Continue to delete from Firestore even if storage deletion fails
        }
      }

      // Delete from Firestore
      const collectionName = document.isUserUploaded ? "documents" : `users/${userId}/documents`;
      await deleteDoc(doc(db, collectionName, document.id));
      
      alert("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document");
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading service details...</div>;

  // Filter documents by selected tax year and group by period
  const filteredDocs = documents.filter(doc => (doc.taxYear || "Unknown Year") === selectedTaxYear);
  const periodsData: Record<string, any[]> = {};
  
  filteredDocs.forEach(doc => {
    let period = doc.periodValue || doc.quarter || doc.month || doc.period || doc.frequency || "Annual";
    if (period === "Monthly" || period === "Quarterly") period = "Annual";
    
    if (!periodsData[period]) periodsData[period] = [];
    periodsData[period].push(doc);
  });

  return (
    <div>
      <button 
        onClick={() => router.push(`/admin/users/${userId}/businesses/${businessId}`)} 
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
      >
        <ArrowLeft size={16} /> Back to Services
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ marginBottom: '0.25rem' }}>
            💼 {serviceName}
          </h1>
          <p className={styles.pageSubtitle}>🏢 {business?.name || "Business Details"}</p>
        </div>
        
        {availableTaxYears.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>Tax Year:</span>
            <select 
              value={selectedTaxYear} 
              onChange={(e) => setSelectedTaxYear(e.target.value)}
              style={{ padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--card-bg)", color: "var(--text-color)", fontSize: "0.95rem", outline: "none", minWidth: "150px" }}
            >
              {availableTaxYears.map(year => (
                <option key={year} value={year}>{year === "Unknown Year" ? "Unknown Year" : year}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={`cleartax-card ${styles.managementCard}`}>
        {availableTaxYears.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: '1rem', textAlign: 'center' }}>No documents found for this service.</p>
        ) : (
          Object.keys(periodsData).length === 0 ? (
            <p style={{ color: "var(--text-muted)", padding: '1rem', textAlign: 'center' }}>No periods or documents found for {selectedTaxYear}.</p>
          ) : (
            Object.keys(periodsData).map(period => {
              const isExpanded = expandedPeriod === period;
              return (
                <div key={period} style={{ marginBottom: "1rem", backgroundColor: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: "hidden" }}>
                  <div 
                    onClick={() => setExpandedPeriod(isExpanded ? null : period)}
                    style={{ padding: "1rem", fontSize: "0.95rem", fontWeight: 600, color: "var(--text-color)", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: "space-between", backgroundColor: isExpanded ? "rgba(0,0,0,0.02)" : "transparent" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      🕒 Period: {period}
                    </div>
                    {isExpanded ? <ChevronDown size={18} style={{ color: "var(--text-muted)" }} /> : <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />}
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: "0 1rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid var(--border-color)" }}>
                      <div style={{ marginTop: "1rem" }}>
                        {periodsData[period].length === 0 ? (
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No documents in this period.</p>
                        ) : (
                          periodsData[period].map((doc: any) => (
                            <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "6px", backgroundColor: "var(--card-bg)", marginBottom: "0.5rem" }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: '0.25rem' }}>
                                  <FileText size={16} style={{ color: "var(--accent-color)" }} />
                                  <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{doc.fileName}</span>
                                  <span style={{ fontSize: "0.7rem", backgroundColor: doc.isUserUploaded ? "#10b981" : "#2563eb", color: "white", padding: "0.1rem 0.4rem", borderRadius: "12px" }}>
                                    {doc.isUserUploaded ? "From User" : "By Admin"}
                                  </span>
                                  {doc.returnType && (
                                    <span style={{ fontSize: "0.7rem", backgroundColor: doc.returnType === "Revision" ? "#f59e0b" : "#6366f1", color: "white", padding: "0.1rem 0.4rem", borderRadius: "12px" }}>
                                      {doc.returnType}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  {doc.createdAt ? (typeof doc.createdAt.toDate === "function" ? doc.createdAt.toDate().toLocaleString() : "Just now") : (doc.uploadedAt ? (typeof doc.uploadedAt.toDate === "function" ? doc.uploadedAt.toDate().toLocaleString() : "Just now") : "Just now")}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.4rem 0.75rem", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", color: "var(--text-color)", borderRadius: "6px", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500, transition: 'all 0.2s' }}>
                                  <Download size={14} /> Download
                                </a>
                                <button onClick={() => handleDeleteDoc(doc)} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.4rem 0.75rem", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, transition: 'all 0.2s' }}>
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {uploadPeriodNode === period ? (
                        <form onSubmit={(e) => handleAdminUpload(e, period)} style={{ marginTop: '0.5rem', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--card-bg)' }}>
                          <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600 }}>Upload Document to {period}</h4>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <input 
                              type="file" 
                              onChange={e => setDocFile(e.target.files ? e.target.files[0] : null)} 
                              required 
                              style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem' }} 
                            />
                            <select 
                              value={adminReturnType} 
                              onChange={e => setAdminReturnType(e.target.value)}
                              style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem' }}
                            >
                              <option value="Original">Original</option>
                              <option value="Revision">Revision</option>
                            </select>
                            <button 
                              type="submit" 
                              disabled={uploadingDoc || !docFile} 
                              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', backgroundColor: "var(--primary-color)", color: "white", border: "none", cursor: "pointer" }}
                            >
                              <Upload size={14} /> {uploadingDoc ? 'Uploading...' : 'Upload'}
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setUploadPeriodNode(null)} 
                              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button 
                          onClick={() => setUploadPeriodNode(period)}
                          style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', width: '100%', transition: 'all 0.2s' }}
                        >
                          <Upload size={14} /> Upload Admin Document here
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
