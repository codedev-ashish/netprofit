"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../../src/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import styles from "../../page.module.css";
import BusinessesTab from "./BusinessesTab";
import { ArrowLeft, User, FileText, MessageSquare, AlertCircle, Shield, Mail, Key, Briefcase, Upload, Download, Send } from "lucide-react";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";

export default function UserDetails() {
  const params = useParams();
  const userId = params?.userId as string;
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("businesses");

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

  const handleChatToggle = async () => {
    if (!user) return;
    const currentStatus = !!user.chatDisabled;
    if (confirm(`Are you sure you want to ${currentStatus ? 'enable' : 'disable'} chat for this user?`)) {
      try {
        await updateDoc(doc(db, "users", userId), { chatDisabled: !currentStatus });
        setUser({ ...user, chatDisabled: !currentStatus });
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
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={handlePasswordReset} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={16} /> Reset Password
          </button>
          <button onClick={handleChatToggle} style={{ background: user.chatDisabled ? '#10b981' : '#f59e0b', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={16} /> {user.chatDisabled ? "Enable Chat" : "Disable Chat"}
          </button>
          <button onClick={handleBanToggle} style={{ background: user.isBanned ? '#10b981' : '#e53e3e', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} /> {user.isBanned ? "Unban User" : "Ban User"}
          </button>
        </div>
      </div>

            {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        {[
          { id: 'businesses', icon: Briefcase, label: 'Businesses' }
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
                {activeTab === 'businesses' && (
          <BusinessesTab userId={userId} />
        )}
      </div>
    </div>
  );
}
