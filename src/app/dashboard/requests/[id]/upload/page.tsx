"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { UploadCloud, CheckCircle } from "lucide-react";

export default function DocumentUploadPage() {
  const params = useParams();
  const router = useRouter();
  const [requestData, setRequestData] = useState<any>(null);
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [taxYear, setTaxYear] = useState("2025-26");
  const [quarter, setQuarter] = useState("");
  const [month, setMonth] = useState("");
  const [returnType, setReturnType] = useState("Original");
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [storageSettings, setStorageSettings] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && params?.id) {
        await fetchRequestDetails(params.id as string);
      } else if (!currentUser) {
        router.push("/auth/login");
      }
    });
    return () => unsubscribe();
  }, [params, router]);

  const fetchRequestDetails = async (id: string) => {
    try {
      const docRef = doc(db, "service_requests", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRequestData(data);
        if (data.taxYear) setTaxYear(data.taxYear);
        if (data.quarter) setQuarter(data.quarter);
        if (data.month) setMonth(data.month);
        if (data.returnType) setReturnType(data.returnType);

        if (data.businessId) {
          const bRef = doc(db, "businesses", data.businessId);
          const bSnap = await getDoc(bRef);
          if (bSnap.exists()) {
            setBusinessData(bSnap.data());
          }
        }
      } else {
        console.error("Request not found");
      }

      // Fetch storage configuration
      const sRef = doc(db, "settings", "storage");
      const sSnap = await getDoc(sRef);
      if (sSnap.exists()) {
        setStorageSettings(sSnap.data());
      }
    } catch (error) {
      console.error("Error fetching request details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) return alert("Please select a file to upload.");
    setUploading(true);

    try {
      // Determine active storage provider
      const provider = storageSettings?.storageProvider ||
        (storageSettings?.gdriveEnabled ? 'gdrive' : 'firebase');

      // 1. Loop through all selected files and add doc records to collection
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileUrl = "";
        let fileId: string | null = null;

        if (provider === 'gdrive' || provider === 'idrive') {
          const uData = new window.FormData();
          uData.append("file", file);
          uData.append("uploadType", "user");
          uData.append("business", requestData?.businessName || "unknown-business");
          uData.append("service", requestData?.serviceName || "unknown-service");
          uData.append("taxYear", taxYear || requestData?.taxYear || "unknown-tax-year");

          let pVal = "Annual";
          if (requestData?.planType === 'Monthly' || month) pVal = month;
          else if (requestData?.planType === 'Quarterly' || quarter) pVal = quarter;
          uData.append("period", pVal);
          uData.append("returnType", returnType || requestData?.returnType || "Original");

          const res = await fetch("/api/upload-drive", {
            method: "POST",
            body: uData,
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Upload failed");
          }

          const uploadRes = await res.json();
          fileUrl = uploadRes.webViewLink || "";
          fileId = uploadRes.fileId || null;
        } else {
          // Firebase Storage (client-side)
          const { storage } = await import("@/lib/firebase");
          const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
          const fileRef = ref(storage, `service_requests/${params?.id}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          fileUrl = await getDownloadURL(fileRef);
        }

        await addDoc(collection(db, "documents"), {
          serviceRequestId: params?.id,
          uploaderType: "User",
          fileName: file.name,
          fileUrl: fileUrl,
          fileId: fileId,
          fileType: file.type || "application/pdf",
          uploadedAt: serverTimestamp(),
          businessId: requestData?.businessId || "",
          businessName: requestData?.businessName || "",
          businessDetails: businessData || null,
          taxYear: taxYear || requestData?.taxYear || "",
          quarter: quarter || requestData?.quarter || "",
          month: month || requestData?.month || "",
          returnType: returnType || requestData?.returnType || "Original"
        });
      }

      // 2. Update the request with period tags if they provided them
      await updateDoc(doc(db, "service_requests", params?.id as string), {
        taxYear: taxYear || requestData.taxYear || "",
        quarter: quarter || requestData.quarter || "",
        month: month || requestData.month || "",
        documentsUploaded: true
      });

      alert("Documents uploaded successfully! The admin will begin processing your service.");
      router.push("/dashboard/requests");
    } catch (error) {
      console.error("Error uploading documents:", error);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Document Requirements...</div>;
  if (!requestData) return <div style={{ padding: '4rem', textAlign: 'center' }}>Service request not found.</div>;

  const isQuarterlyRequest = requestData.planType === 'Quarterly' || !!requestData.quarter || (requestData.serviceName || "").toLowerCase().includes("tds");
  const isMonthlyRequest = requestData.planType === 'Monthly' || !!requestData.month;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', background: 'white', color: '#1f2937', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827' }}>Upload Required Documents</h1>
      <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>For {requestData.serviceName} ({requestData.businessName})</p>

      <div style={{ background: '#FAEEDA', color: '#854F0B', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', fontSize: '0.9rem' }}>
        <strong>Important:</strong> Please ensure all documents are clear and readable. PDF or Excel formats are preferred.
      </div>

      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Dynamic Period Inputs based on Plan Type */}
        {requestData.planType !== 'One-time' && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Tax Year (FY)</label>
              <select disabled value={taxYear} onChange={(e) => setTaxYear(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}>
                <option value="2025-26">2025-26</option>
                <option value="2026-27">2026-27</option>
              </select>
            </div>

            {isQuarterlyRequest && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Quarter</label>
                <select disabled required value={quarter} onChange={(e) => setQuarter(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}>
                  <option value="">Select Quarter</option>
                  <option value="Q1">Q1 (Apr-Jun)</option>
                  <option value="Q2">Q2 (Jul-Sep)</option>
                  <option value="Q3">Q3 (Oct-Dec)</option>
                  <option value="Q4">Q4 (Jan-Mar)</option>
                </select>
              </div>
            )}

            {isMonthlyRequest && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Month</label>
                <input disabled type="month" required value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }} />
              </div>
            )}

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Return Type</label>
              <select disabled value={returnType} onChange={(e) => setReturnType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}>
                <option value="Original">Original</option>
                <option value="Revision">Revision</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Files</label>
          <div style={{ border: '2px dashed #d1d5db', padding: '2rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer' }} onClick={() => document.getElementById('fileInput')?.click()}>
            <UploadCloud size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#374151', fontWeight: '500' }}>Click or drag files here to upload</p>
            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Supported: PDF, Excel, JPEG, PNG</p>
          </div>
          <input
            id="fileInput"
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            style={{ display: 'none' }}
          />
          {files && files.length > 0 && (
            <div style={{ marginTop: '1rem', background: '#f3f4f6', padding: '1rem', borderRadius: '6px' }}>
              <strong style={{ fontSize: '0.9rem', color: '#1f2937' }}>Selected Files:</strong>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.85rem', color: '#4b5563' }}>
                {Array.from(files).map((f, i) => <li key={i}>{f.name}</li>)}
              </ul>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading || !files}
          className="btn btn-primary"
          style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <CheckCircle size={18} /> {uploading ? 'Uploading...' : 'Submit Documents'}
        </button>
      </form>
    </div>
  );
}
