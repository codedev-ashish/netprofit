"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../../src/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import styles from "../../page.module.css";
import { ArrowLeft, User, FileText, MessageSquare, AlertCircle, Shield, Mail, Key, Briefcase, Upload, Download, Send } from "lucide-react";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";

export default function UserDetails() {
  const params = useParams();
  const userId = params?.userId as string;
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Services Tab State
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [userServices, setUserServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [serviceType, setServiceType] = useState("One-Time");
  const [assigningService, setAssigningService] = useState(false);
  const [updatingTimelineId, setUpdatingTimelineId] = useState<string | null>(null);
  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineDesc, setTimelineDesc] = useState("");
  
  // Documents Tab State
  const [documents, setDocuments] = useState<any[]>([]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docService, setDocService] = useState("");
  const [docFrequency, setDocFrequency] = useState("Monthly");
  const [docTaxYear, setDocTaxYear] = useState("2023-2024");
  const [docPeriodValue, setDocPeriodValue] = useState("January");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Rectifications State
  const [rectifications, setRectifications] = useState<any[]>([]);

  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser({ id: docSnap.id, ...docSnap.data() });
        }
        
        // Fetch Available Services
        const servicesSnap = await getDocs(collection(db, "services"));
        const services: any[] = [];
        servicesSnap.forEach(s => services.push({ id: s.id, ...s.data() }));
        setAvailableServices(services);

        // Fetch Assigned User Services
        fetchUserServices();

        // Listen for documents
        const docsQuery = query(collection(db, "users", userId, "documents"), orderBy("createdAt", "desc"));
        const unsubDocs = onSnapshot(docsQuery, (snapshot) => {
          const d: any[] = [];
          snapshot.forEach(doc => d.push({ id: doc.id, ...doc.data() }));
          setDocuments(d);
        });

        // Listen for rectifications
        const rectQuery = query(collection(db, "users", userId, "rectification_requests"), orderBy("createdAt", "desc"));
        const unsubRect = onSnapshot(rectQuery, (snapshot) => {
          const r: any[] = [];
          snapshot.forEach(doc => r.push({ id: doc.id, ...doc.data() }));
          setRectifications(r);
        });

        // Listen for chat messages
        const chatQuery = query(collection(db, "users", userId, "messages"), orderBy("createdAt", "asc"));
        const unsubChat = onSnapshot(chatQuery, (snapshot) => {
          const m: any[] = [];
          snapshot.forEach(doc => m.push({ id: doc.id, ...doc.data() }));
          setMessages(m);
        });

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const fetchUserServices = async () => {
    try {
      const q = query(collection(db, "user_subscriptions"), where("userId", "==", userId), orderBy("purchaseDate", "desc"));
      const snap = await getDocs(q);
      const uServices: any[] = [];
      snap.forEach(s => uServices.push({ id: s.id, ...s.data() }));
      setUserServices(uServices);
    } catch (e) {
      console.error("Error fetching user services", e);
    }
  };

  const handleAssignService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setAssigningService(true);
    
    try {
      const serviceObj = availableServices.find(s => s.id === selectedService);
      await addDoc(collection(db, "user_subscriptions"), {
        userId: userId,
        serviceId: selectedService,
        serviceName: serviceObj?.title || serviceObj?.name || "Unknown Service",
        category: serviceObj?.category || "Other",
        period: serviceType,
        purchaseDate: serverTimestamp(),
        status: "Active",
        timeline: []
      });
      setSelectedService("");
      fetchUserServices();
    } catch (error) {
      console.error("Error assigning service:", error);
      alert("Failed to assign service.");
    } finally {
      setAssigningService(false);
    }
  };

  const handleAddTimeline = async (e: React.FormEvent, subId: string) => {
    e.preventDefault();
    if (!timelineTitle) return;
    
    try {
      const subRef = doc(db, "user_subscriptions", subId);
      const subDoc = await getDoc(subRef);
      if (subDoc.exists()) {
        const currentTimeline = subDoc.data().timeline || [];
        await updateDoc(subRef, {
          timeline: [...currentTimeline, {
            title: timelineTitle,
            description: timelineDesc,
            date: new Date().toISOString(),
            status: 'completed'
          }]
        });
        setTimelineTitle("");
        setTimelineDesc("");
        setUpdatingTimelineId(null);
        fetchUserServices();
      }
    } catch (error) {
      console.error("Error updating timeline:", error);
      alert("Failed to update timeline.");
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !docService) return;
    setUploadingDoc(true);

    try {
      // Import storage dynamically or use the one from lib/firebase
      const { storage } = await import("../../../../../src/lib/firebase");
      
      // Upload to Storage
      const fileRef = ref(storage, `users/${userId}/documents/${Date.now()}_${docFile.name}`);
      await uploadBytes(fileRef, docFile);
      const downloadUrl = await getDownloadURL(fileRef);

      // Save metadata to Firestore
      const serviceObj = availableServices.find(s => s.id === docService);
      await addDoc(collection(db, "users", userId, "documents"), {
        fileName: docFile.name,
        fileUrl: downloadUrl,
        serviceId: docService,
        serviceName: serviceObj?.title || "Unknown",
        frequency: docFrequency,
        taxYear: docTaxYear,
        periodValue: docFrequency === 'Yearly' ? 'Annual' : (['Monthly', 'Quarterly'].includes(docFrequency) ? docPeriodValue : ''),
        uploadedBy: "Admin",
        createdAt: serverTimestamp()
      });

      setDocFile(null);
      alert("Document uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading document:", error);
      alert("Upload failed. Ensure Storage is enabled. " + error.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    if (confirm(`Send a password reset email to ${user.email}?`)) {
      try {
        const auth = getAuth();
        await sendPasswordResetEmail(auth, user.email);
        alert("Password reset email sent successfully!");
      } catch (error: any) {
        console.error("Error sending reset email:", error);
        alert("Failed to send reset email: " + error.message);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSendingMsg(true);
    try {
      await addDoc(collection(db, "users", userId, "messages"), {
        text: newMessage,
        sender: "Admin",
        createdAt: serverTimestamp()
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleBanToggle = async () => {
    if (!user) return;
    const currentStatus = !!user.isBanned;
    if (confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) {
      try {
        await updateDoc(doc(db, "users", userId), { isBanned: !currentStatus });
        setUser({ ...user, isBanned: !currentStatus });
      } catch (error) {
        console.error("Error updating user:", error);
      }
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading user details...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: '2rem' }}>
        <button onClick={() => router.push('/admin/users')} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Users
        </button>
        <h2>User Not Found</h2>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => router.push('/admin/users')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} /> Back to Directory
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user.name || "Client Profile"} 
            {user.isBanned && <span style={{ fontSize: '0.8rem', backgroundColor: '#e53e3e', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '12px' }}>Banned</span>}
          </h1>
          <p className={styles.pageSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={14} /> {user.email} | <span style={{opacity: 0.6}}>ID: {user.id}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handlePasswordReset} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={16} /> Reset Password
          </button>
          <button onClick={handleBanToggle} style={{ background: user.isBanned ? '#10b981' : '#e53e3e', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} /> {user.isBanned ? "Unban User" : "Ban User"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        {[
          { id: 'overview', icon: User, label: 'Overview & Services' },
          { id: 'documents', icon: FileText, label: 'Document Vault' },
          { id: 'rectifications', icon: AlertCircle, label: 'Rectifications' },
          { id: 'chat', icon: MessageSquare, label: 'Live Chat' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-color)' : 'var(--text-muted)',
              padding: '0.5rem 0',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={`cleartax-card ${styles.managementCard}`}>
        {activeTab === 'overview' && (
          <div>
            <h2>Assign New Service</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Assign a One-Time or Recurring service to this client.</p>
            
            <form onSubmit={handleAssignService} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>Select Service</label>
                <select className={styles.inputField} value={selectedService} onChange={e => setSelectedService(e.target.value)} required>
                  <option value="">-- Choose a service --</option>
                  {availableServices.map(s => (
                    <option key={s.id} value={s.id}>{s.title || s.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>Billing Type</label>
                <select className={styles.inputField} value={serviceType} onChange={e => setServiceType(e.target.value)}>
                  <option value="One-Time">One-Time</option>
                  <option value="Recurring">Recurring</option>
                </select>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={assigningService || !selectedService} style={{ height: '42px', padding: '0 2rem' }}>
                {assigningService ? "Assigning..." : "Assign Service"}
              </button>
            </form>

            <h2>Assigned Services</h2>
            {userServices.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>This user has no assigned services yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {userServices.map(us => (
                  <div key={us.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--card-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Briefcase size={16} style={{ color: 'var(--accent-color)' }} />
                          <strong style={{ fontSize: '1.05rem' }}>{us.serviceName}</strong>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Period: {us.period} • Assigned: {us.purchaseDate ? (typeof us.purchaseDate.toDate === 'function' ? us.purchaseDate.toDate().toLocaleDateString() : (us.purchaseDate.seconds ? new Date(us.purchaseDate.seconds * 1000).toLocaleDateString() : 'Just now')) : 'Just now'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', backgroundColor: '#10b981', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 600 }}>
                          {us.status}
                        </span>
                        <button 
                          onClick={() => setUpdatingTimelineId(updatingTimelineId === us.id ? null : us.id)}
                          style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                          {updatingTimelineId === us.id ? 'Cancel' : 'Update Progress'}
                        </button>
                      </div>
                    </div>
                    
                    {updatingTimelineId === us.id && (
                      <form onSubmit={(e) => handleAddTimeline(e, us.id)} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '6px' }}>
                        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Add Timeline Event</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <input type="text" placeholder="Event Title (e.g. Documents Verified)" className={styles.inputField} value={timelineTitle} onChange={e => setTimelineTitle(e.target.value)} required />
                          <input type="text" placeholder="Optional Description" className={styles.inputField} value={timelineDesc} onChange={e => setTimelineDesc(e.target.value)} />
                          <button type="submit" className={styles.submitBtn} style={{ alignSelf: 'flex-start', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Add Event</button>
                        </div>
                      </form>
                    )}
                    
                    {us.timeline && us.timeline.length > 0 && (
                      <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', borderLeft: '2px solid #e2e8f0' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Progress Timeline:</h4>
                        {us.timeline.map((event: any, idx: number) => (
                          <div key={idx} style={{ position: 'relative', marginBottom: '0.5rem' }}>
                            <div style={{ position: 'absolute', left: '-1.85rem', top: '0.3rem', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }}></div>
                            <strong style={{ fontSize: '0.9rem' }}>{event.title}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{new Date(event.date).toLocaleDateString()}</span>
                            {event.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{event.description}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h2>Document Vault</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Upload documents for this client categorized by Service, Frequency, and Tax Year.</p>
            
            <form onSubmit={handleUploadDocument} className={styles.form} style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>File</label>
                  <input type="file" onChange={e => setDocFile(e.target.files ? e.target.files[0] : null)} className={styles.inputField} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>Related Service</label>
                  <select className={styles.inputField} value={docService} onChange={e => setDocService(e.target.value)} required>
                    <option value="">-- Choose a service --</option>
                    {availableServices.map(s => (
                      <option key={s.id} value={s.id}>{s.title || s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>Frequency</label>
                  <select className={styles.inputField} value={docFrequency} onChange={e => setDocFrequency(e.target.value)}>
                    <option value="One-Time">One-Time</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>Tax Year</label>
                  <select className={styles.inputField} value={docTaxYear} onChange={e => setDocTaxYear(e.target.value)}>
                    <option value="2022-2023">2022-2023</option>
                    <option value="2023-2024">2023-2024</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                  </select>
                </div>
                {['Monthly', 'Quarterly'].includes(docFrequency) && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>{docFrequency === 'Monthly' ? 'Month' : 'Quarter'}</label>
                    <select className={styles.inputField} value={docPeriodValue} onChange={e => setDocPeriodValue(e.target.value)}>
                      {docFrequency === 'Monthly' ? (
                        ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))
                      ) : (
                        ["Q1", "Q2", "Q3", "Q4"].map(q => (
                          <option key={q} value={q}>{q}</option>
                        ))
                      )}
                    </select>
                  </div>
                )}
              </div>
              <button type="submit" className={styles.submitBtn} disabled={uploadingDoc || !docFile || !docService}>
                {uploadingDoc ? "Uploading..." : "Upload Document"}
              </button>
            </form>

            <h2>Uploaded Documents</h2>
            {documents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No documents found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {documents.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--card-bg)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} style={{ color: 'var(--accent-color)' }} />
                        <strong style={{ fontSize: '1.05rem' }}>{doc.fileName}</strong>
                        <span style={{ fontSize: '0.75rem', backgroundColor: doc.uploadedBy === 'Admin' ? '#2563eb' : '#10b981', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          By {doc.uploadedBy || 'User'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {doc.serviceName} • {doc.frequency} • Tax Year: {doc.taxYear} {doc.periodValue && doc.periodValue !== 'Annual' ? ` • ${doc.periodValue}` : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Uploaded: {doc.createdAt ? (typeof doc.createdAt.toDate === 'function' ? doc.createdAt.toDate().toLocaleString() : (doc.createdAt.seconds ? new Date(doc.createdAt.seconds * 1000).toLocaleString() : 'Just now')) : 'Just now'}
                      </div>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-color)', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                      <Download size={14} /> Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rectifications' && (
          <div>
            <h2>Rectification Requests</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>View correction requests submitted by this client.</p>
            {rectifications.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No rectification requests found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {rectifications.map(req => (
                  <div key={req.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--card-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{req.serviceName}</strong>
                      <span style={{ fontSize: '0.75rem', backgroundColor: req.status === 'Resolved' ? '#10b981' : '#f59e0b', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {req.status || 'Pending'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Period: {req.period} • Tax Year: {req.taxYear}
                    </div>
                    <p style={{ fontSize: '0.95rem' }}>{req.details}</p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Submitted: {req.createdAt ? (typeof req.createdAt.toDate === 'function' ? req.createdAt.toDate().toLocaleString() : (req.createdAt.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleString() : 'Just now')) : 'Just now'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
            <h2>Live Chat Support</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Direct messaging channel with {user.email}.</p>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px 8px 0 0', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.length === 0 ? (
                <div style={{ margin: 'auto', color: 'var(--text-muted)' }}>No messages yet. Send a message to start the chat.</div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} style={{ alignSelf: msg.sender === 'Admin' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textAlign: msg.sender === 'Admin' ? 'right' : 'left' }}>
                      {msg.sender} • {msg.createdAt ? (typeof msg.createdAt.toDate === 'function' ? msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : (msg.createdAt.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now')) : 'Now'}
                    </div>
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: msg.sender === 'Admin' ? 'var(--primary-color)' : 'var(--bg-color)', color: msg.sender === 'Admin' ? 'white' : 'var(--text-color)', border: msg.sender === 'Admin' ? 'none' : '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleSendMessage} style={{ display: 'flex', border: '1px solid var(--border-color)', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
              <input 
                type="text" 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Type your message..." 
                style={{ flex: 1, padding: '1rem', border: 'none', borderRadius: '0 0 0 8px', outline: 'none' }} 
              />
              <button type="submit" disabled={sendingMsg || !newMessage.trim()} style={{ padding: '0 1.5rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '0 0 8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
