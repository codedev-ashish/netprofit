"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase-auth";
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, UploadCloud, FileText, CheckCircle, Briefcase, Calendar, Info, ShieldCheck, Download } from "lucide-react";

export default function RequestUploadPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [storageSettings, setStorageSettings] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [uploadedMonths, setUploadedMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && requestId) {
        setUser(currentUser);
        await fetchData(requestId);
      } else if (!currentUser) {
        router.push("/auth/login");
      }
    });
    return () => unsubscribe();
  }, [requestId]);

  const fetchData = async (id: string) => {
    try {
      // Fetch Storage Settings
      const sRef = doc(db, 'settings', 'storage');
      const sSnap = await getDoc(sRef);
      if (sSnap.exists()) setStorageSettings(sSnap.data());

      // Fetch Request Details
      const reqRef = doc(db, "service_requests", id);
      const reqSnap = await getDoc(reqRef);
      if (reqSnap.exists()) {
        const reqData: any = { id: reqSnap.id, ...reqSnap.data() };
        setRequest(reqData);

        // If TDS, fetch existing documents to know which months are already uploaded
        if (reqData.serviceName?.toLowerCase().includes("tds")) {
          const { query, collection, where, getDocs } = await import("firebase/firestore");
          const q = query(
            collection(db, "documents"),
            where("serviceRequestId", "==", id),
            where("returnType", "==", reqData.returnType || "Original")
          );
          const docsSnap = await getDocs(q);
          const uMonths: string[] = [];
          docsSnap.forEach(d => {
            const m = d.data().uploadedMonth;
            if (m && !uMonths.includes(m)) uMonths.push(m);
          });
          setUploadedMonths(uMonths);
        }
      } else {
        alert("Request not found");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const isTDS = request?.serviceName?.toLowerCase().includes("tds");
    if (!docFile || !user || !request) return alert("Please select a file to upload.");
    if (isTDS && !selectedMonth) return alert("Please select a month to upload the document for.");
    setUploadingDoc(true);

    try {
      const provider = storageSettings?.storageProvider || (storageSettings?.gdriveEnabled ? 'gdrive' : 'firebase');
      let downloadUrl = "";
      let fileId: string | null = null;

      const period = request.month || request.quarter || request.period || request.frequency || "Annual";

      if (provider === 'gdrive' || provider === 'idrive') {
        const uData = new window.FormData();
        uData.append("file", docFile);
        uData.append("uploadType", "user");
        uData.append("user", user.uid);
        uData.append("business", request.businessName || "unknown-business");
        uData.append("service", request.serviceName || "unknown-service");
        uData.append("taxYear", request.taxYear || "unknown-tax-year");
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
        const fileRef = ref(storage, `users/${user.uid}/documents/${Date.now()}_${docFile.name}`);
        await uploadBytes(fileRef, docFile);
        downloadUrl = await getDownloadURL(fileRef);
      }

      // Add document entry
      await addDoc(collection(db, "documents"), {
        fileName: docFile.name,
        fileUrl: downloadUrl,
        fileId: fileId,
        serviceName: request.serviceName,
        taxYear: request.taxYear,
        periodValue: period,
        businessId: request.businessId,
        businessName: request.businessName,
        uploadedBy: user.email || "User",
        uploaderType: "User",
        userId: user.uid,
        serviceRequestId: request.id,
        returnType: request.returnType || "Original",
        uploadedMonth: isTDS ? selectedMonth : null,
        createdAt: serverTimestamp()
      });

      let shouldLock = true;
      if (isTDS) {
        shouldLock = (uploadedMonths.length + 1) >= 3;
      }

      if (shouldLock) {
        // Update request status to Documents Received & Checked if it's pending or something else
        await updateDoc(doc(db, "service_requests", request.id), {
          documentsUploaded: true,
          status: request.status === "Pending" ? "Documents Received & Checked" : request.status
        });
      }

      // Notify Admin
      try {
        await fetch("/api/notify-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: request.businessName,
            serviceName: request.serviceName,
            taxYear: request.taxYear,
            period: period,
            returnType: request.returnType || "Original",
            userName: user.displayName || user.email || "User",
            fileCount: 1,
            userId: user.uid,
            businessId: request.businessId,
            serviceSlug: encodeURIComponent(request.serviceName),
            plan: request.planType || null
          })
        });
      } catch (notifyErr) {
        console.error("Failed to notify admin:", notifyErr);
      }

      alert("Document uploaded successfully.");
      setDocFile(null);
      // Go back to the dashboard businesses view
      router.back();
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading secure upload environment...</div>;
  if (!request) return null;

  const period = request.month || request.quarter || request.period || request.frequency || "Annual";

  return (
    <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 'calc(100vh - 100px)' }}>
      <button
        onClick={() => router.back()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
        onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-color)'}
        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="cleartax-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(to right, var(--primary-color), var(--primary-hover))', color: 'white', padding: 'clamp(1.5rem, 5vw, 2rem)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '50%' }}>
            <UploadCloud size={32} />
          </div>
          <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
            <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 'bold', margin: 0, color: 'white', lineHeight: 1.2 }}>Secure Upload portal</h1>
            <p style={{ margin: '0.4rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', lineHeight: 1.4 }}>Upload documents for processing by our experts</p>
          </div>
        </div>

        <div style={{ padding: 'clamp(1rem, 5vw, 2rem)' }}>
          <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--accent-color)' }} />
              Filing Context
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Briefcase size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Service & Business</div>
                  <div style={{ fontWeight: 600 }}>{request.serviceName}</div>
                  <div style={{ fontSize: '0.85rem' }}>{request.businessName}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Period</div>
                  <div style={{ fontWeight: 600 }}>{period} ({request.taxYear})</div>
                  <div style={{ fontSize: '0.85rem' }}>{request.returnType || "Original"} Filing</div>
                </div>
              </div>
            </div>
          </div>

          {(() => {
            const isTDS = request?.serviceName?.toLowerCase().includes("tds");
            const getMonthsForQuarter = (q: string) => {
              switch (q) {
                case "Q1": return ["April", "May", "June"];
                case "Q2": return ["July", "August", "September"];
                case "Q3": return ["October", "November", "December"];
                case "Q4": return ["January", "February", "March"];
                default: return [];
              }
            };
            const getMonthDates = (m: string, taxYearStr: string) => {
              if (!taxYearStr) return { enableDate: new Date(0), unlockText: "", dueText: "" };
              const parts = taxYearStr.split('-');
              const startYear = parseInt(parts[0]);
              const endYear = startYear + 1;

              let enableDate = new Date();
              let unlockText = "";
              let dueText = "";
              switch (m) {
                case "April": enableDate = new Date(startYear, 4, 1); unlockText = "1st May"; dueText = "4th May"; break;
                case "May": enableDate = new Date(startYear, 5, 1); unlockText = "1st June"; dueText = "4th June"; break;
                case "June": enableDate = new Date(startYear, 6, 1); unlockText = "1st July"; dueText = "4th July"; break;
                case "July": enableDate = new Date(startYear, 7, 1); unlockText = "1st August"; dueText = "4th August"; break;
                case "August": enableDate = new Date(startYear, 8, 1); unlockText = "1st September"; dueText = "4th September"; break;
                case "September": enableDate = new Date(startYear, 9, 1); unlockText = "1st October"; dueText = "4th October"; break;
                case "October": enableDate = new Date(startYear, 10, 1); unlockText = "1st November"; dueText = "4th November"; break;
                case "November": enableDate = new Date(startYear, 11, 1); unlockText = "1st December"; dueText = "4th December"; break;
                case "December": enableDate = new Date(endYear, 0, 1); unlockText = "1st January"; dueText = "4th January"; break;
                case "January": enableDate = new Date(endYear, 1, 1); unlockText = "1st February"; dueText = "4th February"; break;
                case "February": enableDate = new Date(endYear, 2, 1); unlockText = "1st March"; dueText = "4th March"; break;
                case "March": enableDate = new Date(endYear, 3, 15); unlockText = "15th April"; dueText = "20th April"; break;
              }
              return { enableDate, unlockText, dueText };
            };

            return (
              <form onSubmit={handleUpload}>
                {isTDS && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Select Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-color)', outline: 'none' }}
                      required
                    >
                      <option value="">-- Choose Month --</option>
                      {getMonthsForQuarter(period).map(m => {
                        const { enableDate, unlockText, dueText } = getMonthDates(m, request.taxYear);
                        const isLocked = new Date() < enableDate;
                        const isUploaded = uploadedMonths.includes(m);

                        let label = m;
                        if (isUploaded) label += " (Already Uploaded)";
                        else if (isLocked) label += ` (Unlocks ${unlockText})`;
                        else label += ` (Due ${dueText})`;

                        return (
                          <option key={m} value={m} disabled={isUploaded || isLocked}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                {isTDS && (
                  <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <a 
                      href={`/api/tds-template?period=${encodeURIComponent(period)}`}
                      download={`TDS_Upload_Sample_${period}.xlsx`}
                      style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--accent-color)', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        fontWeight: 600,
                        backgroundColor: 'rgba(255, 107, 0, 0.05)',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        border: '1px solid rgba(255, 107, 0, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 107, 0, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 107, 0, 0.05)';
                      }}
                    >
                      <Download size={14} /> Download Sample Template (.xlsx)
                    </a>
                  </div>
                )}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Upload File</label>
                  <div
                    style={{
                      border: docFile ? '2px solid var(--accent-color)' : '2px dashed var(--border-color)',
                      borderRadius: '12px',
                      padding: 'clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem)',
                      textAlign: 'center',
                      backgroundColor: docFile ? 'rgba(255, 107, 0, 0.05)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={() => document.getElementById('file-upload')?.click()}
                    onMouseOver={(e) => {
                      if (!docFile) {
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                        e.currentTarget.style.backgroundColor = 'rgba(12, 56, 102, 0.03)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!docFile) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                      }
                    }}
                  >
                    {docFile ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--accent-color)' }}>
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                          <CheckCircle size={32} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-color)' }}>{docFile.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Ready to upload. Click to change file.</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                          <UploadCloud size={32} style={{ color: 'var(--primary-color)' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Click to browse your files</div>
                          <div style={{ fontSize: '0.85rem' }}>{isTDS ? "Upload Excel or CSV only (Max 3MB)" : "Upload ZIP, PDF, or Excel (Max 3MB)"}</div>
                        </div>
                      </div>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      accept={isTDS ? ".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" : ".pdf,.zip,.xls,.xlsx,.csv,application/pdf,application/zip,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"}
                      onChange={e => {
                        const file = e.target.files ? e.target.files[0] : null;
                        if (file) {
                          if (file.size > 3 * 1024 * 1024) {
                            alert("File size exceeds 3MB limit.");
                            setDocFile(null);
                            e.target.value = '';
                            return;
                          }
                          const allowedTypes = isTDS ? ['.xls', '.xlsx', '.csv'] : ['.pdf', '.zip', '.xls', '.xlsx', '.csv'];
                          const isAllowed = allowedTypes.some(ext => file.name.toLowerCase().endsWith(ext));
                          if (!isAllowed) {
                            alert(`Invalid file format. Please upload ${isTDS ? "Excel/CSV" : "ZIP, PDF, or Excel"} files.`);
                            setDocFile(null);
                            e.target.value = '';
                            return;
                          }
                          setDocFile(file);
                        } else {
                          setDocFile(null);
                        }
                      }}
                      required
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Info size={14} />
                    <span>Your documents are encrypted and securely stored.</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadingDoc || !docFile}
                  className="btn btn-primary"
                  style={{
                    padding: '1rem',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    borderRadius: '8px',
                    opacity: uploadingDoc || !docFile ? 0.6 : 1,
                    cursor: uploadingDoc || !docFile ? 'not-allowed' : 'pointer',
                    boxShadow: uploadingDoc || !docFile ? 'none' : '0 4px 14px 0 rgba(255, 107, 0, 0.39)'
                  }}
                >
                  {uploadingDoc ? 'Uploading and notifying admin...' : 'Securely Upload Document'}
                </button>
              </form>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
